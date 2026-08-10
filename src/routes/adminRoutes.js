const express = require('express');
const {
  getAdminDashboard,
  getAllUsers,
  updateUserStatus,
  deleteUserByAdmin,
  getSystemStatistics
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(admin);

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUserByAdmin);
router.get('/statistics', getSystemStatistics);

module.exports = router;
