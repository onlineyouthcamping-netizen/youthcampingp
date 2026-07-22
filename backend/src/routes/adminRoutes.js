const express = require('express');
const router = express.Router();
const { adminLogin, getMe, updateMe, updateMyPassword, forgotPassword } = require('../controllers/authController');
const { getStats } = require('../controllers/dashboardController');
const {
  listUsers,
  createUser,
  updateUserRole,
  updateUserPermissions,
  toggleUserActive,
  resetUserPassword,
  listAuditLogs
} = require('../controllers/adminUserController');
const { protect, requirePermission, requireFounder } = require('../middleware/auth');
const { validate, adminLoginSchema } = require('../validators');

// Public login
router.post('/login', validate(adminLoginSchema), adminLogin);
router.post('/forgot-password', forgotPassword);

// Current admin details (My Profile)
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/me/password', protect, updateMyPassword);

// Dashboard statistics
router.get('/stats', protect, requirePermission('dashboard.view'), getStats);

// User & Staff Profile Management (Founder Only)
router.get('/users', protect, requireFounder, listUsers);
router.post('/users', protect, requireFounder, createUser);
router.get('/staff-profiles', protect, requireFounder, listUsers);
router.get('/staff-profiles/:id', protect, requireFounder, listUsers);
router.post('/staff-profiles', protect, requireFounder, createUser);
router.put('/users/:id/role', protect, requireFounder, updateUserRole);
router.put('/users/:id/permissions', protect, requireFounder, updateUserPermissions);
router.put('/users/:id/toggle-active', protect, requireFounder, toggleUserActive);
router.put('/users/:id/reset-password', protect, requireFounder, resetUserPassword);

// Audit Logging (Founder only)
router.get('/audit-logs', protect, requireFounder, listAuditLogs);

module.exports = router;
