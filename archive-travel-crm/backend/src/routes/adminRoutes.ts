import express from 'express';
import { getAdminStats } from '../controllers/dashboardController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/stats', protect, adminOnly, getAdminStats);

export default router;
