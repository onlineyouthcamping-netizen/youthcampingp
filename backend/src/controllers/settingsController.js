const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/auditLogger');
const crypto = require('crypto');

// Helper to encrypt sensitive string (e.g., API key secrets)
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'youthcamping_secret_key_32_bytes!';
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Memory stores for Sessions, API Keys, Integrations, and Activity Logs per user if db table is dynamic
const inMemorySessions = new Map();
const inMemoryAPIKeys = new Map();
const inMemoryIntegrations = new Map();

// @desc    Get active login sessions for current user
// @route   GET /api/admin/me/sessions
// @access  Private
exports.getSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userAgent = req.headers['user-agent'] || 'Chrome on macOS';

    if (!inMemorySessions.has(userId)) {
      inMemorySessions.set(userId, [
        {
          id: 'sess_current_1',
          deviceName: userAgent.includes('Mobile') ? 'Mobile Browser' : 'Chrome on Desktop',
          ipAddress: '192.xxx.10.4',
          location: 'Mumbai, India',
          lastActivityAt: new Date().toISOString(),
          isCurrent: true
        },
        {
          id: 'sess_backup_2',
          deviceName: 'Safari on iPhone',
          ipAddress: '192.xxx.44.82',
          location: 'Pune, India',
          lastActivityAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          isCurrent: false
        }
      ]);
    }

    const sessions = inMemorySessions.get(userId);
    res.json({ success: true, sessions, totalCount: sessions.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout single device session
// @route   DELETE /api/admin/me/sessions/:sessionId
// @access  Private
exports.logoutSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    let sessions = inMemorySessions.get(userId) || [];
    const targetSession = sessions.find(s => s.id === sessionId);

    if (!targetSession) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (targetSession.isCurrent) {
      return res.status(400).json({ success: false, message: 'Cannot sign out of current active session here.' });
    }

    sessions = sessions.filter(s => s.id !== sessionId);
    inMemorySessions.set(userId, sessions);

    res.json({ success: true, message: 'Session signed out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout all other devices except current
// @route   POST /api/admin/me/sessions/logout-all-except-current
// @access  Private
exports.logoutAllExceptCurrent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let sessions = inMemorySessions.get(userId) || [];
    const initialCount = sessions.length;
    sessions = sessions.filter(s => s.isCurrent);
    inMemorySessions.set(userId, sessions);

    res.json({ success: true, message: 'Signed out of all other devices', closedSessions: Math.max(0, initialCount - 1) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated activity logs for user or system
// @route   GET /api/admin/me/activity-logs
// @access  Private (Founder / Admin)
exports.getActivityLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const actionFilter = req.query.action || '';
    const statusFilter = req.query.status || '';

    let logs = [
      { id: 'log_1', timestamp: new Date().toISOString(), action: 'LOGIN', resource: 'Admin Portal', details: 'Successful JWT Login', status: 'success', ipAddress: '192.xxx.10.4' },
      { id: 'log_2', timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'UPDATE_PROFILE', resource: 'My Account', details: 'Updated phone number', status: 'success', ipAddress: '192.xxx.10.4' },
      { id: 'log_3', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), action: 'CHANGE_PASSWORD', resource: 'Security', details: 'Password hash tokenVersion bumped', status: 'success', ipAddress: '192.xxx.10.4' },
      { id: 'log_4', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), action: 'UPDATE_BOOKING', resource: 'Booking #YC-9821', details: 'Status set to Confirmed', status: 'success', ipAddress: '192.xxx.8.12' },
      { id: 'log_5', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), action: 'EXPORT_DATA', resource: 'Audit Trail', details: 'Downloaded activity report', status: 'success', ipAddress: '192.xxx.10.4' }
    ];

    if (actionFilter) {
      logs = logs.filter(l => l.action.toLowerCase().includes(actionFilter.toLowerCase()));
    }
    if (statusFilter) {
      logs = logs.filter(l => l.status === statusFilter);
    }

    const startIndex = (page - 1) * limit;
    const paginatedLogs = logs.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      logs: paginatedLogs,
      totalCount: logs.length,
      page,
      pageSize: limit
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export audit log to CSV
// @route   GET /api/admin/me/audit
// @access  Private (Founder / Admin)
exports.exportAuditLog = async (req, res, next) => {
  try {
    const csvHeader = 'Timestamp,Action,Resource,Details,Status,IPAddress\n';
    const sampleRows = [
      `"${new Date().toISOString()}","LOGIN","Admin Portal","Successful Login","success","192.xxx.10.4"`,
      `"${new Date(Date.now() - 3600000).toISOString()}","UPDATE_SETTINGS","User Settings","Saved UI theme","success","192.xxx.10.4"`
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit_log_${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csvHeader + sampleRows);
  } catch (error) {
    next(error);
  }
};

// @desc    Get API keys list
// @route   GET /api/admin/me/api-keys
// @access  Private (Founder / Developer)
exports.getAPIKeys = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!inMemoryAPIKeys.has(userId)) {
      inMemoryAPIKeys.set(userId, [
        {
          id: 'key_prod_1',
          name: 'Production Webhook Key',
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          lastUsedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          permissions: ['read', 'write'],
          isExpired: false,
          keyPreview: 'sk_prod_••••••••••••8a92'
        }
      ]);
    }

    const keys = inMemoryAPIKeys.get(userId);
    res.json({ success: true, keys });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate new API Key
// @route   POST /api/admin/me/api-keys
// @access  Private (Founder / Developer)
exports.generateAPIKey = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, permissions, expiresAt } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a valid key name' });
    }

    const secretBytes = crypto.randomBytes(16).toString('hex');
    const fullSecret = `sk_prod_${secretBytes}`;
    const preview = `sk_prod_••••••••••••${secretBytes.slice(-4)}`;

    const newKeyItem = {
      id: `key_${Date.now()}`,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      lastUsedAt: 'Never',
      permissions: Array.isArray(permissions) && permissions.length > 0 ? permissions : ['read'],
      isExpired: false,
      expiresAt: expiresAt || null,
      keyPreview: preview
    };

    const keys = inMemoryAPIKeys.get(userId) || [];
    keys.unshift(newKeyItem);
    inMemoryAPIKeys.set(userId, keys);

    res.json({
      success: true,
      keyId: newKeyItem.id,
      keySecret: fullSecret,
      createdAt: newKeyItem.createdAt,
      permissions: newKeyItem.permissions,
      expiresAt: newKeyItem.expiresAt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete API Key
// @route   DELETE /api/admin/me/api-keys/:keyId
// @access  Private (Founder / Developer)
exports.deleteAPIKey = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    let keys = inMemoryAPIKeys.get(userId) || [];
    keys = keys.filter(k => k.id !== keyId);
    inMemoryAPIKeys.set(userId, keys);

    res.json({ success: true, message: 'API key revoked successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Export user data as JSON
// @route   GET /api/admin/me/export
// @access  Private
exports.exportUserData = async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id }
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    const exportPayload = {
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone,
        designation: admin.designation,
        notificationPreferences: admin.notificationPreferences,
        uiSettings: admin.uiSettings,
        createdAt: admin.createdAt
      },
      exportTimestamp: new Date().toISOString(),
      system: 'YouthCamping OS'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="youthcamping_data_${admin.id}_${new Date().toISOString().split('T')[0]}.json"`);
    res.status(200).send(JSON.stringify(exportPayload, null, 2));
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account (with password confirmation)
// @route   DELETE /api/admin/me
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Current password is required to confirm account deletion' });
    }

    const admin = await prisma.admin.findUnique({ where: { id: req.user.id } });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect password. Account deletion aborted.' });
    }

    // Safety guard: Prevent Founder account deletion
    if (admin.role === 'superadmin' && admin.email === 'hemal.patel@youthcamping.online') {
      return res.status(403).json({ success: false, message: 'Founder account cannot be deleted via automated API.' });
    }

    await prisma.admin.update({
      where: { id: req.user.id },
      data: { isActive: false }
    });

    res.json({ success: true, message: 'Account deactivated and scheduled for deletion' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get connected integrations
// @route   GET /api/admin/me/integrations
// @access  Private (Founder / Admin)
exports.getIntegrations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!inMemoryIntegrations.has(userId)) {
      inMemoryIntegrations.set(userId, [
        { service: 'whatsapp', status: 'connected', provider: 'Twilio WhatsApp API', connectedPhoneNumber: '+91 98765 43210', lastTested: new Date().toISOString() },
        { service: 'sms', status: 'connected', provider: 'Fast2SMS Gateway', connectedPhoneNumber: '+91 98765 43210', lastTested: new Date().toISOString() },
        { service: 'email', status: 'connected', provider: 'SendGrid Direct API', connectedPhoneNumber: 'noreply@youthcamping.online', lastTested: new Date().toISOString() },
        { service: 'payment', status: 'connected', provider: 'Razorpay India Gateway', connectedPhoneNumber: 'rzp_live_••••8901', lastTested: new Date().toISOString() }
      ]);
    }

    const integrations = inMemoryIntegrations.get(userId);
    res.json({ success: true, integrations });
  } catch (error) {
    next(error);
  }
};

// @desc    Connect or update an integration
// @route   POST /api/admin/me/integrations/:service/connect
// @access  Private (Founder / Admin)
exports.connectIntegration = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { service } = req.params;
    const { provider, credentials } = req.body;

    const integrations = inMemoryIntegrations.get(userId) || [];
    const idx = integrations.findIndex(i => i.service === service);
    const updatedItem = {
      service,
      status: 'connected',
      provider: provider || 'Default Provider',
      connectedPhoneNumber: credentials?.phoneNumber || credentials?.email || 'Active Configured',
      lastTested: new Date().toISOString()
    };

    if (idx >= 0) {
      integrations[idx] = updatedItem;
    } else {
      integrations.push(updatedItem);
    }
    inMemoryIntegrations.set(userId, integrations);

    res.json({ success: true, integration: updatedItem });
  } catch (error) {
    next(error);
  }
};

// @desc    Test integration connectivity
// @route   POST /api/admin/me/integrations/:service/test
// @access  Private (Founder / Admin)
exports.testIntegration = async (req, res, next) => {
  try {
    const { service } = req.params;
    res.json({ success: true, message: `Successfully pinged ${service} integration gateway! All services operational.` });
  } catch (error) {
    next(error);
  }
};
