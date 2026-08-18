/**
 * Field-level Mutation Guard Middlewares
 *
 * Financial fields on bookings require explicit permission
 * (bookings.financial_edit / bookings.refund). Role-based restrictions here
 * are REAL security, not UX hiding — the backend is the enforcement point.
 */

const { isProtectedSuperadminIdentity } = require("../config/superadmin");

const FINANCIAL_BOOKING_FIELDS = [
  "totalAmount",
  "amount",
  "advancePaid",
  "remainingAmount",
  "baseAmount",
  "gstAmount",
  "depositGst",
  "adjustedPrice",
  "basePrice",
  "paymentStatus",
  "payment_status",
  "payment_method",
  "upi_reference",
  "refundAmount",
  "cancellationCharges",
  "discount",
  "discountAmount",
  "depositPerPax",
];

const guardBookingUpdateFields = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthenticated" });
  }

  const role = (req.user.role || "").trim().toLowerCase();
  if (
    role === "superadmin" ||
    role === "admin" ||
    role === "founder" ||
    role === "owner" ||
    role === "super_admin" ||
    isProtectedSuperadminIdentity({
      email: req.user.email,
      name: req.user.name,
    })
  ) {
    return next();
  }

  const bodyKeys = Object.keys(req.body);

  // Sales can modify booking details but NOT financial fields and NOT ownership
  if (role === "sales") {
    const hasFinancialEdit = req.hasPermission
      ? req.hasPermission("bookings.financial_edit")
      : false;

    if (req.body.salesAdminId !== undefined) {
      return res.status(403).json({
        success: false,
        message: "Sales users cannot modify booking ownership (salesAdminId)",
      });
    }

    if (!hasFinancialEdit) {
      const violations = bodyKeys.filter((k) =>
        FINANCIAL_BOOKING_FIELDS.includes(k),
      );
      if (violations.length > 0) {
        return res.status(403).json({
          success: false,
          message: `Sales users cannot modify financial fields: ${violations.join(", ")}`,
        });
      }
    }
  }

  if (role === "finance" || role === "finance_controller") {
    // Allow updating only payment-related fields
    const FINANCE_ALLOWED = [
      "paymentStatus",
      "payment_status",
      "paymentMethod",
      "payment_method",
      "upiReference",
      "upi_reference",
      "paymentNotes",
      "notes",
      "adminNotes",
      "invoiceStatus",
      "advancePaid",
      "remainingAmount",
    ];

    const violations = bodyKeys.filter((k) => !FINANCE_ALLOWED.includes(k));
    if (violations.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Finance Controller is not allowed to modify operational data: ${violations.join(", ")}`,
      });
    }
  }

  if (role === "operations") {
    // Allow updating operational & passenger manifest fields
    // Confirmed room numbers / whole-departure date moves are not allowed here.
    // Use ops manual-save for rooms and /departures/reschedule for date moves.
    const OPERATIONS_ALLOWED = [
      "passengers",
      "numberOfTravelers",
      "sourceMeta",
      "roomType",
      "roomSharing",
      "guideAssignment",
      "pickupStatus",
      "pickupCity",
      "participantNotes",
      "notes",
      "adminNotes",
      "travelStatus",
      "trainTicketStatus",
      "trainOption",
      "trainClass",
      "foodPreference",
      "status",
      "joiningDate",
    ];

    const violations = bodyKeys.filter((k) => !OPERATIONS_ALLOWED.includes(k));
    if (violations.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Operations is not allowed to modify: ${violations.join(", ")}`,
      });
    }
  }

  if (role === "viewer" || role === "guide") {
    return res.status(403).json({
      success: false,
      message: "Guides and Viewers cannot update bookings",
    });
  }

  next();
};

module.exports = {
  guardBookingUpdateFields,
  FINANCIAL_BOOKING_FIELDS,
};
