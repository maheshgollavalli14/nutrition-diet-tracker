const foodLogService = require('../services/foodLogService');
const asyncHandler = require('../utils/asyncHandler');

const preview = asyncHandler(async (req, res) => {
  const snapshot = await foodLogService.previewFoodLog(req.user.id, req.body);
  res.status(200).json({ snapshot });
});

const create = asyncHandler(async (req, res) => {
  const log = await foodLogService.createFoodLog(req.user, req.body);
  res.status(201).json({
    message: 'Food log recorded.',
    log,
  });
});

const getToday = asyncHandler(async (req, res) => {
  const data = await foodLogService.getLogsForDate(req.user, req.query.date);
  res.status(200).json(data);
});

const getHistory = asyncHandler(async (req, res) => {
  const data = await foodLogService.getHistory(req.user, {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 50,
  });
  res.status(200).json(data);
});

const getById = asyncHandler(async (req, res) => {
  const log = await foodLogService.getFoodLogById(req.user.id, req.params.id);
  res.status(200).json({ log });
});

const update = asyncHandler(async (req, res) => {
  const log = await foodLogService.updateFoodLog(req.user, req.params.id, req.body);
  res.status(200).json({
    message: 'Food log updated.',
    log,
  });
});

const remove = asyncHandler(async (req, res) => {
  await foodLogService.deleteFoodLog(req.user.id, req.params.id);
  res.status(200).json({
    message: 'Food log deleted.',
  });
});

module.exports = {
  preview,
  create,
  getToday,
  getHistory,
  getById,
  update,
  remove,
};
