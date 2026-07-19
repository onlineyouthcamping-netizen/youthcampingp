const { prisma } = require('../lib/prisma');

/**
 * Log a booking activity event.
 * 
 * @param {Object} params
 * @param {string} params.bookingId - The cuid ID of the booking.
 * @param {string} params.action - e.g. "CREATE", "STATUS_CHANGE", "TRAIN_TICKET", "PAYMENT_RECORD", "PASSENGER_ADD", "DETAILS_UPDATE"
 * @param {string} params.details - Details text describing the activity.
 * @param {string} [params.performedByAdminId] - The ID of the admin who performed the action.
 */
async function logBookingActivity({
  bookingId,
  action,
  details,
  performedByAdminId = null
}) {
  try {
    if (!bookingId) {
      console.warn('⚠️ [bookingActivityLogger] Missing bookingId, skipping log.');
      return;
    }
    const { publishEvent } = require('./eventBus');
    
    const log = await prisma.bookingActivityLog.create({
      data: {
        bookingId,
        action,
        details,
        performedByAdminId
      }
    });

    // Also trigger central event bus for cross-module features
    await publishEvent(`booking.${action.toLowerCase()}`, {
      entityType: 'Booking',
      entityId: bookingId,
      actorUserId: performedByAdminId || 'system',
      actorName: 'Admin', // Would be better to fetch actual name if possible
      title: `Booking: ${action}`,
      description: details,
      moduleName: 'Bookings',
      priority: action === 'CREATE' ? 'High' : 'Low',
      actionUrl: `/admin/bookings/${bookingId}`,
      notify: true
    });

  } catch (error) {
    console.error('⚠️ [bookingActivityLogger] Error recording log:', error.message);
  }
}

module.exports = {
  logBookingActivity
};
