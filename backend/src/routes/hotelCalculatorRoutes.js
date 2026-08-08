const express = require('express');
const router = express.Router();
const hotelCalculatorController = require('../controllers/hotelCalculatorController');

router.post('/compute', hotelCalculatorController.computeCost);
router.post('/bulk-calculate', hotelCalculatorController.bulkCalculate);

module.exports = router;
