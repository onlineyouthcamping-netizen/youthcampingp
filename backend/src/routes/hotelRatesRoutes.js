const express = require('express');
const router = express.Router();
const hotelRatesController = require('../controllers/hotelRatesController');

router.post('/create', hotelRatesController.createRates);
router.get('/:hotel_id', hotelRatesController.getRates);
router.patch('/:rate_id', hotelRatesController.updateRate);
router.delete('/:rate_id', hotelRatesController.deleteRate);

module.exports = router;
