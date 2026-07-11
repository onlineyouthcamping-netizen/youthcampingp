const { prisma } = require('../lib/prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/auditLogger');
const { sanitizeUser } = require('../utils/sanitize');

// Generate JWT with tenantId and tokenVersion
const generateToken = (id, role, tenantId = 'default', tokenVersion = 0) => {
  return jwt.sign({ id, role, tenantId, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const submittedEmail = email.toLowerCase().trim();

    // Database-backed authentication only. Synthetic or fallback identities are
    // intentionally unsupported in every environment.
    const admin = await prisma.admin.findUnique({ where: { email: submittedEmail } });
    if (admin) {
      // Check if user is active
      if (!admin.isActive) {
        await logAction({
          tenantId: admin.tenantId,
          actorUserId: admin.id,
          action: 'failed_login_deactivated',
          entityType: 'admin',
          entityId: admin.id,
          ipAddress
        });
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
      }

      let match = false;
      const normalizedHash = admin.password.startsWith('$2y$')
        ? `$2b$${admin.password.slice(4)}`
        : admin.password;
      match = await bcrypt.compare(password, normalizedHash);
      if (match) {
        // Successful login: update lastLoginAt
        const now = new Date();
        await prisma.admin.update({
          where: { id: admin.id },
          data: { lastLoginAt: now }
        });

        await logAction({
          tenantId: admin.tenantId,
          actorUserId: admin.id,
          action: 'login',
          entityType: 'admin',
          entityId: admin.id,
          ipAddress
        });

        return res.json({
          success: true,
          data: {
            token: generateToken(admin.id, admin.role, admin.tenantId, admin.tokenVersion),
            admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, tenantId: admin.tenantId }
          }
        });
      }
    }

    // Log failed login attempt
    await logAction({
      tenantId: 'default',
      actorUserId: null,
      action: 'failed_login',
      entityType: 'admin',
      entityId: null,
      beforeData: { email: submittedEmail },
      ipAddress
    });

    res.status(401).json({ success: false, message: 'Invalid email or password' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current admin
// @route   GET /api/admin/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const admin = await prisma.admin.findFirst({
      where: { id: req.user.id, tenantId },
      select: {
        id: true, name: true, email: true, role: true, tenantId: true,
        isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true
      }
    });
    res.json({ success: true, data: sanitizeUser(admin) });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin forgot password request
// @route   POST /api/admin/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email address' });
    }
    const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!admin) {
      return res.json({ success: true, message: 'If the email exists in our system, password reset instructions have been sent.' });
    }
    
    await logAction({
      tenantId: admin.tenantId,
      actorUserId: admin.id,
      action: 'password_reset_request',
      entityType: 'admin',
      entityId: admin.id,
      beforeData: { email: admin.email }
    });

    res.json({
      success: true,
      message: 'If the email exists in our system, password reset instructions have been sent.'
    });
  } catch (error) {
    next(error);
  }
};
