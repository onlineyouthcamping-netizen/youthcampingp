import express from 'express';
import { getUserProfile, getUserBookings } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/me', protect, getUserProfile);
router.get('/bookings', protect, getUserBookings);

export default router;
