const express = require('express');
const router = express.Router();
const multer = require('multer');

const { authenticate, requirePermission } = require('../middleware/auth');
const templateController = require('../controllers/emailTemplateController');
const logController = require('../controllers/emailLogController');
const composerController = require('../controllers/emailComposerController');
const emailController = require('../controllers/emailController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

// Templates CRUD
router.get('/templates', authenticate, requirePermission('emails.view'), templateController.listTemplates);
router.get('/templates/:id', authenticate, requirePermission('emails.view'), templateController.getTemplate);
router.post('/templates', authenticate, requirePermission('emails.manage_templates'), templateController.createTemplate);
router.put('/templates/:id', authenticate, requirePermission('emails.manage_templates'), templateController.updateTemplate);
router.delete('/templates/:id', authenticate, requirePermission('emails.manage_templates'), templateController.deleteTemplate);
router.post('/templates/:id/duplicate', authenticate, requirePermission('emails.manage_templates'), templateController.duplicateTemplate);

// Logs fetch
router.get('/logs/booking/:bookingId', authenticate, requirePermission('emails.view_logs'), logController.getBookingLogs);
router.get('/logs/inquiry/:inquiryId', authenticate, requirePermission('emails.view_logs'), logController.getInquiryLogs);
router.get('/logs/ticket/:trainTicketId', authenticate, requirePermission('emails.view_logs'), logController.getTicketLogs);

// Custom Composer Send
router.post('/send-custom', authenticate, requirePermission('emails.send'), upload.array('attachments', 10), composerController.sendCustomEmail);
router.post('/send-bulk-custom', authenticate, requirePermission('emails.send_bulk'), composerController.sendBulkEmails);

// Legacy routes for backward compatibility
router.post('/send', emailController.sendBookingEmail);
router.get('/logs/:bookingId', emailController.getEmailLogs);

module.exports = router;
