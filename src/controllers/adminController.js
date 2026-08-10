const mongoose = require('mongoose');
const User = require('../models/User');
const Quest = require('../models/Quest');
const GameSession = require('../models/GameSession');
const AuditLog = require('../models/AuditLog');

// Get Admin Dashboard Overview
const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalQuests = await Quest.countDocuments();
    const totalGameSessions = await GameSession.countDocuments();
    const completedSessions = await GameSession.countDocuments({ status: 'completed' });

    const totalScoresResult = await GameSession.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalScore: { $sum: '$score' }, avgScore: { $avg: '$score' } } }
    ]);

    const totalScore = totalScoresResult.length > 0 ? totalScoresResult[0].totalScore : 0;
    const avgScore = totalScoresResult.length > 0 ? Math.round(totalScoresResult[0].avgScore) : 0;

    res.json({
      success: true,
      message: 'Admin dashboard stats retrieved successfully',
      data: {
        totalUsers,
        activeUsers,
        totalQuests,
        totalGameSessions,
        completedSessions,
        totalScore,
        avgScore
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get All Users (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    const safeUsers = users.map(u => u.toSafeObject ? u.toSafeObject() : u);

    res.json({
      success: true,
      message: 'Users list retrieved successfully',
      data: { users: safeUsers }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update User Status (Activate / Deactivate)
const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID format' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
    } else if (status !== undefined) {
      user.isActive = status === 'active' || status === true;
    }

    await user.save();

    res.json({
      success: true,
      message: `User status updated to ${user.isActive ? 'active' : 'deactivated'}`,
      data: { user: user.toSafeObject() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete User (Admin)
const deleteUserByAdmin = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID format' });
  }

  // Prevent admin from deleting themselves
  if (req.user._id.toString() === id.toString()) {
    return res.status(400).json({ success: false, message: 'Admin cannot delete their own account via this endpoint' });
  }

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await GameSession.deleteMany({ userId: id });

    res.json({
      success: true,
      message: 'User deleted successfully by administrator'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get Detailed System Statistics
const getSystemStatistics = async (req, res) => {
  try {
    const recentAuditLogs = await AuditLog.find().populate('user', 'name email role').sort({ createdAt: -1 }).limit(20);
    const categoryStats = await Quest.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      message: 'System statistics retrieved successfully',
      data: {
        recentAuditLogs,
        questCategories: categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAdminDashboard,
  getAllUsers,
  updateUserStatus,
  deleteUserByAdmin,
  getSystemStatistics
};
