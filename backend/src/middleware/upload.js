const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (!isCloudinaryConfigured) {
  console.warn('⚠️  Cloudinary is not fully configured. The following variables are missing:');
  if (!process.env.CLOUDINARY_CLOUD_NAME) console.warn('   - CLOUDINARY_CLOUD_NAME');
  if (!process.env.CLOUDINARY_API_KEY) console.warn('   - CLOUDINARY_API_KEY');
  if (!process.env.CLOUDINARY_API_SECRET) console.warn('   - CLOUDINARY_API_SECRET');
  console.warn('   Fallback to local storage may be needed if production keys are not set in Render/Vercel.');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

let storage;
if (isCloudinaryConfigured) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const isVideo = file.mimetype.startsWith('video/');
      return {
        folder: 'youthcamping/trips',
        resource_type: isVideo ? 'video' : 'image',
        allowed_formats: isVideo ? ['mp4', 'webm', 'mov', 'ogg'] : ['jpg', 'png', 'jpeg', 'webp', 'gif'],
      };
    }
  });
  console.log('[UPLOAD] ✅ Cloudinary Storage configured and active');
} else {
  console.warn('[UPLOAD] ⚠️ Falling back to LOCAL DISK STORAGE because Cloudinary is not configured');
  const os = require('os');
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'public/uploads/trips';
      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      } catch (err) {
        console.error('[UPLOAD] ❌ Failed to create public upload directory, using system temp fallback:', err.message);
        const tempDir = path.join(os.tmpdir(), 'youthcamping-uploads');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const fileFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/svg+xml'];
  const allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/x-msvideo', 'video/mov'];
  const isVideo = allowedVideos.includes(file.mimetype) || file.mimetype.startsWith('video/');
  const isImage = allowedImages.includes(file.mimetype) || file.mimetype.startsWith('image/');

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: JPG, PNG, WEBP, GIF, MP4, WEBM, MOV.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos and images
  fileFilter
});

module.exports = upload;
