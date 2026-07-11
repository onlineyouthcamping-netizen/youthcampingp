const express = require('express');
const router = express.Router();
const {
  generateTicket,
  getApprovals,
  getApprovalStats,
  getApprovalDetail,
  approveTicket,
  rejectTicket,
  getPendingCount,
} = require('../controllers/ticketApprovalController');
const { authenticate, requirePermission } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Lightweight dash count (no special permission gate — visible to all authenticated users)
router.get('/approvals/pending-count', getPendingCount);

// Stats
router.get('/approvals/stats', requirePermission('tickets.view'), getApprovalStats);

// Queue list
router.get('/approvals', requirePermission('tickets.view'), getApprovals);

// Detail
router.get('/approvals/:id', requirePermission('tickets.view'), getApprovalDetail);

// Approve / Reject (require tickets.approve permission — approver-only)
router.post('/approvals/:id/approve', requirePermission('tickets.approve'), approveTicket);
router.post('/approvals/:id/reject', requirePermission('tickets.approve'), rejectTicket);

// Generate (create a new ticket approval request)
router.post('/:bookingId/generate', requirePermission('tickets.create'), generateTicket);

module.exports = router;
