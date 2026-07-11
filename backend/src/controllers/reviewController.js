const { prisma } = require('../lib/prisma');

exports.getReviews = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || 'default';
    const where = { tenantId };

    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    if (!isAdmin) {
      where.isActive = true;
    } else {
      if (req.query.status === 'active') {
        where.isActive = true;
      } else if (req.query.status === 'pending') {
        where.isActive = false;
      }
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * Public review-card data. Photos are retained because the existing review card
 * and modal actively render them; internal tenant and activity metadata is omitted.
 */
exports.getPublicReviewCards = async (req, res, next) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const take = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(requestedLimit, 100))
      : undefined;
    const reviews = await prisma.review.findMany({
      where: { tenantId: 'default', isActive: true },
      select: {
        id: true,
        userName: true,
        instagram: true,
        city: true,
        tripName: true,
        tripType: true,
        userImage: true,
        comment: true,
        rating: true,
        photos: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=600');
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    if (!isAdmin) {
      updateData.isActive = false;
    }

    const review = await prisma.review.create({
      data: { ...updateData, tenantId: req.user?.tenantId || 'default' }
    });
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error('🔥 [REVIEW CREATE ERROR]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    console.log('🔄 Updating Review:', req.params.id);
    console.log('📦 Data:', JSON.stringify(req.body, null, 2));

    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const review = await prisma.review.updateMany({
      where: { id: req.params.id, tenantId: req.user?.tenantId || 'default' },
      data: updateData
    });

    if (review.count === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review updated' });
  } catch (error) {
    console.error('🔥 [REVIEW UPDATE ERROR]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const result = await prisma.review.deleteMany({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (result.count === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};
