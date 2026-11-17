const foodLogModel = require('../models/foodLogModel');
const goalService = require('./goalService');
const { calculateGoalProgress, round2, sumLogs } = require('../utils/nutritionCalculator');
const {
  normalizeTimeZone,
  formatLocalDate,
  parseStrictDateString,
  addDaysToDateString,
  getUtcRangeForLocalDate,
  getUtcRangeForLocalDateSpan,
  toMysqlUtcDatetime,
} = require('../utils/dateUtils');

function buildMacroBreakdown(totals) {
  const carbCalories = round2(totals.carbohydrates * 4);
  const proteinCalories = round2(totals.protein * 4);
  const fatCalories = round2(totals.fat * 9);
  const totalMacroCalories = carbCalories + proteinCalories + fatCalories;

  return {
    carbCalories,
    proteinCalories,
    fatCalories,
    carbsPercent: totalMacroCalories > 0 ? round2((carbCalories / totalMacroCalories) * 100) : 0,
    proteinPercent: totalMacroCalories > 0 ? round2((proteinCalories / totalMacroCalories) * 100) : 0,
    fatPercent: totalMacroCalories > 0 ? round2((fatCalories / totalMacroCalories) * 100) : 0,
  };
}

async function getDailySummary(user, dateStr) {
  const tz = normalizeTimeZone(user.timezone);
  const targetDate = dateStr || formatLocalDate(new Date(), tz);
  parseStrictDateString(targetDate);

  const { startUtc, endUtc } = getUtcRangeForLocalDate(targetDate, tz);

  const [logs, goal] = await Promise.all([
    foodLogModel.findByUserIdInRange(
      user.id,
      toMysqlUtcDatetime(startUtc),
      toMysqlUtcDatetime(endUtc),
      { order: 'DESC' }
    ),
    goalService.getGoals(user.id),
  ]);

  const totals = sumLogs(logs);
  const progress = calculateGoalProgress(goal, totals);
  const macroBreakdown = buildMacroBreakdown(totals);

  return {
    date: targetDate,
    timezone: tz,
    goal,
    totals,
    progress,
    macroBreakdown,
    logCount: logs.length,
    logs,
  };
}

async function getWeeklySummary(user, anchorDateStr) {
  const tz = normalizeTimeZone(user.timezone);
  const endDate = anchorDateStr || formatLocalDate(new Date(), tz);
  parseStrictDateString(endDate);
  const startDate = addDaysToDateString(endDate, -6);

  const { startUtc, endUtc } = getUtcRangeForLocalDateSpan(startDate, endDate, tz);

  const [logs, goal] = await Promise.all([
    foodLogModel.findByUserIdInRange(
      user.id,
      toMysqlUtcDatetime(startUtc),
      toMysqlUtcDatetime(endUtc),
      { order: 'ASC' }
    ),
    goalService.getGoals(user.id),
  ]);

  const buckets = new Map();
  for (let i = 0; i < 7; i += 1) {
    const dayStr = addDaysToDateString(startDate, i);
    buckets.set(dayStr, {
      date: dayStr,
      calories: 0,
      carbohydrates: 0,
      protein: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      logCount: 0,
    });
  }

  for (const log of logs) {
    const localDay = formatLocalDate(new Date(log.loggedAt), tz);
    const bucket = buckets.get(localDay);
    if (!bucket) continue;

    bucket.calories += Number(log.calories || 0);
    bucket.carbohydrates += Number(log.carbohydrates || 0);
    bucket.protein += Number(log.protein || 0);
    bucket.fat += Number(log.fat || 0);
    bucket.fiber += Number(log.fiber || 0);
    bucket.sugar += Number(log.sugar || 0);
    bucket.logCount += 1;
  }

  const days = Array.from(buckets.values()).map((b) => ({
    date: b.date,
    calories: round2(b.calories),
    carbohydrates: round2(b.carbohydrates),
    protein: round2(b.protein),
    fat: round2(b.fat),
    fiber: round2(b.fiber),
    sugar: round2(b.sugar),
    logCount: b.logCount,
    isOverCalories: goal.dailyCalories > 0 && b.calories > goal.dailyCalories,
  }));

  const loggedDays = days.filter((d) => d.logCount > 0);
  const divisor = loggedDays.length > 0 ? loggedDays.length : 7;
  const totalWeekCalories = days.reduce((acc, d) => acc + d.calories, 0);

  return {
    startDate,
    endDate,
    timezone: tz,
    goalCalories: goal.dailyCalories,
    loggedDaysCount: loggedDays.length,
    averageCaloriesOnLoggedDays: loggedDays.length > 0 ? round2(totalWeekCalories / divisor) : 0,
    days,
  };
}

async function getDashboardSummary(user, dateStr) {
  const [daily, weekly] = await Promise.all([
    getDailySummary(user, dateStr),
    getWeeklySummary(user, dateStr),
  ]);

  return {
    date: daily.date,
    timezone: daily.timezone,
    goal: daily.goal,
    totals: daily.totals,
    progress: daily.progress,
    macroBreakdown: daily.macroBreakdown,
    logCount: daily.logCount,
    todayLogs: daily.logs,
    recentLogs: daily.logs.slice(0, 6),
    weekly,
    isEmpty: daily.logCount === 0,
  };
}

module.exports = {
  buildMacroBreakdown,
  getDailySummary,
  getWeeklySummary,
  getDashboardSummary,
};
