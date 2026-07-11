const { prisma } = require('../lib/prisma');

exports.getAnnouncements = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || 'default';
    const announcements = await prisma.announcement.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    res.json({ success: true, data: announcements });
  } catch (error) {
    next(error);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || 'default';
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    
    // Query admin name
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
      select: { name: true }
    });
    const author = admin?.name || 'Admin';

    const announcement = await prisma.announcement.create({
      data: {
        tenantId,
        title,
        author
      }
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
};
