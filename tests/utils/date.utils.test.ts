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
  daysInMonth,
  formatDuration,
  parseDuration,
  getDateFromDuration,
  isWeekend,
  isToday,
  isFuture,
  isPast,
  addDays,
  addMonths,
  addYears,
  quarterOf,
  weekOfYear
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
  describe('formatDuration', () => {
    it('returns 0ms for non-finite or non-positive', () => {
      expect(formatDuration(NaN)).toBe('0ms');
      expect(formatDuration(-100)).toBe('0ms');
      expect(formatDuration(0)).toBe('0ms');
    });
    it('formats days, hours, minutes, seconds, ms', () => {
      expect(formatDuration(90061)).toBe('1m 30s 61ms');
      expect(formatDuration(3661000)).toBe('1h 1m 1s');
      expect(formatDuration(24 * 60 * 60 * 1000 + 1000)).toContain('1d');
    });
  });

  describe('parseDuration', () => {
    it('returns value for finite number', () => {
      expect(parseDuration(1234)).toBe(1234);
    });
    it('returns 0 for empty or invalid string', () => {
      expect(parseDuration('')).toBe(0);
      expect(parseDuration('   ')).toBe(0);
      expect(parseDuration(undefined as any)).toBe(0);
    });
    it('parses plain ms string', () => {
      expect(parseDuration('60000')).toBe(60000);
    });
    it('parses combined units', () => {
      expect(parseDuration('1h20m10s')).toBe(1 * 3600000 + 20 * 60000 + 10 * 1000);
      expect(parseDuration('2d')).toBe(2 * 86400000);
      expect(parseDuration('1w2d3h')).toBe(1 * 604800000 + 2 * 86400000 + 3 * 3600000);
      expect(parseDuration('5ms')).toBe(5);
    });
    it('throws error for invalid format', () => {
      expect(() => parseDuration('abc')).toThrow();
    });
  });

  describe('getDateFromDuration', () => {
    it('returns future date for valid duration', () => {
      const now = Date.now();
      const result = getDateFromDuration('1s');
      expect(result.getTime()).toBeGreaterThanOrEqual(now + 1000);
    });
    it('throws error for zero duration', () => {
      expect(() => getDateFromDuration('0')).toThrow();
    });
  });

  describe('isWeekend', () => {
    it('returns true for Saturday', () => {
      const saturday = new Date('2024-01-06'); // A Saturday
      expect(isWeekend(saturday)).toBe(true);
    });

    it('returns true for Sunday', () => {
      const sunday = new Date('2024-01-07'); // A Sunday
      expect(isWeekend(sunday)).toBe(true);
    });

    it('returns false for weekday', () => {
      const monday = new Date('2024-01-08'); // A Monday
      expect(isWeekend(monday)).toBe(false);
    });

    it('handles timestamp input', () => {
      const saturday = new Date('2024-01-06').getTime();
      expect(isWeekend(saturday)).toBe(true);
    });
  });

  describe('isToday', () => {
    it('returns true for current date', () => {
      const now = new Date();
      expect(isToday(now)).toBe(true);
    });

    it('returns false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('returns false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });

    it('handles timestamp input', () => {
      const now = Date.now();
      expect(isToday(now)).toBe(true);
    });
  });

  describe('isFuture', () => {
    it('returns true for future date', () => {
      const future = new Date('2099-01-01');
      expect(isFuture(future)).toBe(true);
    });

    it('returns false for past date', () => {
      const past = new Date('2020-01-01');
      expect(isFuture(past)).toBe(false);
    });

    it('handles timestamp input', () => {
      const future = new Date('2099-01-01').getTime();
      expect(isFuture(future)).toBe(true);
    });
  });

  describe('isPast', () => {
    it('returns true for past date', () => {
      const past = new Date('2020-01-01');
      expect(isPast(past)).toBe(true);
    });

    it('returns false for future date', () => {
      const future = new Date('2099-01-01');
      expect(isPast(future)).toBe(false);
    });

    it('handles timestamp input', () => {
      const past = new Date('2020-01-01').getTime();
      expect(isPast(past)).toBe(true);
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, 7);
      expect(result.getDate()).toBe(22);
      expect(result.getMonth()).toBe(0); // January
    });

    it('subtracts days with negative input', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(10);
    });

    it('handles month rollover', () => {
      const date = new Date('2024-01-30');
      const result = addDays(date, 5);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });

    it('handles timestamp input', () => {
      const timestamp = new Date('2024-01-15').getTime();
      const result = addDays(timestamp, 7);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('addMonths', () => {
    it('adds positive months', () => {
      const date = new Date('2024-01-15');
      const result = addMonths(date, 3);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getFullYear()).toBe(2024);
    });

    it('subtracts months with negative input', () => {
      const date = new Date('2024-04-15');
      const result = addMonths(date, -2);
      expect(result.getMonth()).toBe(1); // February
    });

    it('handles year rollover', () => {
      const date = new Date('2024-11-15');
      const result = addMonths(date, 3);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1); // February
    });

    it('adjusts day for months with fewer days', () => {
      const date = new Date('2024-01-31');
      const result = addMonths(date, 1);
      // JavaScript automatically adjusts to March 2 (31 Jan + 1 month = 2 Mar in non-leap adjustment)
      expect(result.getMonth()).toBe(2); // March
      expect(result.getDate()).toBe(2);
    });

    it('handles timestamp input', () => {
      const timestamp = new Date('2024-01-15').getTime();
      const result = addMonths(timestamp, 1);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('addYears', () => {
    it('adds positive years', () => {
      const date = new Date('2024-01-15');
      const result = addYears(date, 5);
      expect(result.getFullYear()).toBe(2029);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });

    it('subtracts years with negative input', () => {
      const date = new Date('2024-01-15');
      const result = addYears(date, -3);
      expect(result.getFullYear()).toBe(2021);
    });

    it('handles leap year edge case', () => {
      const date = new Date('2024-02-29'); // Leap year
      const result = addYears(date, 1);
      expect(result.getFullYear()).toBe(2025);
      // Feb 29 doesn't exist in 2025, so it becomes Feb 28 or Mar 1
      expect(result.getMonth()).toBeGreaterThanOrEqual(1);
    });

    it('handles timestamp input', () => {
      const timestamp = new Date('2024-01-15').getTime();
      const result = addYears(timestamp, 5);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('quarterOf', () => {
    it('returns 1 for Q1 months', () => {
      expect(quarterOf(new Date('2024-01-15'))).toBe(1);
      expect(quarterOf(new Date('2024-02-15'))).toBe(1);
      expect(quarterOf(new Date('2024-03-15'))).toBe(1);
    });

    it('returns 2 for Q2 months', () => {
      expect(quarterOf(new Date('2024-04-15'))).toBe(2);
      expect(quarterOf(new Date('2024-05-15'))).toBe(2);
      expect(quarterOf(new Date('2024-06-15'))).toBe(2);
    });

    it('returns 3 for Q3 months', () => {
      expect(quarterOf(new Date('2024-07-15'))).toBe(3);
      expect(quarterOf(new Date('2024-08-15'))).toBe(3);
      expect(quarterOf(new Date('2024-09-15'))).toBe(3);
    });

    it('returns 4 for Q4 months', () => {
      expect(quarterOf(new Date('2024-10-15'))).toBe(4);
      expect(quarterOf(new Date('2024-11-15'))).toBe(4);
      expect(quarterOf(new Date('2024-12-15'))).toBe(4);
    });

    it('handles timestamp input', () => {
      const timestamp = new Date('2024-07-15').getTime();
      expect(quarterOf(timestamp)).toBe(3);
    });
  });

  describe('weekOfYear', () => {
    it('returns correct ISO week number', () => {
      // Week 1 of 2024 starts on Jan 1 (Monday)
      expect(weekOfYear(new Date('2024-01-01'))).toBe(1);
      expect(weekOfYear(new Date('2024-01-15'))).toBe(3);
    });

    it('handles different months', () => {
      expect(weekOfYear(new Date('2024-07-15'))).toBeGreaterThan(25);
      expect(weekOfYear(new Date('2024-12-31'))).toBeGreaterThan(0);
    });

    it('handles timestamp input', () => {
      const timestamp = new Date('2024-01-15').getTime();
      expect(weekOfYear(timestamp)).toBe(3);
    });

    it('returns correct week for year boundary', () => {
      // ISO week calculation can have week 53 or week 1 near year boundary
      const result = weekOfYear(new Date('2024-12-30'));
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(53);
    });
  });
});
