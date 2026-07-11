const express = require('express');
const router = express.Router();

// STUB: Migrating to Prisma
router.get('/', (req, res) => res.json({ success: true, data: [] }));

module.exports = router;
