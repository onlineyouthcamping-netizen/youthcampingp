const { prisma } = require("../lib/prisma");

/**
 * Log a sensitive administrative action.
 *
 * @param {Object} params
 * @param {string} params.tenantId
 * @param {string} params.actorUserId
 * @param {string} params.action
 * @param {string} params.entityType
 * @param {string} params.entityId
 * @param {Object} [params.beforeData]
 * @param {Object} [params.afterData]
 * @param {string} [params.ipAddress]
 */
async function logAction({
  tenantId = "default",
  actorUserId,
  action,
  entityType,
  entityId,
  bookingId = null,
  changeSummary = null,
  beforeData = null,
  afterData = null,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  userAgent = null,
  changedBy = null,
}) {
  try {
    // Redact sensitive details (passwords, hashes, secrets, reset tokens)
    const cleanBefore = beforeData ? redactSensitive(beforeData) : (oldValue ? redactSensitive(oldValue) : null);
    const cleanAfter = afterData ? redactSensitive(afterData) : (newValue ? redactSensitive(newValue) : null);

    const log = await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: actorUserId || null,
        bookingId: bookingId || null,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        changeSummary: changeSummary || null,
        beforeData: cleanBefore,
        afterData: cleanAfter,
        oldValue: cleanBefore,
        newValue: cleanAfter,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        changedBy: changedBy || null,
      },
    });
    return log;
  } catch (error) {
    console.error("⚠️ [AuditLog] Error recording log:", error.message);
  }
}

/**
 * Recursively redacts sensitive keys from audit log objects.
 */
function redactSensitive(data) {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitive);
  }

  const keysToRedact = [
    "password",
    "passwordHash",
    "password_hash",
    "token",
    "jwt",
    "otp",
    "resettoken",
    "reset_token",
    "secret",
    "apikey",
    "api_key",
    "key",
    "authorization",
    "signature",
    "tokenhash",
    "bankaccount",
    "accountnumber",
    "cardnumber",
    "cvv",
    "routingnumber",
    "upi",
    "cloudinarysecret",
  ];

  const result = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (keysToRedact.some((k) => lowerKey.includes(k))) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      result[key] = redactSensitive(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

module.exports = {
  logAction,
  redactSensitive,
};
