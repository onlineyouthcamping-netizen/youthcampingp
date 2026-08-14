const jwt = require("jsonwebtoken");
const { prisma } = require("../lib/prisma");
const {
  hasPermission,
  getRolePermissions,
  ROLE_PERMISSIONS,
  PERMISSIONS,
} = require("../config/permissions");
const {
  isProtectedSuperadminIdentity,
} = require("../config/superadmin");

const FORBIDDEN_SYNTHETIC_IDENTITIES = new Set([
  "root_admin_bypass",
  "dev_user",
]);

const cache = require("../lib/cache");
const ADMIN_CACHE_TTL = 60 * 1000; // 60 seconds

// JWT auth middleware
const authenticate = async (req, res, next) => {
  const authStart = Date.now();
  try {
    console.log(
      "[AUTH DEBUG] Path:",
      req.path,
      "Authenticated:",
      !!(req.headers.authorization || req.query.token)
    );
    let authHeader = req.headers.authorization || "";
    if (!authHeader && req.query.token) {
      authHeader = `Bearer ${req.query.token}`;
    }
    if (!authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Missing Bearer token" });
    }

    let token = authHeader.slice("Bearer ".length).trim();
    token = token.replace(/^["'\\]+|["'\\]+$/g, "").trim();
    if (!token) {
      return res
        .status(401)
        .json({
          success: false,
          code: "MISSING_TOKEN",
          message: "Missing token",
        });
    }

    const crypto = require("crypto");
    const secretHash = crypto
      .createHash("sha256")
      .update(process.env.JWT_SECRET || "")
      .digest("hex")
      .substring(0, 8);

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      console.error(
        `[AUTH ERROR] Path: ${req.path} | Secret Hash: ${secretHash} | Token Len: ${token.length} | Error: ${jwtErr.name} - ${jwtErr.message}`,
      );
      throw jwtErr;
    }

    if (!decoded.id || FORBIDDEN_SYNTHETIC_IDENTITIES.has(decoded.id)) {
      return res
        .status(401)
        .json({ success: false, message: "Account not found" });
    }

    const cacheKey = `auth:${decoded.id}`;
    const cachedVal = await cache.get(cacheKey);
    let cached = null;
    if (cachedVal) {
      try {
        cached = JSON.parse(cachedVal);
      } catch (e) {}
    }
    if (
      cached &&
      Date.now() < cached.expiresAt &&
      cached.tokenVersion === decoded.tokenVersion
    ) {
      req.user = cached.user;
      req.admin = cached.user;
      req.hasPermission = (permKey) => hasPermission(req.user, permKey);
      req.can = (permKey) => hasPermission(req.user, permKey);
      if (req._timings) req._timings.auth = Date.now() - authStart;
      return next();
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
    });

    if (!admin) {
      // Fallback check on User table for standard user logins (if applicable)
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Account not found" });
      }
      if (
        Object.prototype.hasOwnProperty.call(user, "isActive") &&
        user.isActive === false
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Account is deactivated" });
      }
      const userRole = (user.role || "").trim().toLowerCase();
      const defaultUserPerms =
        userRole === "superadmin"
          ? [...PERMISSIONS]
          : getRolePermissions(user.role);
      req.user = {
        id: user.id,
        role: user.role,
        permissions: defaultUserPerms,
        tenantId: user.tenantId || "default",
      };
      req.admin = req.user;
      req.hasPermission = (permKey) => hasPermission(req.user, permKey);
      req.can = (permKey) => hasPermission(req.user, permKey);
      if (req._timings) req._timings.auth = Date.now() - authStart;
      return next();
    }

    // Check if account is active
    if (!admin.isActive) {
      return res
        .status(403)
        .json({
          success: false,
          code: "USER_DEACTIVATED",
          message: "Account is deactivated",
        });
    }

    // Verify token version (only revoke if token is older than admin.tokenVersion)
    if (
      decoded.tokenVersion !== undefined &&
      admin.tokenVersion !== undefined &&
      admin.tokenVersion > 0
    ) {
      if (decoded.tokenVersion < admin.tokenVersion) {
        return res
          .status(401)
          .json({
            success: false,
            code: "TOKEN_REVOKED",
            message: "Token revoked: credentials changed",
          });
      }
    }

    const adminRole = (admin.role || "").trim().toLowerCase();
    const defaultPerms =
      adminRole === "superadmin"
        ? [...PERMISSIONS]
        : getRolePermissions(admin.role);
    const customPerms = Array.isArray(admin.customPermissions)
      ? admin.customPermissions
      : [];
    const permissions = Array.from(new Set([...defaultPerms, ...customPerms]));

    const user = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      customPermissions: customPerms,
      permissions,
      tenantId: admin.tenantId || "default",
    };

    await cache.set(
      cacheKey,
      {
        user,
        tokenVersion: admin.tokenVersion,
        expiresAt: Date.now() + ADMIN_CACHE_TTL,
      },
      60,
    );

    req.user = user;
    req.admin = user;
    req.hasPermission = (permKey) => hasPermission(req.user, permKey);
    req.can = (permKey) => hasPermission(req.user, permKey);
    if (req._timings) req._timings.auth = Date.now() - authStart;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({
          error: "Token expired",
          code: "TOKEN_EXPIRED",
          status: 401,
          success: false,
          message: "Token expired",
        });
    }
    console.error("JWT Verification Error:", err);
    return res
      .status(401)
      .json({
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
        status: 401,
        success: false,
        message: "Invalid or expired token",
      });
  }
};

const logDeniedAccess = (req, reason, requiredPermission = null) => {
  const clientIp =
    req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  console.warn(
    `[SECURITY AUDIT - DENIED ACCESS] Timestamp: ${new Date().toISOString()} | UserID: ${req.user?.id || "unauthenticated"} | Role: ${req.user?.role || "none"} | Path: ${req.originalUrl || req.path} | IP: ${clientIp} | RequiredPerm: ${requiredPermission || "none"} | Reason: ${reason}`,
  );
};

/**
 * Middleware to enforce role-permission checks.
 */
const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      logDeniedAccess(req, "Missing user context", permissionKey);
      return res
        .status(401)
        .json({
          success: false,
          code: "UNAUTHENTICATED",
          message: "Unauthenticated",
        });
    }
    if (hasPermission(req.user, permissionKey)) {
      return next();
    }
    logDeniedAccess(req, "Insufficient permissions", permissionKey);
    return res
      .status(403)
      .json({
        success: false,
        code: "INSUFFICIENT_PERMISSIONS",
        requiredPermission: permissionKey,
        message: "Forbidden: Insufficient permissions",
      });
  };
};

/**
 * Middleware to restrict by roles list.
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }
    if (roles.includes(req.user.role) || req.user.role === "superadmin") {
      return next();
    }
    return res
      .status(403)
      .json({ success: false, message: "Forbidden: Unauthorized role" });
  };
};

/**
 * Middleware to enforce model ownership and scope validation.
 */
const enforceOwnership = (modelName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    const role = req.user.role;
    const userId = req.user.id;
    const resourceId = req.params.id;

    // Superadmin and Admin bypass ownership restrictions
    if (role === "superadmin" || role === "admin") {
      return next();
    }

    try {
      if (modelName === "booking") {
        let booking = await prisma.booking.findFirst({
          where: { id: resourceId, tenantId: req.user.tenantId },
        });
        if (!booking) {
          booking = await prisma.booking.findFirst({
            where: { id: resourceId },
          });
        }
        if (!booking) {
          return res
            .status(404)
            .json({ success: false, message: "Booking not found" });
        }
        // Allow all roles to view all bookings
        req.loadedBooking = booking; // Cache it so we don't have to query again
      }

      if (modelName === "inquiry") {
        const inquiry = await prisma.inquiry.findFirst({
          where: { id: resourceId, tenantId: req.user.tenantId },
        });
        if (!inquiry) {
          return res
            .status(404)
            .json({ success: false, message: "Inquiry not found" });
        }
        if (role === "sales" && inquiry.salesAdminId !== userId) {
          return res
            .status(404)
            .json({ success: false, message: "Inquiry not found" });
        }
        req.loadedInquiry = inquiry;
      }

      if (modelName === "quotation") {
        const quotation = await prisma.quotation.findFirst({
          where: { id: resourceId, tenantId: req.user.tenantId },
        });
        if (!quotation) {
          return res
            .status(404)
            .json({ success: false, message: "Quotation not found" });
        }
        if (role === "sales" && quotation.salesAdminId !== userId) {
          return res
            .status(404)
            .json({ success: false, message: "Quotation not found" });
        }
        req.loadedQuotation = quotation;
      }

      if (modelName === "trip") {
        const trip = await prisma.trip.findFirst({
          where: { id: resourceId, tenantId: req.user.tenantId },
        });
        if (!trip) {
          return res
            .status(404)
            .json({ success: false, message: "Trip not found" });
        }
        if (role === "guide") {
          const assignment = await prisma.tripAssignment.findUnique({
            where: {
              tripId_guideId: {
                tripId: resourceId,
                guideId: userId,
              },
            },
          });
          if (!assignment) {
            return res
              .status(404)
              .json({ success: false, message: "Trip not found" });
          }
        }
        req.loadedTrip = trip;
      }

      if (!["booking", "inquiry", "quotation", "trip"].includes(modelName)) {
        return res
          .status(500)
          .json({
            success: false,
            message: `Unknown ownership model: ${modelName}`,
          });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

const requireFounder = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthenticated" });
  }
  if (
    req.user.role === "superadmin" ||
    isProtectedSuperadminIdentity({ email: req.user.email, name: req.user.name })
  ) {
    return next();
  }
  return res
    .status(403)
    .json({ success: false, message: "Founder privileges required" });
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthenticated" });
  }
  if (
    ["superadmin", "admin"].includes(req.user.role) ||
    hasPermission(req.user, "settings.view") ||
    hasPermission(req.user, "audit.view")
  ) {
    return next();
  }
  return res
    .status(403)
    .json({
      success: false,
      message: "Access Denied: Admin privileges required.",
    });
};

const optionalAuthenticate = async (req, res, next) => {
  try {
    let authHeader = req.headers.authorization || "";
    if (!authHeader && req.query.token) {
      authHeader = `Bearer ${req.query.token}`;
    }
    if (!authHeader.startsWith("Bearer ")) {
      req.user = { id: "public", role: "public", tenantId: "default" };
      return next();
    }
    let token = authHeader.slice("Bearer ".length).trim();
    token = token.replace(/^["'\\]+|["'\\]+$/g, "").trim();
    if (!token) {
      req.user = { id: "public", role: "public", tenantId: "default" };
      return next();
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      req.user = { id: "public", role: "public", tenantId: "default" };
      return next();
    }
    if (!decoded.id || FORBIDDEN_SYNTHETIC_IDENTITIES.has(decoded.id)) {
      req.user = { id: "public", role: "public", tenantId: "default" };
      return next();
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
      },
    });
    if (user) {
      req.user = user;
    } else {
      req.user = { id: "public", role: "public", tenantId: "default" };
    }
    return next();
  } catch (err) {
    req.user = { id: "public", role: "public", tenantId: "default" };
    return next();
  }
};

const protect = authenticate;
const protectUser = authenticate;
const protectAny = authenticate;

module.exports = {
  authenticate,
  optionalAuthenticate,
  protect,
  protectUser,
  protectAny,
  requirePermission,
  requireRole,
  requireFounder,
  requireAdmin,
  enforceOwnership,
};
