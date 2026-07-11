const express = require('express');
const router = express.Router();
const { 
  getSettings, 
  getPublicSettings,
  updateSettings, 
  getDraftSettings,
  uploadHeroVideo,
  deleteHeroVideo,
  toggleHeroVideo,
  getFooterSettings,
  updateFooterSettings
} = require('../controllers/settingsController');
const { authenticate, requirePermission } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const videoFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.mp4', '.webm', '.mov'];
  const allowedMime = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (allowedExts.includes(ext) || allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, WebM, and MOV are allowed.'), false);
  }
};
const uploadVideo = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: videoFilter
});

router.get('/public', getPublicSettings);
router.get('/footer', authenticate, requirePermission('settings.view'), getFooterSettings);
router.put('/footer', authenticate, requirePermission('settings.edit'), updateFooterSettings);
router.get('/', authenticate, requirePermission('settings.view'), getSettings);
router.put('/', authenticate, requirePermission('settings.edit'), updateSettings);
router.get('/draft', authenticate, requirePermission('settings.view'), getDraftSettings);

// Hero Video management routes
router.post('/hero-video', authenticate, requirePermission('settings.edit'), uploadVideo.single('video'), uploadHeroVideo);
router.delete('/hero-video', authenticate, requirePermission('settings.edit'), deleteHeroVideo);
router.patch('/hero-video/toggle', authenticate, requirePermission('settings.edit'), toggleHeroVideo);

module.exports = router;
