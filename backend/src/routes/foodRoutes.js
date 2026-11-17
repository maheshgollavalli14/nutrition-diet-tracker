const express = require('express');
const foodController = require('../controllers/foodController');
const { requireAuth } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { createFoodRules } = require('../validators/foodValidator');

const router = express.Router();

router.use(requireAuth);

router.get('/', foodController.listFoods);
router.get('/search', foodController.listFoods);
router.get('/:id', foodController.getFoodById);
router.post('/', createFoodRules, validateRequest, foodController.createFood);

module.exports = router;
