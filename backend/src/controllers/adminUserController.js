const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/auditLogger');

const usersCache = new Map(); // tenantId -> { data, expiresAt }
const USERS_CACHE_TTL = 5 * 60 * 1000;

// @desc    List all admin users (Superadmin only)
// @route   GET /api/admin/users
// @access  Private (superadmin)
exports.listUsers = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const cached = usersCache.get(tenantId);
    if (cached && Date.now() < cached.expiresAt) {
      return res.json({ success: true, data: cached.data });
    }

    const users = await prisma.admin.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        tokenVersion: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    usersCache.set(tenantId, { data: users, expiresAt: Date.now() + USERS_CACHE_TTL });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new admin user (Superadmin only)
// @route   POST /api/admin/users
// @access  Private (superadmin)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const submittedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existing = await prisma.admin.findUnique({ where: { email: submittedEmail } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email address is already in use' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.admin.create({
      data: {
        name,
        email: submittedEmail,
        role,
        password: passwordHash,
        tenantId: req.user.tenantId || 'default'
      }
    });

    await logAction({
      tenantId: req.user.tenantId,
      actorUserId: req.user.id,
      action: 'user_created',
      entityType: 'admin',
      entityId: newUser.id,
      afterData: { name, email: submittedEmail, role },
      ipAddress
    });

    const userResponse = { ...newUser };
    delete userResponse.password;

    res.status(201).json({ success: true, data: userResponse });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an admin's role (Superadmin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private (superadmin)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }

    const targetUser = await prisma.admin.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    const updatedUser = await prisma.admin.update({
      where: { id: targetUserId },
      data: {
        role,
        tokenVersion: { increment: 1 } // Invalidate existing sessions
      }
    });

    await logAction({
      tenantId: req.user.tenantId,
      actorUserId: req.user.id,
      action: 'role_change',
      entityType: 'admin',
      entityId: targetUserId,
      beforeData: { role: targetUser.role },
      afterData: { role },
      ipAddress
    });

    res.json({ success: true, data: { id: updatedUser.id, role: updatedUser.role } });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status (Superadmin only)
// @route   PUT /api/admin/users/:id/toggle-active
// @access  Private (superadmin)
exports.toggleUserActive = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    const targetUser = await prisma.admin.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    const nextActive = !targetUser.isActive;
    const updatedUser = await prisma.admin.update({
      where: { id: targetUserId },
      data: {
        isActive: nextActive,
        tokenVersion: { increment: 1 } // Invalidate tokens
      }
    });

    await logAction({
      tenantId: req.user.tenantId,
      actorUserId: req.user.id,
      action: nextActive ? 'user_reactivated' : 'user_deactivated',
      entityType: 'admin',
      entityId: targetUserId,
      beforeData: { isActive: targetUser.isActive },
      afterData: { isActive: nextActive },
      ipAddress
    });

    res.json({ success: true, data: { id: updatedUser.id, isActive: updatedUser.isActive } });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset admin user password (Superadmin only)
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private (superadmin)
exports.resetUserPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const targetUserId = req.params.id;
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
    }

    const targetUser = await prisma.admin.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.admin.update({
      where: { id: targetUserId },
      data: {
        password: passwordHash,
        tokenVersion: { increment: 1 } // Invalidate tokens
      }
    });

    await logAction({
      tenantId: req.user.tenantId,
      actorUserId: req.user.id,
      action: 'password_reset',
      entityType: 'admin',
      entityId: targetUserId,
      ipAddress
    });

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    List Audit Logs (Superadmin only)
// @route   GET /api/admin/audit-logs
// @access  Private (superadmin)
exports.listAuditLogs = async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: req.user.tenantId
      },
      orderBy: { createdAt: 'desc' },
      take: 200 // Max 200 logs
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
