const express = require('express');
const { getVoicePrint, updateVoicePrint, verifyVoicePrint, deleteVoicePrint } = require('../controllers/voicePrintController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Dedicated Voice Print API endpoints
router.get('/status', protect, getVoicePrint);
router.post('/enroll', protect, updateVoicePrint);
router.post('/verify', protect, verifyVoicePrint);
router.delete('/', protect, deleteVoicePrint);

module.exports = router;
