import { Router, Request, Response, NextFunction } from "express";
import { db, attendanceTable, tripsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToCloudinary } from "../lib/cloudinary";

// Middleware to ensure the authenticated user is a guide
function requireGuide(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role !== "guide") {
    res.status(403).json({ error: "Access denied. Guides only." });
    return;
  }
  next();
}

const router = Router();

// Configure multer for local file uploads
const uploadDir = "./uploads";
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

const upload = multer({ storage });

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

// Haversine formula to compute distance in meters between two GPS coordinates
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// GET /attendance/today - Get today's attendance details for the guide
router.get("/attendance/today", requireAuth, requireGuide, async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const todayStr = getLocalDateString();

    const [todayLog] = await db
      .select()
      .from(attendanceTable)
      .where(
        and(
          eq(attendanceTable.guideId, user.id),
          eq(attendanceTable.date, todayStr)
        )
      )
      .limit(1);

    if (!todayLog) {
      res.status(204).send();
      return;
    }

    res.json({
      id: todayLog.id,
      guideId: todayLog.guideId,
      tripId: todayLog.tripId,
      date: todayLog.date,
      checkInTime: todayLog.checkInTime ? todayLog.checkInTime.toISOString() : null,
      checkInLatitude: todayLog.checkInLatitude,
      checkInLongitude: todayLog.checkInLongitude,
      checkInLocationName: todayLog.checkInLocationName,
      checkInSelfieUrl: todayLog.checkInSelfieUrl,
      checkInDistance: todayLog.checkInDistance,
      checkOutTime: todayLog.checkOutTime ? todayLog.checkOutTime.toISOString() : null,
      checkOutLatitude: todayLog.checkOutLatitude,
      checkOutLongitude: todayLog.checkOutLongitude,
      checkOutLocationName: todayLog.checkOutLocationName,
      checkOutSelfieUrl: todayLog.checkOutSelfieUrl,
      checkOutDistance: todayLog.checkOutDistance,
      notes: todayLog.notes,
      status: todayLog.status,
      verifiedAt: todayLog.verifiedAt ? todayLog.verifiedAt.toISOString() : null,
      verifiedBy: todayLog.verifiedBy,
      createdAt: todayLog.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /attendance/check-in - Submits today's check-in GPS location and selfie
router.post("/attendance/check-in", requireAuth, requireGuide, upload.single("selfie"), async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { latitude, longitude, locationName } = req.body;
    const selfieFile = req.file;

    // Strict validation: selfie file is mandatory
    if (!latitude || !longitude || !locationName || !selfieFile) {
      res.status(400).json({ error: "Latitude, longitude, locationName, and selfie file are required" });
      return;
    }

    // Check if guide has an active trip
    const [activeTrip] = await db
      .select()
      .from(tripsTable)
      .where(
        and(
          eq(tripsTable.leadGuideId, user.id),
          eq(tripsTable.status, "active")
        )
      )
      .limit(1);

    if (!activeTrip) {
      res.status(400).json({ error: "No active trip found. You must be assigned to an active trip to check in." });
      return;
    }

    const todayStr = getLocalDateString();

    // Check if already checked in today
    const [existingLog] = await db
      .select()
      .from(attendanceTable)
      .where(
        and(
          eq(attendanceTable.guideId, user.id),
          eq(attendanceTable.date, todayStr)
        )
      )
      .limit(1);

    if (existingLog && existingLog.checkInTime) {
      res.status(400).json({ error: "Already checked in today." });
      return;
    }

    // Calculate check-in distance
    let checkInDistance: number | null = null;
    if (activeTrip.allowedLatitude !== null && activeTrip.allowedLongitude !== null) {
      checkInDistance = calculateHaversineDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        activeTrip.allowedLatitude,
        activeTrip.allowedLongitude
      );
    }

    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    let selfieUrl = `${protocol}://${host}/uploads/${selfieFile.filename}`;
    try {
      const cloudinaryUrl = await uploadToCloudinary(selfieFile.path);
      if (cloudinaryUrl) {
        selfieUrl = cloudinaryUrl;
        try {
          fs.unlinkSync(selfieFile.path);
        } catch (e) {
          console.error("Failed to delete local check-in selfie file after Cloudinary upload", e);
        }
      }
    } catch (e) {
      console.warn("Cloudinary upload failed for check-in selfie, falling back to local file", e);
    }

    let newLog;
    if (existingLog) {
      // Record exists (e.g. created for some other reason), update it
      [newLog] = await db
        .update(attendanceTable)
        .set({
          checkInTime: new Date(),
          checkInLatitude: parseFloat(latitude),
          checkInLongitude: parseFloat(longitude),
          checkInLocationName: locationName,
          checkInSelfieUrl: selfieUrl,
          checkInDistance: checkInDistance,
          status: "incomplete", // check-in only is always 'incomplete'
        })
        .where(eq(attendanceTable.id, existingLog.id))
        .returning();
    } else {
      // Create new record
      [newLog] = await db
        .insert(attendanceTable)
        .values({
          guideId: user.id,
          tripId: activeTrip.id,
          date: todayStr,
          checkInTime: new Date(),
          checkInLatitude: parseFloat(latitude),
          checkInLongitude: parseFloat(longitude),
          checkInLocationName: locationName,
          checkInSelfieUrl: selfieUrl,
          checkInDistance: checkInDistance,
          status: "incomplete", // check-in only is always 'incomplete'
        })
        .returning();
    }

    res.json({
      id: newLog.id,
      guideId: newLog.guideId,
      tripId: newLog.tripId,
      date: newLog.date,
      checkInTime: newLog.checkInTime ? newLog.checkInTime.toISOString() : null,
      checkInLatitude: newLog.checkInLatitude,
      checkInLongitude: newLog.checkInLongitude,
      checkInLocationName: newLog.checkInLocationName,
      checkInSelfieUrl: newLog.checkInSelfieUrl,
      checkInDistance: newLog.checkInDistance,
      checkOutTime: null,
      checkOutLatitude: null,
      checkOutLongitude: null,
      checkOutLocationName: null,
      checkOutSelfieUrl: null,
      checkOutDistance: null,
      notes: newLog.notes,
      status: newLog.status,
      verifiedAt: null,
      verifiedBy: null,
      createdAt: newLog.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /attendance/check-out - Submits today's check-out GPS location and selfie
router.post("/attendance/check-out", requireAuth, requireGuide, upload.single("selfie"), async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { latitude, longitude, locationName } = req.body;
    const selfieFile = req.file;

    // Strict validation: selfie file is mandatory
    if (!latitude || !longitude || !locationName || !selfieFile) {
      res.status(400).json({ error: "Latitude, longitude, locationName, and selfie file are required" });
      return;
    }

    const todayStr = getLocalDateString();

    // Check if check-in exists for today
    const [existingLog] = await db
      .select()
      .from(attendanceTable)
      .where(
        and(
          eq(attendanceTable.guideId, user.id),
          eq(attendanceTable.date, todayStr)
        )
      )
      .limit(1);

    if (!existingLog || !existingLog.checkInTime) {
      res.status(400).json({ error: "You must check in before you can check out." });
      return;
    }

    if (existingLog.checkOutTime) {
      res.status(400).json({ error: "Already checked out today." });
      return;
    }

    // Fetch trip allowed location details
    const [trip] = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.id, existingLog.tripId))
      .limit(1);

    if (!trip) {
      res.status(400).json({ error: "Associated trip not found." });
      return;
    }

    // Calculate check-out distance
    let checkOutDistance: number | null = null;
    if (trip.allowedLatitude !== null && trip.allowedLongitude !== null) {
      checkOutDistance = calculateHaversineDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        trip.allowedLatitude,
        trip.allowedLongitude
      );
    }

    // Determine status: pending or location_mismatch
    let finalStatus = "pending";
    const allowedRadius = trip.allowedRadius ?? 3000;
    const inDist = existingLog.checkInDistance;
    const outDist = checkOutDistance;

    if (inDist !== null && outDist !== null) {
      if (inDist > allowedRadius || outDist > allowedRadius) {
        finalStatus = "location_mismatch";
      } else {
        finalStatus = "pending";
      }
    } else {
      // Default to location_mismatch if distance could not be determined due to missing trip GPS
      finalStatus = "location_mismatch";
    }

    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    let selfieUrl = `${protocol}://${host}/uploads/${selfieFile.filename}`;
    try {
      const cloudinaryUrl = await uploadToCloudinary(selfieFile.path);
      if (cloudinaryUrl) {
        selfieUrl = cloudinaryUrl;
        try {
          fs.unlinkSync(selfieFile.path);
        } catch (e) {
          console.error("Failed to delete local check-out selfie file after Cloudinary upload", e);
        }
      }
    } catch (e) {
      console.warn("Cloudinary upload failed for check-out selfie, falling back to local file", e);
    }

    const [updatedLog] = await db
      .update(attendanceTable)
      .set({
        checkOutTime: new Date(),
        checkOutLatitude: parseFloat(latitude),
        checkOutLongitude: parseFloat(longitude),
        checkOutLocationName: locationName,
        checkOutSelfieUrl: selfieUrl,
        checkOutDistance: checkOutDistance,
        status: finalStatus,
      })
      .where(eq(attendanceTable.id, existingLog.id))
      .returning();

    res.json({
      id: updatedLog.id,
      guideId: updatedLog.guideId,
      tripId: updatedLog.tripId,
      date: updatedLog.date,
      checkInTime: updatedLog.checkInTime ? updatedLog.checkInTime.toISOString() : null,
      checkInLatitude: updatedLog.checkInLatitude,
      checkInLongitude: updatedLog.checkInLongitude,
      checkInLocationName: updatedLog.checkInLocationName,
      checkInSelfieUrl: updatedLog.checkInSelfieUrl,
      checkInDistance: updatedLog.checkInDistance,
      checkOutTime: updatedLog.checkOutTime ? updatedLog.checkOutTime.toISOString() : null,
      checkOutLatitude: updatedLog.checkOutLatitude,
      checkOutLongitude: updatedLog.checkOutLongitude,
      checkOutLocationName: updatedLog.checkOutLocationName,
      checkOutSelfieUrl: updatedLog.checkOutSelfieUrl,
      checkOutDistance: updatedLog.checkOutDistance,
      notes: updatedLog.notes,
      status: updatedLog.status,
      verifiedAt: updatedLog.verifiedAt ? updatedLog.verifiedAt.toISOString() : null,
      verifiedBy: updatedLog.verifiedBy,
      createdAt: updatedLog.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
