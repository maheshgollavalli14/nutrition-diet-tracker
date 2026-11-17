const express = require('express');
const goalController = require('../controllers/goalController');
const { requireAuth } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { updateGoalsRules } = require('../validators/goalValidator');

const router = express.Router();

router.use(requireAuth);

router.get('/', goalController.getGoals);
router.put('/', updateGoalsRules, validateRequest, goalController.updateGoals);

module.exports = router;
