import { Router, Request, Response, NextFunction } from "express";
import { db, usersTable, tripsTable, assignmentsTable, guideWorkDaysTable, guideDayReportsTable, attendanceTable } from "@workspace/db";
import { eq, and, asc, desc } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToCloudinary } from "../lib/cloudinary";

// Local helper middlewares
function requireGuide(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role !== "guide") {
    res.status(403).json({ error: "Access denied. Guides only." });
    return;
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
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

// ---------------------------------------------------------------------------
// ADMIN APIs
// ---------------------------------------------------------------------------

// GET /admin/guide-work-days - Get all guide work days
router.get("/admin/guide-work-days", requireAuth, requireAdmin, async (req, res) => {
  try {
    const workDays = await db
      .select({
        id: guideWorkDaysTable.id,
        assignmentId: guideWorkDaysTable.assignmentId,
        tripId: guideWorkDaysTable.tripId,
        guideId: guideWorkDaysTable.guideId,
        dayNumber: guideWorkDaysTable.dayNumber,
        date: guideWorkDaysTable.date,
        location: guideWorkDaysTable.location,
        journeyTitle: guideWorkDaysTable.journeyTitle,
        dutyInstructions: guideWorkDaysTable.dutyInstructions,
        reportingRequirement: guideWorkDaysTable.reportingRequirement,
        expectedCheckinLatitude: guideWorkDaysTable.expectedCheckinLatitude,
        expectedCheckinLongitude: guideWorkDaysTable.expectedCheckinLongitude,
        expectedCheckoutLatitude: guideWorkDaysTable.expectedCheckoutLatitude,
        expectedCheckoutLongitude: guideWorkDaysTable.expectedCheckoutLongitude,
        requiredPhotosCount: guideWorkDaysTable.requiredPhotosCount,
        status: guideWorkDaysTable.status,
        guideName: usersTable.name,
        tripName: tripsTable.name,
      })
      .from(guideWorkDaysTable)
      .innerJoin(usersTable, eq(guideWorkDaysTable.guideId, usersTable.id))
      .innerJoin(tripsTable, eq(guideWorkDaysTable.tripId, tripsTable.id))
      .orderBy(asc(guideWorkDaysTable.date), asc(guideWorkDaysTable.dayNumber));

    res.json(workDays);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /admin/guide-work-days - Create a workday plan
router.post("/admin/guide-work-days", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      assignmentId,
      tripId,
      guideId,
      dayNumber,
      date,
      location,
      journeyTitle,
      dutyInstructions,
      reportingRequirement,
      expectedCheckinLatitude,
      expectedCheckinLongitude,
      expectedCheckoutLatitude,
      expectedCheckoutLongitude,
      requiredPhotosCount,
    } = req.body;

    if (!assignmentId || !tripId || !guideId || !dayNumber || !date || !location || !journeyTitle || !dutyInstructions) {
      res.status(400).json({ error: "Missing required workday parameters" });
      return;
    }

    const [newWorkDay] = await db
      .insert(guideWorkDaysTable)
      .values({
        assignmentId: Number(assignmentId),
        tripId: Number(tripId),
        guideId: Number(guideId),
        dayNumber: Number(dayNumber),
        date: date,
        location: location,
        journeyTitle: journeyTitle,
        dutyInstructions: dutyInstructions,
        reportingRequirement: reportingRequirement || null,
        expectedCheckinLatitude: expectedCheckinLatitude ? parseFloat(expectedCheckinLatitude) : null,
        expectedCheckinLongitude: expectedCheckinLongitude ? parseFloat(expectedCheckinLongitude) : null,
        expectedCheckoutLatitude: expectedCheckoutLatitude ? parseFloat(expectedCheckoutLatitude) : null,
        expectedCheckoutLongitude: expectedCheckoutLongitude ? parseFloat(expectedCheckoutLongitude) : null,
        requiredPhotosCount: requiredPhotosCount ? Number(requiredPhotosCount) : 0,
        status: "pending",
      })
      .returning();

    res.status(201).json(newWorkDay);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PATCH /admin/guide-work-days/:id - Update workday plan
router.patch("/admin/guide-work-days/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid workday ID" });
      return;
    }

    const updates = req.body;
    const cleanUpdates: any = {};

    if (updates.dayNumber !== undefined) cleanUpdates.dayNumber = Number(updates.dayNumber);
    if (updates.date !== undefined) cleanUpdates.date = updates.date;
    if (updates.location !== undefined) cleanUpdates.location = updates.location;
    if (updates.journeyTitle !== undefined) cleanUpdates.journeyTitle = updates.journeyTitle;
    if (updates.dutyInstructions !== undefined) cleanUpdates.dutyInstructions = updates.dutyInstructions;
    if (updates.reportingRequirement !== undefined) cleanUpdates.reportingRequirement = updates.reportingRequirement || null;
    if (updates.expectedCheckinLatitude !== undefined) cleanUpdates.expectedCheckinLatitude = updates.expectedCheckinLatitude ? parseFloat(updates.expectedCheckinLatitude) : null;
    if (updates.expectedCheckinLongitude !== undefined) cleanUpdates.expectedCheckinLongitude = updates.expectedCheckinLongitude ? parseFloat(updates.expectedCheckinLongitude) : null;
    if (updates.expectedCheckoutLatitude !== undefined) cleanUpdates.expectedCheckoutLatitude = updates.expectedCheckoutLatitude ? parseFloat(updates.expectedCheckoutLatitude) : null;
    if (updates.expectedCheckoutLongitude !== undefined) cleanUpdates.expectedCheckoutLongitude = updates.expectedCheckoutLongitude ? parseFloat(updates.expectedCheckoutLongitude) : null;
    if (updates.requiredPhotosCount !== undefined) cleanUpdates.requiredPhotosCount = Number(updates.requiredPhotosCount);
    if (updates.status !== undefined) cleanUpdates.status = updates.status;

    const [updatedWorkDay] = await db
      .update(guideWorkDaysTable)
      .set({ ...cleanUpdates, updatedAt: new Date() })
      .where(eq(guideWorkDaysTable.id, id))
      .returning();

    if (!updatedWorkDay) {
      res.status(404).json({ error: "Work day not found" });
      return;
    }

    res.json(updatedWorkDay);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /admin/guide-work-days/:id - Delete workday plan
router.delete("/admin/guide-work-days/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid workday ID" });
      return;
    }

    // Delete associated reports first to maintain referential integrity
    await db.delete(guideDayReportsTable).where(eq(guideDayReportsTable.workDayId, id));

    const [deleted] = await db
      .delete(guideWorkDaysTable)
      .where(eq(guideWorkDaysTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Work day not found" });
      return;
    }

    res.json({ message: "Work day deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /admin/guide-day-reports - Get all guide submitted reports
router.get("/admin/guide-day-reports", requireAuth, requireAdmin, async (req, res) => {
  try {
    const reports = await db
      .select({
        id: guideDayReportsTable.id,
        workDayId: guideDayReportsTable.workDayId,
        assignmentId: guideDayReportsTable.assignmentId,
        guideId: guideDayReportsTable.guideId,
        tripId: guideDayReportsTable.tripId,
        attendanceId: guideDayReportsTable.attendanceId,
        reportText: guideDayReportsTable.reportText,
        uploadedPhotoUrls: guideDayReportsTable.uploadedPhotoUrls,
        completedTasks: guideDayReportsTable.completedTasks,
        guideNotes: guideDayReportsTable.guideNotes,
        submittedAt: guideDayReportsTable.submittedAt,
        adminStatus: guideDayReportsTable.adminStatus,
        adminRemarks: guideDayReportsTable.adminRemarks,
        guideName: usersTable.name,
        tripName: tripsTable.name,
        dayNumber: guideWorkDaysTable.dayNumber,
        journeyTitle: guideWorkDaysTable.journeyTitle,
      })
      .from(guideDayReportsTable)
      .innerJoin(usersTable, eq(guideDayReportsTable.guideId, usersTable.id))
      .innerJoin(tripsTable, eq(guideDayReportsTable.tripId, tripsTable.id))
      .innerJoin(guideWorkDaysTable, eq(guideDayReportsTable.workDayId, guideWorkDaysTable.id))
      .orderBy(desc(guideDayReportsTable.submittedAt));

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /admin/guide-day-reports/:id/verify - Approve/reject a guide day report
router.post("/admin/guide-day-reports/:id/verify", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid report ID" });
      return;
    }

    const { status, remarks } = req.body;
    if (!status || (status !== "approved" && status !== "rejected" && status !== "pending")) {
      res.status(400).json({ error: "Invalid status parameter. Must be approved, rejected, or pending." });
      return;
    }

    const [updatedReport] = await db
      .update(guideDayReportsTable)
      .set({
        adminStatus: status,
        adminRemarks: remarks || null,
      })
      .where(eq(guideDayReportsTable.id, id))
      .returning();

    if (!updatedReport) {
      res.status(404).json({ error: "Day report not found" });
      return;
    }

    // If approved, update the corresponding workday status to completed
    if (status === "approved") {
      await db
        .update(guideWorkDaysTable)
        .set({ status: "completed" })
        .where(eq(guideWorkDaysTable.id, updatedReport.workDayId));
    } else {
      await db
        .update(guideWorkDaysTable)
        .set({ status: "pending" })
        .where(eq(guideWorkDaysTable.id, updatedReport.workDayId));
    }

    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ---------------------------------------------------------------------------
// GUIDE APIs
// ---------------------------------------------------------------------------

// GET /guide/work-days/active - Get all workday tasks and statuses for active assignment
router.get("/guide/work-days/active", requireAuth, requireGuide, async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Find active trip
    const [activeTrip] = await db
      .select()
      .from(tripsTable)
      .where(and(eq(tripsTable.leadGuideId, user.id), eq(tripsTable.status, "active")))
      .limit(1);

    if (!activeTrip) {
      res.status(200).json([]); // No active trip, return empty
      return;
    }

    // Find assignment for active trip
    const [assignment] = await db
      .select()
      .from(assignmentsTable)
      .where(and(eq(assignmentsTable.guideId, user.id), eq(assignmentsTable.tripId, activeTrip.id)))
      .limit(1);

    if (!assignment) {
      res.status(200).json([]); // No active assignment, return empty
      return;
    }

    // Get work days for this assignment
    const workDays = await db
      .select()
      .from(guideWorkDaysTable)
      .where(eq(guideWorkDaysTable.assignmentId, assignment.id))
      .orderBy(asc(guideWorkDaysTable.dayNumber));

    // Get guide's day reports for this assignment
    const reports = await db
      .select()
      .from(guideDayReportsTable)
      .where(eq(guideDayReportsTable.assignmentId, assignment.id));

    // Map workdays to include report status if submitted
    const mappedWorkDays = workDays.map((wd) => {
      const matchedReport = reports.find((r) => r.workDayId === wd.id);
      return {
        ...wd,
        report: matchedReport ? {
          id: matchedReport.id,
          reportText: matchedReport.reportText,
          uploadedPhotoUrls: matchedReport.uploadedPhotoUrls,
          completedTasks: matchedReport.completedTasks,
          guideNotes: matchedReport.guideNotes,
          submittedAt: matchedReport.submittedAt,
          adminStatus: matchedReport.adminStatus,
          adminRemarks: matchedReport.adminRemarks,
        } : null,
      };
    });

    res.json(mappedWorkDays);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /guide/day-report - Submit day report with photos
router.post("/guide/day-report", requireAuth, requireGuide, upload.array("photos"), async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { workDayId, reportText, completedTasks, guideNotes } = req.body;
    const photoFiles = req.files as Express.Multer.File[] | undefined;

    if (!workDayId || !reportText) {
      res.status(400).json({ error: "workDayId and reportText are required" });
      return;
    }

    // Fetch the target work day
    const [workDay] = await db
      .select()
      .from(guideWorkDaysTable)
      .where(eq(guideWorkDaysTable.id, Number(workDayId)))
      .limit(1);

    if (!workDay) {
      res.status(404).json({ error: "Work day not found" });
      return;
    }

    // Verify ownership
    if (workDay.guideId !== user.id) {
      res.status(403).json({ error: "You are not assigned to this work day plan" });
      return;
    }

    // Verify photo count
    const photosUploadedCount = photoFiles ? photoFiles.length : 0;
    if (photosUploadedCount < workDay.requiredPhotosCount) {
      res.status(400).json({
        error: `Submission failed. This day requires at least ${workDay.requiredPhotosCount} photo uploads, but only ${photosUploadedCount} was provided.`,
      });
      return;
    }

    // Check if report already exists for this workday
    const [existingReport] = await db
      .select()
      .from(guideDayReportsTable)
      .where(eq(guideDayReportsTable.workDayId, workDay.id))
      .limit(1);

    if (existingReport) {
      res.status(400).json({ error: "A report for this workday has already been submitted." });
      return;
    }

    // Fetch today's attendance record (if checked in/out) to link them
    const todayStr = getLocalDateString();
    const [todayAttendance] = await db
      .select()
      .from(attendanceTable)
      .where(and(eq(attendanceTable.guideId, user.id), eq(attendanceTable.date, todayStr)))
      .limit(1);

    // Process photo URLs
    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    const uploadedPhotoUrls: string[] = [];

    if (photoFiles && photoFiles.length > 0) {
      for (const file of photoFiles) {
        let photoUrl = `${protocol}://${host}/uploads/${file.filename}`;
        try {
          const cloudinaryUrl = await uploadToCloudinary(file.path);
          if (cloudinaryUrl) {
            photoUrl = cloudinaryUrl;
            try {
              fs.unlinkSync(file.path);
            } catch (e) {
              console.error("Failed to delete local report photo file after Cloudinary upload", e);
            }
          }
        } catch (e) {
          console.warn("Cloudinary upload failed for report photo, falling back to local file", e);
        }
        uploadedPhotoUrls.push(photoUrl);
      }
    }

    // Parse completed tasks
    let parsedTasks: string[] = [];
    if (completedTasks) {
      try {
        parsedTasks = typeof completedTasks === "string" ? JSON.parse(completedTasks) : completedTasks;
      } catch {
        parsedTasks = [String(completedTasks)];
      }
    }

    const [newReport] = await db
      .insert(guideDayReportsTable)
      .values({
        workDayId: workDay.id,
        assignmentId: workDay.assignmentId,
        guideId: user.id,
        tripId: workDay.tripId,
        attendanceId: todayAttendance ? todayAttendance.id : null,
        reportText: reportText,
        uploadedPhotoUrls: uploadedPhotoUrls,
        completedTasks: parsedTasks,
        guideNotes: guideNotes || null,
        adminStatus: "pending",
      })
      .returning();

    res.status(201).json(newReport);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
