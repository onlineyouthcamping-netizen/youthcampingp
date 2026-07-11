const express = require('express');
const router = express.Router();
const {
  getTicketsByBooking,
  getTicketHistory,
  createTicket,
  autoGenerateTickets,
  updateTicket,
  submitTicket,
  approveTicket,
  rejectTicket,
  reopenTicket,
  cancelTicket,
  rebookTicket,
  bulkUpdateTickets,
  getApprovalsQueue,
  getAlerts,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
} = require('../controllers/trainTicketController');
const { authenticate, requirePermission } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Approvals & Alerts (specific routes before parameterized ones)
router.get('/approvals', requirePermission('tickets.view'), getApprovalsQueue);
router.get('/alerts', requirePermission('tickets.alerts.view'), getAlerts);

// Train Templates
router.get('/templates', requirePermission('tickets.view'), getTemplates);
router.post('/templates', requirePermission('tickets.templates.manage'), createTemplate);
router.patch('/templates/:id', requirePermission('tickets.templates.manage'), updateTemplate);
router.delete('/templates/:id', requirePermission('tickets.templates.manage'), deleteTemplate);

// Booking-level ticket operations
router.get('/booking/:bookingId', requirePermission('tickets.view'), getTicketsByBooking);
router.post('/booking/:bookingId', requirePermission('tickets.create'), createTicket);
router.post('/booking/:bookingId/auto-generate', requirePermission('tickets.create'), autoGenerateTickets);

// Bulk Update
router.post('/bulk-update', requirePermission('tickets.bulk'), bulkUpdateTickets);

// Ticket-level operations
router.get('/:ticketId/history', requirePermission('tickets.view'), getTicketHistory);
router.patch('/:ticketId', requirePermission('tickets.edit'), updateTicket);
router.post('/:ticketId/submit', requirePermission('tickets.submit'), submitTicket);
router.post('/:ticketId/approve', requirePermission('tickets.approve'), approveTicket);
router.post('/:ticketId/reject', requirePermission('tickets.approve'), rejectTicket);
router.post('/:ticketId/reopen', requirePermission('tickets.reopen'), reopenTicket);
router.post('/:ticketId/cancel', requirePermission('tickets.edit'), cancelTicket);
router.post('/:ticketId/rebook', requirePermission('tickets.create'), rebookTicket);

module.exports = router;
