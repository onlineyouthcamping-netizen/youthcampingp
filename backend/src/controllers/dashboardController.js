const { prisma } = require("../lib/prisma");
const cache = require("../lib/cache");

/**
 * @desc    Get dashboard statistics (Scoped by tenantId)
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
exports.getStats = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || "default";
    const { dateFilter } = req.query; // 'today', 'week', 'month', 'year', or 'all'
    const cacheKey = `stats_${tenantId}_${dateFilter || "all"}`;

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
    if (dateFilter === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      dateClause = { gte: start, lte: end };
    } else if (dateFilter === "week") {
      const start = new Date();
      start.setDate(now.getDate() - now.getDay()); // start of week (Sunday)
      start.setHours(0, 0, 0, 0);
      dateClause = { gte: start };
    } else if (dateFilter === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1); // start of month
      dateClause = { gte: start };
    } else if (dateFilter === "year") {
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
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(today.getDate() - 15);
    fifteenDaysAgo.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    sevenDaysLater.setHours(23, 59, 59, 999);

    // Use Promise.all for single-pass parallel database queries
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
      roomingCount,
      complaintCount,
      tasksOver24Count,
      missingTicketsCount,
      tempoPendingCount,
      admins,
      pendingTasksGroup,
      activeBookings,
      upcomingBookings,
      todayTasks,
      todayInflow,
      todayOutflow,
    ] = await Promise.all([
      prisma.trip.count({ where: tripWhere }),
      prisma.booking.count({ where: bookingWhere }),
      prisma.booking.aggregate({
        where: {
          ...bookingWhere,
          paymentStatus: {
            in: ["PAID", "Paid", "paid", "Confirmed", "confirmed"],
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.booking.aggregate({
        where: {
          ...bookingWhere,
          paymentStatus: {
            in: ["PARTIAL", "UNPAID", "Partial", "partial", "Pending", "pending", "Pending / Manual Verification"],
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.booking.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          tripName: true,
          amount: true,
          advancePaid: true,
          totalAmount: true,
          paymentStatus: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.$queryRaw`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
          SUM(amount) AS revenue
        FROM "Booking"
        WHERE "tenantId" = ${tenantId}
          AND "paymentStatus" IN ('PAID', 'Paid', 'paid', 'Confirmed', 'confirmed')
          AND "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC
      `.catch((err) => {
        console.warn(
          "⚠️ Raw SQL monthly revenue failed, falling back to empty array:",
          err.message,
        );
        return [];
      }),
      prisma.bookingTask.count({ where: taskWhere }),
      prisma.bookingTask.count({
        where: { ...taskWhere, status: "COMPLETED" },
      }),
      prisma.bookingTask.count({
        where: {
          ...taskWhere,
          status: { not: "COMPLETED" },
          dueDate: { lt: today },
        },
      }),
      prisma.bookingTask.count({
        where: {
          ...taskWhere,
          status: { not: "COMPLETED" },
          OR: [{ dueDate: { gte: today } }, { dueDate: null }],
        },
      }),
      prisma.tripVendor.aggregate({
        where: {
          tenantId,
          paymentStatus: { notIn: ["Paid", "paid"] },
        },
        _sum: {
          agreedCost: true,
          paidAmount: true,
        },
      }),
      prisma.tripVendor.count({
        where: {
          tenantId,
          paymentStatus: { notIn: ["Paid", "paid"] },
        },
      }),
      prisma.bookingVerification.count({
        where: { tenantId, status: "PENDING_VERIFICATION" },
      }),
      prisma.booking.count({
        where: {
          tenantId,
          status: { in: ["confirmed", "Confirmed"] },
          NOT: {
            documents: {
              some: {
                documentType: { in: ["aadhaar", "Aadhaar", "AADHAAR"] },
              },
            },
          },
        },
      }),
      prisma.opsHotelBooking.count({
        where: { tenantId, confirmed: "UNCONFIRMED" },
      }),
      prisma.opsRoomAllocation.count({
        where: {
          booking: {
            tenantId: tenantId,
          },
          allocationStatus: "ACTIVE",
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.bookingTask.count({
        where: {
          tenantId,
          status: { not: "COMPLETED" },
          title: { contains: "complaint", mode: "insensitive" },
        },
      }),
      prisma.bookingTask.count({
        where: {
          tenantId,
          status: { not: "COMPLETED" },
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.booking.count({
        where: {
          tenantId,
          trainTicketRequired: true,
          trainTicketStatus: { notIn: ["ISSUED", "CONFIRMED"] },
        },
      }),
      prisma.opsTransportFleet.count({
        where: { tenantId, driverName: null },
      }),
      prisma.admin.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          lastLoginAt: true,
        },
      }),
      prisma.bookingTask.groupBy({
        by: ["assignedToId"],
        where: {
          tenantId,
          status: { not: "COMPLETED" },
          assignedToId: { not: "" },
        },
        _count: { _all: true },
      }).catch(() => []),
      prisma.booking.findMany({
        where: {
          tenantId,
          status: { in: ["confirmed", "Confirmed", "paid", "Paid"] },
          departureDate: {
            gte: fifteenDaysAgo,
            lte: endOfToday,
          },
        },
        include: {
          tripRef: true,
        },
      }),
      prisma.booking.findMany({
        where: {
          tenantId,
          status: { in: ["confirmed", "Confirmed", "paid", "Paid"] },
          departureDate: {
            gt: endOfToday,
            lte: sevenDaysLater,
          },
        },
        include: {
          tripRef: true,
        },
      }),
      prisma.bookingTask.findMany({
        where: {
          tenantId,
          dueDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        orderBy: {
          dueDate: "asc",
        },
        take: 10,
      }),
      prisma.payment.aggregate({
        where: {
          tenantId,
          status: { in: ["success", "SUCCESS", "Paid", "paid"] },
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.opsMiscExpense.aggregate({
        where: {
          tenantId,
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const totalRevenue = totalRevenueResult._sum.amount || 0;
    const pendingPayments = pendingPaymentsResult._sum.amount || 0;
    const vendorDueCount = pendingVendorsCountResult || 0;

    const formattedMonthlyRevenue = (monthlyRevenue || []).map((r) => ({
      month: r.month,
      revenue: Number(r.revenue) || 0,
    }));

    const mappedRecentBookings = (recentBookings || []).map((b) => ({
      id: b.id,
      customerName: b.name,
      name: b.name,
      userName: b.name || "Guest",
      tripName: b.tripName,
      tripTitle: b.tripName || "Unknown Trip",
      amount: b.totalAmount || b.amount || 0,
      paidAmount: b.advancePaid || 0,
      paymentStatus: b.paymentStatus || null,
      status: b.status,
      createdAt: b.createdAt,
    }));

    const taskCountMap = new Map();
    (pendingTasksGroup || []).forEach((g) => {
      if (g.assignedToId) taskCountMap.set(g.assignedToId, g._count?._all || g._count || 0);
    });

    const adminWorkloads = (admins || []).map((adm) => {
      const pendingTasksCount = taskCountMap.get(adm.id) || 0;
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const isOnline = adm.lastLoginAt && adm.lastLoginAt >= fourHoursAgo;

      const pct = Math.min(pendingTasksCount * 25, 100);
      let workloadState = "Available";
      let color = "bg-[#2563EB]";

      if (pct >= 75) {
        workloadState = "High";
        color = "bg-[#D97706]";
      } else if (pct > 0) {
        workloadState = "Normal";
        color = "bg-[#16A34A]";
      }

      return {
        name: adm.name || adm.email.split("@")[0],
        isOnline: !!isOnline,
        pct,
        state: workloadState,
        color,
      };
    });

    const onlineEmployees = adminWorkloads
      .filter((emp) => emp.isOnline)
      .map((emp) => emp.name);
    const offlineEmployees = adminWorkloads
      .filter((emp) => !emp.isOnline)
      .map((emp) => emp.name);

    // Return empty online list if nobody is actually online — do not fabricate presence

    const pendingVendorsCost = Math.max(
      0,
      (pendingVendorsResult._sum.agreedCost || 0) -
      (pendingVendorsResult._sum.paidAmount || 0),
    );
    const pendingVendorsCount = pendingVendorsCountResult || 0;

    // Helper functions for dynamic trip operations
    function getDurationInDays(durationStr) {
      const match = String(durationStr || "").match(/(\d+)\s*D/i);
      return match ? parseInt(match[1], 10) : 7;
    }

    function getShortName(title) {
      return title
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 4);
    }

    function formatDateDayMonth(date) {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
    }

    function formatDateDayMonthYear(date) {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    // 1. Trips Running Now (Active departures)
    const activeGroups = {};
    for (const b of (activeBookings || [])) {
      if (!b.departureDate || !b.tripRef) continue;
      const durationDays = getDurationInDays(b.tripRef.duration);
      const depTime = new Date(b.departureDate).getTime();
      const endTime = depTime + durationDays * 24 * 60 * 60 * 1000;

      if (endTime >= startOfToday.getTime()) {
        const key = `${b.tripId}_${b.departureDate.toISOString()}`;
        if (!activeGroups[key]) {
          activeGroups[key] = {
            trip: b.tripRef,
            departureDate: b.departureDate,
            travelers: 0,
          };
        }
        activeGroups[key].travelers += b.numberOfTravelers || 1;
      }
    }

    const tripsRunningNow = Object.values(activeGroups).map((g) => {
      const depTime = new Date(g.departureDate).getTime();
      const currentDay =
        Math.floor((today.getTime() - depTime) / (24 * 60 * 60 * 1000)) + 1;
      let stay = `Day ${currentDay}`;

      // Try to determine stay from itinerary if available
      try {
        if (g.trip.itinerary && Array.isArray(g.trip.itinerary)) {
          const dayPlan = g.trip.itinerary.find(
            (item) => item.day === currentDay,
          );
          if (dayPlan && dayPlan.title) {
            stay = dayPlan.title;
          }
        }
      } catch (e) {}

      return {
        code: `${g.trip.shortName || getShortName(g.trip.title)} - ${formatDateDayMonth(g.departureDate)}`,
        name: g.trip.title,
        size: g.travelers,
        stay,
      };
    });

    // 2. Trips Departing Next 7 Days
    const upcomingGroups = {};
    for (const b of (upcomingBookings || [])) {
      if (!b.departureDate || !b.tripRef) continue;
      const key = `${b.tripId}_${b.departureDate.toISOString()}`;
      if (!upcomingGroups[key]) {
        upcomingGroups[key] = {
          trip: b.tripRef,
          departureDate: b.departureDate,
          travelers: 0,
        };
      }
      upcomingGroups[key].travelers += b.numberOfTravelers || 1;
    }

    const tripsDepartingNext7Days = Object.values(upcomingGroups).map((g) => {
      const maxGroupSize = g.trip.maxGroupSize || 40;
      return {
        name: g.trip.title,
        date: formatDateDayMonthYear(g.departureDate),
        count: `${g.travelers}/${maxGroupSize}`,
        status: g.travelers >= maxGroupSize ? "full" : "normal",
      };
    });

    // 3. Today's Schedule (Booking Tasks due today)
    const todaysSchedule = (todayTasks || []).map((t) => {
      const timeStr = t.dueDate
        ? new Date(t.dueDate).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "All Day";
      return {
        time: timeStr,
        label: t.title,
        color:
          t.status === "COMPLETED"
            ? "bg-[#16A34A]"
            : t.dueDate < today
              ? "bg-[#E23D4D]"
              : "bg-[#2563EB]",
      };
    });

    // 4. Cash Flow Overview
    const collectionToday = todayInflow?._sum?.amount || 0;
    const paymentsToday = todayOutflow?._sum?.amount || 0;
    const netCashInflow = collectionToday - paymentsToday;

    const role = req.user.role;
    const userPerms = req.user.permissions || req.user.customPermissions || [];

    const hasPerm = (requiredPerm) => {
      if (role === "superadmin") return true;
      if (Array.isArray(userPerms)) {
        return userPerms.includes(requiredPerm) || userPerms.includes("*");
      }
      return false;
    };

    const resData = {
      bookings: hasPerm("bookings.view") ? totalBookings : 0,
      trips: hasPerm("trips.view") ? totalTrips : 0,
      totalBookings: hasPerm("bookings.view") ? totalBookings : 0,
      totalTrips: hasPerm("trips.view") ? totalTrips : 0,
      totalRevenue: hasPerm("accounting.view") ? totalRevenue : undefined,
      pendingPayments:
        hasPerm("accounting.view") || hasPerm("bookings.view")
          ? pendingPayments
          : undefined,
      pendingVendorsCost:
        hasPerm("accounting.view") || hasPerm("vendors.view")
          ? pendingVendorsCost
          : undefined,
      pendingVendorsCount:
        hasPerm("accounting.view") || hasPerm("vendors.view")
          ? pendingVendorsCount
          : undefined,
      monthlyRevenue: hasPerm("accounting.view")
        ? formattedMonthlyRevenue
        : undefined,
      recentBookings: hasPerm("bookings.view")
        ? mappedRecentBookings
        : undefined,
      tasksTotal:
        hasPerm("tasks.view") || hasPerm("ops.view") ? tasksTotal : undefined,
      tasksCompleted:
        hasPerm("tasks.view") || hasPerm("ops.view")
          ? tasksCompleted
          : undefined,
      tasksOverdue:
        hasPerm("tasks.view") || hasPerm("ops.view") ? tasksOverdue : undefined,
      tasksPending:
        hasPerm("tasks.view") || hasPerm("ops.view") ? tasksPending : undefined,
      employeeStatus: hasPerm("users.view")
        ? {
            online: onlineEmployees,
            offline: offlineEmployees,
          }
        : undefined,
      employeeWorkload: hasPerm("users.view")
        ? adminWorkloads.map((emp) => ({
            name: emp.name,
            state: emp.state,
            pct: emp.pct ?? 0,
            color: emp.color,
          }))
        : undefined,
      attentionItems:
        hasPerm("ops.view") || hasPerm("bookings.view")
          ? [
              {
                label: "Payments waiting verification",
                count: payVerifyCount,
                color: "bg-[#E23D4D]",
                urgent: true,
                path: "/admin/approvals-hub?tab=booking-verification",
              },
              {
                label: "Aadhaar pending",
                count: aadhaarPendingCount,
                color: "bg-[#D97706]",
                path: "/admin/approvals-hub?tab=booking-verification",
              },
              {
                label: "Hotels pending confirmation",
                count: hotelPendingCount,
                color: "bg-[#D97706]",
                path: "/admin/departure-workspace",
              },
              {
                label: "Vendors with payments due today",
                count: vendorDueCount,
                color: "bg-[#E23D4D]",
                urgent: true,
                path: "/admin/accounting?tab=vendor_payments",
              },
              {
                label: "Rooming pending",
                count: roomingCount || 0,
                color: "bg-[#D97706]",
                path: "/admin/departure-workspace",
              },
              {
                label: "Customer complaints",
                count: complaintCount,
                color: "bg-[#E23D4D]",
                urgent: true,
                path: "/admin/departure-workspace",
              },
              {
                label: "Tasks pending > 24 hours",
                count: tasksOver24Count,
                color: "bg-[#E23D4D]",
                urgent: true,
                path: "/admin/departure-workspace",
              },
              {
                label: "Missing train tickets",
                count: missingTicketsCount,
                color: "bg-[#E23D4D]",
                urgent: true,
                path: "/admin/approvals-hub?tab=ticket-approvals",
              },
              {
                label: "Missing tempo confirmation",
                count: tempoPendingCount,
                color: "bg-[#D97706]",
                path: "/admin/departure-workspace",
              },
            ]
          : undefined,
      tripsRunningNow: hasPerm("trips.view") ? tripsRunningNow : undefined,
      tripsDepartingNext7Days: hasPerm("trips.view")
        ? tripsDepartingNext7Days
        : undefined,
      todaysSchedule: hasPerm("ops.view") ? todaysSchedule : undefined,
      cashFlow: hasPerm("accounting.view")
        ? {
            collectionToday,
            paymentsToday,
            netCashInflow,
          }
        : undefined,
      approvalQueue: hasPerm("bookings.verify") || hasPerm("accounting.view")
        ? {
            paymentApprovals: payVerifyCount || 0,
            vendorBills: pendingVendorsCountResult || 0,
            missingTickets: missingTicketsCount || 0,
          }
        : undefined,
    };

    // Cache the data in Redis/memory for 45 seconds
    await cache.set(cacheKey, resData, 45);

    res.json({
      success: true,
      data: resData,
    });
  } catch (error) {
    console.error("❌ Stats error:", error.message);
    res.status(503).json({
      success: false,
      error: "Database unavailable",
    });
  }
};
