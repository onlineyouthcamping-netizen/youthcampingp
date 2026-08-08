const express = require("express");
const router = express.Router({ mergeParams: true });
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { prisma } = require("../lib/prisma");
const { authenticate, requirePermission } = require("../middleware/auth");

// Multer Storage setup: /backend/public/uploads/trips/[tripId]/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tripId = req.params.tripId || req.body.tripId || "general";
    const uploadDir = path.join(
      __dirname,
      "../../public/uploads/trips",
      tripId,
    );

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Also create secondary path if needed
    const fallbackDir = path.join(__dirname, "../../uploads/trips", tripId);
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const nameWithoutExt = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

// File filter: Allowed types .pdf, .png, .jpg, .jpeg, .docx (max 10MB)
const fileFilter = (req, file, cb) => {
  const allowedExts = [".pdf", ".png", ".jpg", ".jpeg", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];

  if (allowedExts.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only .pdf, .png, .jpg, .jpeg, and .docx files are allowed.",
      ),
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

/**
 * 1. POST /api/trips/:tripId/documents/upload
 * Handle multipart/form-data with file + category fields
 */
router.post(
  "/:tripId/documents/upload",
  authenticate,
  requirePermission("edit_trip"),
  (req, res, next) => {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res
              .status(400)
              .json({
                success: false,
                message: "File size exceeds 10MB limit",
              });
          }
          return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Please upload a file" });
      }

      try {
        const { tripId } = req.params;
        const category = req.body.category || "other";
        const fileName = req.file.originalname;
        const storedFileName = req.file.filename;
        const fileSize = req.file.size;
        const mimeType = req.file.mimetype;
        const fileUrl = `/uploads/trips/${tripId}/${storedFileName}`;

        // Save file record to database via TripDocument model
        const document = await prisma.tripDocument.create({
          data: {
            tripId,
            name: fileName,
            fileName,
            category,
            fileType: mimeType,
            mimeType,
            size: `${(fileSize / 1024).toFixed(1)} KB`,
            fileSize,
            fileUrl,
            storedFilename: storedFileName,
            uploadedBy: req.user.id,
            status: "published",
          },
        });

        // Also sync file to secondary directory
        try {
          const primaryFilePath = req.file.path;
          const secondaryFilePath = path.join(
            __dirname,
            "../../uploads/trips",
            tripId,
            storedFileName,
          );
          if (
            fs.existsSync(primaryFilePath) &&
            !fs.existsSync(secondaryFilePath)
          ) {
            fs.copyFileSync(primaryFilePath, secondaryFilePath);
          }
        } catch (copyErr) {
          console.error("Failed to copy file to secondary directory:", copyErr);
        }

        // Auto-log to TripActivityLog
        await prisma.tripActivityLog.create({
          data: {
            tripId,
            action: "upload",
            section: "documents",
            itemId: document.id,
            changes: { fileName, category, fileSize, fileUrl },
            performedBy: req.user.id,
          },
        });

        return res.status(201).json({
          success: true,
          data: {
            id: document.id,
            fileName,
            fileUrl,
            fileSize,
            category: document.category,
            createdAt: document.createdAt,
          },
          message: "Document uploaded successfully",
        });
      } catch (dbErr) {
        next(dbErr);
      }
    });
  },
);

/**
 * 2. GET /api/trips/:tripId/documents
 * Fetch all documents for trip
 * Query params: category (filter)
 * Return: { success: true, data: { documents: [], total }, message: '' }
 */
router.get(
  "/:tripId/documents",
  authenticate,
  requirePermission("view_trip"),
  async (req, res, next) => {
    try {
      const { tripId } = req.params;
      const { category } = req.query;

      const where = { tripId };
      if (category) {
        where.category = category;
      }

      const [documents, total] = await Promise.all([
        prisma.tripDocument.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            uploader: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        }),
        prisma.tripDocument.count({ where }),
      ]);

      return res.json({
        success: true,
        data: { documents, total },
        message: "Documents fetched successfully",
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * 3. DELETE /api/trips/:tripId/documents/:docId
 * Delete file from filesystem + database
 * Auto-log deletion
 */
router.delete(
  "/:tripId/documents/:docId",
  authenticate,
  requirePermission("edit_trip"),
  async (req, res, next) => {
    try {
      const { tripId, docId } = req.params;

      const doc = await prisma.tripDocument.findUnique({
        where: { id: docId },
      });

      if (!doc || doc.tripId !== tripId) {
        return res
          .status(404)
          .json({ success: false, message: "Document not found" });
      }

      // Delete file from filesystem
      if (doc.fileUrl && doc.fileUrl.startsWith("/uploads/")) {
        const publicPath = path.join(__dirname, "../../public", doc.fileUrl);
        if (fs.existsSync(publicPath)) {
          try {
            fs.unlinkSync(publicPath);
          } catch (e) {
            console.error("Failed to delete file from disk:", publicPath, e);
          }
        }

        const rootUploadPath = path.join(__dirname, "../../", doc.fileUrl);
        if (fs.existsSync(rootUploadPath)) {
          try {
            fs.unlinkSync(rootUploadPath);
          } catch (e) {
            console.error(
              "Failed to delete file from disk:",
              rootUploadPath,
              e,
            );
          }
        }
      }

      // Delete record from database
      await prisma.tripDocument.delete({
        where: { id: docId },
      });

      // Auto-log deletion to TripActivityLog
      await prisma.tripActivityLog.create({
        data: {
          tripId,
          action: "delete",
          section: "documents",
          itemId: docId,
          changes: {
            fileName: doc.name || doc.fileName,
            category: doc.category,
          },
          performedBy: req.user.id,
        },
      });

      return res.json({
        success: true,
        data: null,
        message: "Document deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
