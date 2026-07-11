const express = require('express');
const router = express.Router();
const { getSeo, updateSeo, getSitemap, getRobots } = require('../controllers/seoController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.get('/sitemap.xml', getSitemap);
router.get('/robots.txt', getRobots);

router.get('/:page', getSeo);
router.put('/:page', authenticate, requirePermission('seo.edit'), updateSeo);

module.exports = router;
