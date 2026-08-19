const notImplemented = (_req, res) =>
  res.status(501).json({
    success: false,
    message: "Dynamic forms module is not yet migrated to Prisma",
  });

exports.getFormStructure = notImplemented;
exports.submitFormData = notImplemented;
exports.saveFormConfig = notImplemented;
exports.getForms = notImplemented;
