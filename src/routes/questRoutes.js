const express = require('express');
const {
  getAllQuests,
  getQuestById,
  createQuest,
  updateQuest,
  deleteQuest,
  startQuest,
  completeQuest
} = require('../controllers/questController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// User & Public Operations
router.get('/', protect, getAllQuests);
router.get('/:id', protect, getQuestById);
router.post('/:id/start', protect, startQuest);
router.post('/:id/complete', protect, completeQuest);

// Admin-Only Quest Operations
router.post('/', protect, admin, createQuest);
router.put('/:id', protect, admin, updateQuest);
router.delete('/:id', protect, admin, deleteQuest);

module.exports = router;
