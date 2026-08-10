const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const allowedOrigins = [
  "https://youthcamping.online",
  "https://www.youthcamping.online",
  "https://admin.youthcamping.online",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, "");
    if (
      allowedOrigins.includes(normalized) ||
      /\.vercel\.app$/i.test(normalized) ||
      /^https?:\/\/localhost(:\d+)?$/i.test(normalized) ||
      /patelparth3315/i.test(normalized)
    ) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

// Register CORS explicitly at the router level
router.use(cors(corsOptions));
router.options("*", cors(corsOptions));

const isCloudinaryConfigured = () => !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

/**
 * Uploads a file buffer to Cloudinary if configured; otherwise gracefully falls back to local disk.
 */
async function saveUploadedFile(file, folder = "youthcamping/trips") {
  const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
  const mime = (file.mimetype || "").toLowerCase();
  const isVideo = mime.startsWith("video/") || [".mp4", ".webm", ".mov", ".ogg", ".avi", ".mkv"].includes(ext);

  // 1. Try Cloudinary if configured
  if (isCloudinaryConfigured()) {
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: isVideo ? "video" : "auto",
          },
          (error, res) => {
            if (error) return reject(error);
            resolve(res);
          }
        );
        uploadStream.end(file.buffer);
      });

      if (result && (result.secure_url || result.url)) {
        const finalUrl = result.secure_url || result.url;
        console.log("[UPLOAD] ✅ Uploaded to Cloudinary:", finalUrl);
        return {
          url: finalUrl,
          publicId: result.public_id,
          size: file.size,
          filename: file.originalname,
        };
      }
    } catch (cErr) {
      console.warn("[UPLOAD] ⚠️ Cloudinary upload failed, falling back to local disk storage:", cErr.message);
    }
  }

  // 2. Fallback to local disk storage
  const primaryDir = path.join(__dirname, "../../public/uploads/trips");
  const fallbackDir = path.join(process.cwd(), "public/uploads/trips");
  const cwdDir = path.join(process.cwd(), "uploads/trips");
  let targetDir = primaryDir;

  try {
    if (!fs.existsSync(primaryDir)) {
      fs.mkdirSync(primaryDir, { recursive: true });
    }
  } catch (err) {
    console.warn(`[UPLOAD] Could not create ${primaryDir}, trying fallback:`, err.message);
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      targetDir = fallbackDir;
    } catch (err2) {
      if (!fs.existsSync(cwdDir)) {
        fs.mkdirSync(cwdDir, { recursive: true });
      }
      targetDir = cwdDir;
    }
  }

  const safeBaseName = (file.fieldname || "image") + "-" + Date.now() + "-" + Math.round(Math.random() * 1e9);
  const finalFilename = safeBaseName + ext;
  const filePath = path.join(targetDir, finalFilename);

  fs.writeFileSync(filePath, file.buffer);
  const webUrl = `/uploads/trips/${finalFilename}`;
  console.log("[UPLOAD] ✅ Saved to local disk:", webUrl);

  return {
    url: webUrl,
    publicId: `local_${finalFilename}`,
    size: file.size,
    filename: finalFilename,
  };
}

// ── DELETE /api/upload/photo ──
// Physically removes a file from uploads directory or Cloudinary
router.delete("/photo", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res
        .status(400)
        .json({ success: false, message: "No URL provided" });
    }

    // Cloudinary photo deletion
    if (url.startsWith("http") && url.includes("cloudinary.com")) {
      if (isCloudinaryConfigured()) {
        try {
          const match = url.match(/\/youthcamping\/trips\/([^.]+)/);
          if (match) {
            await cloudinary.uploader.destroy(`youthcamping/trips/${match[1]}`);
          }
        } catch (cErr) {
          console.warn("[DELETE PHOTO] Cloudinary destroy error:", cErr.message);
        }
      }
      return res.json({ success: true, message: "Cloudinary photo deleted" });
    }

    // Only allow deleting files from /uploads/
    if (url.startsWith("/uploads/")) {
      const fullPath = path.join(__dirname, "../../public", url);
      const cwdPath = path.join(process.cwd(), "public", url);
      const directCwd = path.join(process.cwd(), url.replace(/^\//, ""));

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`[DELETE PHOTO] ✅ Deleted: ${fullPath}`);
      } else if (fs.existsSync(cwdPath)) {
        fs.unlinkSync(cwdPath);
        console.log(`[DELETE PHOTO] ✅ Deleted: ${cwdPath}`);
      } else if (fs.existsSync(directCwd)) {
        fs.unlinkSync(directCwd);
        console.log(`[DELETE PHOTO] ✅ Deleted: ${directCwd}`);
      }
      return res.json({ success: true, message: "File deleted" });
    }

    res.json({
      success: true,
      message: "File skipped or not local",
    });
  } catch (error) {
    console.error("[DELETE PHOTO] ❌ Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/upload/single ──
// Upload a single image and return its persistent URL
router.post("/single", (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      console.error("[UPLOAD SINGLE] Multer Error:", err.message);
      return res.status(400).json({
        success: false,
        message: `Upload failed: ${err.message}`,
        error: err.code || "UPLOAD_ERROR",
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded. Ensure field name is "image"',
        });
      }

      console.log(
        "[UPLOAD SINGLE] File received:",
        req.file.originalname,
        `(${req.file.size} bytes)`
      );

      const saved = await saveUploadedFile(req.file, "youthcamping/trips");

      res.status(200).json({
        success: true,
        url: saved.url,
        size: saved.size,
        filename: saved.filename,
        publicId: saved.publicId,
      });
    } catch (innerErr) {
      console.error("[UPLOAD SINGLE] Processing Error:", innerErr.message);
      res.status(500).json({ success: false, message: innerErr.message });
    }
  });
});

// ── POST /api/upload/multiple ──
// Upload multiple images and return their persistent URLs
router.post("/multiple", (req, res) => {
  upload.array("images", 10)(req, res, async (err) => {
    if (err) {
      console.error("[UPLOAD MULTI] Multer Error:", err.message);
      return res
        .status(400)
        .json({ success: false, message: `Upload failed: ${err.message}` });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No files uploaded" });
      }

      const results = await Promise.all(
        req.files.map((file) => saveUploadedFile(file, "youthcamping/trips"))
      );

      const urls = results.map((r) => r.url);

      res.status(200).json({
        success: true,
        urls: urls,
        count: urls.length,
      });
    } catch (innerErr) {
      console.error("[UPLOAD MULTI] Processing Error:", innerErr.message);
      res.status(500).json({ success: false, message: innerErr.message });
    }
  });
});

// ── POST /api/upload/ticket ──
const ticketUpload = require("../middleware/ticketUpload");
router.post("/ticket", ticketUpload.single("ticket"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No ticket uploaded" });
  }

  const url = `/uploads/tickets/${req.file.filename}`;
  res.status(200).json({
    success: true,
    url: url,
  });
});

// ── GET /api/upload/verify ──
// Debug endpoint to check if a file exists on disk
router.get("/verify", (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res
      .status(400)
      .json({ success: false, message: "Provide ?url= parameter" });
  }

  const fullPath = path.join(__dirname, "../../public", url);
  const exists = fs.existsSync(fullPath);
  const stats = exists ? fs.statSync(fullPath) : null;

  res.json({
    success: true,
    url,
    exists,
    size: stats ? stats.size : 0,
    fullPath: exists ? fullPath : null,
  });
});

// ── POST /api/upload/video ──
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const videoStorage = multer.memoryStorage();
const videoFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = [".mp4", ".webm", ".mov"];
  if (allowed.includes(ext) || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only MP4, WebM, and MOV videos are allowed"), false);
  }
};
const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: videoFilter,
});

router.post("/video", (req, res) => {
  uploadVideo.single("video")(req, res, async (err) => {
    if (err) {
      console.error("[UPLOAD VIDEO] Multer Error:", err.message);
      return res.status(500).json({ success: false, message: err.message });
    }

    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      const isCloudinaryConfigured = !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      );
      let uploadResult;

      if (isCloudinaryConfigured) {
        uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "video",
              folder: "youthcamping/videos",
              transformation: [{ quality: "auto", fetch_format: "auto" }],
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          );
          uploadStream.end(req.file.buffer);
        });
      } else {
        // Fallback local storage
        const uploadDir = path.join(__dirname, "../../public/uploads/videos");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename =
          Date.now() + "-" + req.file.originalname.replace(/\s+/g, "-");
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, req.file.buffer);
        uploadResult = {
          secure_url: `/uploads/videos/${filename}`,
          public_id: `local_${filename}`,
        };
      }

      const videoUrl = uploadResult.secure_url;
      const publicId = uploadResult.public_id;
      const posterUrl = videoUrl.startsWith("http")
        ? videoUrl.replace(/\.[^/.]+$/, ".jpg")
        : "";

      res.status(200).json({
        success: true,
        url: videoUrl,
        publicId: publicId,
        posterUrl: posterUrl,
      });
    } catch (innerErr) {
      console.error("[UPLOAD VIDEO] Processing Error:", innerErr.message);
      res.status(500).json({ success: false, message: innerErr.message });
    }
  });
});

// ── DELETE /api/upload/video ──
router.delete("/video", async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res
        .status(400)
        .json({ success: false, message: "No public ID provided" });
    }

    if (publicId.startsWith("local_")) {
      const filename = publicId.replace(/^local_/, "");
      const filePath = path.join(
        __dirname,
        "../../public/uploads/videos",
        filename,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else {
      const isCloudinaryConfigured = !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      );
      if (isCloudinaryConfigured) {
        await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
      }
    }

    res.json({ success: true, message: "Video deleted" });
  } catch (error) {
    console.error("[DELETE VIDEO] Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
