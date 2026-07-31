const express = require('express');
const router = express.Router();
const {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  cloneRole,
  deleteRole,
  getPermissions,
  getPermissionMatrix,
  getUserAccessDetails,
  updateUserRoles,
  setUserCustomPermission,
  removeUserCustomPermission,
  delegatePermission,
  revokeDelegation,
  getAuditLog
} = require('../controllers/rbacController');
const { protect, requirePermission } = require('../middleware/auth');

router.use(protect);

// Role Management Routes
router.get('/roles', requirePermission('users.permissions'), getRoles);
router.get('/roles/:id', requirePermission('users.permissions'), getRoleById);
router.post('/roles', requirePermission('users.permissions'), createRole);
router.put('/roles/:id', requirePermission('users.permissions'), updateRole);
router.post('/roles/:id/clone', requirePermission('users.permissions'), cloneRole);
router.delete('/roles/:id', requirePermission('users.permissions'), deleteRole);

// Permissions & Matrix Routes
router.get('/permissions', getPermissions);
router.get('/matrix', requirePermission('users.permissions'), getPermissionMatrix);

// User Access & Permission Overrides Routes
router.get('/users/:userId/access', requirePermission('users.permissions'), getUserAccessDetails);
router.put('/users/:userId/roles', requirePermission('users.permissions'), updateUserRoles);
router.post('/users/:userId/custom-permissions', requirePermission('users.permissions'), setUserCustomPermission);
router.delete('/users/:userId/custom-permissions/:permissionId', requirePermission('users.permissions'), removeUserCustomPermission);

// Permission Delegation Routes
router.post('/delegations', requirePermission('users.permissions'), delegatePermission);
router.delete('/delegations/:delegationId', requirePermission('users.permissions'), revokeDelegation);

// RBAC Audit Log Route
router.get('/audit-log', requirePermission('users.permissions'), getAuditLog);

module.exports = router;
