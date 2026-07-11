const express = require('express');
const router = express.Router();
const {
  createBookingLink,
  getBookingLinks,
  revokeBookingLink,
  resolveBookingLink,
  getBookingLinksAnalytics,
} = require('../controllers/bookingLinkController');

const { authenticate, requirePermission } = require('../middleware/auth');

// ── PUBLIC: resolve link token → customer snapshot ──
router.get('/resolve', resolveBookingLink);

// ── ADMIN/Sales: booking link management ──
router.get('/analytics', authenticate, requirePermission('bookings.view'), getBookingLinksAnalytics);
router.get('/', authenticate, requirePermission('bookings.view'), getBookingLinks);
router.post('/', authenticate, requirePermission('bookings.create'), createBookingLink);
router.post('/:id/revoke', authenticate, requirePermission('bookings.edit'), revokeBookingLink);

module.exports = router;
