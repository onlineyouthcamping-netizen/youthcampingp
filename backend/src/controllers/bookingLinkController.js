const crypto = require('crypto');
const { prisma } = require('../lib/prisma');

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const generateToken = () => {
  // 256-bit token -> hex (64 chars)
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenPrefix: token.slice(0, 8) };
};

const getBaseUrl = () => {
  const url = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://youthcamping.online';
  return url.replace(/\/$/, '');
};

const getSigningSecret = () => process.env.BOOKING_LINK_SECRET || process.env.JWT_SECRET || 'dev-booking-link-secret';

const createSignedPayload = (payload) => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', getSigningSecret()).update(encoded).digest('hex');
  return { payload: encoded, signature };
};

const verifySignedPayload = (encodedPayload, signature) => {
  if (!encodedPayload || !signature) return null;
  const expected = crypto.createHmac('sha256', getSigningSecret()).update(String(encodedPayload)).digest('hex');
  const actual = Buffer.from(String(signature));
  const expectedBuffer = Buffer.from(expected);
  if (actual.length !== expectedBuffer.length) return null;
  try {
    if (crypto.timingSafeEqual(actual, expectedBuffer)) {
      const decoded = Buffer.from(String(encodedPayload), 'base64url').toString('utf8');
      return JSON.parse(decoded);
    }
  } catch {
    return null;
  }
  return null;
};

const getIpHash = (req) => {
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || '';
  return ip ? sha256(ip) : null;
};

// ────────────────────────────────────────────
// ADMIN: Create booking link
// ────────────────────────────────────────────
exports.createBookingLink = async (req, res, next) => {
  try {
    const {
      tripId,
      departureDate,
      paymentMode,
      customAmount,
      pickupCity,
      expiresAt,
      customTime,
      headerTitle,
      headerSubtitle,
      customerName,
      customerPhone,
      customerEmail,
      travelerCount,
      internalNote,
      salesAdminId,
    } = req.body;

    if (!tripId || !departureDate || !paymentMode || pickupCity === undefined || pickupCity === null) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: tripId, departureDate, paymentMode, pickupCity',
      });
    }

    const tenantId = req.user?.tenantId || 'default';

    const trip = await prisma.trip.findFirst({
      where: {
        OR: [
          { id: String(tripId) },
          { slug: String(tripId) },
          { title: String(tripId) }
        ],
        tenantId
      },
      select: { id: true, title: true },
    });

    const finalTripId = trip ? trip.id : String(tripId);
    const finalTripName = trip ? trip.title : null;

    const { token, tokenPrefix } = generateToken();
    const tokenHash = sha256(token);

    const parsedDepartureDate = departureDate ? new Date(departureDate) : null;
    if (!parsedDepartureDate || isNaN(parsedDepartureDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid departureDate' });
    }

    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;
    const finalExpiresAt = parsedExpiresAt && !isNaN(parsedExpiresAt.getTime())
      ? parsedExpiresAt
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    let finalAdminId = null;
    if (req.user?.id) {
      const adminExists = await prisma.admin.findUnique({
        where: { id: req.user.id }
      });
      if (adminExists) {
        finalAdminId = req.user.id;
      }
    }

    if (req.user?.role && ['admin', 'superadmin'].includes(req.user.role) && salesAdminId) {
      const selectedSalesAdmin = await prisma.admin.findUnique({ where: { id: salesAdminId } });
      if (selectedSalesAdmin) {
        finalAdminId = selectedSalesAdmin.id;
      }
    }

    const signedMetadata = createSignedPayload({
      tenantId,
      tripId: finalTripId,
      tripName: finalTripName,
      departureDate: parsedDepartureDate.toISOString(),
      pickupCity: String(pickupCity),
      paymentMode: String(paymentMode),
      customAmount: customAmount !== undefined && customAmount !== null ? Number(customAmount) : null,
      customTime: customTime || null,
      headerTitle: headerTitle || null,
      headerSubtitle: headerSubtitle || null,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      customerEmail: customerEmail || null,
      travelerCount: travelerCount !== undefined && travelerCount !== null ? Number(travelerCount) : null,
      internalNote: internalNote || null,
      salesAdminId: finalAdminId,
      expiresAt: finalExpiresAt.toISOString(),
    });

    const link = await prisma.bookingLink.create({
      data: {
        tenantId,
        createdByAdminId: finalAdminId,
        tripId: finalTripId,
        tripName: finalTripName,
        departureDate: parsedDepartureDate,
        pickupCity: String(pickupCity),
        paymentMode: String(paymentMode),
        customAmount: customAmount !== undefined && customAmount !== null ? Number(customAmount) : null,
        customTime: customTime || null,
        headerTitle: headerTitle || null,
        headerSubtitle: headerSubtitle || null,
        expiresAt: finalExpiresAt,
        status: 'active',
        tokenHash,
        tokenPrefix,
        shareUrl: `${getBaseUrl()}/book/link/${token}?p=${encodeURIComponent(signedMetadata.payload)}&s=${encodeURIComponent(signedMetadata.signature)}`,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...link,
        shareUrl: link.shareUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// ADMIN: List booking links (with basic filters)
// ────────────────────────────────────────────
exports.getBookingLinks = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || 'default';
    const role = req.user?.role;
    const requesterAdminId = req.user?.id;

    const {
      salesAdminId,
      tripId,
      status,
      from,
      to,
    } = req.query;

    const where = { tenantId };

    if (tripId) where.tripId = String(tripId);
    if (status) where.status = String(status);

    // Optional date-range filter on createdAt
    if (from || to) {
      const createdAtFilter = {};
      if (from) createdAtFilter.gte = new Date(String(from));
      if (to) createdAtFilter.lte = new Date(String(to));
      where.createdAt = createdAtFilter;
    }

    // Role-based constraint (full enforcement comes in later access-control hardening task)
    if (role === 'sales') {
      where.createdByAdminId = requesterAdminId;
    } else if (salesAdminId) {
      where.createdByAdminId = String(salesAdminId);
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const [totalCount, links] = await Promise.all([
      prisma.bookingLink.count({ where }),
      prisma.bookingLink.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          createdByAdminId: true,
          tripId: true,
          tripName: true,
          departureDate: true,
          pickupCity: true,
          paymentMode: true,
          customAmount: true,
          customTime: true,
          headerTitle: true,
          headerSubtitle: true,
          expiresAt: true,
          status: true,
          tokenPrefix: true,
          shareUrl: true,
          openedCount: true,
          completedCount: true,
          createdAt: true,
        },
      })
    ]);

    // Populate live trip titles to guarantee details match live trips
    const tripIds = Array.from(new Set(links.map(l => l.tripId).filter(Boolean)));
    const liveTrips = tripIds.length > 0 ? await prisma.trip.findMany({
      where: { id: { in: tripIds } },
      select: { id: true, title: true }
    }) : [];
    const tripMap = new Map(liveTrips.map(t => [t.id, t.title]));

    const formattedLinks = links.map(l => ({
      ...l,
      tripName: tripMap.get(l.tripId) || l.tripName || 'Custom Trip'
    }));

    res.json({
      success: true,
      count: formattedLinks.length,
      data: formattedLinks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// ADMIN: Revoke link
// ────────────────────────────────────────────
exports.revokeBookingLink = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || 'default';
    const { id } = req.params;
    const role = req.user?.role;
    const requesterAdminId = req.user?.id;

    const link = await prisma.bookingLink.findFirst({
      where: { id, tenantId },
    });
    if (!link) return res.status(404).json({ success: false, message: 'Booking link not found' });

    // Sales can only revoke links they created
    if (role === 'sales' && requesterAdminId && link.createdByAdminId !== requesterAdminId) {
      return res.status(403).json({ success: false, message: 'Forbidden: cannot revoke this booking link' });
    }

    const updated = await prisma.bookingLink.update({
      where: { id },
      data: { status: 'revoked', revokedAt: new Date() },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// PUBLIC: Resolve link token -> snapshot for customer
// ────────────────────────────────────────────
exports.resolveBookingLink = async (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ success: false, message: 'token is required' });

    const tokenHash = sha256(String(token));
    const link = await prisma.bookingLink.findFirst({ where: { tokenHash } });

    if (!link) {
      return res.status(404).json({ success: false, message: 'Invalid booking link' });
    }

    const now = new Date();
    const signedMetadata = verifySignedPayload(req.query.p, req.query.s);

    if (link.status === 'revoked') {
      await prisma.bookingLinkEvent.create({
        data: {
          tenantId: link.tenantId,
          bookingLinkId: link.id,
          type: 'revoked_access',
          ipHash: getIpHash(req),
          userAgent: req.headers['user-agent']?.toString(),
        },
      });
      return res.status(410).json({ success: false, message: 'This booking link has been deactivated' });
    }

    if (link.status === 'used') {
      return res.status(410).json({ success: false, message: 'This booking link has already been used' });
    }

    if (link.expiresAt && link.expiresAt.getTime() < now.getTime()) {
      await prisma.bookingLink.update({
        where: { id: link.id },
        data: { status: 'expired' },
      });

      await prisma.bookingLinkEvent.create({
        data: {
          tenantId: link.tenantId,
          bookingLinkId: link.id,
          type: 'expired_access',
          ipHash: getIpHash(req),
          userAgent: req.headers['user-agent']?.toString(),
        },
      });

      return res.status(410).json({ success: false, message: 'This booking link has expired' });
    }

    if (link.status !== 'active') {
      return res.status(410).json({ success: false, message: 'This booking link is not active' });
    }

    const ipHash = getIpHash(req);
    const userAgent = req.headers['user-agent']?.toString();

    // Update open counters + emit event
    const openedAt = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.bookingLink.update({
        where: { id: link.id },
        data: {
          openedCount: { increment: 1 },
          firstOpenedAt: link.firstOpenedAt ? link.firstOpenedAt : openedAt,
          lastOpenedAt: openedAt,
        },
      });

      await tx.bookingLinkEvent.create({
        data: {
          tenantId: link.tenantId,
          bookingLinkId: link.id,
          type: 'opened',
          ipHash,
          userAgent,
        },
      });
    });

    // Fetch live trip title to guarantee exact detail matching
    const liveTrip = await prisma.trip.findFirst({
      where: { OR: [{ id: link.tripId }, { slug: link.tripId }, { title: link.tripId }, { shortName: link.tripId }] },
      select: { id: true, title: true }
    });

    // Return immutable snapshot used for prefill with live matched trip details
    return res.json({
      success: true,
      data: {
        bookingLinkId: link.id,
        salesAdminId: link.createdByAdminId,
        tokenPrefix: link.tokenPrefix,
        tripId: liveTrip ? liveTrip.id : link.tripId,
        tripName: liveTrip ? liveTrip.title : (link.tripName || 'Custom Trip'),
        departureDate: link.departureDate ? link.departureDate.toISOString() : null,
        pickupCity: link.pickupCity,
        paymentMode: link.paymentMode,
        customAmount: link.customAmount,
        customTime: link.customTime,
        headerTitle: link.headerTitle,
        headerSubtitle: link.headerSubtitle,
        expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
        customerName: signedMetadata?.customerName || null,
        customerPhone: signedMetadata?.customerPhone || null,
        customerEmail: signedMetadata?.customerEmail || null,
        travelerCount: signedMetadata?.travelerCount || null,
        internalNote: signedMetadata?.internalNote || null,
        status: link.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// ADMIN: Booking link analytics (basic)
// ────────────────────────────────────────────
exports.verifySignedPayload = verifySignedPayload;

exports.getBookingLinksAnalytics = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || 'default';
    const role = req.user?.role;
    const requesterAdminId = req.user?.id;

    const { from, to, salesAdminId } = req.query;

    const where = { tenantId, status: { in: ['active', 'expired', 'revoked'] } };
    if (role === 'sales') where.createdByAdminId = requesterAdminId;
    if (role !== 'sales' && salesAdminId) where.createdByAdminId = String(salesAdminId);

    // Range on createdAt
    if (from || to) {
      const createdAt = {};
      if (from) createdAt.gte = new Date(String(from));
      if (to) createdAt.lte = new Date(String(to));
      where.createdAt = createdAt;
    }

    // Fetch links + aggregate revenue from bookings
    const links = await prisma.bookingLink.findMany({
      where,
      select: { id: true, createdAt: true, openedCount: true, completedCount: true },
    });

    const linkIds = links.map((l) => l.id);
    if (linkIds.length === 0) {
      return res.json({
        success: true,
        data: {
          linksGenerated: 0,
          opened: 0,
          completedBookings: 0,
          revenueGenerated: 0,
        },
      });
    }

    const revenueAgg = await prisma.booking.aggregate({
      where: { tenantId, sourceBookingLinkId: { in: linkIds } },
      _sum: { totalAmount: true },
    });

    const linksGenerated = links.length;
    const opened = links.reduce((acc, l) => acc + (l.openedCount > 0 ? 1 : 0), 0);
    const completedBookings = links.reduce((acc, l) => acc + (l.completedCount || 0), 0);

    res.json({
      success: true,
      data: {
        linksGenerated,
        opened,
        completedBookings,
        revenueGenerated: revenueAgg._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

