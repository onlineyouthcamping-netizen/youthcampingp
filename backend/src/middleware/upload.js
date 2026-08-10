const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("[UPLOAD] ✅ Cloudinary configured");
} else {
  console.warn(
    "[UPLOAD] ⚠️ Cloudinary credentials missing or partial. Local disk storage fallback is active."
  );
}

const fileFilter = (req, file, cb) => {
  const allowedImages = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/gif",
    "image/svg+xml",
    "image/avif",
    "image/heic",
    "image/heif",
    "image/bmp",
    "image/tiff",
  ];
  const allowedVideos = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/ogg",
    "video/x-msvideo",
    "video/mov",
    "video/avi",
    "video/mkv",
  ];

  const mime = (file.mimetype || "").toLowerCase();
  const ext = path.extname(file.originalname || "").toLowerCase();
  const allowedExts = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".svg",
    ".avif",
    ".heic",
    ".heif",
    ".bmp",
    ".tiff",
    ".mp4",
    ".webm",
    ".mov",
    ".ogg",
    ".avi",
    ".mkv",
  ];

  const isVideo =
    allowedVideos.includes(mime) ||
    mime.startsWith("video/") ||
    [".mp4", ".webm", ".mov", ".ogg", ".avi", ".mkv"].includes(ext);
  const isImage =
    allowedImages.includes(mime) ||
    mime.startsWith("image/") ||
    [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".svg",
      ".avif",
      ".heic",
      ".heif",
      ".bmp",
      ".tiff",
    ].includes(ext);

  if (isImage || isVideo || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype || ext}. Allowed image & video formats only.`
      ),
      false
    );
  }
};

// Use memoryStorage for reliable streaming to Cloudinary and safe fallback to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter,
});

module.exports = upload;

