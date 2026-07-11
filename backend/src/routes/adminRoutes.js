const express = require('express');
const router = express.Router();
const { adminLogin, getMe, forgotPassword } = require('../controllers/authController');
const { getStats } = require('../controllers/dashboardController');
const {
  listUsers,
  createUser,
  updateUserRole,
  toggleUserActive,
  resetUserPassword,
  listAuditLogs
} = require('../controllers/adminUserController');
const { protect, requirePermission } = require('../middleware/auth');
const { validate, adminLoginSchema } = require('../validators');

// Public login
router.post('/login', validate(adminLoginSchema), adminLogin);
router.post('/forgot-password', forgotPassword);

// Current admin details
router.get('/me', protect, getMe);

// Dashboard statistics
router.get('/stats', protect, requirePermission('dashboard.view'), getStats);

// User Management (Superadmin only)
router.get('/users', protect, requirePermission('users.view'), listUsers);
router.post('/users', protect, requirePermission('users.manage'), createUser);
router.put('/users/:id/role', protect, requirePermission('roles.manage'), updateUserRole);
router.put('/users/:id/toggle-active', protect, requirePermission('users.manage'), toggleUserActive);
router.put('/users/:id/reset-password', protect, requirePermission('users.manage'), resetUserPassword);

// Audit Logging (Superadmin only)
router.get('/audit-logs', protect, requirePermission('audit.view'), listAuditLogs);

module.exports = router;
