const express = require('express');
const { getBlogs, getPublicBlogCards, getPublicBlogDetail, getBlog, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const { protect } = require('../middleware/auth');
const { validate, createBlogSchema } = require('../validators');

const router = express.Router();

router.get('/public/cards', getPublicBlogCards);
router.get('/public/slug/:slug', getPublicBlogDetail);

router.route('/')
  .get(protect, getBlogs)
  .post(protect, validate(createBlogSchema), createBlog);

router.route('/:id')
  .get(protect, getBlog)
  .put(protect, updateBlog)
  .delete(protect, deleteBlog);

module.exports = router;
