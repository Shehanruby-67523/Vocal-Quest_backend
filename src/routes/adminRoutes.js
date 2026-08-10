const express = require('express');
const {
  getUsers,
  inviteUser,
  toggleUserStatus,
  changeUserRole,
  deleteUserSession,
  exportUsersCSV,
  getAuditLogs,
  getSettings,
  updateSettings,
  getNodes,
  createNode,
  updateNode,
  deleteNode
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// User Management
router.get('/users', protect, admin, getUsers);
router.post('/users/invite', protect, admin, inviteUser);
router.patch('/users/:id/status', protect, admin, toggleUserStatus);
router.patch('/users/:id/role', protect, admin, changeUserRole);
router.delete('/users/:id/session', protect, admin, deleteUserSession);
router.get('/users/export', protect, admin, exportUsersCSV);

// Security logs
router.get('/security/logs', protect, admin, getAuditLogs);

// System Settings
router.get('/settings', protect, admin, getSettings);
router.put('/settings', protect, admin, updateSettings);

// Narrative/Campaign builder CRUD
router.get('/story-logic', protect, admin, getNodes);
router.post('/story-logic', protect, admin, createNode);
router.put('/story-logic/:nodeId', protect, admin, updateNode);
router.delete('/story-logic/:nodeId', protect, admin, deleteNode);

module.exports = router;
