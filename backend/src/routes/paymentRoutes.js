const express = require('express');
const router = express.Router();
const {
  addPayment,
  getPaymentsByBooking,
  getAllPayments,
  deletePayment
} = require('../controllers/paymentController');
const { authenticate, requirePermission } = require('../middleware/auth');

// All payment routes are admin-only, gated by permissions
router.use(authenticate);

router.post('/', requirePermission('payments.edit'), addPayment);
router.get('/', requirePermission('payments.view'), getAllPayments);
router.get('/booking/:bookingId', requirePermission('payments.view'), getPaymentsByBooking);
router.delete('/:id', requirePermission('payments.edit'), deletePayment);

module.exports = router;
