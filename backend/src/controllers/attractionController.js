const { prisma } = require('../lib/prisma');
const slugify = require('slugify');

/**
 * @desc    Get all attractions
 * @route   GET /api/attractions
 * @access  Public
 */
exports.getAttractions = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || 'default';
    const attractions = await prisma.attraction.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' }
    });
    res.json({ success: true, data: attractions });
  } catch (error) {
    console.error('Error fetching attractions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single attraction by slug
 * @route   GET /api/attractions/slug/:slug
 * @access  Public
 */
exports.getAttractionBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const tenantId = req.user?.tenantId || 'default';
    const attraction = await prisma.attraction.findFirst({
      where: { slug, tenantId }
    });
    if (!attraction) {
      return res.status(404).json({ success: false, message: 'Attraction not found' });
    }
    res.json({ success: true, data: attraction });
  } catch (error) {
    console.error('Error fetching attraction by slug:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create new attraction
 * @route   POST /api/attractions
 * @access  Private/Admin
 */
exports.createAttraction = async (req, res, next) => {
  try {
    const data = { ...req.body };
    const tenantId = req.user?.tenantId || 'default';

    if (!data.slug && data.name) {
      data.slug = slugify(data.name, { lower: true, strict: true });
    }

    const attraction = await prisma.attraction.create({
      data: {
        ...data,
        tenantId
      }
    });

    res.status(201).json({ success: true, data: attraction });
  } catch (error) {
    console.error('Error creating attraction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update attraction
 * @route   PUT /api/attractions/:id
 * @access  Private/Admin
 */
exports.updateAttraction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    
    delete data.id;
    delete data.tenantId;

    const attraction = await prisma.attraction.update({
      where: { id },
      data
    });

    res.json({ success: true, data: attraction });
  } catch (error) {
    console.error('Error updating attraction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete attraction
 * @route   DELETE /api/attractions/:id
 * @access  Private/Admin
 */
exports.deleteAttraction = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.attraction.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Attraction deleted' });
  } catch (error) {
    console.error('Error deleting attraction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
