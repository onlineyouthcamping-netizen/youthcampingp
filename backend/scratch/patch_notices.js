exports.getWorkspaceNotices = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const workspace = await prisma.travelDeskWorkspace.findUnique({ where: { tripId } });
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    
    const notices = await prisma.travelDeskNotice.findMany({
      where: { workspaceId: workspace.id, status: 'ACTIVE' },
      orderBy: { publishedAt: 'desc' },
      take: 10
    });
    
    res.json({ success: true, data: notices });
  } catch (e) {
    next(e);
  }
};
