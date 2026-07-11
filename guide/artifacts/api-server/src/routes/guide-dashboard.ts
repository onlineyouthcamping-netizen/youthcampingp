import { Router, Response } from "express";
import { db, usersTable, tripsTable, assignmentsTable, guideExpensesTable, travelerAttendanceTable, tripStatusUpdatesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";
import { fetchBookingsForTrip } from "../lib/mainBackendProxy";

const guideRouter = Router();

// Apply guide authentication to all routes in this router
guideRouter.use(requireAuth);

// GET /guide/profile - Retrieve authenticated guide profile
guideRouter.get("/profile", async (req: AuthenticatedRequest, res: Response) => {
  res.json(req.user);
});

// Helper helper to verify that an assignment belongs to the logged-in guide
async function verifyAssignmentOwner(req: AuthenticatedRequest, assignmentId: number): Promise<boolean> {
  const guideId = req.user?.id;
  if (!guideId) return false;

  const [assignment] = await db
    .select()
    .from(assignmentsTable)
    .where(and(eq(assignmentsTable.id, assignmentId), eq(assignmentsTable.guideId, guideId)))
    .limit(1);

  return !!assignment;
}

// 1. GET /guide/my-assignments - List assignments for logged-in guide
guideRouter.get("/my-assignments", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const guideId = req.user!.id;

    const assignments = await db
      .select({
        id: assignmentsTable.id,
        guideId: assignmentsTable.guideId,
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
      .leftJoin(tripsTable, eq(assignmentsTable.tripId, tripsTable.id))
      .where(eq(assignmentsTable.guideId, guideId))
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

// 2. GET /guide/my-travelers/:assignmentId - Get traveler list for guide's assignment
guideRouter.get("/my-travelers/:assignmentId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId as string, 10);
    if (isNaN(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }

    const hasAccess = await verifyAssignmentOwner(req, assignmentId);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied. This assignment does not belong to you." });
      return;
    }

    const [assignment] = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, assignmentId))
      .limit(1);

    const tripId = assignment.mainBackendTripId;
    if (!tripId) {
      res.json([]); // Not a main backend assignment
      return;
    }

    const bookings = await fetchBookingsForTrip(tripId);
    const confirmedBookings = bookings.filter(b => b.status === "confirmed");

    const getFoodPreference = (p: any): "Jain" | "Non-Jain" | "Other" => {
      const pref = (p.foodPreference || p.mealPreference || p.dietary || p.food || p.meal || "").toLowerCase().trim();
      if (pref.includes("jain")) return "Jain";
      if (pref.includes("non-jain") || pref.includes("nonjain") || pref.includes("non veg") || pref.includes("non-veg") || pref.includes("nonveg")) return "Non-Jain";
      return "Other";
    };

    const travelers: any[] = [];
    confirmedBookings.forEach(booking => {
      // Booker
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

      // Passengers
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

// 3. POST /guide/expenses - Upload a receipt / create an expense
guideRouter.post("/expenses", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assignmentId, category, amount, description, receiptUrl } = req.body;
    const guideId = req.user!.id;

    if (!assignmentId || !category || !amount || !description || !receiptUrl) {
      res.status(400).json({ error: "Missing required fields: assignmentId, category, amount, description, and receiptUrl are required" });
      return;
    }

    const hasAccess = await verifyAssignmentOwner(req, assignmentId);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied. This assignment does not belong to you." });
      return;
    }

    const [expense] = await db
      .insert(guideExpensesTable)
      .values({
        guideId,
        assignmentId,
        category,
        amount: parseInt(amount, 10),
        description,
        receiptUrl,
        status: "pending",
      })
      .returning();

    res.status(201).json({
      ...expense,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 4. GET /guide/expenses/:assignmentId - List guide's own expenses for an assignment
guideRouter.get("/expenses/:assignmentId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId as string, 10);
    const guideId = req.user!.id;

    if (isNaN(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }

    const hasAccess = await verifyAssignmentOwner(req, assignmentId);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied. This assignment does not belong to you." });
      return;
    }

    const expenses = await db
      .select()
      .from(guideExpensesTable)
      .where(and(eq(guideExpensesTable.guideId, guideId), eq(guideExpensesTable.assignmentId, assignmentId)))
      .orderBy(desc(guideExpensesTable.createdAt));

    const formatted = expenses.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 5. POST /guide/traveler-attendance - Record or update a traveler's attendance
guideRouter.post("/traveler-attendance", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assignmentId, bookingId, travelerName, travelerPhone, status, notes } = req.body;
    const guideId = req.user!.id;

    if (!assignmentId || !bookingId || !travelerName || !status) {
      res.status(400).json({ error: "Missing required fields: assignmentId, bookingId, travelerName, and status are required" });
      return;
    }

    const hasAccess = await verifyAssignmentOwner(req, assignmentId);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied. This assignment does not belong to you." });
      return;
    }

    // Perform upsert (Insert or update on conflict of key combination)
    const [attendance] = await db
      .insert(travelerAttendanceTable)
      .values({
        assignmentId,
        bookingId,
        travelerName,
        travelerPhone: travelerPhone || null,
        status,
        notes: notes || null,
        markedByGuideId: guideId,
      })
      .onConflictDoUpdate({
        target: [travelerAttendanceTable.assignmentId, travelerAttendanceTable.bookingId, travelerAttendanceTable.travelerName],
        set: {
          status,
          notes: notes || null,
          markedByGuideId: guideId,
          updatedAt: new Date(),
        }
      })
      .returning();

    res.json({
      ...attendance,
      updatedAt: attendance.updatedAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 6. GET /guide/traveler-attendance/:assignmentId - Get recorded traveler attendance for guide's assignment
guideRouter.get("/traveler-attendance/:assignmentId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId as string, 10);

    if (isNaN(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }

    const hasAccess = await verifyAssignmentOwner(req, assignmentId);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied. This assignment does not belong to you." });
      return;
    }

    const attendance = await db
      .select()
      .from(travelerAttendanceTable)
      .where(eq(travelerAttendanceTable.assignmentId, assignmentId));

    const formatted = attendance.map((a) => ({
      ...a,
      updatedAt: a.updatedAt.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 7. POST /guide/trip-status - Post a new live trip milestone update
guideRouter.post("/trip-status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assignmentId, status, notes, location } = req.body;
    const guideId = req.user!.id;

    if (!assignmentId || !status) {
      res.status(400).json({ error: "assignmentId and status are required" });
      return;
    }

    const hasAccess = await verifyAssignmentOwner(req, assignmentId);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied. This assignment does not belong to you." });
      return;
    }

    // Insert milestone
    const [milestone] = await db
      .insert(tripStatusUpdatesTable)
      .values({
        assignmentId,
        guideId,
        status,
        notes: notes || null,
        location: location || null,
      })
      .returning();

    // Auto-update assignment status based on milestone progress
    if (status === "trip_started") {
      await db
        .update(assignmentsTable)
        .set({ status: "ongoing" })
        .where(eq(assignmentsTable.id, assignmentId));
    } else if (status === "return_journey_started") {
      await db
        .update(assignmentsTable)
        .set({ status: "completed" })
        .where(eq(assignmentsTable.id, assignmentId));
    }

    res.status(201).json({
      ...milestone,
      updatedAt: milestone.updatedAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default guideRouter;
