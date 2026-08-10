const mongoose = require('mongoose');
const Quest = require('../models/Quest');
const GameSession = require('../models/GameSession');

// Get all active quests
const getAllQuests = async (req, res) => {
  try {
    const filter = req.user && req.user.role === 'admin' ? {} : { isActive: true };
    const quests = await Quest.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Quests retrieved successfully',
      data: { quests }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get quest by ID
const getQuestById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid quest ID format' });
  }

  try {
    const quest = await Quest.findById(id);
    if (!quest) {
      return res.status(404).json({ success: false, message: 'Quest not found' });
    }

    res.json({
      success: true,
      message: 'Quest retrieved successfully',
      data: { quest }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create Quest (Admin only)
const createQuest = async (req, res) => {
  const { title, description, category, difficulty, points, questions, isActive } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required' });
  }

  if (questions && !Array.isArray(questions)) {
    return res.status(400).json({ success: false, message: 'Questions must be an array' });
  }

  if (questions) {
    for (const q of questions) {
      if (!q.questionText || !q.options || !q.correctAnswer) {
        return res.status(400).json({
          success: false,
          message: 'Each question must include questionText, options array, and correctAnswer'
        });
      }
    }
  }

  try {
    const quest = await Quest.create({
      title,
      description,
      category: category || 'General',
      difficulty: difficulty || 'easy',
      points: points !== undefined ? Number(points) : 100,
      questions: questions || [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Quest created successfully',
      data: { quest }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update Quest (Admin only)
const updateQuest = async (req, res) => {
  const { id } = req.params;
  const { title, description, category, difficulty, points, questions, isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid quest ID format' });
  }

  try {
    const quest = await Quest.findById(id);
    if (!quest) {
      return res.status(404).json({ success: false, message: 'Quest not found' });
    }

    if (title) quest.title = title;
    if (description) quest.description = description;
    if (category) quest.category = category;
    if (difficulty) quest.difficulty = difficulty;
    if (points !== undefined) quest.points = Number(points);
    if (questions) quest.questions = questions;
    if (isActive !== undefined) quest.isActive = Boolean(isActive);

    await quest.save();

    res.json({
      success: true,
      message: 'Quest updated successfully',
      data: { quest }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete Quest (Admin only)
const deleteQuest = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid quest ID format' });
  }

  try {
    const quest = await Quest.findByIdAndDelete(id);
    if (!quest) {
      return res.status(404).json({ success: false, message: 'Quest not found' });
    }

    res.json({
      success: true,
      message: 'Quest deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Start Quest for authenticated user
const startQuest = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid quest ID format' });
  }

  try {
    const quest = await Quest.findById(id);
    if (!quest || !quest.isActive) {
      return res.status(404).json({ success: false, message: 'Quest not found or inactive' });
    }

    let session = await GameSession.findOne({
      userId: req.user._id,
      questId: quest._id,
      status: 'in_progress'
    });

    if (!session) {
      session = await GameSession.create({
        userId: req.user._id,
        questId: quest._id,
        score: 0,
        totalQuestions: quest.questions ? quest.questions.length : 0,
        correctAnswersCount: 0,
        status: 'in_progress',
        answers: []
      });
    }

    res.json({
      success: true,
      message: 'Quest started successfully',
      data: {
        gameSessionId: session._id,
        quest
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Complete Quest for authenticated user
const completeQuest = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid quest ID format' });
  }

  try {
    const quest = await Quest.findById(id);
    if (!quest) {
      return res.status(404).json({ success: false, message: 'Quest not found' });
    }

    const session = await GameSession.findOne({
      userId: req.user._id,
      questId: quest._id,
      status: 'in_progress'
    });

    if (session) {
      session.status = 'completed';
      session.completedAt = new Date();
      await session.save();
    }

    res.json({
      success: true,
      message: 'Quest completed successfully',
      data: { questId: id, status: 'completed' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllQuests,
  getQuestById,
  createQuest,
  updateQuest,
  deleteQuest,
  startQuest,
  completeQuest
};
