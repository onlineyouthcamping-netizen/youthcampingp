const express = require('express');
const router = express.Router();
const designController = require('../controllers/designController');
const { protect, requirePermission, requireRole } = require('../middleware/auth');

// Public (merged config for frontend)
router.get('/config/:scope/merged', designController.getMergedConfig);

// Protected routes
router.get('/config/:scope', protect, requirePermission('design.view'), designController.getConfig);
router.put('/config/:scope/draft', protect, requirePermission('design.edit'), designController.saveDraft);
router.post('/config/:scope/publish', protect, requirePermission('design.publish'), designController.publishConfig);
router.post('/config/:scope/discard', protect, requirePermission('design.edit'), designController.discardDraft);

// Version history
router.get('/versions/:scope', protect, requirePermission('design.view'), designController.getVersions);
router.post('/versions/:id/restore', protect, requireRole('superadmin'), designController.restoreVersion);
router.get('/versions/:id/compare', protect, requirePermission('design.view'), designController.compareVersions);

// Presets
router.get('/presets', protect, requirePermission('design.view'), designController.getPresets);
router.post('/presets', protect, requirePermission('design.edit'), designController.savePreset);
router.delete('/presets/:id', protect, requireRole('superadmin'), designController.deletePreset);
router.post('/presets/:id/apply', protect, requirePermission('design.edit'), designController.applyPreset);

module.exports = router;
