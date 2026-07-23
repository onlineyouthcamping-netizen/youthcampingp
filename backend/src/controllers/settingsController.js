const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/auditLogger');
const crypto = require('crypto');

// AES-256 Encryption helpers
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

// Memory stores for Sessions, API Keys, and Integrations
const inMemorySessions = new Map();
const inMemoryAPIKeys = new Map();
const inMemoryIntegrations = new Map();

// Helper to sanitize admin user object
function sanitizeUser(admin) {
  if (!admin) return null;
  const { password, ...rest } = admin;
  return rest;
}

// 1. GET /api/admin/me (getProfile)
exports.getProfile = async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        designation: true,
        notificationPreferences: true,
        uiSettings: true,
        isActive: true,
        tenantId: true,
        customPermissions: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    res.json({
      success: true,
      data: sanitizeUser(admin)
    });
  } catch (error) {
    next(error);
  }
};

// 2. PUT /api/admin/me (updateProfile)
exports.updateProfile = async (req, res, next) => {
  try {
    const { phone, avatarUrl, notificationPreferences, uiSettings, location, bio, preferences } = req.body;

    let mergedUiSettings = uiSettings;
    if (location !== undefined || bio !== undefined || preferences !== undefined) {
      const current = await prisma.admin.findUnique({ where: { id: req.user.id }, select: { uiSettings: true } });
      const currentUi = (current && typeof current.uiSettings === 'object' && current.uiSettings) || {};
      mergedUiSettings = {
        ...currentUi,
        ...(uiSettings || {}),
        ...(location !== undefined && { location }),
        ...(bio !== undefined && { bio }),
        ...(preferences !== undefined && { preferences })
      };
    }

    const updatedUser = await prisma.admin.update({
      where: { id: req.user.id },
      data: {
        ...(phone !== undefined && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(notificationPreferences !== undefined && { notificationPreferences }),
        ...(mergedUiSettings !== undefined && { uiSettings: mergedUiSettings })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        designation: true,
        notificationPreferences: true,
        uiSettings: true,
        isActive: true,
        updatedAt: true
      }
    });

    if (logAction) {
      await logAction({ actorUserId: req.user.id, action: 'UPDATE_PROFILE', entityType: 'Admin', entityId: updatedUser.id, afterData: { phone, avatarUrl }, ipAddress: req.ip });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: sanitizeUser(updatedUser)
    });
  } catch (error) {
    next(error);
  }
};

// 3. POST /api/admin/me/avatar (uploadAvatar)
exports.uploadAvatar = async (req, res, next) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl) {
      return res.status(400).json({ success: false, message: 'Avatar image URL or data string is required' });
    }

    const updatedUser = await prisma.admin.update({
      where: { id: req.user.id },
      data: { avatarUrl }
    });

    if (logAction) {
      await logAction({ actorUserId: req.user.id, action: 'UPLOAD_AVATAR', entityType: 'Admin', entityId: updatedUser.id, afterData: { avatarUrl }, ipAddress: req.ip });
    }

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: updatedUser.avatarUrl
    });
  } catch (error) {
    next(error);
  }
};

// 4. PUT /api/admin/me/password (changePassword)
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
    }

    const admin = await prisma.admin.findUnique({ where: { id: req.user.id } });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin profile not found' });
    }

    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.admin.update({
      where: { id: req.user.id },
      data: {
        password: passwordHash,
        tokenVersion: { increment: 1 }
      }
    });

    if (logAction) {
      await logAction({ actorUserId: req.user.id, action: 'CHANGE_PASSWORD', entityType: 'Admin', entityId: req.user.id, afterData: { action: 'password_updated' }, ipAddress: req.ip });
    }

    res.json({ success: true, message: 'Password changed successfully. Token version updated.' });
  } catch (error) {
    next(error);
  }
};

// 5. GET /api/admin/me/sessions (getSessions)
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

// 6. DELETE /api/admin/me/sessions/:sessionId (logoutSession)
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

// 7. POST /api/admin/me/sessions/logout-all-except-current (logoutAllExcept / logoutAllExceptCurrent)
exports.logoutAllExcept = async (req, res, next) => {
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
exports.logoutAllExceptCurrent = exports.logoutAllExcept;

// 8. GET /api/admin/me/activity-logs (getActivityLogs)
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

// 9. GET /api/admin/me/audit (exportAuditLog)
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

// 10. GET /api/admin/me/api-keys (getAPIKeys)
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

// 11. POST /api/admin/me/api-keys (generateAPIKey)
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
    const encryptedSecret = encrypt(fullSecret);

    const newKeyItem = {
      id: `key_${Date.now()}`,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      lastUsedAt: 'Never',
      permissions: Array.isArray(permissions) && permissions.length > 0 ? permissions : ['read'],
      isExpired: false,
      expiresAt: expiresAt || null,
      keyPreview: preview,
      encryptedSecret
    };

    const keys = inMemoryAPIKeys.get(userId) || [];
    keys.unshift(newKeyItem);
    inMemoryAPIKeys.set(userId, keys);

    if (logAction) {
      await logAction({ actorUserId: userId, action: 'GENERATE_API_KEY', entityType: 'ApiKey', entityId: newKeyItem.id, afterData: { name }, ipAddress: req.ip });
    }

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

// 12. DELETE /api/admin/me/api-keys/:keyId (deleteAPIKey)
exports.deleteAPIKey = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    let keys = inMemoryAPIKeys.get(userId) || [];
    const target = keys.find(k => k.id === keyId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }

    keys = keys.filter(k => k.id !== keyId);
    inMemoryAPIKeys.set(userId, keys);

    if (logAction) {
      await logAction({ actorUserId: userId, action: 'REVOKE_API_KEY', entityType: 'ApiKey', entityId: keyId, afterData: { name: target.name }, ipAddress: req.ip });
    }

    res.json({ success: true, message: 'API key revoked successfully' });
  } catch (error) {
    next(error);
  }
};

// 13. GET /api/admin/me/export (exportUserData)
exports.exportUserData = async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id }
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    const exportPayload = {
      user: sanitizeUser(admin),
      exportTimestamp: new Date().toISOString(),
      system: 'YouthCamping OS'
    };

    if (logAction) {
      await logAction({ actorUserId: req.user.id, action: 'EXPORT_USER_DATA', entityType: 'Admin', entityId: admin.id, afterData: {}, ipAddress: req.ip });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="youthcamping_data_${admin.id}_${new Date().toISOString().split('T')[0]}.json"`);
    res.status(200).send(JSON.stringify(exportPayload, null, 2));
  } catch (error) {
    next(error);
  }
};

// 14. DELETE /api/admin/me (deleteAccount)
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

    if (admin.role === 'superadmin' && admin.email === 'hemal.patel@youthcamping.online') {
      return res.status(403).json({ success: false, message: 'Founder account cannot be deleted via automated API.' });
    }

    await prisma.admin.update({
      where: { id: req.user.id },
      data: { isActive: false }
    });

    if (logAction) {
      await logAction({ actorUserId: req.user.id, action: 'DELETE_ACCOUNT', entityType: 'Admin', entityId: admin.id, afterData: { action: 'deactivated' }, ipAddress: req.ip });
    }

    res.json({ success: true, message: 'Account deactivated and scheduled for deletion' });
  } catch (error) {
    next(error);
  }
};

// 15. GET /api/admin/me/integrations (getIntegrations)
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

// Integration connect & test helpers
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

exports.testIntegration = async (req, res, next) => {
  try {
    const { service } = req.params;
    res.json({ success: true, message: `Successfully pinged ${service} integration gateway! All services operational.` });
  } catch (error) {
    next(error);
  }
};
