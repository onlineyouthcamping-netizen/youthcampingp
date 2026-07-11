const express = require('express');
const router = express.Router();
const {
  getReviews,
  getPublicReviewCards,
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/public/cards', getPublicReviewCards);
router.get('/', protect, getReviews);
router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
