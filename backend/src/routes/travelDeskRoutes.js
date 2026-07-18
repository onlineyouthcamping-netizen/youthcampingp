const express = require('express');
const router = express.Router();
const controller = require('../controllers/travelDeskController');
const coreController = require('../controllers/travelDeskCoreController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const contentController = require('../controllers/travelDeskContentController');
const { validateSop, validateTicketingSop, validateTicketingLink, validateItinerary } = require('../middleware/travelDeskValidators');

// ── TAB 1: WORKSPACE & TRIPS (Stage 2) ──
router.get('/trips', protect, coreController.getTravelDeskTrips);
router.post('/workspaces/feed', protect, coreController.feedWorkspaces);
router.get('/workspaces/:tripId', protect, coreController.getWorkspace);
router.get('/:tripId/overview', protect, coreController.getTripOverview);
router.get('/:tripId/itinerary', protect, coreController.getOfficialItinerary);
router.get('/:tripId/departures', protect, coreController.getDepartures);
router.get('/:tripId/vendors', protect, coreController.getVendors);
router.post('/:tripId/vendors/link', protect, coreController.linkVendor);
router.delete('/:tripId/vendors/:linkId', protect, coreController.unlinkVendor);
router.get('/:tripId/readiness', protect, coreController.getReadiness);

// ── ARTICLES & CONTENT MANAGEMENT (Stage 4) ──
router.get('/:tripId/articles', protect, contentController.getArticles);
router.post('/:tripId/articles', protect, contentController.createArticle);
router.patch('/:tripId/articles/:articleId', protect, contentController.updateArticle);
router.post('/:tripId/articles/:articleId/request-changes', protect, contentController.requestChangesArticle);
router.patch('/:tripId/articles/:articleId/status', protect, contentController.changeArticleStatus);

// ── APPROVAL CENTER ──
router.get('/:tripId/approvals', protect, contentController.getPendingApprovals);

// ── TAB 2: TICKETING ──
router.get('/ticketing/:tripId', protect, controller.getTicketing);
router.post('/ticketing/sops', protect, validateTicketingSop, controller.createTicketingSop);
router.put('/ticketing/sops/:id', protect, validateTicketingSop, controller.updateTicketingSop);
router.delete('/ticketing/sops/:id', protect, controller.deleteTicketingSop);
router.post('/ticketing/links', protect, validateTicketingLink, controller.createTicketingLink);
router.put('/ticketing/links/:id', protect, validateTicketingLink, controller.updateTicketingLink);
router.delete('/ticketing/links/:id', protect, controller.deleteTicketingLink);

// ── TAB 3: ITINERARY ──
router.get('/itineraries/:tripId', protect, controller.getItineraries);
router.post('/itineraries', protect, validateItinerary, controller.createItinerary);
router.post('/itineraries/:id/duplicate', protect, controller.duplicateItinerary);
router.put('/itineraries/:id', protect, validateItinerary, controller.updateItinerary);
router.delete('/itineraries/:id', protect, controller.deleteItinerary);
router.put('/itineraries/:id/default', protect, controller.setDefaultItinerary);

// ── TAB 4: SOPs ──
router.get('/sops/:tripId', protect, controller.getSops);
router.post('/sops', protect, validateSop, controller.createSop);
router.put('/sops/:id', protect, validateSop, controller.updateSop);
router.delete('/sops/:id', protect, controller.deleteSop);

// ── TAB 5: DOCUMENTS ──
router.get('/documents/:id/view', controller.viewDocumentInline);
router.get('/documents/:tripId', protect, controller.getDocuments);
router.post('/documents/upload', protect, upload.array('files'), controller.uploadDocuments);
router.patch('/documents/:id', protect, controller.updateDocumentMetadata);
router.put('/documents/:id/status', protect, controller.reviewDocument);
router.delete('/documents/:id', protect, controller.deleteDocument);

// ── TAB 7: GALLERY ──
router.get('/gallery/:tripId', protect, controller.getGallery);
router.post('/gallery', protect, upload.array('files'), controller.createGalleryItem);
router.delete('/gallery/:id', protect, controller.deleteGalleryItem);

// ── TAB 8: NOTES & UPDATES ──
router.get('/notes/:tripId', protect, controller.getNotes);
router.post('/notes', protect, controller.createNote);
router.put('/notes/:id', protect, controller.updateNote);
router.delete('/notes/:id', protect, controller.deleteNote);

// ── KNOWLEDGE BASE ITEMS ──
router.get('/knowledge-items/:tripId', protect, controller.getKnowledgeItems);
router.put('/knowledge-items/:id', protect, controller.updateKnowledgeItem);

// ── TRAVEL AI ──
router.post('/ai/chat', protect, controller.travelAiChat);

// ── ESCALATED QUESTIONS ──
router.get('/questions/:tripId', protect, controller.getEscalatedQuestions);
router.post('/questions', protect, controller.createEscalatedQuestion);
router.put('/questions/:id/answer', protect, controller.answerEscalatedQuestion);

// ── TRIP NOTICES & UPDATES ACKS ──
router.get('/:tripId/activity-log', protect, controller.getActivityLog);
router.get('/:tripId/notices', protect, contentController.getWorkspaceNotices);
router.post('/notices/:id/acknowledge', protect, contentController.acknowledgeNotice);
router.get('/notices/:id/acks', protect, controller.getNoticeAcks);

// ── SALES RECORD GENERATION ──
router.post('/create-record', protect, controller.createSalesRecord);
router.post('/bulk-trips', protect, controller.bulkCreateTrips);

module.exports = router;

