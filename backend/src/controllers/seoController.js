const { prisma } = require('../lib/prisma');

// STUB: Migrating to Prisma
exports.getSeo = async (req, res) => res.json({ success: true, data: {} });
exports.updateSeo = async (req, res) => res.json({ success: true });
exports.getSitemap = async (req, res) => res.send('');
exports.getRobots = async (req, res) => res.send('');
