const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement } = require('../controllers/announcementController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, getAnnouncements);
router.post('/', authenticate, requireRole('admin', 'superadmin'), createAnnouncement);

module.exports = router;
