/**
 * Field-level Mutation Guard Middlewares
 */

const guardBookingUpdateFields = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated' });
  }

  const role = req.user.role;
  if (role === 'superadmin' || role === 'admin') {
    return next();
  }

  const bodyKeys = Object.keys(req.body);

  if (role === 'finance') {
    // Allow updating only payment-related fields
    const FINANCE_ALLOWED = [
      'paymentStatus',
      'payment_status',
      'paymentMethod',
      'payment_method',
      'upiReference',
      'upi_reference',
      'paymentNotes',
      'notes',
      'adminNotes',
      'invoiceStatus',
      'advancePaid',
      'remainingAmount'
    ];

    const violations = bodyKeys.filter(k => !FINANCE_ALLOWED.includes(k));
    if (violations.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Finance is not allowed to modify: ${violations.join(', ')}`
      });
    }
  }

  if (role === 'operations') {
    // Allow updating only operational fields
    const OPERATIONS_ALLOWED = [
      'roomAllocation',
      'roomType',
      'guideAssignment',
      'pickupStatus',
      'pickupCity',
      'participantNotes',
      'notes',
      'adminNotes',
      'travelStatus'
    ];

    const violations = bodyKeys.filter(k => !OPERATIONS_ALLOWED.includes(k));
    if (violations.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Operations is not allowed to modify: ${violations.join(', ')}`
      });
    }
  }

  if (role === 'sales') {
    // Sales can modify booking details but NOT salesAdminId or price fields
    if (req.body.salesAdminId !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'Sales users cannot modify booking ownership (salesAdminId)'
      });
    }
  }

  if (role === 'viewer' || role === 'guide') {
    return res.status(403).json({
      success: false,
      message: 'Guides and Viewers cannot update bookings'
    });
  }

  next();
};

module.exports = {
  guardBookingUpdateFields
};
