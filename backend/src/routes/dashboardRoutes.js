const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/summary', dashboardController.getDashboardSummary);
router.get('/daily', dashboardController.getDailySummary);
router.get('/weekly', dashboardController.getWeeklySummary);

module.exports = router;
