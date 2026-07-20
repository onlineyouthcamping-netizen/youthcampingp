const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stationPaymentController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate);

// Dashboard & booking list
router.get('/', requirePermission('station_payments.view'), ctrl.getDashboard);

// Receiving account management
router.get('/accounts', requirePermission('station_payments.view'), ctrl.getAccounts);
router.post('/accounts', requirePermission('station_payments.manage_accounts'), ctrl.createAccount);
router.patch('/accounts/:id/approve', requirePermission('station_payments.manage_accounts'), ctrl.approveAccount);

// Reports
router.get('/reports', requirePermission('station_payments.export'), ctrl.getReports);

// Handover routes
router.post('/handover', requirePermission('station_payments.handover'), ctrl.createHandover);
router.post('/handover/:id/confirm', requirePermission('station_payments.receive'), ctrl.confirmHandover);
router.post('/handover/:id/reconcile', requirePermission('station_payments.reconcile'), ctrl.reconcileHandover);

// Collection
router.post('/collect', requirePermission('station_payments.collect'), ctrl.collect);
router.get('/receipt/:id', requirePermission('station_payments.view'), ctrl.getReceipt);
router.get('/:id', requirePermission('station_payments.view'), ctrl.getOne);
router.post('/:id/cancel', requirePermission('station_payments.cancel'), ctrl.cancel);
router.post('/:id/verify-upi', requirePermission('station_payments.verify_upi'), ctrl.verifyUpi);
router.post('/:id/resend-email', requirePermission('station_payments.resend_receipt'), ctrl.resendEmail);

module.exports = router;
