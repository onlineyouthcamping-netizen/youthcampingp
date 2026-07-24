const express = require('express');
const router = express.Router({ mergeParams: true });
const { prisma } = require('../lib/prisma');
const { authenticate, requirePermission } = require('../middleware/auth');

/**
 * 1. GET /api/trips/:tripId/vendors
 * Fetch all vendors linked to this trip
 * Join with Vendor model to get vendor details
 * Return: { success: true, data: { vendors: [{id, vendorId, role, contactName, contactPhone, contactEmail, notes}], total }, message: '' }
 */
router.get('/:tripId/vendors', authenticate, requirePermission('view_trip'), async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const [rawVendors, total] = await Promise.all([
      prisma.tripVendor.findMany({
        where: { tripId },
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: true
        }
      }),
      prisma.tripVendor.count({ where: { tripId } })
    ]);

    const vendors = rawVendors.map(tv => ({
      id: tv.id,
      vendorId: tv.vendorId,
      role: tv.role,
      contactName: tv.contactName || tv.vendor?.contactPerson || tv.vendor?.name || '',
      contactPhone: tv.contactPhone || tv.vendor?.phone || '',
      contactEmail: tv.contactEmail || tv.vendor?.email || '',
      notes: tv.notes || '',
      agreedCost: tv.agreedCost,
      paidAmount: tv.paidAmount,
      paymentStatus: tv.paymentStatus,
      vendor: tv.vendor
    }));

    return res.json({
      success: true,
      data: { vendors, total },
      message: 'Trip vendors fetched successfully'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. POST /api/trips/:tripId/vendors
 * Link existing vendor to trip
 * Body: { vendorId, role, contactName, contactPhone, contactEmail, notes }
 * Auto-log to TripActivityLog
 * Return: created TripVendor
 */
router.post('/:tripId/vendors', authenticate, requirePermission('edit_trip'), async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { vendorId, role, contactName, contactPhone, contactEmail, notes, agreedCost } = req.body;

    let vDetails = null;
    if (vendorId) {
      vDetails = await prisma.vendor.findUnique({ where: { id: vendorId } });
    }

    const tripVendor = await prisma.tripVendor.create({
      data: {
        tripId,
        vendorId: vendorId || null,
        role: role || (vDetails ? vDetails.category : 'Vendor'),
        contactName: contactName || (vDetails ? (vDetails.contactPerson || vDetails.name) : null),
        contactPhone: contactPhone || (vDetails ? vDetails.phone : null),
        contactEmail: contactEmail || (vDetails ? vDetails.email : null),
        notes: notes || null,
        agreedCost: parseFloat(agreedCost) || 0
      },
      include: {
        vendor: true
      }
    });

    // Auto-log to TripActivityLog
    await prisma.tripActivityLog.create({
      data: {
        tripId,
        action: 'create',
        section: 'vendors',
        itemId: tripVendor.id,
        changes: {
          vendorId: tripVendor.vendorId,
          vendorName: vDetails ? vDetails.name : tripVendor.contactName,
          role: tripVendor.role,
          contactName: tripVendor.contactName
        },
        performedBy: req.user.id
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        id: tripVendor.id,
        vendorId: tripVendor.vendorId,
        role: tripVendor.role,
        contactName: tripVendor.contactName,
        contactPhone: tripVendor.contactPhone,
        contactEmail: tripVendor.contactEmail,
        notes: tripVendor.notes,
        agreedCost: tripVendor.agreedCost,
        vendor: tripVendor.vendor
      },
      message: 'Vendor linked to trip successfully'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. DELETE /api/trips/:tripId/vendors/:vendorId
 * Unlink vendor from trip
 * Auto-log
 */
router.delete('/:tripId/vendors/:vendorId', authenticate, requirePermission('edit_trip'), async (req, res, next) => {
  try {
    const { tripId, vendorId } = req.params;

    const tripVendor = await prisma.tripVendor.findFirst({
      where: {
        tripId,
        OR: [
          { id: vendorId },
          { vendorId: vendorId }
        ]
      },
      include: { vendor: true }
    });

    if (!tripVendor) {
      return res.status(404).json({ success: false, message: 'Trip vendor link not found' });
    }

    await prisma.tripVendor.delete({
      where: { id: tripVendor.id }
    });

    // Auto-log unlinking to TripActivityLog
    await prisma.tripActivityLog.create({
      data: {
        tripId,
        action: 'delete',
        section: 'vendors',
        itemId: tripVendor.id,
        changes: {
          vendorId: tripVendor.vendorId,
          role: tripVendor.role,
          contactName: tripVendor.contactName
        },
        performedBy: req.user.id
      }
    });

    return res.json({
      success: true,
      data: null,
      message: 'Vendor unlinked from trip successfully'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
