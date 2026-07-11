const express = require('express');
const router = express.Router();
const {
  createInquiry,
  getInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry
} = require('../controllers/inquiryController');
const { authenticate, requirePermission, enforceOwnership } = require('../middleware/auth');
const { validate, createInquirySchema } = require('../validators');

// Public route: client submissions
router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, validate(createInquirySchema), createInquiry);

// Admin routes gated by permissions and ownership
router.get('/', authenticate, requirePermission('inquiries.view'), getInquiries);
router.get('/:id', authenticate, requirePermission('inquiries.view'), enforceOwnership('inquiry'), getInquiry);
router.patch('/:id/status', authenticate, requirePermission('inquiries.edit'), enforceOwnership('inquiry'), updateInquiryStatus);
router.delete('/:id', authenticate, requirePermission('inquiries.edit'), enforceOwnership('inquiry'), deleteInquiry);

module.exports = router;
