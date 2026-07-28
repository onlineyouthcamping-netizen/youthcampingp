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
router.delete('/users/:id', protect, requireFounder, deleteUser);
router.delete('/staff-profiles/:id', protect, requireFounder, deleteUser);

// Audit Logging (Founder only)
router.get('/audit-logs', protect, requireFounder, listAuditLogs);

module.exports = router;
