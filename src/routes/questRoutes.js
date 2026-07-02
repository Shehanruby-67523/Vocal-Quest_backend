const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Public route
router.get('/welcome', (req, res) => res.send("Welcome to the Quest"));

// Protected routes
router.post('/submit-quiz', protect, (req, res) => {
  res.json({ message: `Quiz submitted for user ${req.user}` });
});

router.get('/stats', protect, (req, res) => {
  res.json({ message: `Stats retrieved for user ${req.user}` });
});

module.exports = router;
