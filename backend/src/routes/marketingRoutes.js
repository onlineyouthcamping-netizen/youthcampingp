const express = require('express');
const { 
  getOverview, 
  getContentStudio, 
  createIdea, 
  updateIdea,
  deleteIdea,
  getCampaigns, 
  getLearnings, 
  getAssets, 
  getReports 
} = require('../controllers/marketingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/overview', getOverview);
router.get('/content-studio', getContentStudio);
router.post('/content-studio/idea', createIdea);
router.put('/content-studio/idea/:id', updateIdea);
router.delete('/content-studio/idea/:id', deleteIdea);
router.get('/campaigns', getCampaigns);
router.get('/learnings/:campaignId?', getLearnings);
router.get('/assets/:campaignId?', getAssets);
router.get('/reports', getReports);

module.exports = router;
