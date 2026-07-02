const express = require('express');
const { loginUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Public route
router.post('/login', loginUser);

// Protected routes for Task 5
router.post('/submit-quiz', protect, (req, res) => {
  res.json({ message: "Quiz submitted successfully!" });
});

router.get('/stats', protect, (req, res) => {
  res.json({ message: "User stats retrieved", data: { score: 85, rank: 5 } });
});

module.exports = router;