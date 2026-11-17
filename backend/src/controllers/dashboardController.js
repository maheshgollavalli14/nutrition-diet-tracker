const summaryService = require('../services/summaryService');
const asyncHandler = require('../utils/asyncHandler');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await summaryService.getDashboardSummary(req.user, req.query.date);
  res.status(200).json(summary);
});

const getDailySummary = asyncHandler(async (req, res) => {
  const summary = await summaryService.getDailySummary(req.user, req.query.date);
  res.status(200).json(summary);
});

const getWeeklySummary = asyncHandler(async (req, res) => {
  const summary = await summaryService.getWeeklySummary(req.user, req.query.date);
  res.status(200).json(summary);
});

module.exports = {
  getDashboardSummary,
  getDailySummary,
  getWeeklySummary,
};
