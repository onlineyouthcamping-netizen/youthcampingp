import { Router, Request, Response, NextFunction } from "express";
import { db, usersTable, tripsTable, attendanceTable, assignmentsTable, payoutsTable, guideWorkDaysTable, guideDayReportsTable, guideExpensesTable, travelerAttendanceTable, tripStatusUpdatesTable } from "@workspace/db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";
import { fetchTrips, fetchBookingsForTrip } from "../lib/mainBackendProxy";

const adminRouter = Router();

// Middleware to ensure the authenticated user is an admin
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }
  next();
}

// Apply auth and admin check to all admin routes
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

// 1. GET /admin/dashboard - Overview statistics
adminRouter.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const [activeTrips, totalGuides, todayCheckIns, allAttendance] = await Promise.all([
      db
        .select()
        .from(tripsTable)
        .where(eq(tripsTable.status, "active")),
      db
        .select()
        .from(usersTable)
        .where(eq(usersTable.role, "guide")),
      db
        .select()
        .from(attendanceTable)
        .where(eq(attendanceTable.date, todayStr)),
      db
        .select({
          attendance: attendanceTable,
          tripName: tripsTable.name,
        })
        .from(attendanceTable)
        .innerJoin(tripsTable, eq(attendanceTable.tripId, tripsTable.id)),
    ]);
      
    // Missing check-ins today: active guides who haven't checked in today
    const activeGuideIds = activeTrips.map((t) => t.leadGuideId);
    const checkedInGuideIds = todayCheckIns.map((a) => a.guideId);
    const missingCheckIns = activeGuideIds.filter(
      (id) => !checkedInGuideIds.includes(id)
    ).length;
    
    // locationMismatchFlags (Red Flags): Count records that have location_mismatch, incomplete, or missing checkout/selfies
    const locationMismatchFlags = allAttendance.filter((record) => {
      const isMismatch = record.attendance.status === "location_mismatch";
      const isIncomplete = record.attendance.status === "incomplete";
      const isRejected = record.attendance.status === "rejected";
      
      const hasCheckIn = !!record.attendance.checkInTime;
      const hasCheckOut = !!record.attendance.checkOutTime;
      const missingCheckInSelfie = hasCheckIn && !record.attendance.checkInSelfieUrl;
      const missingCheckOutSelfie = hasCheckOut && !record.attendance.checkOutSelfieUrl;
      const missingSelfie = missingCheckInSelfie || missingCheckOutSelfie;
      
      const missingCheckOut = hasCheckIn && !hasCheckOut;

      return isMismatch || isIncomplete || isRejected || missingSelfie || missingCheckOut;
    }).length;

    res.json({
      activeTrips: activeTrips.length,
      totalGuides: totalGuides.length,
      todayCheckIns: todayCheckIns.length,
      missingCheckIns,
      locationMismatchFlags,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 2. GET /admin/guides - Guide monitoring list
adminRouter.get("/guides", async (req: Request, res: Response) => {
  try {
    const guides = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.role, "guide"));
      
    const todayStr = new Date().toISOString().split("T")[0];
    const result = [];
    const guideIds = guides.map(g => g.id);

    // Batch query active trips for all guides
    const activeTrips = guideIds.length > 0 ? await db
      .select()
      .from(tripsTable)
      .where(
        and(
          inArray(tripsTable.leadGuideId, guideIds),
          eq(tripsTable.status, "active")
        )
      ) : [];
    const activeTripMap = new Map(activeTrips.map(t => [t.leadGuideId, t]));

    // Batch query today's attendance logs for all guides
    const todayLogs = guideIds.length > 0 ? await db
      .select()
      .from(attendanceTable)
      .where(
        and(
          inArray(attendanceTable.guideId, guideIds),
          eq(attendanceTable.date, todayStr)
        )
      ) : [];
    const todayLogMap = new Map(todayLogs.map(l => [l.guideId, l]));

    // Batch query all attendance logs joined with tripName for flagged check and days count
    const allLogs = guideIds.length > 0 ? await db
      .select({
        attendance: attendanceTable,
        tripName: tripsTable.name,
      })
      .from(attendanceTable)
      .innerJoin(tripsTable, eq(attendanceTable.tripId, tripsTable.id))
      .where(inArray(attendanceTable.guideId, guideIds)) : [];

    const logsByGuideMap = new Map<number, typeof allLogs>();
    allLogs.forEach(log => {
      const gId = log.attendance.guideId;
      if (!logsByGuideMap.has(gId)) {
        logsByGuideMap.set(gId, []);
      }
      logsByGuideMap.get(gId)!.push(log);
    });
    
    for (const guide of guides) {
      // Find active trip from pre-fetched map
      const activeTrip = activeTripMap.get(guide.id);
        
      // Get today's attendance log from pre-fetched map
      const todayLog = todayLogMap.get(guide.id);
        
      // Today status logic
      let todayStatus: "checked_in" | "checked_out" | "missing" | "idle" = "idle";
      if (activeTrip) {
        if (!todayLog) {
          todayStatus = "missing";
        } else if (todayLog.checkOutTime) {
          todayStatus = "checked_out";
        } else {
          todayStatus = "checked_in";
        }
      }
      const guideLogs = logsByGuideMap.get(guide.id) || [];

      // Find log with latest checkInTime in memory
      let lastLog = null;
      for (const log of guideLogs) {
        if (log.attendance.checkInTime) {
          if (!lastLog || !lastLog.checkInTime || log.attendance.checkInTime.getTime() > lastLog.checkInTime.getTime()) {
            lastLog = log.attendance;
          }
        }
      }
        
      // Check if guide has flagged records
      const flagged = guideLogs.some((log) => {
        const isMismatch = log.attendance.status === "location_mismatch";
        const isIncomplete = log.attendance.status === "incomplete";
        const isRejected = log.attendance.status === "rejected";
        
        const hasCheckIn = !!log.attendance.checkInTime;
        const hasCheckOut = !!log.attendance.checkOutTime;
        const missingCheckInSelfie = hasCheckIn && !log.attendance.checkInSelfieUrl;
        const missingCheckOutSelfie = hasCheckOut && !log.attendance.checkOutSelfieUrl;
        const missingSelfie = missingCheckInSelfie || missingCheckOutSelfie;
        
        const missingCheckOut = hasCheckIn && !hasCheckOut;

        return isMismatch || isIncomplete || isRejected || missingSelfie || missingCheckOut;
      });
      
      // Approved days count
      const approvedLogs = guideLogs.filter((log) => log.attendance.status === "approved");
      
      result.push({
        id: guide.id,
        name: guide.name,
        phone: guide.phone,
        activeTripName: activeTrip ? activeTrip.name : null,
        todayStatus,
        lastCheckInTime: lastLog && lastLog.checkInTime ? lastLog.checkInTime.toISOString() : null,
        flagged,
        daysLogged: approvedLogs.length,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 3. GET /admin/attendance-logs - Detailed attendance logs
adminRouter.get("/attendance-logs", async (req: Request, res: Response) => {
  try {
    const logs = await db
      .select({
        id: attendanceTable.id,
        guideName: usersTable.name,
        tripName: tripsTable.name,
        date: attendanceTable.date,
        checkInTime: attendanceTable.checkInTime,
        checkInLatitude: attendanceTable.checkInLatitude,
        checkInLongitude: attendanceTable.checkInLongitude,
        checkInLocationName: attendanceTable.checkInLocationName,
        checkInSelfieUrl: attendanceTable.checkInSelfieUrl,
        checkInDistance: attendanceTable.checkInDistance,
        checkOutTime: attendanceTable.checkOutTime,
        checkOutLatitude: attendanceTable.checkOutLatitude,
        checkOutLongitude: attendanceTable.checkOutLongitude,
        checkOutLocationName: attendanceTable.checkOutLocationName,
        checkOutSelfieUrl: attendanceTable.checkOutSelfieUrl,
        checkOutDistance: attendanceTable.checkOutDistance,
        notes: attendanceTable.notes,
        status: attendanceTable.status,
      })
      .from(attendanceTable)
      .innerJoin(usersTable, eq(attendanceTable.guideId, usersTable.id))
      .innerJoin(tripsTable, eq(attendanceTable.tripId, tripsTable.id))
      .orderBy(desc(attendanceTable.date));
      
    // Format timestamps to ISO strings
    const formatted = logs.map((log) => ({
      ...log,
      checkInTime: log.checkInTime ? log.checkInTime.toISOString() : null,
      checkOutTime: log.checkOutTime ? log.checkOutTime.toISOString() : null,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 4. POST /admin/verify-attendance - Approve or reject an attendance day
adminRouter.post("/verify-attendance", async (req: Request, res: Response) => {
  try {
    const { attendanceId, status } = req.body;
    const admin = (req as AuthenticatedRequest).user!;
    
    if (!attendanceId || !status || !["approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "Invalid attendanceId or status" });
      return;
    }
    
    const [updated] = await db
      .update(attendanceTable)
      .set({
        status,
        verifiedAt: new Date(),
        verifiedBy: admin.id,
      })
      .where(eq(attendanceTable.id, attendanceId))
      .returning();
      
    if (!updated) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }
    
    res.json({
      ...updated,
      checkInTime: updated.checkInTime ? updated.checkInTime.toISOString() : null,
      checkOutTime: updated.checkOutTime ? updated.checkOutTime.toISOString() : null,
      verifiedAt: updated.verifiedAt ? updated.verifiedAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 5. GET /admin/reports - Aggregated payroll and attendance summaries
adminRouter.get("/reports", async (req: Request, res: Response) => {
  try {
    const guides = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.role, "guide"));
      
    const result = [];
    const guideIds = guides.map(g => g.id);

    // Batch query trips for all guides
    const allTrips = guideIds.length > 0 ? await db
      .select()
      .from(tripsTable)
      .where(inArray(tripsTable.leadGuideId, guideIds))
      .orderBy(desc(tripsTable.startDate)) : [];

    const tripsByGuideMap = new Map<number, typeof allTrips>();
    allTrips.forEach(t => {
      const gId = t.leadGuideId;
      if (gId) {
        if (!tripsByGuideMap.has(gId)) {
          tripsByGuideMap.set(gId, []);
        }
        tripsByGuideMap.get(gId)!.push(t);
      }
    });

    // Batch query attendance for all guides
    const allAttendance = guideIds.length > 0 ? await db
      .select()
      .from(attendanceTable)
      .where(inArray(attendanceTable.guideId, guideIds)) : [];

    const attendanceByGuideMap = new Map<number, typeof allAttendance>();
    allAttendance.forEach(a => {
      const gId = a.guideId;
      if (!attendanceByGuideMap.has(gId)) {
        attendanceByGuideMap.set(gId, []);
      }
      attendanceByGuideMap.get(gId)!.push(a);
    });

    // Batch query workDays for all guides
    const allWorkDays = guideIds.length > 0 ? await db
      .select()
      .from(guideWorkDaysTable)
      .where(inArray(guideWorkDaysTable.guideId, guideIds)) : [];

    const workDaysByGuideMap = new Map<number, typeof allWorkDays>();
    allWorkDays.forEach(wd => {
      const gId = wd.guideId;
      if (!workDaysByGuideMap.has(gId)) {
        workDaysByGuideMap.set(gId, []);
      }
      workDaysByGuideMap.get(gId)!.push(wd);
    });

    // Batch query reports for all guides
    const allReports = guideIds.length > 0 ? await db
      .select()
      .from(guideDayReportsTable)
      .where(inArray(guideDayReportsTable.guideId, guideIds)) : [];

    const reportsByGuideMap = new Map<number, typeof allReports>();
    allReports.forEach(r => {
      const gId = r.guideId;
      if (!reportsByGuideMap.has(gId)) {
        reportsByGuideMap.set(gId, []);
      }
      reportsByGuideMap.get(gId)!.push(r);
    });
    
    for (const guide of guides) {
      // Find trip assignment (active or most recent)
      const trips = tripsByGuideMap.get(guide.id) || [];
      const latestTrip = trips[0];
      
      // Calculate attendance status counters
      const attendance = attendanceByGuideMap.get(guide.id) || [];
      const approvedDays = attendance.filter((a) => a.status === "approved").length;
      const rejectedDays = attendance.filter((a) => a.status === "rejected").length;
      const pendingDays = attendance.filter((a) => a.status === "pending").length;
      const mismatchDays = attendance.filter((a) => a.status === "location_mismatch").length;
      const incompleteDays = attendance.filter((a) => a.status === "incomplete").length;
      
      const totalTripDays = approvedDays + rejectedDays + pendingDays + mismatchDays + incompleteDays;
      
      // Calculate day reports counts
      const workDays = workDaysByGuideMap.get(guide.id) || [];
      const reports = reportsByGuideMap.get(guide.id) || [];
      
      const submittedReportsCount = reports.length;
      const missingReportsCount = Math.max(0, workDays.length - reports.length);

      // "Only approved days count in payable amount."
      const payableAmount = approvedDays * guide.dailyRate;
      
      result.push({
        guideId: guide.id,
        guideName: guide.name,
        tripName: latestTrip ? latestTrip.name : null,
        totalTripDays,
        approvedDays,
        rejectedDays,
        pendingDays,
        incompleteDays,
        locationMismatchDays: mismatchDays,
        payableAmount,
        submittedReportsCount,
        missingReportsCount,
      });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 6. GET /admin/trips - List all trips
adminRouter.get("/trips", async (req: Request, res: Response) => {
  try {
    const trips = await db
      .select({
        id: tripsTable.id,
        name: tripsTable.name,
        location: tripsTable.location,
        startDate: tripsTable.startDate,
        endDate: tripsTable.endDate,
        leadGuideId: tripsTable.leadGuideId,
        leadGuideName: usersTable.name,
        status: tripsTable.status,
      })
      .from(tripsTable)
      .innerJoin(usersTable, eq(tripsTable.leadGuideId, usersTable.id))
      .orderBy(desc(tripsTable.startDate));

    const formatted = trips.map((t) => ({
      ...t,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
// 7. POST /admin/guides - Create a new guide user
adminRouter.post("/guides", async (req: Request, res: Response) => {
  try {
    const { name, phone, dailyRate, emergencyContact, isActive, email, profilePhoto, address, notes } = req.body;

    if (!name || !phone) {
      res.status(400).json({ error: "Name and phone are required" });
      return;
    }

    const [guide] = await db
      .insert(usersTable)
      .values({
        name,
        phone,
        role: "guide",
        dailyRate: dailyRate ?? 1500,
        emergencyContact: emergencyContact ?? null,
        isActive: isActive ?? "active",
        email: email ?? null,
        profilePhoto: profilePhoto ?? null,
        address: address ?? null,
        notes: notes ?? null,
      })
      .returning();

    res.status(201).json({
      ...guide,
      createdAt: guide.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 8. PUT /admin/guides/:id - Update a guide
adminRouter.put("/guides/:id", async (req: Request, res: Response) => {
  try {
    const guideId = parseInt(req.params.id as string, 10);
    const { name, phone, dailyRate, emergencyContact, isActive, email, profilePhoto, address, notes } = req.body;

    if (isNaN(guideId)) {
      res.status(400).json({ error: "Invalid guide ID" });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (dailyRate !== undefined) updateData.dailyRate = dailyRate;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (email !== undefined) updateData.email = email ?? null;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto ?? null;
    if (address !== undefined) updateData.address = address ?? null;
    if (notes !== undefined) updateData.notes = notes ?? null;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, guideId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Guide not found" });
      return;
    }

    res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 8b. DELETE /admin/guides/:id - Delete a guide and clean up dependencies
adminRouter.delete("/guides/:id", async (req: Request, res: Response) => {
  try {
    const guideId = parseInt(req.params.id as string, 10);

    if (isNaN(guideId)) {
      res.status(400).json({ error: "Invalid guide ID" });
      return;
    }

    // Verify if guide exists
    const [guide] = await db.select().from(usersTable).where(eq(usersTable.id, guideId));
    if (!guide) {
      res.status(404).json({ error: "Guide not found" });
      return;
    }

    await db.transaction(async (tx) => {
      // 1. Delete day reports
      await tx.delete(guideDayReportsTable).where(eq(guideDayReportsTable.guideId, guideId));
      
      // 2. Delete work days
      await tx.delete(guideWorkDaysTable).where(eq(guideWorkDaysTable.guideId, guideId));
      
      // 3. Delete traveler attendance
      await tx.delete(travelerAttendanceTable).where(eq(travelerAttendanceTable.markedByGuideId, guideId));
      
      // 4. Delete status updates
      await tx.delete(tripStatusUpdatesTable).where(eq(tripStatusUpdatesTable.guideId, guideId));
      
      // 5. Delete guide expenses
      await tx.delete(guideExpensesTable).where(eq(guideExpensesTable.guideId, guideId));
      
      // 6. Nullify verifiedBy in attendance
      await tx.update(attendanceTable).set({ verifiedBy: null }).where(eq(attendanceTable.verifiedBy, guideId));
      
      // 7. Delete attendance
      await tx.delete(attendanceTable).where(eq(attendanceTable.guideId, guideId));
      
      // 8. Delete payouts
      await tx.delete(payoutsTable).where(eq(payoutsTable.guideId, guideId));
      
      // 9. Delete assignments
      await tx.delete(assignmentsTable).where(eq(assignmentsTable.guideId, guideId));
      
      // 10. Clean up any trips where this guide is leadGuideId
      const guideTrips = await tx.select().from(tripsTable).where(eq(tripsTable.leadGuideId, guideId));
      const tripIds = guideTrips.map(t => t.id);
      if (tripIds.length > 0) {
        await tx.delete(assignmentsTable).where(inArray(assignmentsTable.tripId, tripIds));
        await tx.delete(attendanceTable).where(inArray(attendanceTable.tripId, tripIds));
        await tx.delete(guideWorkDaysTable).where(inArray(guideWorkDaysTable.tripId, tripIds));
        await tx.delete(guideDayReportsTable).where(inArray(guideDayReportsTable.tripId, tripIds));
      }
      await tx.delete(tripsTable).where(eq(tripsTable.leadGuideId, guideId));

      // 11. Finally, delete the guide
      await tx.delete(usersTable).where(eq(usersTable.id, guideId));
    });

    res.json({ success: true, message: "Guide deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 9. GET /admin/assignments - List all assignments with guide and trip names
adminRouter.get("/assignments", async (req: Request, res: Response) => {
  try {
    const assignments = await db
      .select({
        id: assignmentsTable.id,
        guideId: assignmentsTable.guideId,
        guideName: usersTable.name,
        tripId: assignmentsTable.tripId,
        tripName: tripsTable.name,
        departureDate: assignmentsTable.departureDate,
        role: assignmentsTable.role,
        perDayAmount: assignmentsTable.perDayAmount,
        allowedLatitude: assignmentsTable.allowedLatitude,
        allowedLongitude: assignmentsTable.allowedLongitude,
        allowedRadius: assignmentsTable.allowedRadius,
        status: assignmentsTable.status,
        mainBackendTripId: assignmentsTable.mainBackendTripId,
        mainBackendTripName: assignmentsTable.mainBackendTripName,
        createdAt: assignmentsTable.createdAt,
      })
      .from(assignmentsTable)
      .innerJoin(usersTable, eq(assignmentsTable.guideId, usersTable.id))
      .leftJoin(tripsTable, eq(assignmentsTable.tripId, tripsTable.id))
      .orderBy(desc(assignmentsTable.createdAt));

    const formatted = assignments.map((a) => ({
      ...a,
      tripName: a.tripName || a.mainBackendTripName || "Unknown Trip",
      createdAt: a.createdAt.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 10. POST /admin/assignments - Create an assignment
adminRouter.post("/assignments", async (req: Request, res: Response) => {
  try {
    const { guideId, tripId, departureDate, role, perDayAmount, allowedLatitude, allowedLongitude, allowedRadius, status, mainBackendTripId, mainBackendTripName } = req.body;

    if (!guideId || (!tripId && !mainBackendTripId) || !departureDate || !role || perDayAmount === undefined) {
      res.status(400).json({ error: "guideId, departureDate, role, perDayAmount, and either tripId or mainBackendTripId are required" });
      return;
    }

    const [assignment] = await db
      .insert(assignmentsTable)
      .values({
        guideId,
        tripId: tripId || null,
        departureDate,
        role,
        perDayAmount,
        allowedLatitude: allowedLatitude ?? null,
        allowedLongitude: allowedLongitude ?? null,
        allowedRadius: allowedRadius ?? 3000,
        status: status ?? "assigned",
        mainBackendTripId: mainBackendTripId ?? null,
        mainBackendTripName: mainBackendTripName ?? null,
      })
      .returning();

    res.status(201).json({
      ...assignment,
      createdAt: assignment.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 11. PUT /admin/assignments/:id - Update an assignment
adminRouter.put("/assignments/:id", async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.id as string, 10);
    const { guideId, tripId, departureDate, role, perDayAmount, allowedLatitude, allowedLongitude, allowedRadius, status, mainBackendTripId, mainBackendTripName } = req.body;

    if (isNaN(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (guideId !== undefined) updateData.guideId = guideId;
    if (tripId !== undefined) updateData.tripId = tripId;
    if (departureDate !== undefined) updateData.departureDate = departureDate;
    if (role !== undefined) updateData.role = role;
    if (perDayAmount !== undefined) updateData.perDayAmount = perDayAmount;
    if (allowedLatitude !== undefined) updateData.allowedLatitude = allowedLatitude;
    if (allowedLongitude !== undefined) updateData.allowedLongitude = allowedLongitude;
    if (allowedRadius !== undefined) updateData.allowedRadius = allowedRadius;
    if (status !== undefined) updateData.status = status;
    if (mainBackendTripId !== undefined) updateData.mainBackendTripId = mainBackendTripId;
    if (mainBackendTripName !== undefined) updateData.mainBackendTripName = mainBackendTripName;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const [updated] = await db
      .update(assignmentsTable)
      .set(updateData)
      .where(eq(assignmentsTable.id, assignmentId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 12. DELETE /admin/assignments/:id - Delete an assignment
adminRouter.delete("/assignments/:id", async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.id as string, 10);

    if (isNaN(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }

    // Check if assignment exists
    const [assignment] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, assignmentId));
    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    await db.transaction(async (tx) => {
      // 1. Delete day reports
      await tx.delete(guideDayReportsTable).where(eq(guideDayReportsTable.assignmentId, assignmentId));
      
      // 2. Delete work days
      await tx.delete(guideWorkDaysTable).where(eq(guideWorkDaysTable.assignmentId, assignmentId));
      
      // 3. Delete traveler attendance
      await tx.delete(travelerAttendanceTable).where(eq(travelerAttendanceTable.assignmentId, assignmentId));
      
      // 4. Delete status updates
      await tx.delete(tripStatusUpdatesTable).where(eq(tripStatusUpdatesTable.assignmentId, assignmentId));
      
      // 5. Delete expenses
      await tx.delete(guideExpensesTable).where(eq(guideExpensesTable.assignmentId, assignmentId));
      
      // 6. Finally delete the assignment
      await tx.delete(assignmentsTable).where(eq(assignmentsTable.id, assignmentId));
    });

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Proxy routes and new features endpoints
// GET /admin/main-trips - Fetch trips from main backend for assignment dropdown selection
adminRouter.get("/main-trips", async (req: Request, res: Response) => {
  try {
    const trips = await fetchTrips();
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /admin/assignment-travelers/:assignmentId - Fetch confirmed travelers for assignment's trip from main backend bookings
adminRouter.get("/assignment-travelers/:assignmentId", async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId as string, 10);
    if (isNaN(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }
    const [assignment] = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, assignmentId))
      .limit(1);

    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    const tripId = assignment.mainBackendTripId;
    if (!tripId) {
      res.json([]); // Not a main backend assignment
      return;
    }

    const bookings = await fetchBookingsForTrip(tripId);
    // Confirmed bookings only
    const confirmedBookings = bookings.filter(b => b.status === "confirmed");

    const getFoodPreference = (p: any): "Jain" | "Non-Jain" | "Other" => {
      const pref = (p.foodPreference || p.mealPreference || p.dietary || p.food || p.meal || "").toLowerCase().trim();
      if (pref.includes("jain")) return "Jain";
      if (pref.includes("non-jain") || pref.includes("nonjain") || pref.includes("non veg") || pref.includes("non-veg") || pref.includes("nonveg")) return "Non-Jain";
      return "Other";
    };

    // Expand to individual travelers (passengers list + Booker)
    const travelers: any[] = [];
    confirmedBookings.forEach(booking => {
      // Booker is traveler 1
      travelers.push({
        bookingId: booking.bookingId,
        bookingCuid: booking.id,
        name: booking.name,
        phone: booking.phone,
        email: booking.email,
        departureDate: booking.departureDate,
        pickupCity: booking.pickupCity,
        paymentStatus: booking.paymentStatus,
        totalAmount: booking.totalAmount,
        advancePaid: booking.advancePaid,
        remainingAmount: booking.remainingAmount,
        isPrimaryBooker: true,
        age: booking.age || null,
        gender: booking.gender || null,
        foodPreference: getFoodPreference(booking),
      });

      // Other passengers
      const persons = booking.passengers || [];
      persons.forEach((p: any) => {
        travelers.push({
          bookingId: booking.bookingId,
          bookingCuid: booking.id,
          name: p.name || p.fullName,
          phone: p.phone || p.mobile || booking.phone,
          email: booking.email,
          departureDate: booking.departureDate,
          pickupCity: booking.pickupCity,
          paymentStatus: booking.paymentStatus,
          totalAmount: 0,
          advancePaid: 0,
          remainingAmount: 0,
          isPrimaryBooker: false,
          age: p.age || null,
          gender: p.gender || null,
          foodPreference: getFoodPreference(p),
        });
      });
    });

    res.json(travelers);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /admin/expenses - List all uploaded expenses (filterable by guide, assignment, category, status)
adminRouter.get("/expenses", async (req: Request, res: Response) => {
  try {
    const { guideId, assignmentId, category, status } = req.query;
    const whereConditions = [];

    if (guideId) whereConditions.push(eq(guideExpensesTable.guideId, parseInt(guideId as string, 10)));
    if (assignmentId) whereConditions.push(eq(guideExpensesTable.assignmentId, parseInt(assignmentId as string, 10)));
    if (category) whereConditions.push(eq(guideExpensesTable.category, category as string));
    if (status) whereConditions.push(eq(guideExpensesTable.status, status as string));

    const query = db
      .select({
        id: guideExpensesTable.id,
        guideId: guideExpensesTable.guideId,
        guideName: usersTable.name,
        assignmentId: guideExpensesTable.assignmentId,
        tripName: assignmentsTable.mainBackendTripName,
        category: guideExpensesTable.category,
        amount: guideExpensesTable.amount,
        description: guideExpensesTable.description,
        receiptUrl: guideExpensesTable.receiptUrl,
        status: guideExpensesTable.status,
        adminRemarks: guideExpensesTable.adminRemarks,
        createdAt: guideExpensesTable.createdAt,
      })
      .from(guideExpensesTable)
      .innerJoin(usersTable, eq(guideExpensesTable.guideId, usersTable.id))
      .innerJoin(assignmentsTable, eq(guideExpensesTable.assignmentId, assignmentsTable.id));

    const expenses = whereConditions.length > 0 
      ? await query.where(and(...whereConditions)).orderBy(desc(guideExpensesTable.createdAt))
      : await query.orderBy(desc(guideExpensesTable.createdAt));

    const formatted = expenses.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /admin/expenses/:id/status - Approve or reject an expense and add remarks
adminRouter.put("/expenses/:id/status", async (req: Request, res: Response) => {
  try {
    const expenseId = parseInt(req.params.id as string, 10);
    const { status, adminRemarks } = req.body;

    if (isNaN(expenseId) || !status) {
      res.status(400).json({ error: "Invalid expense ID or missing status" });
      return;
    }

    if (status !== "approved" && status !== "rejected") {
      res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      return;
    }

    const [updated] = await db
      .update(guideExpensesTable)
      .set({ status, adminRemarks: adminRemarks || null, updatedAt: new Date() })
      .where(eq(guideExpensesTable.id, expenseId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /admin/traveler-attendance/:assignmentId - Monitor live traveler attendance for an assignment
adminRouter.get("/traveler-attendance/:assignmentId", async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId as string, 10);
    if (isNaN(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }

    const attendance = await db
      .select({
        id: travelerAttendanceTable.id,
        assignmentId: travelerAttendanceTable.assignmentId,
        bookingId: travelerAttendanceTable.bookingId,
        travelerName: travelerAttendanceTable.travelerName,
        travelerPhone: travelerAttendanceTable.travelerPhone,
        status: travelerAttendanceTable.status,
        notes: travelerAttendanceTable.notes,
        markedByGuideId: travelerAttendanceTable.markedByGuideId,
        markedByGuideName: usersTable.name,
        updatedAt: travelerAttendanceTable.updatedAt,
      })
      .from(travelerAttendanceTable)
      .innerJoin(usersTable, eq(travelerAttendanceTable.markedByGuideId, usersTable.id))
      .where(eq(travelerAttendanceTable.assignmentId, assignmentId))
      .orderBy(desc(travelerAttendanceTable.updatedAt));

    const formatted = attendance.map((a) => ({
      ...a,
      updatedAt: a.updatedAt.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /admin/trip-status/recent - Fetch recent status updates across all assignments
adminRouter.get("/trip-status/recent", async (req: Request, res: Response) => {
  try {
    const statusUpdates = await db
      .select({
        id: tripStatusUpdatesTable.id,
        assignmentId: tripStatusUpdatesTable.assignmentId,
        tripName: assignmentsTable.mainBackendTripName,
        guideId: tripStatusUpdatesTable.guideId,
        guideName: usersTable.name,
        status: tripStatusUpdatesTable.status,
        notes: tripStatusUpdatesTable.notes,
        location: tripStatusUpdatesTable.location,
        updatedAt: tripStatusUpdatesTable.updatedAt,
      })
      .from(tripStatusUpdatesTable)
      .innerJoin(usersTable, eq(tripStatusUpdatesTable.guideId, usersTable.id))
      .innerJoin(assignmentsTable, eq(tripStatusUpdatesTable.assignmentId, assignmentsTable.id))
      .orderBy(desc(tripStatusUpdatesTable.updatedAt))
      .limit(5);

    const formatted = statusUpdates.map((s) => ({
      ...s,
      updatedAt: s.updatedAt.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /admin/trip-status/:assignmentId - Fetch the timeline history of trip statuses for a trip
adminRouter.get("/trip-status/:assignmentId", async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId as string, 10);
    if (isNaN(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }

    const statusUpdates = await db
      .select({
        id: tripStatusUpdatesTable.id,
        assignmentId: tripStatusUpdatesTable.assignmentId,
        guideId: tripStatusUpdatesTable.guideId,
        guideName: usersTable.name,
        status: tripStatusUpdatesTable.status,
        notes: tripStatusUpdatesTable.notes,
        location: tripStatusUpdatesTable.location,
        updatedAt: tripStatusUpdatesTable.updatedAt,
      })
      .from(tripStatusUpdatesTable)
      .innerJoin(usersTable, eq(tripStatusUpdatesTable.guideId, usersTable.id))
      .where(eq(tripStatusUpdatesTable.assignmentId, assignmentId))
      .orderBy(desc(tripStatusUpdatesTable.updatedAt));

    const formatted = statusUpdates.map((s) => ({
      ...s,
      updatedAt: s.updatedAt.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 13. GET /admin/payroll - Guide-wise and trip-wise payment summary
adminRouter.get("/payroll", async (req: Request, res: Response) => {
  try {
    const guides = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.role, "guide"));

    const result = [];
    const guideIds = guides.map(g => g.id);

    // Batch query all attendance logs for all these guides, joined with trip names
    const allLogs = guideIds.length > 0 ? await db
      .select({
        tripId: attendanceTable.tripId,
        tripName: tripsTable.name,
        status: attendanceTable.status,
        guideId: attendanceTable.guideId,
      })
      .from(attendanceTable)
      .innerJoin(tripsTable, eq(attendanceTable.tripId, tripsTable.id))
      .where(inArray(attendanceTable.guideId, guideIds)) : [];

    const logsByGuideMap = new Map<number, typeof allLogs>();
    allLogs.forEach(log => {
      const gId = log.guideId;
      if (!logsByGuideMap.has(gId)) {
        logsByGuideMap.set(gId, []);
      }
      logsByGuideMap.get(gId)!.push(log);
    });

    for (const guide of guides) {
      const attendanceLogs = logsByGuideMap.get(guide.id) || [];

      // Group by trip in memory
      const tripMap = new Map<number, { tripName: string; approvedDays: number }>();

      for (const log of attendanceLogs) {
        if (!tripMap.has(log.tripId)) {
          tripMap.set(log.tripId, { tripName: log.tripName, approvedDays: 0 });
        }
        if (log.status === "approved") {
          tripMap.get(log.tripId)!.approvedDays += 1;
        }
      }

      const tripBreakdown = Array.from(tripMap.entries()).map(([, data]) => ({
        tripName: data.tripName,
        approvedDays: data.approvedDays,
        amount: data.approvedDays * guide.dailyRate,
      }));

      const totalApprovedDays = tripBreakdown.reduce((sum, t) => sum + t.approvedDays, 0);
      const payableAmount = totalApprovedDays * guide.dailyRate;

      result.push({
        guideId: guide.id,
        guideName: guide.name,
        dailyRate: guide.dailyRate,
        approvedDays: totalApprovedDays,
        payableAmount,
        tripBreakdown,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default adminRouter;
