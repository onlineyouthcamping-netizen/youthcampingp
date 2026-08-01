const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const attachmentController = require('../controllers/attachmentController');

// Multer Storage setup: /uploads/attachments/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads/attachments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const nameWithoutExt = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max limit
});

// All attachment routes protected by JWT auth
router.use(protect);

router.get('/booking/:bookingId', attachmentController.getBookingAttachments);
router.post('/booking/:bookingId', upload.array('files', 10), attachmentController.uploadBookingAttachments);
router.put('/:id', upload.single('file'), attachmentController.replaceBookingAttachment);
router.patch('/:id/metadata', attachmentController.updateAttachmentMetadata);
router.delete('/:id', attachmentController.deleteBookingAttachment);
router.get('/download/:id', attachmentController.downloadBookingAttachment);
router.post('/send/booking/:bookingId', attachmentController.sendBookingAttachments);

module.exports = router;
