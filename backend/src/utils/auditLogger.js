const { prisma } = require('../lib/prisma');

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
  tenantId = 'default',
  actorUserId,
  action,
  entityType,
  entityId,
  beforeData = null,
  afterData = null,
  ipAddress = null
}) {
  try {
    // Redact sensitive details (passwords, hashes, secrets, reset tokens)
    const cleanBefore = beforeData ? redactSensitive(beforeData) : null;
    const cleanAfter = afterData ? redactSensitive(afterData) : null;

    const log = await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId,
        action,
        entityType,
        entityId,
        beforeData: cleanBefore,
        afterData: cleanAfter,
        ipAddress
      }
    });
    return log;
  } catch (error) {
    console.error('⚠️ [AuditLog] Error recording log:', error.message);
  }
}

/**
 * Recursively redacts sensitive keys from audit log objects.
 */
function redactSensitive(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitive);
  }

  const keysToRedact = [
    'password',
    'passwordHash',
    'password_hash',
    'token',
    'jwt',
    'secret',
    'apiKey',
    'api_key',
    'key',
    'cloudinarySecret',
    'signature',
    'tokenHash'
  ];

  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (keysToRedact.some(k => key.toLowerCase().includes(k))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      result[key] = redactSensitive(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

module.exports = {
  logAction,
  redactSensitive
};
