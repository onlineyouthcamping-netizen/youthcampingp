const express = require('express');
const router = express.Router();
const { adminLogin, forgotPassword } = require('../controllers/authController');
const { getStats } = require('../controllers/dashboardController');
const {
  listUsers,
  createUser,
  updateUserRole,
  updateUserPermissions,
  toggleUserActive,
  resetUserPassword,
  deleteUser,
  listAuditLogs
} = require('../controllers/adminUserController');
const { protect, requirePermission, requireFounder, requireAdmin } = require('../middleware/auth');
const { passwordChangeLimiter, apiKeyGenerationLimiter } = require('../middleware/rateLimiter');
const { validate, adminLoginSchema } = require('../validators');

const {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  getSessions,
  logoutSession,
  logoutAllExcept,
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

// 1. Profile & Account Settings
router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.post('/me/avatar', protect, uploadAvatar);
router.put('/me/password', protect, passwordChangeLimiter, changePassword);
router.delete('/me', protect, deleteAccount);
router.get('/me/export', protect, exportUserData);

// 2. Connected Sessions
router.get('/me/sessions', protect, getSessions);
router.delete('/me/sessions/:sessionId', protect, logoutSession);
router.post('/me/sessions/logout-all-except-current', protect, logoutAllExcept);

// 3. Activity Logs & Audit Trail (Founder + Admin)
router.get('/me/activity-logs', protect, requireAdmin, getActivityLogs);
router.get('/me/audit', protect, requireAdmin, exportAuditLog);

// 4. API Keys (Founder + Developer)
router.get('/me/api-keys', protect, requireFounder, getAPIKeys);
router.post('/me/api-keys', protect, requireFounder, apiKeyGenerationLimiter, generateAPIKey);
router.delete('/me/api-keys/:keyId', protect, requireFounder, deleteAPIKey);

// 5. Integrations (Founder + Admin)
router.get('/me/integrations', protect, requireAdmin, getIntegrations);
router.post('/me/integrations/:service/connect', protect, requireFounder, connectIntegration);
router.post('/me/integrations/:service/test', protect, requireAdmin, testIntegration);

// Dashboard statistics
router.get('/stats', protect, requirePermission('dashboard.view'), getStats);

// User & Staff Profile Management
router.get('/users', protect, listUsers);
router.post('/users', protect, createUser);
router.get('/staff-profiles', protect, listUsers);
router.get('/staff-profiles/:id', protect, listUsers);
router.post('/staff-profiles', protect, createUser);
router.put('/users/:id/role', protect, updateUserRole);
router.put('/users/:id/permissions', protect, updateUserPermissions);
router.put('/users/:id/toggle-active', protect, toggleUserActive);
router.put('/users/:id/reset-password', protect, resetUserPassword);
router.delete('/users/:id', protect, deleteUser);
router.delete('/staff-profiles/:id', protect, deleteUser);

// Audit Logging
router.get('/audit-logs', protect, listAuditLogs);

module.exports = router;
