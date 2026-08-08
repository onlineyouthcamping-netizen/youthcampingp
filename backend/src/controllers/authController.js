const { prisma } = require("../lib/prisma");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { logAction } = require("../utils/auditLogger");
const { sanitizeUser } = require("../utils/sanitize");
const { ROLE_PERMISSIONS, PERMISSIONS } = require("../config/permissions");

const crypto = require("crypto");
const getSecretHash = () =>
  crypto
    .createHash("sha256")
    .update(process.env.JWT_SECRET || "")
    .digest("hex")
    .substring(0, 8);

// Generate JWT with tenantId and tokenVersion
const generateToken = (id, role, tenantId = "default", tokenVersion = 0) => {
  console.log(
    `[AUTH GENERATE] Secret Hash: ${getSecretHash()} | User ID: ${id} | Role: ${role}`,
  );
  return jwt.sign(
    { id, role, tenantId, tokenVersion },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    const submittedEmail = email.toLowerCase().trim();

    // Database-backed authentication only. Synthetic or fallback identities are
    // intentionally unsupported in every environment.
    const admin = await prisma.admin.findUnique({
      where: { email: submittedEmail },
    });
    if (admin) {
      // Check if user is active
      if (!admin.isActive) {
        await logAction({
          tenantId: admin.tenantId,
          actorUserId: admin.id,
          action: "failed_login_deactivated",
          entityType: "admin",
          entityId: admin.id,
          ipAddress,
        });
        return res
          .status(403)
          .json({ success: false, message: "Account is deactivated" });
      }

      let match = false;
      const normalizedHash = admin.password.startsWith("$2y$")
        ? `$2b$${admin.password.slice(4)}`
        : admin.password;
      match = await bcrypt.compare(password, normalizedHash);
      if (match) {
        // Fire lastLoginAt update and audit log in background (non-blocking for fast login response)
        const now = new Date();
        prisma.admin
          .update({
            where: { id: admin.id },
            data: { lastLoginAt: now },
          })
          .catch((err) =>
            console.error(
              "⚠️ [Auth] Failed to update lastLoginAt:",
              err.message,
            ),
          );

        logAction({
          tenantId: admin.tenantId,
          actorUserId: admin.id,
          action: "login",
          entityType: "admin",
          entityId: admin.id,
          ipAddress,
        }).catch((err) =>
          console.error("⚠️ [Auth] Failed to log action:", err.message),
        );

        const defaultPerms =
          admin.role === "superadmin"
            ? PERMISSIONS || []
            : ROLE_PERMISSIONS[admin.role] || [];
        const customPerms = Array.isArray(admin.customPermissions)
          ? admin.customPermissions
          : [];
        const permissions = Array.from(
          new Set([...defaultPerms, ...customPerms]),
        );

        return res.json({
          success: true,
          data: {
            token: generateToken(
              admin.id,
              admin.role,
              admin.tenantId,
              admin.tokenVersion || 0,
            ),
            admin: {
              id: admin.id,
              name: admin.name,
              email: admin.email,
              role: admin.role,
              tenantId: admin.tenantId,
              customPermissions: customPerms,
              permissions,
            },
          },
        });
      }
    }

    // Log failed login attempt
    await logAction({
      tenantId: "default",
      actorUserId: null,
      action: "failed_login",
      entityType: "admin",
      entityId: null,
      beforeData: { email: submittedEmail },
      ipAddress,
    });

    res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current admin profile (My Profile)
// @route   GET /api/admin/me
// @access  Private
exports.getMe = async (req, res, next) => {
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
        updatedAt: true,
      },
    });

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }

    // Role-based permissions calculation (shallow clone to prevent mutating global ROLE_PERMISSIONS)
    let permissions =
      admin.role === "superadmin"
        ? [...PERMISSIONS]
        : [...(ROLE_PERMISSIONS[admin.role] || [])];
    if (Array.isArray(admin.customPermissions)) {
      admin.customPermissions.forEach((p) => {
        if (!permissions.includes(p)) permissions.push(p);
      });
    }

    res.json({
      success: true,
      data: {
        ...sanitizeUser(admin),
        permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current logged-in user's own profile (My Profile)
// @route   PUT /api/admin/me
// @access  Private (Self only - NEVER accepts user ID from frontend)
exports.updateMe = async (req, res, next) => {
  try {
    const {
      phone,
      avatarUrl,
      notificationPreferences,
      uiSettings,
      location,
      bio,
      preferences,
    } = req.body;

    let mergedUiSettings = uiSettings;
    if (
      location !== undefined ||
      bio !== undefined ||
      preferences !== undefined
    ) {
      const current = await prisma.admin.findUnique({
        where: { id: req.user.id },
        select: { uiSettings: true },
      });
      const currentUi =
        (current &&
          typeof current.uiSettings === "object" &&
          current.uiSettings) ||
        {};
      mergedUiSettings = {
        ...currentUi,
        ...(uiSettings || {}),
        ...(location !== undefined && { location }),
        ...(bio !== undefined && { bio }),
        ...(preferences !== undefined && { preferences }),
      };
    }

    const updatedUser = await prisma.admin.update({
      where: { id: req.user.id },
      data: {
        ...(phone !== undefined && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(notificationPreferences !== undefined && {
          notificationPreferences,
        }),
        ...(mergedUiSettings !== undefined && { uiSettings: mergedUiSettings }),
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
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Profile and settings updated successfully",
      data: sanitizeUser(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change current logged-in user's own password
// @route   PUT /api/admin/me/password
// @access  Private (Self only)
exports.updateMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res
        .status(400)
        .json({
          success: false,
          message: "New password must be at least 4 characters long",
        });
    }

    const admin = await prisma.admin.findUnique({ where: { id: req.user.id } });
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    // Verify current password if provided
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Incorrect current password" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.admin.update({
      where: { id: req.user.id },
      data: {
        password: passwordHash,
        tokenVersion: { increment: 1 },
      },
    });

    res.json({ success: true, message: "Password updated successfully" });
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
      return res
        .status(400)
        .json({ success: false, message: "Please provide email address" });
    }
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!admin) {
      return res.json({
        success: true,
        message:
          "If the email exists in our system, password reset instructions have been sent.",
      });
    }

    await logAction({
      tenantId: admin.tenantId,
      actorUserId: admin.id,
      action: "password_reset_request",
      entityType: "admin",
      entityId: admin.id,
      beforeData: { email: admin.email },
    });

    res.json({
      success: true,
      message:
        "If the email exists in our system, password reset instructions have been sent.",
    });
  } catch (error) {
    next(error);
  }
};
