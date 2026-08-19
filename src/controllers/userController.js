const mongoose = require('mongoose');
const User = require('../models/User');
const GameSave = require('../models/GameSave');
const GameSession = require('../models/GameSession');
const VoicePrint = require('../models/VoicePrint');

// Helper to check ownership or admin rights
const canAccessUserData = (req, targetUserId) => {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  return req.user._id.toString() === targetUserId.toString();
};

// Get Current User Profile
const getProfile = async (req, res) => {
  try {
    const safeUser = req.user.toSafeObject ? req.user.toSafeObject() : req.user;
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user: safeUser },
      user: safeUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update Current User Profile
const updateProfile = async (req, res) => {
  const { name, username, bio, profilePic } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (profilePic !== undefined) user.profilePic = profilePic;

    await user.save();

    const updatedSafeUser = user.toSafeObject();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedSafeUser },
      user: updatedSafeUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get User Stats and Achievements
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const saveCount = await GameSave.countDocuments({ userId });
    const completedSessions = await GameSession.countDocuments({ userId, status: 'completed' });
    const voicePrint = await VoicePrint.findOne({ userId });
    const accuracy = voicePrint && voicePrint.status === 'active' ? voicePrint.accuracy : 80;

    const quizzesCompleted = completedSessions || (saveCount * 2) || 0;
    const averageAccuracy = accuracy;

    const achievements = [
      { id: 'recruit', title: 'Recruit', description: 'Complete First Quiz Level', unlocked: quizzesCompleted >= 1 },
      { id: 'explorer', title: 'Explorer', description: 'Complete Second Quiz Level', unlocked: quizzesCompleted >= 2 },
      { id: 'guardian', title: 'Guardian', description: 'Complete Third Quiz Level', unlocked: quizzesCompleted >= 3 },
      { id: 'precision', title: 'Precision Castle', description: 'Get 80% in Quiz', unlocked: averageAccuracy >= 80 }
    ];

    res.json({
      success: true,
      message: 'User stats retrieved successfully',
      data: {
        userId,
        stats: {
          quizzesCompleted,
          averageAccuracy: `${averageAccuracy}%`,
          gameSavesCount: saveCount
        },
        achievements
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get User by ID
const getUserById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID format' });
  }

  if (!canAccessUserData(req, id)) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this user profile' });
  }

  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const safeUser = user.toSafeObject ? user.toSafeObject() : user;
    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: { user: safeUser }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get User Progress by ID
const getUserProgress = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID format' });
  }

  if (!canAccessUserData(req, id)) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this progress' });
  }

  try {
    const totalGames = await GameSession.countDocuments({ userId: id });
    const completedGames = await GameSession.countDocuments({ userId: id, status: 'completed' });
    const saves = await GameSave.find({ userId: id }).populate('questId', 'title category difficulty');

    res.json({
      success: true,
      message: 'User progress retrieved successfully',
      data: {
        userId: id,
        totalGames,
        completedGames,
        saves
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get User Scores by ID
const getUserScores = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID format' });
  }

  if (!canAccessUserData(req, id)) {
    return res.status(403).json({ success: false, message: 'Not authorized to view these scores' });
  }

  try {
    const gameSessions = await GameSession.find({ userId: id })
      .populate('questId', 'title category difficulty')
      .sort({ createdAt: -1 });

    const totalScore = gameSessions.reduce((acc, session) => acc + session.score, 0);

    res.json({
      success: true,
      message: 'User scores retrieved successfully',
      data: {
        userId: id,
        totalScore,
        totalGamesPlayed: gameSessions.length,
        scores: gameSessions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete User by ID
const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID format' });
  }

  if (!canAccessUserData(req, id)) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this user' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(id);
    await GameSession.deleteMany({ userId: id });
    await GameSave.deleteMany({ userId: id });
    await VoicePrint.deleteMany({ userId: id });

    res.json({
      success: true,
      message: 'User account and associated data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserStats,
  getUserById,
  getUserProgress,
  getUserScores,
  deleteUser
};
