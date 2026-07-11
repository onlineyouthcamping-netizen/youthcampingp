import express from 'express';
import { createBookingFromInquiry, getBookings, getMyBookings, getBookingById, updateBooking, deleteBooking } from '../controllers/bookingController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/me', protect, getMyBookings);
router.post('/', protect, createBookingFromInquiry);
router.get('/', protect, getBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id', protect, adminOnly, updateBooking);
router.delete('/:id', protect, adminOnly, deleteBooking);

export default router;
