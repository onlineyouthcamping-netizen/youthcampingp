const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const { hasPermission } = require('../config/permissions');

const FORBIDDEN_SYNTHETIC_IDENTITIES = new Set([
  'root_admin_bypass',
  'dev_user'
]);

const cache = require('../lib/cache');
const ADMIN_CACHE_TTL = 60 * 1000; // 60 seconds

// JWT auth middleware
const authenticate = async (req, res, next) => {
  const authStart = Date.now();
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing Bearer token' });
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      return res.status(401).json({ success: false, message: 'Missing token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || FORBIDDEN_SYNTHETIC_IDENTITIES.has(decoded.id)) {
      return res.status(401).json({ success: false, message: 'Account not found' });
    }

    const cacheKey = `auth:${decoded.id}`;
    const cachedVal = await cache.get(cacheKey);
    let cached = null;
    if (cachedVal) {
      try {
        cached = JSON.parse(cachedVal);
      } catch (e) {}
    }
    if (cached && Date.now() < cached.expiresAt && cached.tokenVersion === decoded.tokenVersion) {
      req.user = cached.user;
      req.admin = cached.user;
      if (req._timings) req._timings.auth = Date.now() - authStart;
      return next();
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id }
    });

    if (!admin) {
      // Fallback check on User table for standard user logins (if applicable)
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Account not found' });
      }
      if (Object.prototype.hasOwnProperty.call(user, 'isActive') && user.isActive === false) {
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
      }
      req.user = {
        id: user.id,
        role: user.role,
        tenantId: user.tenantId || 'default'
      };
      req.admin = req.user;
      if (req._timings) req._timings.auth = Date.now() - authStart;
      return next();
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Verify token version
    // Policy: New tokens always include tokenVersion. If the token has a
    // tokenVersion, it must match the database. Legacy tokens without
    // tokenVersion are accepted during the migration period but will be
    // rejected once tokenVersion is set on the admin record.
    if (decoded.tokenVersion !== undefined) {
      if (decoded.tokenVersion !== admin.tokenVersion) {
        return res.status(401).json({ success: false, message: 'Token revoked: credentials changed' });
      }
    } else if (admin.tokenVersion > 0) {
      return res.status(401).json({ success: false, message: 'Token revoked: please log in again' });
    }

    const user = {
      id: admin.id,
      role: admin.role,
      tenantId: admin.tenantId || 'default'
    };

    await cache.set(cacheKey, {
      user,
      tokenVersion: admin.tokenVersion,
      expiresAt: Date.now() + ADMIN_CACHE_TTL
    }, 60);

    req.user = user;
    req.admin = user;
    if (req._timings) req._timings.auth = Date.now() - authStart;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', status: 401, success: false, message: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid or expired token', status: 401, success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Middleware to enforce role-permission checks.
 */
const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    if (hasPermission(req.user.role, permissionKey)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
  };
};

/**
 * Middleware to restrict by roles list.
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    if (roles.includes(req.user.role) || req.user.role === 'superadmin') {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized role' });
  };
};

/**
 * Middleware to enforce model ownership and scope validation.
 */
const enforceOwnership = (modelName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const role = req.user.role;
    const userId = req.user.id;
    const resourceId = req.params.id;

    // Superadmin and Admin bypass ownership restrictions
    if (role === 'superadmin' || role === 'admin') {
      return next();
    }

    try {
      if (modelName === 'booking') {
        const booking = await prisma.booking.findFirst({
          where: { id: resourceId, tenantId: req.user.tenantId }
        });
        if (!booking) {
          return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        if (role === 'sales' && booking.salesAdminId !== userId) {
          return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        req.loadedBooking = booking; // Cache it so we don't have to query again
      }

      if (modelName === 'inquiry') {
        const inquiry = await prisma.inquiry.findFirst({
          where: { id: resourceId, tenantId: req.user.tenantId }
        });
        if (!inquiry) {
          return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }
        if (role === 'sales' && inquiry.salesAdminId !== userId) {
          return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }
        req.loadedInquiry = inquiry;
      }

      if (modelName === 'quotation') {
        const quotation = await prisma.quotation.findFirst({
          where: { id: resourceId, tenantId: req.user.tenantId }
        });
        if (!quotation) {
          return res.status(404).json({ success: false, message: 'Quotation not found' });
        }
        if (role === 'sales' && quotation.salesAdminId !== userId) {
          return res.status(404).json({ success: false, message: 'Quotation not found' });
        }
        req.loadedQuotation = quotation;
      }

      if (modelName === 'trip') {
        const trip = await prisma.trip.findFirst({
          where: { id: resourceId, tenantId: req.user.tenantId }
        });
        if (!trip) {
          return res.status(404).json({ success: false, message: 'Trip not found' });
        }
        if (role === 'guide') {
          const assignment = await prisma.tripAssignment.findUnique({
            where: {
              tripId_guideId: {
                tripId: resourceId,
                guideId: userId
              }
            }
          });
          if (!assignment) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
          }
        }
        req.loadedTrip = trip;
      }

      if (!['booking', 'inquiry', 'quotation', 'trip'].includes(modelName)) {
        return res.status(500).json({ success: false, message: `Unknown ownership model: ${modelName}` });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

const protect = authenticate;
const protectUser = authenticate;
const protectAny = authenticate;

module.exports = {
  authenticate,
  protect,
  protectUser,
  protectAny,
  requirePermission,
  requireRole,
  enforceOwnership
};
