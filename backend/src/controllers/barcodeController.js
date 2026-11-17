const barcodeService = require('../services/barcodeService');
const asyncHandler = require('../utils/asyncHandler');

const lookupBarcode = asyncHandler(async (req, res) => {
  const result = await barcodeService.lookupBarcode(req.user.id, req.params.barcode);
  res.status(200).json(result);
});

module.exports = {
  lookupBarcode,
};
