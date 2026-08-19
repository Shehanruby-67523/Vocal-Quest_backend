const express = require('express');
const {
  getAdminDashboard,
  getAllUsers,
  getUsers,
  inviteUser,
  toggleUserStatus,
  updateUserStatus,
  changeUserRole,
  deleteUserByAdmin,
  deleteUserSession,
  exportUsersCSV,
  getAuditLogs,
  getSettings,
  updateSettings,
  getNodes,
  createNode,
  updateNode,
  deleteNode,
  getSystemStatistics
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(admin);

router.get('/dashboard', getAdminDashboard);
router.get('/statistics', getSystemStatistics);

// User Management
router.get('/users', getAllUsers);
router.get('/users/list', getUsers);
router.post('/users/invite', inviteUser);
router.put('/users/:id/status', updateUserStatus);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/role', changeUserRole);
router.delete('/users/:id', deleteUserByAdmin);
router.delete('/users/:id/session', deleteUserSession);
router.get('/users/export', exportUsersCSV);

// Security logs
router.get('/security/logs', getAuditLogs);

// System Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Story logic
router.get('/story-logic', getNodes);
router.post('/story-logic', createNode);
router.put('/story-logic/:nodeId', updateNode);
router.delete('/story-logic/:nodeId', deleteNode);

module.exports = router;
