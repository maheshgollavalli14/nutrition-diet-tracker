const express = require('express');
const foodLogController = require('../controllers/foodLogController');
const { requireAuth } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { logPayloadRules, updateLogRules } = require('../validators/foodLogValidator');

const router = express.Router();

router.use(requireAuth);

router.post('/preview', logPayloadRules, validateRequest, foodLogController.preview);
router.get('/today', foodLogController.getToday);
router.get('/history', foodLogController.getHistory);
router.post('/', logPayloadRules, validateRequest, foodLogController.create);
router.get('/:id', foodLogController.getById);
router.put('/:id', updateLogRules, validateRequest, foodLogController.update);
router.delete('/:id', foodLogController.remove);

module.exports = router;
