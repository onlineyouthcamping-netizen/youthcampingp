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
    params: {
      folder: 'youthcamping/trips',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 1200, crop: 'limit' }, { fetch_format: 'auto', quality: 'auto' }]
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
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPG, PNG, WEBP allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

module.exports = upload;
