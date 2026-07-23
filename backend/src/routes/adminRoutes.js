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

const {
  getSessions,
  logoutSession,
  logoutAllExceptCurrent,
  getActivityLogs,
  exportAuditLog,
  getAPIKeys,
  generateAPIKey,
  deleteAPIKey,
  exportUserData,
  deleteAccount,
  getIntegrations,
  connectIntegration,
  testIntegration
} = require('../controllers/settingsController');

// Public login
router.post('/login', validate(adminLoginSchema), adminLogin);
router.post('/forgot-password', forgotPassword);

// Current admin details (My Profile & Settings)
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/me/password', protect, updateMyPassword);
router.delete('/me', protect, deleteAccount);
router.get('/me/export', protect, exportUserData);

// Connected Sessions
router.get('/me/sessions', protect, getSessions);
router.delete('/me/sessions/:sessionId', protect, logoutSession);
router.post('/me/sessions/logout-all-except-current', protect, logoutAllExceptCurrent);

// Activity Logs & Audit
router.get('/me/activity-logs', protect, getActivityLogs);
router.get('/me/audit', protect, exportAuditLog);

// API Keys (Founder & Developer)
router.get('/me/api-keys', protect, getAPIKeys);
router.post('/me/api-keys', protect, generateAPIKey);
router.delete('/me/api-keys/:keyId', protect, deleteAPIKey);

// Integrations (Founder & Admin)
router.get('/me/integrations', protect, getIntegrations);
router.post('/me/integrations/:service/connect', protect, connectIntegration);
router.post('/me/integrations/:service/test', protect, testIntegration);

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
