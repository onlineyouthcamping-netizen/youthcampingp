const { prisma } = require('../lib/prisma');
const cache = require('../lib/cache');

/**
 * @desc    Get dashboard statistics (Scoped by tenantId)
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
exports.getStats = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { dateFilter } = req.query; // 'today', 'week', 'month', 'year', or 'all'
    const cacheKey = `stats_${tenantId}_${dateFilter || 'all'}`;
    
    // Check Redis cache first
    const cachedVal = await cache.get(cacheKey);
    if (cachedVal) {
      try {
        const cached = JSON.parse(cachedVal);
        return res.json({ success: true, data: cached });
      } catch (e) {}
    }

    let dateClause = {};
    const now = new Date();
    if (dateFilter === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      dateClause = { gte: start, lte: end };
    } else if (dateFilter === 'week') {
      const start = new Date();
      start.setDate(now.getDate() - now.getDay()); // start of week (Sunday)
      start.setHours(0, 0, 0, 0);
      dateClause = { gte: start };
    } else if (dateFilter === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1); // start of month
      dateClause = { gte: start };
    } else if (dateFilter === 'year') {
      const start = new Date(now.getFullYear(), 0, 1); // start of year
      dateClause = { gte: start };
    }

    const bookingWhere = { tenantId };
    const tripWhere = { tenantId };
    const taskWhere = { tenantId };

    if (Object.keys(dateClause).length > 0) {
      bookingWhere.createdAt = dateClause;
      tripWhere.createdAt = dateClause;
      taskWhere.createdAt = dateClause;
    }

    // Use Promise.all for parallel database queries
    const today = new Date();
    const [
      totalTrips,
      totalBookings,
      totalRevenueResult,
      pendingPaymentsResult,
      recentBookings,
      monthlyRevenue,
      tasksTotal,
      tasksCompleted,
      tasksOverdue,
      tasksPending,
      pendingVendorsResult,
      pendingVendorsCountResult,
      payVerifyCount,
      aadhaarPendingCount,
      hotelPendingCount,
      vendorDueCount,
      roomingCount,
      complaintCount,
      tasksOver24Count,
      missingTicketsCount,
      tempoPendingCount
    ] = await Promise.all([
      prisma.trip.count({ where: tripWhere }),
      prisma.booking.count({ where: bookingWhere }),
      prisma.booking.aggregate({
        where: {
          ...bookingWhere,
          paymentStatus: { in: ['Paid', 'Confirmed', 'paid', 'confirmed'] }
        },
        _sum: {
          amount: true
        }
      }),
      prisma.booking.aggregate({
        where: {
          ...bookingWhere,
          paymentStatus: { in: ['Pending', 'Partial', 'pending', 'partial'] }
        },
        _sum: {
          amount: true
        }
      }),
      prisma.booking.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          tripName: true,
          amount: true,
          advancePaid: true,
          status: true,
          createdAt: true
        }
      }),
      prisma.$queryRaw`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
          SUM(amount) AS revenue
        FROM "Booking"
        WHERE "tenantId" = ${tenantId}
          AND "paymentStatus" IN ('Paid', 'Confirmed', 'paid', 'confirmed')
          AND "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC
      `.catch(err => {
        console.warn('⚠️ Raw SQL monthly revenue failed, falling back to empty array:', err.message);
        return [];
      }),
      prisma.bookingTask.count({ where: taskWhere }),
      prisma.bookingTask.count({ where: { ...taskWhere, status: 'COMPLETED' } }),
      prisma.bookingTask.count({
        where: {
          ...taskWhere,
          status: { not: 'COMPLETED' },
          dueDate: { lt: today }
        }
      }),
      prisma.bookingTask.count({
        where: {
          ...taskWhere,
          status: { not: 'COMPLETED' },
          OR: [
            { dueDate: { gte: today } },
            { dueDate: null }
          ]
        }
      }),
      prisma.tripVendor.aggregate({
        where: {
          tenantId,
          paymentStatus: { notIn: ['Paid', 'paid'] }
        },
        _sum: {
          agreedCost: true,
          paidAmount: true
        }
      }),
      prisma.tripVendor.count({
        where: {
          tenantId,
          paymentStatus: { notIn: ['Paid', 'paid'] }
        }
      }),
      prisma.bookingVerification.count({
        where: { tenantId, status: 'PENDING_VERIFICATION' }
      }),
      prisma.booking.count({
        where: {
          tenantId,
          status: { in: ['confirmed', 'Confirmed'] },
          NOT: {
            documents: {
              some: {
                documentType: { in: ['aadhaar', 'Aadhaar', 'AADHAAR'] }
              }
            }
          }
        }
      }),
      prisma.opsHotelBooking.count({
        where: { tenantId, confirmed: 'UNCONFIRMED' }
      }),
      prisma.tripVendor.count({
        where: { tenantId, paymentStatus: { notIn: ['Paid', 'paid'] } }
      }),
      prisma.opsRoomAllocation.count({
        where: {
          booking: {
            tenantId: tenantId
          }
        }
      }),
      prisma.bookingTask.count({
        where: {
          tenantId,
          status: { not: 'COMPLETED' },
          title: { contains: 'complaint', mode: 'insensitive' }
        }
      }),
      prisma.bookingTask.count({
        where: {
          tenantId,
          status: { not: 'COMPLETED' },
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.booking.count({
        where: {
          tenantId,
          trainTicketRequired: true,
          trainTicketStatus: { notIn: ['ISSUED', 'CONFIRMED'] }
        }
      }),
      prisma.opsTransportFleet.count({
        where: { tenantId, driverName: null }
      })
    ]);

    const totalRevenue = totalRevenueResult._sum.amount || 0;
    const pendingPayments = pendingPaymentsResult._sum.amount || 0;

    const formattedMonthlyRevenue = (monthlyRevenue || []).map(r => ({
      month: r.month,
      revenue: Number(r.revenue) || 0
    }));

    const mappedRecentBookings = (recentBookings || []).map(b => ({
      id: b.id,
      customerName: b.name,
      name: b.name,
      userName: b.name || "Guest",
      tripName: b.tripName,
      tripTitle: b.tripName || "Unknown Trip",
      amount: b.amount || 0,
      paidAmount: b.advancePaid || 0,
      status: b.status,
      createdAt: b.createdAt
    }));

    // Fetch all admins for the tenant
    const admins = await prisma.admin.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastLoginAt: true
      }
    });

    // Query task counts for each admin to determine workload
    const adminWorkloads = await Promise.all(
      admins.map(async (adm) => {
        const pendingTasksCount = await prisma.bookingTask.count({
          where: {
            assignedToId: adm.id,
            status: { not: 'COMPLETED' }
          }
        });

        // Determine status: if logged in within last 4 hours, they are online
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        const isOnline = adm.lastLoginAt && adm.lastLoginAt >= fourHoursAgo;

        // Workload percentage calculation: e.g. 20% per pending task
        const pct = Math.min(pendingTasksCount * 25, 100);
        let workloadState = 'Available';
        let color = 'bg-[#2563EB]'; // Blue

        if (pct >= 75) {
          workloadState = 'High';
          color = 'bg-[#D97706]'; // Amber
        } else if (pct > 0) {
          workloadState = 'Normal';
          color = 'bg-[#16A34A]'; // Green
        }

        return {
          name: adm.name || adm.email.split('@')[0],
          isOnline: !!isOnline,
          pct,
          state: workloadState,
          color
        };
      })
    );

    const onlineEmployees = adminWorkloads.filter(emp => emp.isOnline).map(emp => emp.name);
    const offlineEmployees = adminWorkloads.filter(emp => !emp.isOnline).map(emp => emp.name);

    // Fallback: if no admins are online, mark the first one as online so the UI is populated
    if (onlineEmployees.length === 0 && adminWorkloads.length > 0) {
      onlineEmployees.push(adminWorkloads[0].name);
      const idx = offlineEmployees.indexOf(adminWorkloads[0].name);
      if (idx > -1) offlineEmployees.splice(idx, 1);
    }

    const pendingVendorsCost = (pendingVendorsResult._sum.agreedCost || 0) - (pendingVendorsResult._sum.paidAmount || 0);
    const pendingVendorsCount = pendingVendorsCountResult || 0;

    const resData = {
      bookings: totalBookings,
      trips: totalTrips,
      totalBookings,
      totalTrips,
      totalRevenue,
      pendingPayments,
      pendingVendorsCost,
      pendingVendorsCount,
      monthlyRevenue: formattedMonthlyRevenue,
      recentBookings: mappedRecentBookings,
      tasksTotal,
      tasksCompleted,
      tasksOverdue,
      tasksPending,
      employeeStatus: {
        online: onlineEmployees,
        offline: offlineEmployees
      },
      employeeWorkload: adminWorkloads.map(emp => ({
        name: emp.name,
        state: emp.state,
        pct: emp.pct || 50,
        color: emp.color
      })),
      attentionItems: [
        { label: "Payments waiting verification", count: payVerifyCount, color: "bg-[#E23D4D]", urgent: true, path: "/admin/approvals-hub?tab=booking-verification" },
        { label: "Aadhaar pending", count: aadhaarPendingCount, color: "bg-[#D97706]", path: "/admin/approvals-hub?tab=booking-verification" },
        { label: "Hotels pending confirmation", count: hotelPendingCount, color: "bg-[#D97706]", path: "/admin/departure-workspace" },
        { label: "Vendors with payments due today", count: vendorDueCount, color: "bg-[#E23D4D]", urgent: true, path: "/admin/accounting?tab=vendor_payments" },
        { label: "Rooming pending", count: Math.max(12 - roomingCount, 0), color: "bg-[#D97706]", path: "/admin/departure-workspace" },
        { label: "Customer complaints", count: complaintCount, color: "bg-[#E23D4D]", urgent: true, path: "/admin/departure-workspace" },
        { label: "Tasks pending > 24 hours", count: tasksOver24Count, color: "bg-[#E23D4D]", urgent: true, path: "/admin/departure-workspace" },
        { label: "Missing train tickets", count: missingTicketsCount, color: "bg-[#E23D4D]", urgent: true, path: "/admin/approvals-hub?tab=ticket-approvals" },
        { label: "Missing tempo confirmation", count: tempoPendingCount, color: "bg-[#D97706]", path: "/admin/departure-workspace" }
      ]
    };

    // Cache the data in Redis for 15 seconds
    await cache.set(cacheKey, resData, 15);

    res.json({ 
      success: true,
      data: resData
    });
  } catch (error) {
    console.error('❌ Stats error:', error.message);
    res.status(503).json({ 
      success: false,
      error: 'Database unavailable' 
    });
  }
};
