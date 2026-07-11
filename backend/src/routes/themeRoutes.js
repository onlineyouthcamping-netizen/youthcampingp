const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController');
const { protect, requirePermission } = require('../middleware/auth');

// Public
router.get('/public', themeController.getPublicTheme);
router.get('/', themeController.getTheme);

// Admin protected
router.post('/', protect, requirePermission('settings.edit'), themeController.updateTheme);
router.post('/reset', protect, requirePermission('settings.edit'), themeController.resetTheme);

// Presets
router.get('/presets', protect, requirePermission('settings.view'), themeController.getPresets);
router.post('/presets', protect, requirePermission('settings.edit'), themeController.savePreset);
router.delete('/presets/:name', protect, requirePermission('settings.edit'), themeController.deletePreset);
router.post('/presets/:name/apply', protect, requirePermission('settings.edit'), themeController.applyPreset);

module.exports = router;
