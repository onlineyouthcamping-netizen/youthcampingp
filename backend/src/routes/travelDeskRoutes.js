const express = require('express');
const router = express.Router();
const controller = require('../controllers/travelDeskController');
const { protect } = require('../middleware/auth');

// ── TAB 2: TICKETING ──
router.get('/ticketing/:tripId', protect, controller.getTicketing);
router.post('/ticketing/sops', protect, controller.createTicketingSop);
router.put('/ticketing/sops/:id', protect, controller.updateTicketingSop);
router.delete('/ticketing/sops/:id', protect, controller.deleteTicketingSop);
router.post('/ticketing/links', protect, controller.createTicketingLink);
router.put('/ticketing/links/:id', protect, controller.updateTicketingLink);
router.delete('/ticketing/links/:id', protect, controller.deleteTicketingLink);

// ── TAB 3: ITINERARY ──
router.get('/itineraries/:tripId', protect, controller.getItineraries);
router.post('/itineraries', protect, controller.createItinerary);
router.post('/itineraries/:id/duplicate', protect, controller.duplicateItinerary);
router.put('/itineraries/:id', protect, controller.updateItinerary);
router.delete('/itineraries/:id', protect, controller.deleteItinerary);
router.put('/itineraries/:id/default', protect, controller.setDefaultItinerary);

// ── TAB 4: SOPs ──
router.get('/sops/:tripId', protect, controller.getSops);
router.post('/sops', protect, controller.createSop);
router.put('/sops/:id', protect, controller.updateSop);
router.delete('/sops/:id', protect, controller.deleteSop);

// ── TAB 5: DOCUMENTS ──
router.get('/documents/:tripId', protect, controller.getDocuments);
router.post('/documents', protect, controller.createDocument);
router.delete('/documents/:id', protect, controller.deleteDocument);

// ── TAB 7: GALLERY ──
router.get('/gallery/:tripId', protect, controller.getGallery);
router.post('/gallery', protect, controller.createGalleryItem);
router.delete('/gallery/:id', protect, controller.deleteGalleryItem);

// ── TAB 8: NOTES & UPDATES ──
router.get('/notes/:tripId', protect, controller.getNotes);
router.post('/notes', protect, controller.createNote);
router.put('/notes/:id', protect, controller.updateNote);
router.delete('/notes/:id', protect, controller.deleteNote);

module.exports = router;
