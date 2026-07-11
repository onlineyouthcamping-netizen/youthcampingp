const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const allowedOrigins = [
  'https://youthcamping.online',
  'https://www.youthcamping.online',
  'https://admin.youthcamping.online'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalized) || /\.vercel\.app$/i.test(normalized) || /^https?:\/\/localhost(:\d+)?$/i.test(normalized) || /patelparth3315/i.test(normalized)) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// Register CORS explicitly at the router level
router.use(cors(corsOptions));
router.options('*', cors(corsOptions));

// ── DELETE /api/upload/photo ──
// Physically removes a file from uploads directory
router.delete('/photo', (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'No URL provided' });
    }

    // Only allow deleting files from /uploads/
    if (!url.startsWith('/uploads/')) {
      return res.status(400).json({ success: false, message: 'Invalid file path - must start with /uploads/' });
    }

    const fullPath = path.join(__dirname, '../../public', url);
    console.log(`[DELETE PHOTO] Attempting to delete: ${fullPath}`);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[DELETE PHOTO] ✅ Deleted: ${fullPath}`);
      res.json({ success: true, message: 'File deleted' });
    } else {
      console.log(`[DELETE PHOTO] ⚠️ File not found (already deleted?): ${fullPath}`);
      res.json({ success: true, message: 'File not found (may already be deleted)' });
    }
  } catch (error) {
    console.error('[DELETE PHOTO] ❌ Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/upload/single ──
// Upload a single image and return its persistent URL
router.post('/single', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('[UPLOAD SINGLE] Multer/Cloudinary Error:', err.message);
      return res.status(500).json({ 
        success: false, 
        message: `Upload failed: ${err.message}`,
        error: err.code || 'UPLOAD_ERROR'
      });
    }

    try {
      console.log('[UPLOAD SINGLE] File received:', req.file ? (req.file.originalname || 'Yes') : 'NONE');
      if (req.body) console.log('[UPLOAD SINGLE] Body:', JSON.stringify(req.body));

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded. Ensure field name is "image"' });
      }

      let url = req.file.path;
      
      // If it's a local file (not a Cloudinary URL), normalize it to a relative web path
      if (!url.startsWith('http')) {
        // Multer diskStorage path looks like "public/uploads/trips/image-..."
        // We want "/uploads/trips/image-..."
        url = '/' + url.replace(/\\/g, '/').replace(/^public\//, '');
      }

      if (!url) {
        throw new Error('File processing failed - no URL generated');
      }

      console.log('[UPLOAD SINGLE] ✅ Success:', url);

      res.status(200).json({
        success: true,
        url: url,
        size: req.file.size,
        filename: req.file.filename || req.file.originalname
      });
    } catch (innerErr) {
      console.error('[UPLOAD SINGLE] Processing Error:', innerErr.message);
      res.status(500).json({ success: false, message: innerErr.message });
    }
  });
});

// ── POST /api/upload/multiple ──
// Upload multiple images and return their persistent URLs
router.post('/multiple', (req, res) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      console.error('[UPLOAD MULTI] Multer/Cloudinary Error:', err.message);
      return res.status(500).json({ success: false, message: `Upload failed: ${err.message}` });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      const urls = [];
      for (const file of req.files) {
        let url = file.path;
        if (url) {
          // Local path normalization
          if (!url.startsWith('http')) {
            url = '/' + url.replace(/\\/g, '/').replace(/^public\//, '');
          }
          urls.push(url);
          console.log(`[UPLOAD MULTI] ✅ Success: ${url}`);
        }
      }

      res.status(200).json({
        success: true,
        urls: urls,
        count: urls.length
      });
    } catch (innerErr) {
      console.error('[UPLOAD MULTI] Processing Error:', innerErr.message);
      res.status(500).json({ success: false, message: innerErr.message });
    }
  });
});

// ── POST /api/upload/ticket ──
const ticketUpload = require('../middleware/ticketUpload');
router.post('/ticket', ticketUpload.single('ticket'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No ticket uploaded' });
  }

  const url = `/uploads/tickets/${req.file.filename}`;
  res.status(200).json({
    success: true,
    url: url
  });
});

// ── GET /api/upload/verify ──
// Debug endpoint to check if a file exists on disk
router.get('/verify', (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ success: false, message: 'Provide ?url= parameter' });
  }

  const fullPath = path.join(__dirname, '../../public', url);
  const exists = fs.existsSync(fullPath);
  const stats = exists ? fs.statSync(fullPath) : null;

  res.json({
    success: true,
    url,
    exists,
    size: stats ? stats.size : 0,
    fullPath: exists ? fullPath : null
  });
});

// ── POST /api/upload/video ──
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const videoStorage = multer.memoryStorage();
const videoFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ['.mp4', '.webm', '.mov'];
  if (allowed.includes(ext) || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only MP4, WebM, and MOV videos are allowed'), false);
  }
};
const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: videoFilter
});

router.post('/video', (req, res) => {
  uploadVideo.single('video')(req, res, async (err) => {
    if (err) {
      console.error('[UPLOAD VIDEO] Multer Error:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
      let uploadResult;

      if (isCloudinaryConfigured) {
        uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              folder: 'youthcamping/videos',
              transformation: [{ quality: 'auto', fetch_format: 'auto' }]
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
      } else {
        // Fallback local storage
        const uploadDir = path.join(__dirname, '../../public/uploads/videos');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = Date.now() + '-' + req.file.originalname.replace(/\s+/g, '-');
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, req.file.buffer);
        uploadResult = {
          secure_url: `/uploads/videos/${filename}`,
          public_id: `local_${filename}`
        };
      }

      const videoUrl = uploadResult.secure_url;
      const publicId = uploadResult.public_id;
      const posterUrl = videoUrl.startsWith('http') 
        ? videoUrl.replace(/\.[^/.]+$/, '.jpg') 
        : '';

      res.status(200).json({
        success: true,
        url: videoUrl,
        publicId: publicId,
        posterUrl: posterUrl
      });
    } catch (innerErr) {
      console.error('[UPLOAD VIDEO] Processing Error:', innerErr.message);
      res.status(500).json({ success: false, message: innerErr.message });
    }
  });
});

// ── DELETE /api/upload/video ──
router.delete('/video', async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'No public ID provided' });
    }

    if (publicId.startsWith('local_')) {
      const filename = publicId.replace(/^local_/, '');
      const filePath = path.join(__dirname, '../../public/uploads/videos', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else {
      const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
      if (isCloudinaryConfigured) {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      }
    }

    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    console.error('[DELETE VIDEO] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
