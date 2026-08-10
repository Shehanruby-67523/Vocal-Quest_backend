const express = require('express');
const {
  getProfile,
  updateProfile,
  getUserStats,
  getUserById,
  getUserProgress,
  getUserScores,
  deleteUser
} = require('../controllers/userController');
const {
  getVoicePrint,
  updateVoicePrint,
  deleteVoicePrint
} = require('../controllers/voicePrintController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// User Profile & Stats (Current User)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/stats', protect, getUserStats);

// Voice Print Biometrics
router.get('/voice-print', protect, getVoicePrint);
router.post('/voice-print', protect, updateVoicePrint);
router.delete('/voice-print', protect, deleteVoicePrint);

// Specific User Operations (Requires Ownership or Admin)
router.get('/:id', protect, getUserById);
router.get('/:id/progress', protect, getUserProgress);
router.get('/:id/scores', protect, getUserScores);
router.delete('/:id', protect, deleteUser);

module.exports = router;
