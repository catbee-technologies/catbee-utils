import {
  formatDate,
  formatRelativeTime,
  parseDate,
  dateDiff,
  addToDate,
  startOf,
  endOf,
  isBetween,
  isLeapYear,
  daysInMonth
} from '../../src/date';

describe('date.utils', () => {
  describe('formatDate', () => {
    it('formats date as yyyy-MM-dd', () => {
      const date = new Date('2023-05-15T10:20:30Z');
      expect(formatDate(date, { format: 'yyyy-MM-dd' })).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('formats date with time', () => {
      const date = new Date('2023-05-15T14:30:22');
      expect(formatDate(date, { format: 'yyyy-MM-dd HH:mm:ss' })).toContain('2023');
    });

    it('formats date with locale', () => {
      const date = new Date('2023-05-15');
      const result = formatDate(date, { format: 'PPPP', locale: 'fr-FR' });
      expect(typeof result).toBe('string');
    });

    it('formats relative time', () => {
      const now = new Date();
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatDate(fiveMinAgo, { format: 'relative' })).toContain('minute');
    });
  });

  describe('formatRelativeTime', () => {
    it('returns "seconds ago" for recent past', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 30 * 1000);
      expect(formatRelativeTime(past, now)).toContain('second');
    });

    it('returns "in days" for future', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(future, now)).toContain('day');
    });
  });

  describe('parseDate', () => {
    it('parses valid date string', () => {
      const date = parseDate('2023-05-15');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2023);
    });

    it('parses timestamp', () => {
      const ts = Date.now();
      const date = parseDate(ts);
      expect(date).toBeInstanceOf(Date);
      expect(date?.getTime()).toBe(ts);
    });

    it('returns fallback for invalid input', () => {
      const fallback = new Date(2020, 0, 1);
      expect(parseDate('invalid', fallback)).toEqual(fallback);
    });

    it('returns null for invalid input without fallback', () => {
      expect(parseDate('invalid')).toBeNull();
    });
  });

  describe('dateDiff', () => {
    const d1 = new Date('2023-05-15T10:20:30');
    const d2 = new Date('2023-05-10T08:15:10');
    it('calculates difference in milliseconds', () => {
      expect(dateDiff(d1, d2, 'milliseconds')).toBe(d1.getTime() - d2.getTime());
    });
    it('calculates difference in seconds', () => {
      expect(dateDiff(d1, d2, 'seconds')).toBeCloseTo((d1.getTime() - d2.getTime()) / 1000);
    });
    it('calculates difference in minutes', () => {
      expect(dateDiff(d1, d2, 'minutes')).toBeCloseTo((d1.getTime() - d2.getTime()) / (1000 * 60));
    });
    it('calculates difference in hours', () => {
      expect(dateDiff(d1, d2, 'hours')).toBeCloseTo((d1.getTime() - d2.getTime()) / (1000 * 60 * 60));
    });
    it('calculates difference in days', () => {
      expect(dateDiff(d1, d2, 'days')).toBeCloseTo((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    });
    it('calculates difference in months', () => {
      expect(dateDiff(new Date('2023-07-01'), new Date('2023-05-01'), 'months')).toBe(2);
    });
    it('calculates difference in years', () => {
      expect(dateDiff(new Date('2025-01-01'), new Date('2023-01-01'), 'years')).toBe(2);
    });
    it('throws error for unsupported unit', () => {
      expect(() => dateDiff(d1, d2, 'unsupported' as any)).toThrow();
    });
  });

  describe('addToDate', () => {
    const base = new Date('2023-05-15T10:20:30');
    it('adds milliseconds', () => {
      const result = addToDate(base, 1000, 'milliseconds');
      expect(result.getTime()).toBe(base.getTime() + 1000);
    });
    it('adds seconds', () => {
      const result = addToDate(base, 10, 'seconds');
      expect(result.getSeconds()).toBe((base.getSeconds() + 10) % 60);
    });
    it('adds minutes', () => {
      const result = addToDate(base, 5, 'minutes');
      expect(result.getMinutes()).toBe((base.getMinutes() + 5) % 60);
    });
    it('adds hours', () => {
      const result = addToDate(base, 2, 'hours');
      expect(result.getHours()).toBe((base.getHours() + 2) % 24);
    });
    it('adds days', () => {
      const result = addToDate(base, 3, 'days');
      expect(result.getDate()).toBe(base.getDate() + 3);
    });
    it('adds months', () => {
      const date = new Date('2023-01-31');
      const result = addToDate(date, 1, 'months');
      expect(result.getMonth()).toBe(1); // February
    });
    it('adds years', () => {
      const result = addToDate(base, 1, 'years');
      expect(result.getFullYear()).toBe(base.getFullYear() + 1);
    });
    it('throws error for unsupported unit', () => {
      expect(() => addToDate(base, 1, 'unsupported' as any)).toThrow();
    });
  });

  describe('startOf', () => {
    const base = new Date('2023-05-15T10:20:30.123');
    it('gets start of second', () => {
      const result = startOf(base, 'second');
      expect(result.getMilliseconds()).toBe(0);
    });
    it('gets start of minute', () => {
      const result = startOf(base, 'minute');
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
    it('gets start of hour', () => {
      const result = startOf(base, 'hour');
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
    it('gets start of day', () => {
      const result = startOf(base, 'day');
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
    it('gets start of week', () => {
      const result = startOf(base, 'week');
      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getHours()).toBe(0);
    });
    it('gets start of month', () => {
      const result = startOf(base, 'month');
      expect(result.getDate()).toBe(1);
    });
    it('gets start of quarter', () => {
      const result = startOf(base, 'quarter');
      expect([0, 3, 6, 9]).toContain(result.getMonth());
      expect(result.getDate()).toBe(1);
    });
    it('gets start of year', () => {
      const result = startOf(base, 'year');
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(1);
    });
    it('throws error for unsupported unit', () => {
      expect(() => startOf(base, 'unsupported' as any)).toThrow();
    });
  });

  describe('endOf', () => {
    const base = new Date('2023-05-15T10:20:30.123');
    it('gets end of second', () => {
      const result = endOf(base, 'second');
      expect(result.getMilliseconds()).toBe(999);
    });
    it('gets end of minute', () => {
      const result = endOf(base, 'minute');
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
    it('gets end of hour', () => {
      const result = endOf(base, 'hour');
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
    it('gets end of day', () => {
      const result = endOf(base, 'day');
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
    it('gets end of week', () => {
      const result = endOf(base, 'week');
      expect(result.getDay()).toBe(6); // Saturday
      expect(result.getHours()).toBe(23);
    });
    it('gets end of month', () => {
      const result = endOf(base, 'month');
      expect([28, 29, 30, 31]).toContain(result.getDate());
      expect(result.getHours()).toBe(23);
    });
    it('gets end of quarter', () => {
      const result = endOf(base, 'quarter');
      expect([2, 5, 8, 11]).toContain(result.getMonth());
      expect(result.getDate()).toBeGreaterThanOrEqual(28);
      expect(result.getHours()).toBe(23);
    });
    it('gets end of year', () => {
      const result = endOf(base, 'year');
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(23);
    });
    it('throws error for unsupported unit', () => {
      expect(() => endOf(base, 'unsupported' as any)).toThrow();
    });
  });

  describe('isBetween', () => {
    it('returns true for date within range', () => {
      const date = new Date('2023-05-15');
      const start = new Date('2023-05-10');
      const end = new Date('2023-05-20');
      expect(isBetween(date, start, end)).toBe(true);
    });

    it('returns false for date outside range', () => {
      const date = new Date('2023-05-25');
      const start = new Date('2023-05-10');
      const end = new Date('2023-05-20');
      expect(isBetween(date, start, end)).toBe(false);
    });

    it('respects inclusive flag', () => {
      const date = new Date('2023-05-10');
      const start = new Date('2023-05-10');
      const end = new Date('2023-05-20');
      expect(isBetween(date, start, end, false)).toBe(false);
    });
  });

  describe('isLeapYear', () => {
    it('returns true for leap year', () => {
      expect(isLeapYear(2020)).toBe(true);
      expect(isLeapYear(new Date('2020-01-01'))).toBe(true);
    });

    it('returns false for non-leap year', () => {
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(new Date('2023-01-01'))).toBe(false);
    });
  });

  describe('daysInMonth', () => {
    it('returns 31 for January', () => {
      expect(daysInMonth(2023, 0)).toBe(31);
    });

    it('returns 28 for February in non-leap year', () => {
      expect(daysInMonth(2023, 1)).toBe(28);
    });

    it('returns 29 for February in leap year', () => {
      expect(daysInMonth(2020, 1)).toBe(29);
    });

    it('accepts Date object', () => {
      expect(daysInMonth(new Date('2023-05-15'))).toBe(31);
    });

    it('throws error if month is missing', () => {
      expect(() => daysInMonth(2023 as any)).toThrow();
    });
  });
});
