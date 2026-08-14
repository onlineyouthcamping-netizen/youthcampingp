/**
 * Booking Lifecycle Status + Validation
 *
 * Booking status is a lifecycle concept and must never be mixed with payment
 * status (see utils/paymentStatus.js).
 *
 *   pending    → awaiting confirmation
 *   confirmed  → confirmed
 *   cancelled  → cancelled (terminal)
 *   rejected   → rejected (terminal, legacy equivalent of cancelled)
 *
 * Allowed transitions:
 *   pending    → confirmed | cancelled
 *   confirmed  → cancelled
 *   cancelled  → (none)
 *   rejected   → (none)
 */

const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};

const BOOKING_STATUSES = Object.values(BOOKING_STATUS);

const ALLOWED_TRANSITIONS = {
  [BOOKING_STATUS.PENDING]: new Set([
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.REJECTED,
  ]),
  [BOOKING_STATUS.CONFIRMED]: new Set([
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.REJECTED,
  ]),
  [BOOKING_STATUS.CANCELLED]: new Set(),
  [BOOKING_STATUS.REJECTED]: new Set(),
};

/**
 * Validate a status transition.
 * @returns {null|string} null when allowed, otherwise an error message.
 */
const validateBookingStatusTransition = (fromStatus, toStatus) => {
  const current = String(fromStatus || "").trim().toLowerCase() || BOOKING_STATUS.PENDING;
  const target = String(toStatus || "").trim().toLowerCase();

  if (!BOOKING_STATUSES.includes(target)) {
    return `Invalid booking status: "${toStatus}". Allowed values: ${BOOKING_STATUSES.join(", ")}`;
  }

  const allowed = ALLOWED_TRANSITIONS[current] || new Set();
  if (!allowed.has(target)) {
    return `Invalid booking status transition: "${current}" → "${target}" is not allowed`;
  }
  return null;
};

const isBookingStatus = (value) => BOOKING_STATUSES.includes(String(value || "").toLowerCase());

module.exports = {
  BOOKING_STATUS,
  BOOKING_STATUSES,
  validateBookingStatusTransition,
  isBookingStatus,
};