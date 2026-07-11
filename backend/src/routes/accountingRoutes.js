const express = require('express');
const router = express.Router();
const {
  getEntries,
  getEntryHistory,
  createEntry,
  approveEntry,
  rejectEntry,
  getReports
} = require('../controllers/accountingController');
const { authenticate, requirePermission } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// CRUD routes
router.get('/entries', requirePermission('accounting.view'), getEntries);
router.get('/entries/:id/history', requirePermission('accounting.view'), getEntryHistory);
router.post('/entries', requirePermission('accounting.submit'), createEntry);
router.post('/entries/:id/approve', requirePermission('accounting.approve'), approveEntry);
router.post('/entries/:id/reject', requirePermission('accounting.approve'), rejectEntry);

// Analytics & Reports
router.get('/reports', requirePermission('accounting.view'), getReports);

module.exports = router;
