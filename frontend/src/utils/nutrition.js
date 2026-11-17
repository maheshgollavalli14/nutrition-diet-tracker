export function round2(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatNum(value, decimals = 1) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '0';
  return Number.isInteger(num) ? String(num) : num.toFixed(decimals);
}

export function computeNutritionPreview(food, consumedQuantity) {
  if (!food) return null;
  const qty = Number(consumedQuantity);
  if (!Number.isFinite(qty) || qty <= 0) return null;

  let multiplier = 0;
  if (food.nutritionBasis === 'PER_SERVING') {
    const size = Number(food.servingSize || 1);
    if (size <= 0) return null;
    multiplier = qty / size;
  } else {
    multiplier = qty / 100;
  }

  return {
    calories: round2((food.calories || 0) * multiplier),
    carbohydrates: round2((food.carbohydrates || 0) * multiplier),
    protein: round2((food.protein || 0) * multiplier),
    fat: round2((food.fat || 0) * multiplier),
    fiber: round2((food.fiber || 0) * multiplier),
    sugar: round2((food.sugar || 0) * multiplier),
  };
}

export function getTodayDateString(timeZone = 'UTC') {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function formatTimeInTimeZone(isoString, timeZone = 'UTC') {
  if (!isoString) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

export function formatDateTimeInTimeZone(isoString, timeZone = 'UTC') {
  if (!isoString) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return new Date(isoString).toLocaleString();
  }
}

export function formatHumanDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dt);
}

/**
 * Formats an instant as YYYY-MM-DDTHH:mm for <input type="datetime-local"> in the browser's local clock.
 */
export function toDateTimeLocalValue(dateInput = new Date()) {
  const dt = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(dt.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  const data = err.response?.data;
  if (data?.message) return data.message;
  if (err.code === 'ERR_NETWORK') {
    return 'Cannot connect to backend API server. Verify the Express server is running on port 5000.';
  }
  return err.message || fallback;
}
