const express = require('express');
const {
  getAvailableGames,
  startGame,
  submitAnswer,
  finishGame,
  getGameResult,
  getGameHistory,
  getLeaderboard
} = require('../controllers/gameController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// General Game / Gameplay Endpoints
router.get('/', protect, getAvailableGames);
router.post('/start', protect, startGame);
router.get('/history', protect, getGameHistory);
router.get('/leaderboard', protect, getLeaderboard);

// Game Session Endpoints
router.post('/:gameId/answer', protect, submitAnswer);
router.post('/:gameId/finish', protect, finishGame);
router.get('/:gameId/result', protect, getGameResult);

module.exports = router;
