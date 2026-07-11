const SENSITIVE_FIELDS = new Set([
  'password',
  'resetToken',
  'otp',
  'otpHash',
  'tokenVersion',
  'emailVerificationToken',
  'stripeCustomerId',
  'stripeSessionId'
]);

function sanitizeUser(user) {
  if (!user) return user;
  if (Array.isArray(user)) return user.map(u => sanitizeUser(u));
  if (typeof user !== 'object') return user;
  const cleaned = {};
  for (const [key, value] of Object.entries(user)) {
    if (!SENSITIVE_FIELDS.has(key)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = sanitizeUser(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

module.exports = { sanitizeUser, SENSITIVE_FIELDS };
