const express = require('express');
const router = express.Router();
const {
  getPublishedPages,
  getAllPages,
  getPageBySlug,
  createPage,
  updatePage,
  softDeletePage,
  getPublicSettings,
  getAllSettings,
  upsertSetting,
} = require('../controllers/websiteController');
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  validateCreatePage,
  validateUpdatePage,
  validateUpsertSetting,
} = require('../validators/websiteValidators');

// ── Admin routes — MUST be before parameterized public routes ────────
router.get('/pages/all', authenticate, requirePermission('settings.view'), getAllPages);
router.get('/settings/all', authenticate, requirePermission('settings.view'), getAllSettings);

// ── Public routes (no auth) ─────────────────────────────────────────
router.get('/pages', getPublishedPages);
router.get('/pages/:slug', getPageBySlug);
router.get('/settings', getPublicSettings);

// ── Admin mutation routes (auth + permission) ───────────────────────
router.post('/pages', authenticate, requirePermission('settings.edit'), validateCreatePage, createPage);
router.patch('/pages/:id', authenticate, requirePermission('settings.edit'), validateUpdatePage, updatePage);
router.delete('/pages/:id', authenticate, requirePermission('settings.edit'), softDeletePage);
router.patch('/settings/:key', authenticate, requirePermission('settings.edit'), validateUpsertSetting, upsertSetting);

module.exports = router;
