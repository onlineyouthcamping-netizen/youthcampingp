const { prisma } = require('../lib/prisma');

/**
 * @desc    Create vendor
 * @route   POST /api/vendors
 * @access  Private/Admin
 */
exports.createVendor = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.create({
      data: { ...req.body, tenantId: req.user.tenantId }
    });
    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all vendors (Scoped by tenantId)
 * @route   GET /api/vendors
 * @access  Private/Admin
 */
exports.getVendors = async (req, res, next) => {
  try {
    const where = { tenantId: req.user.tenantId };
    if (req.query.type) where.type = req.query.type;
    if (req.query.active !== undefined) where.isActive = req.query.active === 'true';

    const vendors = await prisma.vendor.findMany({ where, orderBy: { name: 'asc' } });
    res.json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign vendor to trip
 * @route   POST /api/vendors/trip-assign
 * @access  Private/Admin
 */
exports.assignVendorToTrip = async (req, res, next) => {
  try {
    const { tripId, vendorId, agreedCost, notes } = req.body;
    const tenantId = req.user.tenantId;

    const assignment = await prisma.tripVendor.create({
      data: { tripId, vendorId, agreedCost: Number(agreedCost), notes, tenantId },
      include: { vendor: true }
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all vendors for a trip
 * @route   GET /api/vendors/trip/:tripId
 * @access  Private/Admin
 */
exports.getVendorsForTrip = async (req, res, next) => {
  try {
    const assignments = await prisma.tripVendor.findMany({
      where: { tripId: req.params.tripId, tenantId: req.user.tenantId },
      include: { vendor: true },
      orderBy: { createdAt: 'asc' }
    });

    const totalVendorCost = assignments.reduce((sum, a) => sum + (a.agreedCost || 0), 0);
    const totalPaidToVendors = assignments.reduce((sum, a) => sum + (a.paidAmount || 0), 0);

    res.json({
      success: true,
      data: assignments,
      summary: {
        totalVendorCost,
        totalPaidToVendors,
        pendingVendorPayments: totalVendorCost - totalPaidToVendors,
        count: assignments.length
      }
    });
  } catch (error) {
    next(error);
  }
};
/**
 * @desc    Get single vendor
 * @route   GET /api/vendors/:id
 */
exports.getVendor = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vendor
 * @route   PUT /api/vendors/:id
 */
exports.updateVendor = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.updateMany({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: req.body
    });
    if (vendor.count === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, message: 'Vendor updated' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete vendor
 * @route   DELETE /api/vendors/:id
 */
exports.deleteVendor = async (req, res, next) => {
  try {
    const result = await prisma.vendor.deleteMany({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (result.count === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update trip vendor assignment
 * @route   PUT /api/vendors/trip-assign/:id
 */
exports.updateTripVendor = async (req, res, next) => {
  try {
    const assignment = await prisma.tripVendor.updateMany({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: req.body
    });
    if (assignment.count === 0) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, message: 'Assignment updated' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove trip vendor assignment
 * @route   DELETE /api/vendors/trip-assign/:id
 */
exports.removeTripVendor = async (req, res, next) => {
  try {
    const result = await prisma.tripVendor.deleteMany({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (result.count === 0) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, message: 'Assignment removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get bulk trip vendor assignments
 * @route   GET /api/vendors/bulk
 */
exports.getBulkTripVendors = async (req, res, next) => {
  try {
    const { tripIds } = req.query;
    let where = { tenantId: req.user.tenantId };
    if (tripIds) {
      const ids = String(tripIds).split(',').filter(Boolean);
      where.tripId = { in: ids };
    }
    const assignments = await prisma.tripVendor.findMany({
      where,
      include: { vendor: true },
      orderBy: { createdAt: 'asc' }
    });

    const byTrip = {};
    assignments.forEach(a => {
      if (!byTrip[a.tripId]) byTrip[a.tripId] = [];
      byTrip[a.tripId].push(a);
    });

    res.json({
      success: true,
      data: byTrip
    });
  } catch (error) {
    next(error);
  }
};
