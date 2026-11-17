const test = require('node:test');
const assert = require('node:assert/strict');
const {
  formatLocalDate,
  getUtcRangeForLocalDate,
  daysBetweenInclusive,
  parseStrictDateString,
  normalizeToSecondDate,
  toMysqlUtcDatetime,
} = require('../src/utils/dateUtils');

test('getUtcRangeForLocalDate handles UTC and Asia/Kolkata half-hour offset', () => {
  const utcRange = getUtcRangeForLocalDate('2026-04-10', 'UTC');
  assert.equal(utcRange.startUtc.toISOString(), '2026-04-10T00:00:00.000Z');
  assert.equal(utcRange.endUtc.toISOString(), '2026-04-11T00:00:00.000Z');

  const istRange = getUtcRangeForLocalDate('2026-04-10', 'Asia/Kolkata');
  assert.equal(istRange.startUtc.toISOString(), '2026-04-09T18:30:00.000Z');
  assert.equal(istRange.endUtc.toISOString(), '2026-04-10T18:30:00.000Z');
});

test('getUtcRangeForLocalDate respects America/New_York DST boundaries', () => {
  const springForward = getUtcRangeForLocalDate('2025-03-09', 'America/New_York');
  const springHours = (springForward.endUtc - springForward.startUtc) / 3600000;
  assert.equal(springHours, 23);

  const fallBack = getUtcRangeForLocalDate('2025-11-02', 'America/New_York');
  const fallHours = (fallBack.endUtc - fallBack.startUtc) / 3600000;
  assert.equal(fallHours, 25);
});

test('formatLocalDate converts UTC timestamp cleanly to local date', () => {
  const instant = new Date('2026-04-10T20:00:00.000Z');
  assert.equal(formatLocalDate(instant, 'UTC'), '2026-04-10');
  assert.equal(formatLocalDate(instant, 'Asia/Kolkata'), '2026-04-11');
});

test('parseStrictDateString rejects invalid calendar dates and checks span', () => {
  assert.doesNotThrow(() => parseStrictDateString('2024-02-29'));
  assert.throws(() => parseStrictDateString('2025-02-29'), /Invalid calendar date/i);
  assert.equal(daysBetweenInclusive('2026-01-01', '2026-12-31'), 365);
});

test('normalizeToSecondDate truncates milliseconds and formats MySQL UTC datetime', () => {
  const dt = normalizeToSecondDate('2026-04-10T12:34:56.789Z');
  assert.equal(dt.getUTCMilliseconds(), 0);
  assert.equal(toMysqlUtcDatetime(dt), '2026-04-10 12:34:56');
});
