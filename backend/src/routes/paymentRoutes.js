const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  getClientPayments,
  addClientPayment,
  verifyClientPayment,
  getVendorPayments,
  createVendorPayment,
  updateVendorPayment,
  deleteVendorPayment,
  getPaymentsDashboardStats
} = require('../controllers/paymentController');

router.use(authenticate);

// Client Receivables Routes
router.get('/client/:tripId', requirePermission('ops.view'), getClientPayments);
router.post('/client/add/:bookingId', requirePermission('ops.manage'), addClientPayment);
router.patch('/client/verify/:id', requirePermission('ops.manage'), verifyClientPayment);

// Vendor Payables Routes
router.get('/vendor/:tripId', requirePermission('ops.view'), getVendorPayments);
router.post('/vendor/:tripId', requirePermission('ops.manage'), createVendorPayment);
router.put('/vendor/:tripId/:id', requirePermission('ops.manage'), updateVendorPayment);
router.delete('/vendor/:id', requirePermission('ops.manage'), deleteVendorPayment);

// Financial Dashboard stats
router.get('/dashboard/:tripId', requirePermission('ops.view'), getPaymentsDashboardStats);

module.exports = router;
