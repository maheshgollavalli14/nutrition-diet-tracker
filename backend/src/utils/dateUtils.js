const { ValidationError } = require('./errors');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidTimeZone(tz) {
  if (!tz || typeof tz !== 'string') {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz.trim() });
    return true;
  } catch {
    return false;
  }
}

function normalizeTimeZone(tz) {
  const candidate = typeof tz === 'string' && tz.trim() ? tz.trim() : 'UTC';
  if (!isValidTimeZone(candidate)) {
    throw new ValidationError(`Invalid IANA timezone: "${tz}".`);
  }
  return candidate;
}

function getDatePartsInTimeZone(date, tz) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') {
      parts[part.type] = Number(part.value);
    }
  }
  return parts;
}

/**
 * Computes timezone offset (local - UTC) in milliseconds for a specific UTC instant.
 */
function getTimeZoneOffsetMs(utcDate, tz) {
  const parts = getDatePartsInTimeZone(utcDate, tz);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour === 24 ? 0 : parts.hour,
    parts.minute,
    parts.second
  );
  const utcWholeSec = Math.floor(utcDate.getTime() / 1000) * 1000;
  return localAsUtc - utcWholeSec;
}

function formatLocalDate(date, tz = 'UTC') {
  const safeTz = normalizeTimeZone(tz);
  const parts = getDatePartsInTimeZone(date, safeTz);
  const y = String(parts.year).padStart(4, '0');
  const m = String(parts.month).padStart(2, '0');
  const d = String(parts.day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseStrictDateString(dateStr) {
  if (typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) {
    throw new ValidationError('Date must be in YYYY-MM-DD format.');
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new ValidationError(`Invalid calendar date: ${dateStr}`);
  }
  return { year, month, day };
}

function addDaysToDateString(dateStr, deltaDays) {
  const { year, month, day } = parseStrictDateString(dateStr);
  const dt = new Date(Date.UTC(year, month - 1, day + deltaDays));
  const y = String(dt.getUTCFullYear()).padStart(4, '0');
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converts a local calendar midnight (YYYY-MM-DD 00:00:00 in tz) into an exact UTC Date.
 */
function localMidnightToUtc(dateStr, tz = 'UTC') {
  const safeTz = normalizeTimeZone(tz);
  const { year, month, day } = parseStrictDateString(dateStr);
  const naiveUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0);

  let guess = new Date(naiveUtcMs);
  let offset1 = getTimeZoneOffsetMs(guess, safeTz);
  let candidate = new Date(naiveUtcMs - offset1);

  // Refine once for DST transition boundaries
  const offset2 = getTimeZoneOffsetMs(candidate, safeTz);
  if (offset2 !== offset1) {
    candidate = new Date(naiveUtcMs - offset2);
  }
  return candidate;
}

/**
 * Returns inclusive start UTC Date and exclusive end UTC Date for a user's local calendar day.
 */
function getUtcRangeForLocalDate(localDateStr, tz = 'UTC') {
  const startUtc = localMidnightToUtc(localDateStr, tz);
  const nextDateStr = addDaysToDateString(localDateStr, 1);
  const endUtc = localMidnightToUtc(nextDateStr, tz);
  return {
    localDate: localDateStr,
    startUtc,
    endUtc,
  };
}

/**
 * Returns inclusive start UTC Date and exclusive end UTC Date for an inclusive local date span.
 */
function getUtcRangeForLocalDateSpan(startDateStr, endDateStr, tz = 'UTC') {
  const startUtc = localMidnightToUtc(startDateStr, tz);
  const dayAfterEnd = addDaysToDateString(endDateStr, 1);
  const endUtc = localMidnightToUtc(dayAfterEnd, tz);
  return {
    startDate: startDateStr,
    endDate: endDateStr,
    startUtc,
    endUtc,
  };
}

function daysBetweenInclusive(startDateStr, endDateStr) {
  const s = parseStrictDateString(startDateStr);
  const e = parseStrictDateString(endDateStr);
  const startMs = Date.UTC(s.year, s.month - 1, s.day);
  const endMs = Date.UTC(e.year, e.month - 1, e.day);
  return Math.round((endMs - startMs) / 86400000) + 1;
}

/**
 * Truncates timestamps to whole seconds because MySQL TIMESTAMP columns default to 0 fractional digits.
 */
function normalizeToSecondDate(input) {
  const date = input ? new Date(input) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid loggedAt timestamp.');
  }
  return new Date(Math.floor(date.getTime() / 1000) * 1000);
}

function toMysqlUtcDatetime(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date for MySQL formatting.');
  }
  const y = String(date.getUTCFullYear()).padStart(4, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function toIsoUtcString(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === 'string') {
    const normalized = val.includes('T') ? val : val.replace(' ', 'T') + (val.endsWith('Z') ? '' : 'Z');
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? val : parsed.toISOString();
  }
  return null;
}

module.exports = {
  isValidTimeZone,
  normalizeTimeZone,
  formatLocalDate,
  parseStrictDateString,
  addDaysToDateString,
  localMidnightToUtc,
  getUtcRangeForLocalDate,
  getUtcRangeForLocalDateSpan,
  daysBetweenInclusive,
  normalizeToSecondDate,
  toMysqlUtcDatetime,
  toIsoUtcString,
};
