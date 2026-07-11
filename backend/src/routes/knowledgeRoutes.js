const express = require('express');
const router = express.Router();
const {
  getNavState,
  saveNavState,
  getSections,
  getNotices,
  searchKnowledge,
  upsertSection,
  createNotice
} = require('../controllers/knowledgeController');
const { protect } = require('../middleware/auth');

router.get('/nav-state', protect, getNavState);
router.post('/nav-state', protect, saveNavState);
router.get('/sections/:tripId', protect, getSections);
router.get('/notices/:tripId', protect, getNotices);
router.post('/sections', protect, upsertSection);
router.post('/notices', protect, createNotice);
router.get('/search', protect, searchKnowledge);


module.exports = router;
