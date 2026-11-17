const express = require('express');
const barcodeController = require('../controllers/barcodeController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/:barcode', barcodeController.lookupBarcode);

module.exports = router;
