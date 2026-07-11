const express = require('express');
const router = express.Router();
const { register, login, getMe, getAllUsers, updateUserRole, sendOTP, verifyOTP } = require('../controllers/userController');
const { getMyBookings } = require('../controllers/bookingController');
const { authenticate, protectUser, requirePermission } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/otp/send', sendOTP);
router.post('/otp/verify', verifyOTP);
router.get('/me', protectUser, getMe);
router.get('/bookings', protectUser, getMyBookings);

// Admin only routes for standard users
router.get('/', authenticate, requirePermission('users.view'), getAllUsers);
router.patch('/:id/role', authenticate, requirePermission('users.manage'), updateUserRole);

module.exports = router;
