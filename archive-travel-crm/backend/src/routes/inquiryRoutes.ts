import express from 'express';
import { submitInquiry, getInquiries, updateInquiry, getMyInquiries } from '../controllers/inquiryController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();
 
router.post('/', submitInquiry);
router.get('/me', protect, getMyInquiries);
router.get('/', protect, getInquiries);
router.patch('/:id', protect, updateInquiry);
 
export default router;
