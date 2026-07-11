import express from 'express';
import { getTrips, getTripBySlug, getTripById, createTrip, updateTrip, deleteTrip } from '../controllers/tripController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getTrips);
router.get('/:slug', getTripBySlug);
router.post('/', protect, adminOnly, createTrip);

// Routes with ID parameter (must be after slug to avoid conflicts)
router.get('/id/:id', getTripById);
router.put('/:id', protect, adminOnly, updateTrip);
router.delete('/:id', protect, adminOnly, deleteTrip);

export default router;
