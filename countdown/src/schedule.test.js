import { describe, expect, it } from 'vitest';
import { getStatus } from './schedule.js';

const HOUR = 3600000;
const range = { month: 4, day: 10, endMonth: 5, endDay: 31 };
const yearWrap = { month: 12, day: 20, endMonth: 1, endDay: 5 };

describe('getStatus for a floating weekday date', () => {
  // 2nd Sunday of March and 1st Sunday of November, 2 AM.
  const dstStarts = { nthWeekday: { month: 3, weekday: 0, nth: 2, hour: 2 } };
  const dstEnds = { nthWeekday: { month: 11, weekday: 0, nth: 1, hour: 2 } };
  const twoAm = (year, monthIndex, day) => new Date(year, monthIndex, day).getTime() + 2 * HOUR;

  it.each([
    [2026, 2, 8],
    [2027, 2, 14],
    [2028, 2, 12],
  ])('resolves the 2nd Sunday of March in %i', (year, monthIndex, day) => {
    const result = getStatus(dstStarts, new Date(year, 0, 1));
    expect(result.start.getTime()).toBe(twoAm(year, monthIndex, day));
  });

  it.each([
    [2026, 1],
    [2027, 7],
    [2028, 5],
  ])('resolves the 1st Sunday of November in %i', (year, day) => {
    const result = getStatus(dstEnds, new Date(year, 0, 1));
    expect(result.start.getTime()).toBe(twoAm(year, 10, day));
  });

  it.each([
    [2026, 26],
    [2027, 25],
    [2028, 23],
  ])('resolves the 4th Thursday of November (Thanksgiving) in %i', (year, day) => {
    const thanksgiving = { nthWeekday: { month: 11, weekday: 4, nth: 4 } };
    const result = getStatus(thanksgiving, new Date(year, 0, 1));
    expect(result.start.getTime()).toBe(new Date(year, 10, day).getTime());
  });

  it('counts down to 2 AM on the day', () => {
    const result = getStatus(dstEnds, new Date(2026, 9, 31, 22));
    expect(result.active).toBe(false);
    expect(result.remaining).toBe(new Date(2026, 10, 1).getTime() + 2 * HOUR - new Date(2026, 9, 31, 22).getTime());
  });

  it('rolls to next year once the change has happened', () => {
    const result = getStatus(dstEnds, new Date(2026, 10, 1, 12));
    expect(result.start.getFullYear()).toBe(2027);
    expect(result.start.getTime()).toBe(twoAm(2027, 10, 7));
  });
});

describe('getStatus for a single date', () => {
  const christmas = { month: 12, day: 25 };

  it('counts down to the upcoming date', () => {
    const result = getStatus(christmas, new Date(2026, 11, 24, 12));
    expect(result).toMatchObject({ active: false, remaining: 12 * HOUR });
  });

  it('is never active and rolls to next year once the date has started', () => {
    const result = getStatus(christmas, new Date(2026, 11, 25, 12));
    expect(result.active).toBe(false);
    expect(result.remaining).toBeGreaterThan(300 * 24 * HOUR);
  });
});

describe('getStatus for a date range', () => {
  it('counts down to the start before the range', () => {
    const result = getStatus(range, new Date(2027, 3, 9, 23));
    expect(result).toMatchObject({ active: false, remaining: HOUR });
  });

  it('is active from the first moment of the start date', () => {
    const result = getStatus(range, new Date(2027, 3, 10, 0, 0, 0));
    expect(result.active).toBe(true);
    expect(result.remaining).toBe(new Date(2027, 5, 1) - new Date(2027, 3, 10));
  });

  it('counts down to the end while the range is happening', () => {
    const result = getStatus(range, new Date(2027, 4, 1, 12));
    expect(result).toMatchObject({
      active: true,
      remaining: new Date(2027, 5, 1) - new Date(2027, 4, 1, 12),
    });
  });

  it('includes the whole end date', () => {
    const result = getStatus(range, new Date(2027, 4, 31, 23));
    expect(result).toMatchObject({ active: true, remaining: HOUR });
  });

  it('switches to counting down to next year once the range is over', () => {
    const result = getStatus(range, new Date(2027, 5, 1, 0, 0, 0));
    expect(result.active).toBe(false);
    expect(result.remaining).toBe(new Date(2028, 3, 10) - new Date(2027, 5, 1));
  });

  it('is upcoming well before the range starts', () => {
    const result = getStatus(range, new Date(2026, 10, 11, 10));
    expect(result.active).toBe(false);
    expect(result.remaining).toBe(new Date(2027, 3, 10) - new Date(2026, 10, 11, 10));
  });
});

describe('getStatus for a range that spans New Year', () => {
  it('is active in December', () => {
    const result = getStatus(yearWrap, new Date(2026, 11, 25, 12));
    expect(result.active).toBe(true);
    expect(result.remaining).toBe(new Date(2027, 0, 6) - new Date(2026, 11, 25, 12));
  });

  it('is still active in January of the following year', () => {
    const result = getStatus(yearWrap, new Date(2027, 0, 3, 12));
    expect(result.active).toBe(true);
    expect(result.remaining).toBe(new Date(2027, 0, 6) - new Date(2027, 0, 3, 12));
  });

  it('is upcoming after the range ends', () => {
    const result = getStatus(yearWrap, new Date(2027, 0, 6, 0, 0, 0));
    expect(result.active).toBe(false);
    expect(result.remaining).toBe(new Date(2027, 11, 20) - new Date(2027, 0, 6));
  });
});
