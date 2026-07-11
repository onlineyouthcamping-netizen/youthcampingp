const express = require('express');
const router = express.Router();
const attractionController = require('../controllers/attractionController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.get('/', attractionController.getAttractions);
router.get('/slug/:slug', attractionController.getAttractionBySlug);
router.post('/', authenticate, requirePermission('trips.create'), attractionController.createAttraction);
router.put('/:id', authenticate, requirePermission('trips.edit'), attractionController.updateAttraction);
router.delete('/:id', authenticate, requirePermission('trips.delete'), attractionController.deleteAttraction);

module.exports = router;
