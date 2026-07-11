import { Router, Request, Response, NextFunction } from "express";
import { 
  db, 
  usersTable, 
  assignmentsTable, 
  guideTripUpdatesTable, 
  guideCheckinPointsTable, 
  guideHotelUpdatesTable, 
  guideFoodUpdatesTable, 
  guideGroupPhotosTable, 
  guideMovementUpdatesTable,
  guideFoodPreferenceAuditsTable
} from "@workspace/db";
import { eq, desc, and, sql, gte, lte, inArray } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";
import { fetchBookingsForTrip, updateBookingInMainBackend } from "../lib/mainBackendProxy";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToCloudinary } from "../lib/cloudinary";

const operationsRouter = Router();

// Configure multer for temp local storage
const uploadDir = "./uploads/operations";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Allow up to 50MB for video
  }
});

// Middleware to ensure user is a guide
function requireGuide(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role !== "guide") {
    res.status(403).json({ error: "Access denied. Guides only." });
    return;
  }
  next();
}

// Middleware to ensure user is an admin
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }
  next();
}

// Helper to verify assignment ownership
async function verifyAssignmentOwner(guideId: number, assignmentId: number): Promise<boolean> {
  const [assignment] = await db
    .select()
    .from(assignmentsTable)
    .where(and(eq(assignmentsTable.id, assignmentId), eq(assignmentsTable.guideId, guideId)))
    .limit(1);
  return !!assignment;
}

// Helper to parse food preference from passenger booking
function getFoodPreference(p: any): "Jain" | "Non-Jain" | "Other" {
  const pref = (p.foodPreference || p.mealPreference || p.dietary || p.food || p.meal || "").toLowerCase().trim();
  if (pref.includes("jain")) return "Jain";
  if (pref.includes("non-jain") || pref.includes("nonjain") || pref.includes("non veg") || pref.includes("non-veg") || pref.includes("nonveg")) return "Non-Jain";
  return "Other";
}

// 1. POST /guide/operations/upload-media - Handle file uploading to Cloudinary with format & size rules
operationsRouter.post(
  "/guide/operations/upload-media",
  requireAuth,
  requireGuide,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const ext = path.extname(file.originalname).toLowerCase();
      const mime = file.mimetype;

      const isImage = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) && mime.startsWith("image/");
      const isVideo = [".mp4", ".webm"].includes(ext) && mime.startsWith("video/");

      if (!isImage && !isVideo) {
        fs.unlinkSync(file.path);
        res.status(400).json({ error: "Invalid file format. Allowed formats: JPG, PNG, WebP, MP4, WebM." });
        return;
      }

      // Check size constraints
      if (isImage && file.size > 5 * 1024 * 1024) {
        fs.unlinkSync(file.path);
        res.status(400).json({ error: "Photo exceeds max size limit of 5MB." });
        return;
      }

      if (isVideo && file.size > 50 * 1024 * 1024) {
        fs.unlinkSync(file.path);
        res.status(400).json({ error: "Video exceeds max size limit of 50MB." });
        return;
      }

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(file.path);
      try {
        fs.unlinkSync(file.path); // remove temp file
      } catch (err) {
        console.error("Error deleting temp file:", err);
      }

      if (!cloudinaryUrl) {
        res.status(500).json({ error: "Failed to upload media to cloud hosting." });
        return;
      }

      res.json({ url: cloudinaryUrl });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// 2. POST /guide/operations/checkin - Participant Check-in Point
operationsRouter.post(
  "/guide/operations/checkin",
  requireAuth,
  requireGuide,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { assignmentId, checkinType, locationName, latitude, longitude, photoUrl, notes } = req.body;
      const guideId = req.user!.id;

      if (!assignmentId || !checkinType || !locationName || !photoUrl) {
        res.status(400).json({ error: "Missing required fields. assignmentId, checkinType, locationName, and photoUrl are required." });
        return;
      }

      const hasAccess = await verifyAssignmentOwner(guideId, parseInt(assignmentId, 10));
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied. Assignment does not belong to you." });
        return;
      }

      const [checkin] = await db
        .insert(guideCheckinPointsTable)
        .values({
          assignmentId: parseInt(assignmentId, 10),
          guideId,
          checkinType,
          locationName,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          photoUrl,
          notes: notes || null,
        })
        .returning();

      res.status(201).json(checkin);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// 3. POST /guide/operations/hotel - Hotel check-in update / quick button
operationsRouter.post(
  "/guide/operations/hotel",
  requireAuth,
  requireGuide,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { assignmentId, hotelName, roomsUsed, roomAllocationStatus, hotelPhotos, notes, status } = req.body;
      const guideId = req.user!.id;

      if (!assignmentId || !hotelName) {
        res.status(400).json({ error: "assignmentId and hotelName are required." });
        return;
      }

      const hasAccess = await verifyAssignmentOwner(guideId, parseInt(assignmentId, 10));
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied. Assignment does not belong to you." });
        return;
      }

      // Check if photo is required (mandatory hotel check-in requires photo)
      const photosArray = Array.isArray(hotelPhotos) ? hotelPhotos : [];
      if (status === "done" && photosArray.length === 0) {
        res.status(400).json({ error: "Photo upload is required to mark hotel check-in as Done." });
        return;
      }

      const [hotelUpdate] = await db
        .insert(guideHotelUpdatesTable)
        .values({
          assignmentId: parseInt(assignmentId, 10),
          guideId,
          hotelName,
          checkinTime: new Date(),
          roomsUsed: roomsUsed ? parseInt(roomsUsed, 10) : 0,
          roomAllocationStatus: roomAllocationStatus || "allocated",
          hotelPhotos: photosArray,
          notes: notes || null,
          status: status || "pending",
        })
        .returning();

      res.status(201).json(hotelUpdate);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// 4. POST /guide/operations/food - Dinner / Food updates
operationsRouter.post(
  "/guide/operations/food",
  requireAuth,
  requireGuide,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { assignmentId, dayNumber, photoUrl, videoUrl, rating, jainCount, nonJainCount, extraMeals, notes } = req.body;
      const guideId = req.user!.id;

      if (!assignmentId || !dayNumber || !rating) {
        res.status(400).json({ error: "assignmentId, dayNumber, and rating are required." });
        return;
      }

      const hasAccess = await verifyAssignmentOwner(guideId, parseInt(assignmentId, 10));
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied. Assignment does not belong to you." });
        return;
      }

      // Food update requires photo or video
      if (!photoUrl && !videoUrl) {
        res.status(400).json({ error: "Either food photo or video is required to submit a food update." });
        return;
      }

      const [foodUpdate] = await db
        .insert(guideFoodUpdatesTable)
        .values({
          assignmentId: parseInt(assignmentId, 10),
          guideId,
          dayNumber: parseInt(dayNumber, 10),
          photoUrl: photoUrl || null,
          videoUrl: videoUrl || null,
          rating: parseInt(rating, 10),
          jainCount: jainCount ? parseInt(jainCount, 10) : 0,
          nonJainCount: nonJainCount ? parseInt(nonJainCount, 10) : 0,
          extraMeals: extraMeals ? parseInt(extraMeals, 10) : 0,
          notes: notes || null,
        })
        .returning();

      res.status(201).json(foodUpdate);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// 5. POST /guide/operations/group-photo - Sightseeing group photo
operationsRouter.post(
  "/guide/operations/group-photo",
  requireAuth,
  requireGuide,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { assignmentId, photoUrl, locationName, dayNumber, notes } = req.body;
      const guideId = req.user!.id;

      if (!assignmentId || !photoUrl || !locationName || !dayNumber) {
        res.status(400).json({ error: "assignmentId, photoUrl, locationName, and dayNumber are required." });
        return;
      }

      const hasAccess = await verifyAssignmentOwner(guideId, parseInt(assignmentId, 10));
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied. Assignment does not belong to you." });
        return;
      }

      const [groupPhoto] = await db
        .insert(guideGroupPhotosTable)
        .values({
          assignmentId: parseInt(assignmentId, 10),
          guideId,
          photoUrl,
          locationName,
          dayNumber: parseInt(dayNumber, 10),
          notes: notes || null,
        })
        .returning();

      res.status(201).json(groupPhoto);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// 6. POST /guide/operations/movement - Live movement update
operationsRouter.post(
  "/guide/operations/movement",
  requireAuth,
  requireGuide,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { assignmentId, movementType, locationName, photoUrl, videoUrl, notes } = req.body;
      const guideId = req.user!.id;

      if (!assignmentId || !movementType) {
        res.status(400).json({ error: "assignmentId and movementType are required." });
        return;
      }

      const hasAccess = await verifyAssignmentOwner(guideId, parseInt(assignmentId, 10));
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied. Assignment does not belong to you." });
        return;
      }

      const [movement] = await db
        .insert(guideMovementUpdatesTable)
        .values({
          assignmentId: parseInt(assignmentId, 10),
          guideId,
          movementType,
          locationName: locationName || null,
          photoUrl: photoUrl || null,
          videoUrl: videoUrl || null,
          notes: notes || null,
        })
        .returning();

      res.status(201).json(movement);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// 7. POST /guide/operations/trip-timing - Trip timings & Delay updates
operationsRouter.post(
  "/guide/operations/trip-timing",
  requireAuth,
  requireGuide,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { assignmentId, currentDestination, expectedArrivalTime, delayReason, nextDestination, actualArrivalTime, currentTripStatus } = req.body;
      const guideId = req.user!.id;

      if (!assignmentId) {
        res.status(400).json({ error: "assignmentId is required." });
        return;
      }

      const hasAccess = await verifyAssignmentOwner(guideId, parseInt(assignmentId, 10));
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied. Assignment does not belong to you." });
        return;
      }

      const [timingUpdate] = await db
        .insert(guideTripUpdatesTable)
        .values({
          assignmentId: parseInt(assignmentId, 10),
          guideId,
          currentDestination: currentDestination || null,
          expectedArrivalTime: expectedArrivalTime ? new Date(expectedArrivalTime) : null,
          delayReason: delayReason || null,
          nextDestination: nextDestination || null,
          actualArrivalTime: actualArrivalTime ? new Date(actualArrivalTime) : null,
          currentTripStatus: currentTripStatus || "ongoing",
        })
        .returning();

      res.status(201).json(timingUpdate);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// GET /guide/operations/stats/:assignmentId - Get real-time participant & food preferences sync statistics for Guide
operationsRouter.get(
  "/guide/operations/stats/:assignmentId",
  requireAuth,
  requireGuide,
  async (req: Request, res: Response) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId as string, 10);
      if (isNaN(assignmentId)) {
        res.status(400).json({ error: "Invalid assignment ID" });
        return;
      }

      const guideId = (req as AuthenticatedRequest).user!.id;
      const hasAccess = await verifyAssignmentOwner(guideId, assignmentId);
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied. Assignment does not belong to you." });
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
        res.json({
          totalParticipants: 0,
          confirmedCount: 0,
          pendingCount: 0,
          cancelledCount: 0,
          maleCount: 0,
          femaleCount: 0,
          jainPreferenceCount: 0,
          nonJainPreferenceCount: 0,
          otherFoodPreferenceCount: 0,
          pickupCityBreakdown: {},
        });
        return;
      }

      const bookings = await fetchBookingsForTrip(tripId);

      let totalParticipants = 0;
      let confirmedCount = 0;
      let pendingCount = 0;
      let cancelledCount = 0;
      let maleCount = 0;
      let femaleCount = 0;
      let jainPreferenceCount = 0;
      let nonJainPreferenceCount = 0;
      let otherFoodPreferenceCount = 0;
      const pickupCityBreakdown: Record<string, number> = {};

      bookings.forEach(b => {
        const count = 1 + (b.passengers?.length || 0);

        if (b.status === "confirmed") confirmedCount += count;
        else if (b.status === "pending") pendingCount += count;
        else if (b.status === "cancelled") cancelledCount += count;

        totalParticipants += count;

        if (b.gender) {
          const g = b.gender.toLowerCase().trim();
          if (g === "male" || g === "m") maleCount++;
          else if (g === "female" || g === "f") femaleCount++;
        }

        const bookerFood = getFoodPreference(b);
        if (bookerFood === "Jain") jainPreferenceCount++;
        else if (bookerFood === "Non-Jain") nonJainPreferenceCount++;
        else otherFoodPreferenceCount++;

        const passengers = b.passengers || [];
        passengers.forEach(p => {
          if (p.gender) {
            const g = p.gender.toLowerCase().trim();
            if (g === "male" || g === "m") maleCount++;
            else if (g === "female" || g === "f") femaleCount++;
          }
          const pFood = getFoodPreference(p);
          if (pFood === "Jain") jainPreferenceCount++;
          else if (pFood === "Non-Jain") nonJainPreferenceCount++;
          else otherFoodPreferenceCount++;
        });

        if (b.pickupCity) {
          const city = b.pickupCity.trim();
          pickupCityBreakdown[city] = (pickupCityBreakdown[city] || 0) + count;
        }
      });

      res.json({
        totalParticipants,
        confirmedCount,
        pendingCount,
        cancelledCount,
        maleCount,
        femaleCount,
        jainPreferenceCount,
        nonJainPreferenceCount,
        otherFoodPreferenceCount,
        pickupCityBreakdown,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// ─── ADMIN DASHBOARD OPERATIONS ROUTES ───


// 8. GET /admin/operations/live - Query unified operations timeline
operationsRouter.get(
  "/admin/operations/live",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { tripId, assignmentId, guideId, date, type, status } = req.query;

      // We fetch updates from all 6 tables and map them to a uniform format.
      // Filter applied database-side where applicable, then combined and sorted.
      const parsedAssignmentId = assignmentId ? parseInt(assignmentId as string, 10) : undefined;
      const parsedGuideId = guideId ? parseInt(guideId as string, 10) : undefined;

      const timelineItems: any[] = [];

      // Fetch assignments to link names
      const assignments = await db
        .select({
          id: assignmentsTable.id,
          tripName: assignmentsTable.mainBackendTripName,
          guideName: usersTable.name,
        })
        .from(assignmentsTable)
        .innerJoin(usersTable, eq(assignmentsTable.guideId, usersTable.id));

      const assignMap = new Map(assignments.map(a => [a.id, a]));

      const timingConditions = [];
      if (parsedAssignmentId) timingConditions.push(eq(guideTripUpdatesTable.assignmentId, parsedAssignmentId));
      if (parsedGuideId) timingConditions.push(eq(guideTripUpdatesTable.guideId, parsedGuideId));

      const checkinConditions = [];
      if (parsedAssignmentId) checkinConditions.push(eq(guideCheckinPointsTable.assignmentId, parsedAssignmentId));
      if (parsedGuideId) checkinConditions.push(eq(guideCheckinPointsTable.guideId, parsedGuideId));

      const hotelConditions = [];
      if (parsedAssignmentId) hotelConditions.push(eq(guideHotelUpdatesTable.assignmentId, parsedAssignmentId));
      if (parsedGuideId) hotelConditions.push(eq(guideHotelUpdatesTable.guideId, parsedGuideId));
      if (status) hotelConditions.push(eq(guideHotelUpdatesTable.status, status as string));

      const foodConditions = [];
      if (parsedAssignmentId) foodConditions.push(eq(guideFoodUpdatesTable.assignmentId, parsedAssignmentId));
      if (parsedGuideId) foodConditions.push(eq(guideFoodUpdatesTable.guideId, parsedGuideId));

      const photoConditions = [];
      if (parsedAssignmentId) photoConditions.push(eq(guideGroupPhotosTable.assignmentId, parsedAssignmentId));
      if (parsedGuideId) photoConditions.push(eq(guideGroupPhotosTable.guideId, parsedGuideId));

      const movementConditions = [];
      if (parsedAssignmentId) movementConditions.push(eq(guideMovementUpdatesTable.assignmentId, parsedAssignmentId));
      if (parsedGuideId) movementConditions.push(eq(guideMovementUpdatesTable.guideId, parsedGuideId));

      const [updates, checkins, hotels, foods, groupPhotos, movements] = await Promise.all([
        !type || type === "timing"
          ? db.select().from(guideTripUpdatesTable).where(and(...timingConditions)).orderBy(desc(guideTripUpdatesTable.createdAt))
          : Promise.resolve([] as Array<typeof guideTripUpdatesTable.$inferSelect>),
        !type || type === "checkin"
          ? db.select().from(guideCheckinPointsTable).where(and(...checkinConditions)).orderBy(desc(guideCheckinPointsTable.createdAt))
          : Promise.resolve([] as Array<typeof guideCheckinPointsTable.$inferSelect>),
        !type || type === "hotel"
          ? db.select().from(guideHotelUpdatesTable).where(and(...hotelConditions)).orderBy(desc(guideHotelUpdatesTable.createdAt))
          : Promise.resolve([] as Array<typeof guideHotelUpdatesTable.$inferSelect>),
        !type || type === "food"
          ? db.select().from(guideFoodUpdatesTable).where(and(...foodConditions)).orderBy(desc(guideFoodUpdatesTable.createdAt))
          : Promise.resolve([] as Array<typeof guideFoodUpdatesTable.$inferSelect>),
        !type || type === "group_photo"
          ? db.select().from(guideGroupPhotosTable).where(and(...photoConditions)).orderBy(desc(guideGroupPhotosTable.createdAt))
          : Promise.resolve([] as Array<typeof guideGroupPhotosTable.$inferSelect>),
        !type || type === "movement"
          ? db.select().from(guideMovementUpdatesTable).where(and(...movementConditions)).orderBy(desc(guideMovementUpdatesTable.createdAt))
          : Promise.resolve([] as Array<typeof guideMovementUpdatesTable.$inferSelect>),
      ]);

      // 1. Fetch Trip Timing Updates
      if (!type || type === "timing") {
        updates.forEach(u => {
          const match = assignMap.get(u.assignmentId);
          timelineItems.push({
            id: `timing-${u.id}`,
            timestamp: u.createdAt,
            guideName: match?.guideName || "Guide",
            tripName: match?.tripName || "Trip",
            type: "timing",
            location: u.currentDestination || "",
            notes: u.delayReason ? `Delay: ${u.delayReason}. Next: ${u.nextDestination || "Unknown"}` : `Status: ${u.currentTripStatus}`,
            photoUrl: null,
            videoUrl: null,
            status: u.currentTripStatus || "ongoing",
            details: u,
          });
        });
      }

      // 2. Fetch Checkin Points
      if (!type || type === "checkin") {
        checkins.forEach(c => {
          const match = assignMap.get(c.assignmentId);
          timelineItems.push({
            id: `checkin-${c.id}`,
            timestamp: c.createdAt,
            guideName: match?.guideName || "Guide",
            tripName: match?.tripName || "Trip",
            type: "checkin",
            location: c.locationName,
            notes: `${c.checkinType.replace("_", " ").toUpperCase()} check-in. ${c.notes || ""}`,
            photoUrl: c.photoUrl,
            videoUrl: null,
            status: "done",
            details: c,
          });
        });
      }

      // 3. Fetch Hotel Updates
      if (!type || type === "hotel") {
        hotels.forEach(h => {
          const match = assignMap.get(h.assignmentId);
          timelineItems.push({
            id: `hotel-${h.id}`,
            timestamp: h.createdAt,
            guideName: match?.guideName || "Guide",
            tripName: match?.tripName || "Trip",
            type: "hotel",
            location: h.hotelName,
            notes: `Check-in update. Rooms used: ${h.roomsUsed}. Allocation: ${h.roomAllocationStatus}. ${h.notes || ""}`,
            photoUrl: h.hotelPhotos[0] || null,
            videoUrl: null,
            status: h.status,
            details: h,
          });
        });
      }

      // 4. Fetch Food Updates
      if (!type || type === "food") {
        foods.forEach(f => {
          const match = assignMap.get(f.assignmentId);
          timelineItems.push({
            id: `food-${f.id}`,
            timestamp: f.createdAt,
            guideName: match?.guideName || "Guide",
            tripName: match?.tripName || "Trip",
            type: "food",
            location: `Day ${f.dayNumber} Meals`,
            notes: `Food Rating: ${f.rating}/5. Jain: ${f.jainCount}, Non-Jain: ${f.nonJainCount}. Notes: ${f.notes || ""}`,
            photoUrl: f.photoUrl,
            videoUrl: f.videoUrl,
            status: "done",
            details: f,
          });
        });
      }

      // 5. Fetch Group Photos
      if (!type || type === "group_photo") {
        groupPhotos.forEach(g => {
          const match = assignMap.get(g.assignmentId);
          timelineItems.push({
            id: `group-photo-${g.id}`,
            timestamp: g.createdAt,
            guideName: match?.guideName || "Guide",
            tripName: match?.tripName || "Trip",
            type: "group_photo",
            location: g.locationName,
            notes: `Sightseeing Group Photo (Day ${g.dayNumber}). ${g.notes || ""}`,
            photoUrl: g.photoUrl,
            videoUrl: null,
            status: "done",
            details: g,
          });
        });
      }

      // 6. Fetch Movement Updates
      if (!type || type === "movement") {
        movements.forEach(m => {
          const match = assignMap.get(m.assignmentId);
          timelineItems.push({
            id: `movement-${m.id}`,
            timestamp: m.createdAt,
            guideName: match?.guideName || "Guide",
            tripName: match?.tripName || "Trip",
            type: "movement",
            location: m.locationName || "",
            notes: `Transit Update: ${m.movementType.replace("_", " ").toUpperCase()}. ${m.notes || ""}`,
            photoUrl: m.photoUrl,
            videoUrl: m.videoUrl,
            status: "done",
            details: m,
          });
        });
      }

      // Filter by date if provided
      let finalTimeline = timelineItems;
      if (date) {
        const targetDateStr = date as string; // YYYY-MM-DD
        finalTimeline = timelineItems.filter(item => {
          const itemDateStr = new Date(item.timestamp).toISOString().split("T")[0];
          return itemDateStr === targetDateStr;
        });
      }

      // Sort timeline descending by timestamp
      finalTimeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json(finalTimeline);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// 9. GET /admin/operations/stats/:assignmentId - Get real-time participant & food preferences sync statistics
operationsRouter.get(
  "/admin/operations/stats/:assignmentId",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
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
        res.json({
          totalParticipants: 0,
          confirmedCount: 0,
          pendingCount: 0,
          cancelledCount: 0,
          maleCount: 0,
          femaleCount: 0,
          jainPreferenceCount: 0,
          nonJainPreferenceCount: 0,
          otherFoodPreferenceCount: 0,
          pickupCityBreakdown: {},
        });
        return;
      }

      const bookings = await fetchBookingsForTrip(tripId);

      let totalParticipants = 0;
      let confirmedCount = 0;
      let pendingCount = 0;
      let cancelledCount = 0;
      let maleCount = 0;
      let femaleCount = 0;
      let jainPreferenceCount = 0;
      let nonJainPreferenceCount = 0;
      let otherFoodPreferenceCount = 0;
      const pickupCityBreakdown: Record<string, number> = {};

      bookings.forEach(b => {
        const count = 1 + (b.passengers?.length || 0);

        if (b.status === "confirmed") confirmedCount += count;
        else if (b.status === "pending") pendingCount += count;
        else if (b.status === "cancelled") cancelledCount += count;

        totalParticipants += count;

        // Parse booker details
        if (b.gender) {
          const g = b.gender.toLowerCase().trim();
          if (g === "male" || g === "m") maleCount++;
          else if (g === "female" || g === "f") femaleCount++;
        }

        const bookerFood = getFoodPreference(b);
        if (bookerFood === "Jain") jainPreferenceCount++;
        else if (bookerFood === "Non-Jain") nonJainPreferenceCount++;
        else otherFoodPreferenceCount++;

        // Parse passenger details
        const passengers = b.passengers || [];
        passengers.forEach(p => {
          if (p.gender) {
            const g = p.gender.toLowerCase().trim();
            if (g === "male" || g === "m") maleCount++;
            else if (g === "female" || g === "f") femaleCount++;
          }
          const pFood = getFoodPreference(p);
          if (pFood === "Jain") jainPreferenceCount++;
          else if (pFood === "Non-Jain") nonJainPreferenceCount++;
          else otherFoodPreferenceCount++;
        });

        // Pickup city count
        if (b.pickupCity) {
          const city = b.pickupCity.trim();
          pickupCityBreakdown[city] = (pickupCityBreakdown[city] || 0) + count;
        }
      });

      res.json({
        totalParticipants,
        confirmedCount,
        pendingCount,
        cancelledCount,
        maleCount,
        femaleCount,
        jainPreferenceCount,
        nonJainPreferenceCount,
        otherFoodPreferenceCount,
        pickupCityBreakdown,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// 10. GET /admin/operations/alerts - Real-time operational anomalies detector
operationsRouter.get(
  "/admin/operations/alerts",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const activeAssignments = await db
        .select({
          id: assignmentsTable.id,
          mainBackendTripName: assignmentsTable.mainBackendTripName,
          mainBackendTripId: assignmentsTable.mainBackendTripId,
          guideId: assignmentsTable.guideId,
          guideName: usersTable.name,
          departureDate: assignmentsTable.departureDate,
        })
        .from(assignmentsTable)
        .innerJoin(usersTable, eq(assignmentsTable.guideId, usersTable.id))
        .where(eq(assignmentsTable.status, "ongoing"));

      const alerts: any[] = [];
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = now.toISOString().split("T")[0];
      const assignmentIds = activeAssignments.map((assignment) => assignment.id);

      const [allHotelUpdates, allFoodUpdates, allGroupPhotos, allMovementUpdates] = assignmentIds.length > 0
        ? await Promise.all([
            db.select().from(guideHotelUpdatesTable).where(inArray(guideHotelUpdatesTable.assignmentId, assignmentIds)),
            db.select().from(guideFoodUpdatesTable).where(inArray(guideFoodUpdatesTable.assignmentId, assignmentIds)).orderBy(desc(guideFoodUpdatesTable.createdAt)),
            db.select().from(guideGroupPhotosTable).where(inArray(guideGroupPhotosTable.assignmentId, assignmentIds)),
            db.select().from(guideMovementUpdatesTable).where(inArray(guideMovementUpdatesTable.assignmentId, assignmentIds)).orderBy(desc(guideMovementUpdatesTable.createdAt)),
          ])
        : [[], [], [], []];

      const groupByAssignment = <T extends { assignmentId: number }>(rows: T[]) => {
        const grouped = new Map<number, T[]>();
        rows.forEach((row) => {
          const current = grouped.get(row.assignmentId) || [];
          current.push(row);
          grouped.set(row.assignmentId, current);
        });
        return grouped;
      };

      const hotelUpdatesByAssignment = groupByAssignment(allHotelUpdates);
      const foodUpdatesByAssignment = groupByAssignment(allFoodUpdates);
      const groupPhotosByAssignment = groupByAssignment(allGroupPhotos);
      const movementUpdatesByAssignment = groupByAssignment(allMovementUpdates);

      const tripIds = Array.from(new Set(activeAssignments.map((assignment) => assignment.mainBackendTripId).filter(Boolean))) as string[];
      const bookingEntries = await Promise.all(
        tripIds.map(async (tripId) => [tripId, await fetchBookingsForTrip(tripId).catch(() => [])] as const)
      );
      const bookingsByTrip = new Map(bookingEntries);

      for (const a of activeAssignments) {
        // 1. Hotel check-in issue reported or missing check-in
        const hotelUpdates = hotelUpdatesByAssignment.get(a.id) || [];

        const issueReported = hotelUpdates.some(h => h.status === "issue_reported");
        if (issueReported) {
          alerts.push({
            type: "hotel_issue",
            assignmentId: a.id,
            tripName: a.mainBackendTripName,
            guideName: a.guideName,
            message: `Hotel issue reported by guide ${a.guideName} during hotel allocation.`,
            severity: "critical",
          });
        }

        // Expected hotel check-in alert (e.g. past 2:00 PM / 14:00 local time on active trip, and no hotel record logged)
        if (hotelUpdates.length === 0 && currentHour >= 14) {
          alerts.push({
            type: "hotel_missing",
            assignmentId: a.id,
            tripName: a.mainBackendTripName,
            guideName: a.guideName,
            message: `Hotel check-in has not been submitted by the expected time (2:00 PM).`,
            severity: "high",
          });
        }

        // 2. Dinner update missing (raise alert past 10 PM / 22:00 if no food logged today)
        const foodUpdates = foodUpdatesByAssignment.get(a.id) || [];

        const todayFoodLogged = foodUpdates.some(f => new Date(f.createdAt).toISOString().split("T")[0] === todayStr);
        if (!todayFoodLogged && currentHour >= 22) {
          alerts.push({
            type: "dinner_missing",
            assignmentId: a.id,
            tripName: a.mainBackendTripName,
            guideName: a.guideName,
            message: `Dinner / Food quality update has not been submitted for today.`,
            severity: "medium",
          });
        }

        // 3. Group photo missing (raise alert past 8 PM / 20:00 if no sightseeing group photo today)
        const groupPhotos = groupPhotosByAssignment.get(a.id) || [];

        const todayPhotoLogged = groupPhotos.some(g => new Date(g.createdAt).toISOString().split("T")[0] === todayStr);
        if (!todayPhotoLogged && currentHour >= 20) {
          alerts.push({
            type: "group_photo_missing",
            assignmentId: a.id,
            tripName: a.mainBackendTripName,
            guideName: a.guideName,
            message: `Sightseeing group photo has not been uploaded for today.`,
            severity: "medium",
          });
        }

        // 4. Guide transit/movement missing (no updates for > 4 hours during active trip hours 8 AM - 8 PM)
        if (currentHour >= 8 && currentHour <= 20) {
          const movementUpdates = movementUpdatesByAssignment.get(a.id) || [];

          const lastMovement = movementUpdates[0];
          const lastTime = lastMovement ? new Date(lastMovement.createdAt).getTime() : new Date(a.departureDate).getTime();
          const diffHours = (now.getTime() - lastTime) / (1000 * 60 * 60);

          if (diffHours > 4) {
            alerts.push({
              type: "movement_idle",
              assignmentId: a.id,
              tripName: a.mainBackendTripName,
              guideName: a.guideName,
              message: `No movement status update received from guide ${a.guideName} for over 4 hours.`,
              severity: "high",
            });
          }
        }

        // 5. Meal Preference Mismatch
        if (a.mainBackendTripId) {
          const bookings = bookingsByTrip.get(a.mainBackendTripId) || [];
          let jainPreferenceCount = 0;
          let nonJainPreferenceCount = 0;

          bookings.forEach((b: any) => {
            if (b.status === "confirmed") {
              const bookerFood = getFoodPreference(b);
              if (bookerFood === "Jain") jainPreferenceCount++;
              else if (bookerFood === "Non-Jain") nonJainPreferenceCount++;

              const passengers = b.passengers || [];
              const persons = Array.isArray(passengers) ? passengers : (passengers.persons || []);
              persons.forEach((p: any) => {
                const pFood = getFoodPreference(p);
                if (pFood === "Jain") jainPreferenceCount++;
                else if (pFood === "Non-Jain") nonJainPreferenceCount++;
              });
            }
          });

          const [latestFoodUpdate] = foodUpdates;

          if (latestFoodUpdate) {
            const reportedJain = latestFoodUpdate.jainCount || 0;
            const reportedNonJain = latestFoodUpdate.nonJainCount || 0;

            if (reportedJain !== jainPreferenceCount || reportedNonJain !== nonJainPreferenceCount) {
              alerts.push({
                type: "meal_mismatch",
                assignmentId: a.id,
                tripName: a.mainBackendTripName,
                guideName: a.guideName,
                message: `Meal mismatch: Guide reported ${reportedJain} Jain / ${reportedNonJain} Non-Jain today, but database has ${jainPreferenceCount} Jain / ${nonJainPreferenceCount} Non-Jain synced.`,
                severity: "high",
              });
            }
          }
        }
      }

      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// 11. PUT /admin/operations/hotel/:id - Admin approves or rejects a hotel stay check-in report
operationsRouter.put(
  "/admin/operations/hotel/:id",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const { status, notes } = req.body;
      if (isNaN(id) || !status) {
        res.status(400).json({ error: "id and status are required." });
        return;
      }

      const [updated] = await db
        .update(guideHotelUpdatesTable)
        .set({ status, notes: notes || null })
        .where(eq(guideHotelUpdatesTable.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Hotel update log not found." });
        return;
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// 12. POST /admin/operations/sync-food-preference - Admin overrides/syncs passenger food preference in the main backend with audit logging
operationsRouter.post(
  "/admin/operations/sync-food-preference",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { bookingCuid, bookingId, passengerName, foodPreference, isPrimaryBooker, reason } = req.body;
      if (!bookingCuid || !bookingId || !passengerName || !foodPreference) {
        res.status(400).json({ error: "bookingCuid, bookingId, passengerName, and foodPreference are required." });
        return;
      }

      // Validate allowed food values
      const ALLOWED_VALUES = ["Jain", "Non-Jain", "Swaminarayan", "Vegan", "Other", "Not specified"];
      if (!ALLOWED_VALUES.includes(foodPreference)) {
        res.status(400).json({ error: `Invalid food preference. Allowed values: ${ALLOWED_VALUES.join(", ")}` });
        return;
      }

      // Fetch current booking details from main backend
      const fetchUrl = `${process.env.MAIN_BACKEND_URL || "http://localhost:3001/api"}/bookings/${bookingCuid}`;
      const headers: HeadersInit = {};
      if (process.env.MAIN_BACKEND_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.MAIN_BACKEND_TOKEN}`;
      }
      const fetchRes = await fetch(fetchUrl, { headers });
      if (!fetchRes.ok) {
        res.status(fetchRes.status).json({ error: `Failed to fetch booking. Status: ${fetchRes.status}` });
        return;
      }
      const json = await fetchRes.json() as { success: boolean; data: any };
      const booking = json.data;
      if (!booking) {
        res.status(404).json({ error: "Booking not found in main backend." });
        return;
      }

      // Read old food preference
      let oldPreference: string | null = null;
      let currentPassengers = booking.passengers || { details: {}, persons: [] };
      if (!currentPassengers.details) currentPassengers = { details: currentPassengers, persons: [] };
      const details = { ...currentPassengers.details };
      const persons = [...(currentPassengers.persons || [])];

      if (isPrimaryBooker) {
        oldPreference = details.foodPreference || details.mealPreference || details.dietary || "Not specified";
      } else {
        const p = persons.find((p: any) => (p.name || p.fullName) === passengerName);
        oldPreference = p ? (p.foodPreference || p.mealPreference || p.dietary || "Not specified") : "Not specified";
      }

      // Modify food preference in the passengers payload safely
      if (isPrimaryBooker) {
        details.foodPreference = foodPreference;
        details.mealPreference = foodPreference;
        details.dietary = foodPreference;
      } else {
        const idx = persons.findIndex((p: any) => (p.name || p.fullName) === passengerName);
        if (idx !== -1) {
          persons[idx] = {
            ...persons[idx],
            foodPreference,
            mealPreference: foodPreference,
            dietary: foodPreference,
          };
        } else {
          persons.push({
            name: passengerName,
            foodPreference,
            mealPreference: foodPreference,
            dietary: foodPreference,
          });
        }
      }

      // Construct safe update payload (Only update specific fields)
      const updatePayload: any = {};
      if (isPrimaryBooker) {
        updatePayload.foodPreference = foodPreference;
        updatePayload.mealPreference = foodPreference;
        updatePayload.dietary = foodPreference;
      } else {
        updatePayload.passengers = persons;
      }

      const success = await updateBookingInMainBackend(bookingCuid, updatePayload);
      if (!success) {
        res.status(500).json({ error: "Failed to update booking in main backend." });
        return;
      }

      // Store in audit log
      const adminUser = (req as AuthenticatedRequest).user!;
      await db.insert(guideFoodPreferenceAuditsTable).values({
        bookingId,
        travelerName: passengerName,
        oldPreference,
        newPreference: foodPreference,
        approvedBy: `${adminUser.name} (${adminUser.email || adminUser.id})`,
        approvedAt: new Date(),
        source: "Guide Operation",
        notes: reason || null,
      });

      res.json({ success: true, message: "Food preference updated and synced successfully!" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

export default operationsRouter;
