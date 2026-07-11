const { prisma } = require('../lib/prisma');

// STUB: Migrating to Prisma
exports.getFormStructure = async (req, res) => res.json({ success: true, data: { fields: [] } });
exports.submitFormData = async (req, res) => res.json({ success: true });
exports.saveFormConfig = async (req, res) => res.json({ success: true });
exports.getForms = async (req, res) => res.json({ success: true, data: [] });
