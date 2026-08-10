const express = require('express');
const { getProfile, updateProfile, getUserStats } = require('../controllers/userController');
const { getVoicePrint, updateVoicePrint, deleteVoicePrint } = require('../controllers/voicePrintController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// User Profile
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/stats', protect, getUserStats);

// Voice Print Biometrics
router.get('/voice-print', protect, getVoicePrint);
router.post('/voice-print', protect, updateVoicePrint);
router.delete('/voice-print', protect, deleteVoicePrint);

module.exports = router;
