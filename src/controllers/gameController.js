const mongoose = require('mongoose');
const GameSession = require('../models/GameSession');
const Quest = require('../models/Quest');
const User = require('../models/User');
const GameSave = require('../models/GameSave');

// Get available games / quizzes
const getAvailableGames = async (req, res) => {
  try {
    const quests = await Quest.find({ isActive: true }).select('title description category difficulty points questions');
    
    // Format quests as games list
    const games = quests.map(quest => ({
      gameId: quest._id,
      title: quest.title,
      description: quest.description,
      category: quest.category,
      difficulty: quest.difficulty,
      points: quest.points,
      questionCount: quest.questions ? quest.questions.length : 0
    }));

    res.json({
      success: true,
      message: 'Available games retrieved successfully',
      data: { games }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Start a game session
const startGame = async (req, res) => {
  const { questId } = req.body;

  if (!questId) {
    return res.status(400).json({ success: false, message: 'questId is required to start a game' });
  }

  if (!mongoose.Types.ObjectId.isValid(questId)) {
    return res.status(400).json({ success: false, message: 'Invalid quest ID format' });
  }

  try {
    const quest = await Quest.findById(questId);
    if (!quest || !quest.isActive) {
      return res.status(404).json({ success: false, message: 'Quest not found or inactive' });
    }

    const session = await GameSession.create({
      userId: req.user._id,
      questId: quest._id,
      score: 0,
      totalQuestions: quest.questions ? quest.questions.length : 0,
      correctAnswersCount: 0,
      status: 'in_progress',
      answers: [],
      startedAt: new Date()
    });

    // Provide questions without exposing correctAnswer directly in client prompt if desired, or sanitized
    const clientQuestions = quest.questions.map((q, idx) => ({
      index: idx,
      questionText: q.questionText,
      options: q.options,
      voiceCommandKeyword: q.voiceCommandKeyword
    }));

    res.status(201).json({
      success: true,
      message: 'Game session started successfully',
      data: {
        gameId: session._id,
        questTitle: quest.title,
        totalQuestions: session.totalQuestions,
        questions: clientQuestions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Submit answer for a question in a game session
const submitAnswer = async (req, res) => {
  const { gameId } = req.params;
  const { questionIndex, answer } = req.body;

  if (!mongoose.Types.ObjectId.isValid(gameId)) {
    return res.status(400).json({ success: false, message: 'Invalid game ID format' });
  }

  if (questionIndex === undefined || answer === undefined) {
    return res.status(400).json({ success: false, message: 'questionIndex and answer are required' });
  }

  try {
    const session = await GameSession.findById(gameId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Game session not found' });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to submit answers for this session' });
    }

    if (session.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Game session is already finished or abandoned' });
    }

    // Check if question already answered
    const alreadyAnswered = session.answers.some(a => a.questionIndex === Number(questionIndex));
    if (alreadyAnswered) {
      return res.status(400).json({ success: false, message: 'Question already answered in this session' });
    }

    const quest = await Quest.findById(session.questId);
    if (!quest || !quest.questions[questionIndex]) {
      return res.status(400).json({ success: false, message: 'Invalid question index for this quest' });
    }

    const question = quest.questions[questionIndex];
    const isCorrect = question.correctAnswer.trim().toLowerCase() === String(answer).trim().toLowerCase();
    
    // Points per question calculated server-side
    const pointsPerQuestion = Math.round(quest.points / Math.max(quest.questions.length, 1));
    const scoreEarned = isCorrect ? pointsPerQuestion : 0;

    session.answers.push({
      questionIndex: Number(questionIndex),
      userAnswer: String(answer),
      isCorrect,
      scoreEarned
    });

    if (isCorrect) {
      session.score += scoreEarned;
      session.correctAnswersCount += 1;
    }

    await session.save();

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        gameId: session._id,
        questionIndex,
        isCorrect,
        scoreEarned,
        currentTotalScore: session.score,
        explanation: isCorrect ? 'Correct!' : `Incorrect. Explanation: ${question.explanation || 'Try again next time.'}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Finish a game session
const finishGame = async (req, res) => {
  const { gameId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(gameId)) {
    return res.status(400).json({ success: false, message: 'Invalid game ID format' });
  }

  try {
    const session = await GameSession.findById(gameId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Game session not found' });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this game session' });
    }

    if (session.status === 'completed') {
      return res.json({
        success: true,
        message: 'Game session was already completed',
        data: { session }
      });
    }

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    // Create or update GameSave record
    await GameSave.create({
      userId: req.user._id,
      questId: session.questId,
      progressData: {
        gameSessionId: session._id,
        score: session.score,
        correctAnswersCount: session.correctAnswersCount,
        totalQuestions: session.totalQuestions
      }
    });

    res.json({
      success: true,
      message: 'Game session completed successfully',
      data: {
        gameId: session._id,
        finalScore: session.score,
        correctAnswersCount: session.correctAnswersCount,
        totalQuestions: session.totalQuestions,
        accuracyPercentage: session.totalQuestions > 0 ? Math.round((session.correctAnswersCount / session.totalQuestions) * 100) : 0,
        completedAt: session.completedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get specific game session result
const getGameResult = async (req, res) => {
  const { gameId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(gameId)) {
    return res.status(400).json({ success: false, message: 'Invalid game ID format' });
  }

  try {
    const session = await GameSession.findById(gameId).populate('questId', 'title category difficulty points');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Game session not found' });
    }

    if (session.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this result' });
    }

    res.json({
      success: true,
      message: 'Game result retrieved successfully',
      data: { session }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get authenticated user's game history
const getGameHistory = async (req, res) => {
  try {
    const history = await GameSession.find({ userId: req.user._id })
      .populate('questId', 'title category difficulty')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Game history retrieved successfully',
      data: { history }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get global leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await GameSession.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$userId',
          totalScore: { $sum: '$score' },
          gamesPlayed: { $sum: 1 },
          totalCorrect: { $sum: '$correctAnswersCount' }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$_id',
          name: '$userInfo.name',
          username: '$userInfo.username',
          email: '$userInfo.email',
          totalScore: 1,
          gamesPlayed: 1,
          totalCorrect: 1
        }
      }
    ]);

    res.json({
      success: true,
      message: 'Leaderboard retrieved successfully',
      data: { leaderboard }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAvailableGames,
  startGame,
  submitAnswer,
  finishGame,
  getGameResult,
  getGameHistory,
  getLeaderboard
};
