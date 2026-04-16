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
  weekOfYear,
  getTimezoneOffset,
  toTimeZone,
  formatDateInTimeZone,
  isDST,
  getTimezoneAbbreviation,
  dateDiffDaysTZ,
  COUNTRY_CODES,
  TIMEZONE_NAMES,
  getCountries,
  getTimezones
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

    // Named presets (Angular-style) — use UTC date + UTC timezone for deterministic output
    const presetDate = new Date('2015-06-15T09:03:01Z');

    it('formats with "short" preset', () => {
      const result = formatDate(presetDate, { format: 'short', locale: 'en-US', timeZone: 'UTC' });
      expect(result).toBe('6/15/15, 9:03 AM');
    });

    it('formats with "medium" preset', () => {
      const result = formatDate(presetDate, { format: 'medium', locale: 'en-US', timeZone: 'UTC' });
      expect(result).toBe('Jun 15, 2015, 9:03:01 AM');
    });

    it('formats with "long" preset', () => {
      const result = formatDate(presetDate, { format: 'long', locale: 'en-US', timeZone: 'UTC' });
      expect(result).toBe('June 15, 2015 at 9:03:01 AM UTC');
    });

    it('formats with "full" preset', () => {
      const result = formatDate(presetDate, { format: 'full', locale: 'en-US', timeZone: 'UTC' });
      expect(result).toBe('Monday, June 15, 2015 at 9:03:01 AM Coordinated Universal Time');
    });

    it('formats with "shortDate" preset', () => {
      const result = formatDate(presetDate, { format: 'shortDate', locale: 'en-US', timeZone: 'UTC' });
      expect(result).toBe('6/15/15');
    });

    it('formats with "mediumDate" preset', () => {
      const result = formatDate(presetDate, { format: 'mediumDate', locale: 'en-US', timeZone: 'UTC' });
      expect(result).toBe('Jun 15, 2015');
    });

    it('formats with "longDate" preset', () => {
      const result = formatDate(presetDate, { format: 'longDate', locale: 'en-US', timeZone: 'UTC' });
      expect(result).toBe('June 15, 2015');
    });

    it('formats with "fullDate" preset', () => {
      const result = formatDate(presetDate, { format: 'fullDate', locale: 'en-US', timeZone: 'UTC' });
      expect(result).toBe('Monday, June 15, 2015');
    });

    it('formats with "shortTime" preset', () => {
      const result = formatDate(presetDate, { format: 'shortTime', locale: 'en-US', timeZone: 'UTC' });
      expect(result).toBe('9:03 AM');
    });

    it('formats with "mediumTime" preset', () => {
      const result = formatDate(presetDate, { format: 'mediumTime', locale: 'en-US', timeZone: 'UTC' });
      expect(result).toBe('9:03:01 AM');
    });

    it('formats with "longTime" preset', () => {
      const result = formatDate(presetDate, { format: 'longTime', locale: 'en-US', timeZone: 'UTC' });
      expect(result).toBe('9:03:01 AM UTC');
    });

    it('formats with "fullTime" preset', () => {
      const result = formatDate(presetDate, { format: 'fullTime', locale: 'en-US', timeZone: 'UTC' });
      expect(result).toBe('9:03:01 AM Coordinated Universal Time');
    });

    it('respects timeZone with presets', () => {
      const utcDate = new Date('2024-06-15T12:00:00Z');
      const result = formatDate(utcDate, { format: 'short', locale: 'en-US', timeZone: 'Asia/Tokyo' });
      expect(result).toBe('6/15/24, 9:00 PM');
    });

    it('respects locale with presets', () => {
      const result = formatDate(presetDate, { format: 'longDate', locale: 'de-DE', timeZone: 'UTC' });
      expect(result).toBe('15. Juni 2015');
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

    it('uses default now and supports numeric input', () => {
      const thirtySecondsAgo = Date.now() - 30 * 1000;
      expect(formatRelativeTime(thirtySecondsAgo)).toContain('second');
    });

    it('returns minute/hour/month/year buckets', () => {
      const now = new Date('2024-01-01T00:00:00Z');

      const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatRelativeTime(minutesAgo, now, 'en-US')).toContain('minute');

      const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      expect(formatRelativeTime(hoursAgo, now, 'en-US')).toContain('hour');

      const monthsAgo = new Date(now.getTime() - 70 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(monthsAgo, now, 'en-US')).toContain('month');

      const yearsAgo = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(yearsAgo, now, 'en-US')).toContain('year');
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

    it('parses date-only string as local midnight', () => {
      const date = parseDate('2023-05-15');
      expect(date?.getHours()).toBe(0);
      expect(date?.getMinutes()).toBe(0);
      expect(date?.getSeconds()).toBe(0);
      expect(date?.getMilliseconds()).toBe(0);
    });

    it('parses ISO string with timezone correctly', () => {
      const date = parseDate('2023-05-15T10:30:00Z');
      expect(date).toBeInstanceOf(Date);
      // Should parse as UTC
      expect(date?.toISOString()).toContain('2023-05-15T10:30:00');
    });

    it('handles date-only input differently from new Date()', () => {
      // parseDate should give local midnight, not UTC midnight
      const parsed = parseDate('2023-05-15');
      const native = new Date('2023-05-15');

      // They should be different unless in UTC timezone
      expect(parsed).toBeInstanceOf(Date);
      expect(native).toBeInstanceOf(Date);

      // Verify local midnight behavior
      expect(parsed?.getHours()).toBe(0);
      expect(parsed?.getMinutes()).toBe(0);
    });

    it('returns null for invalid date format', () => {
      expect(parseDate('not-a-date')).toBeNull();
      expect(parseDate('2023-13-45')).toBeNull();
    });

    it('uses fallback for malformed date strings', () => {
      const fallback = new Date(2020, 0, 1);
      expect(parseDate('abc-def-ghi', fallback)).toEqual(fallback);
      expect(parseDate('', fallback)).toEqual(fallback);
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
      expect(dateDiff(d1, d2, 'days')).toBe(5);
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

  describe('dateDiffDaysTZ', () => {
    it('calculates calendar days in a specific timezone', () => {
      const d1 = new Date('2024-06-15T23:00:00Z'); // June 16 in Asia/Tokyo
      const d2 = new Date('2024-06-14T14:00:00Z'); // June 14 in Asia/Tokyo
      expect(dateDiffDaysTZ(d1, d2, 'Asia/Tokyo')).toBe(2);
    });

    it('handles same calendar day in timezone', () => {
      const d1 = new Date('2024-06-15T02:00:00Z'); // June 15 11:00 in Asia/Tokyo
      const d2 = new Date('2024-06-14T22:00:00Z'); // June 15 07:00 in Asia/Tokyo
      expect(dateDiffDaysTZ(d1, d2, 'Asia/Tokyo')).toBe(0);
    });

    it('handles date rollover correctly', () => {
      const d1 = new Date('2024-06-15T23:59:00Z'); // June 16 08:59 in Asia/Tokyo
      const d2 = new Date('2024-06-15T14:59:00Z'); // June 15 23:59 in Asia/Tokyo
      expect(dateDiffDaysTZ(d1, d2, 'Asia/Tokyo')).toBe(1);
    });

    it('works across DST boundaries', () => {
      // March 10, 2024: US DST spring forward
      const before = new Date('2024-03-09T12:00:00Z');
      const after = new Date('2024-03-11T12:00:00Z');
      expect(dateDiffDaysTZ(after, before, 'America/New_York')).toBe(2);
    });

    it('calculates negative difference correctly', () => {
      const d1 = new Date('2024-06-15T00:00:00Z');
      const d2 = new Date('2024-06-18T00:00:00Z');
      expect(dateDiffDaysTZ(d1, d2, 'UTC')).toBe(-3);
    });

    it('works in UTC timezone', () => {
      const d1 = new Date('2024-06-18T12:00:00Z');
      const d2 = new Date('2024-06-15T12:00:00Z');
      expect(dateDiffDaysTZ(d1, d2, 'UTC')).toBe(3);
    });

    it('handles timezone-specific date boundaries', () => {
      // 2024-06-15 00:30 UTC is still June 14 in New York (EDT, UTC-4)
      const utcMorning = new Date('2024-06-15T00:30:00Z');
      const nyEvening = new Date('2024-06-14T20:00:00Z'); // June 14 16:00 EDT
      expect(dateDiffDaysTZ(utcMorning, nyEvening, 'America/New_York')).toBe(0);
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

    describe('with timezone option', () => {
      it('adds days in specific timezone', () => {
        const utcDate = new Date('2024-06-15T12:00:00Z');
        const result = addToDate(utcDate, 1, 'days', { timeZone: 'Asia/Tokyo' });

        // Should add 1 calendar day in Tokyo timezone
        const tokyo = toTimeZone(result, 'Asia/Tokyo');
        const original = toTimeZone(utcDate, 'Asia/Tokyo');
        expect(tokyo.day).toBe(original.day + 1);
      });

      it('adds months in specific timezone', () => {
        const utcDate = new Date('2024-01-31T12:00:00Z');
        const result = addToDate(utcDate, 1, 'months', { timeZone: 'America/New_York' });

        const ny = toTimeZone(result, 'America/New_York');
        // January 31 + 1 month = February 29 (2024 is leap year)
        expect(ny.month).toBe(2);
        expect(ny.day).toBe(29); // Clamped to last day of February
      });

      it('adds years in specific timezone', () => {
        const utcDate = new Date('2024-02-29T12:00:00Z'); // Leap year
        const result = addToDate(utcDate, 1, 'years', { timeZone: 'Europe/London' });

        const london = toTimeZone(result, 'Europe/London');
        expect(london.year).toBe(2025);
        expect(london.day).toBe(28); // Clamped to Feb 28 in non-leap year
      });

      it('handles month overflow correctly with timezone', () => {
        const utcDate = new Date('2024-01-31T00:00:00Z');
        const result = addToDate(utcDate, 1, 'months', { timeZone: 'UTC' });

        expect(result.getUTCMonth()).toBe(1); // February
        expect(result.getUTCDate()).toBe(29); // 2024 is leap year
      });

      it('handles year-end month addition with timezone', () => {
        const utcDate = new Date('2024-12-31T12:00:00Z');
        const result = addToDate(utcDate, 1, 'months', { timeZone: 'Asia/Tokyo' });

        const tokyo = toTimeZone(result, 'Asia/Tokyo');
        expect(tokyo.year).toBe(2025);
        expect(tokyo.month).toBe(1); // January
      });

      it('adds days across DST boundary in timezone', () => {
        // March 10, 2024: US DST spring forward (2am → 3am)
        const beforeDST = new Date('2024-03-09T12:00:00Z');
        const result = addToDate(beforeDST, 2, 'days', { timeZone: 'America/New_York' });

        const ny = toTimeZone(result, 'America/New_York');
        expect(ny.day).toBe(11); // March 11
      });

      it('preserves wall-clock time when adding months in timezone', () => {
        const utcDate = new Date('2024-01-15T15:00:00Z'); // 10:00 EST in New York
        const result = addToDate(utcDate, 1, 'months', { timeZone: 'America/New_York' });

        const ny = toTimeZone(result, 'America/New_York');
        expect(ny.month).toBe(2); // February
        expect(ny.day).toBe(15);
        expect(ny.hour).toBe(10); // Wall-clock time preserved
      });

      it('handles negative additions with timezone', () => {
        const utcDate = new Date('2024-03-15T12:00:00Z');
        const result = addToDate(utcDate, -2, 'months', { timeZone: 'Europe/Paris' });

        const paris = toTimeZone(result, 'Europe/Paris');
        expect(paris.month).toBe(1); // January
      });

      it('clamps day correctly for February in timezone', () => {
        const utcDate = new Date('2024-01-31T00:00:00Z');
        const result = addToDate(utcDate, 1, 'months', { timeZone: 'UTC' });

        expect(result.getUTCMonth()).toBe(1); // February
        expect(result.getUTCDate()).toBe(29); // Clamped (2024 is leap year)

        // Test non-leap year
        const utcDate2023 = new Date('2023-01-31T00:00:00Z');
        const result2023 = addToDate(utcDate2023, 1, 'months', { timeZone: 'UTC' });
        expect(result2023.getUTCDate()).toBe(28);
      });

      it('works with absolute time units and timezone (should ignore timezone)', () => {
        const utcDate = new Date('2024-06-15T12:00:00Z');

        // Absolute units should ignore timezone
        const withMs = addToDate(utcDate, 1000, 'milliseconds', { timeZone: 'Asia/Tokyo' });
        const withoutMs = addToDate(utcDate, 1000, 'milliseconds');
        expect(withMs.getTime()).toBe(withoutMs.getTime());

        const withHours = addToDate(utcDate, 2, 'hours', { timeZone: 'Asia/Tokyo' });
        const withoutHours = addToDate(utcDate, 2, 'hours');
        expect(withHours.getTime()).toBe(withoutHours.getTime());
      });

      it('preserves milliseconds when adding calendar units with timezone', () => {
        const utcDate = new Date('2024-06-15T12:30:45.789Z');

        // Adding days should preserve milliseconds
        const resultDays = addToDate(utcDate, 1, 'days', { timeZone: 'Asia/Tokyo' });
        expect(resultDays.getMilliseconds()).toBe(789);

        // Adding months should preserve milliseconds
        const resultMonths = addToDate(utcDate, 1, 'months', { timeZone: 'America/New_York' });
        expect(resultMonths.getMilliseconds()).toBe(789);

        // Adding years should preserve milliseconds
        const resultYears = addToDate(utcDate, 1, 'years', { timeZone: 'Europe/London' });
        expect(resultYears.getMilliseconds()).toBe(789);
      });

      it('matches non-timezone path millisecond behavior', () => {
        const utcDate = new Date('2024-06-15T12:30:45.456Z');

        // Local path preserves milliseconds
        const localResult = addToDate(utcDate, 5, 'days');
        expect(localResult.getMilliseconds()).toBe(456);

        // Timezone path should also preserve milliseconds
        const tzResult = addToDate(utcDate, 5, 'days', { timeZone: 'America/New_York' });
        expect(tzResult.getMilliseconds()).toBe(456);
      });
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

    it('supports numeric timestamps and inclusive boundaries', () => {
      const start = new Date('2023-05-10').getTime();
      const end = new Date('2023-05-20').getTime();
      const boundary = start;

      expect(isBetween(boundary, start, end, true)).toBe(true);
      expect(isBetween(boundary, start, end, false)).toBe(false);
    });

    it('handles mixed date/number inputs consistently', () => {
      const dateNumber = new Date('2023-05-15').getTime();
      const startDate = new Date('2023-05-10');
      const endDate = new Date('2023-05-20');

      expect(isBetween(dateNumber, startDate, endDate.getTime(), true)).toBe(true);
      expect(isBetween(dateNumber, startDate.getTime(), endDate, true)).toBe(true);
      expect(isBetween(new Date('2023-05-15'), startDate.getTime(), endDate.getTime(), true)).toBe(true);
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

    it('handles zero-year addition and preserves date value', () => {
      const date = new Date('2024-03-01T12:00:00Z');
      const result = addYears(date, 0);
      expect(result.getTime()).toBe(date.getTime());
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

  // ==================== Timezone & DST Tests ====================

  describe('formatDate with timeZone option', () => {
    it('formats yyyy-MM-dd respecting timezone', () => {
      // 2024-06-15 23:30 UTC → 2024-06-16 in Tokyo (UTC+9)
      const utcLateNight = new Date('2024-06-15T23:30:00Z');
      expect(formatDate(utcLateNight, { format: 'yyyy-MM-dd', timeZone: 'Asia/Tokyo' })).toBe('2024-06-16');
    });

    it('formats yyyy-MM-dd HH:mm:ss respecting timezone', () => {
      const utcNoon = new Date('2024-06-15T12:00:00Z');
      const result = formatDate(utcNoon, { format: 'yyyy-MM-dd HH:mm:ss', timeZone: 'Asia/Tokyo' });
      expect(result).toBe('2024-06-15 21:00:00');
    });

    it('formats correctly in UTC', () => {
      const date = new Date('2024-03-10T05:00:00Z');
      expect(formatDate(date, { format: 'yyyy-MM-dd HH:mm:ss', timeZone: 'UTC' })).toBe('2024-03-10 05:00:00');
    });
  });

  describe('dateDiff DST safety', () => {
    it('returns exact calendar days across US spring-forward DST', () => {
      // US DST spring forward: March 10, 2024 (23-hour day)
      const before = new Date(2024, 2, 9, 12, 0, 0); // March 9
      const after = new Date(2024, 2, 11, 12, 0, 0); // March 11
      expect(dateDiff(after, before, 'days')).toBe(2);
    });

    it('returns exact calendar days across US fall-back DST', () => {
      // US DST fall back: November 3, 2024 (25-hour day)
      const before = new Date(2024, 10, 2, 12, 0, 0); // Nov 2
      const after = new Date(2024, 10, 4, 12, 0, 0); // Nov 4
      expect(dateDiff(after, before, 'days')).toBe(2);
    });

    it('returns 1 for consecutive days across spring-forward', () => {
      const day1 = new Date(2024, 2, 10, 1, 0, 0);
      const day2 = new Date(2024, 2, 11, 1, 0, 0);
      expect(dateDiff(day2, day1, 'days')).toBe(1);
    });
  });

  describe('getTimezoneOffset', () => {
    it('returns UTC offset for a timezone', () => {
      // UTC should always be 0
      expect(getTimezoneOffset('UTC')).toBeCloseTo(0);
    });

    it('returns correct offset for Tokyo (no DST)', () => {
      // Asia/Tokyo is always UTC+9 (540 minutes)
      const date = new Date('2024-06-15T12:00:00Z');
      expect(getTimezoneOffset('Asia/Tokyo', date)).toBe(540);
    });

    it('distinguishes EST vs EDT offsets', () => {
      const winter = new Date('2024-01-15T12:00:00Z');
      const summer = new Date('2024-07-15T12:00:00Z');
      const winterOffset = getTimezoneOffset('America/New_York', winter);
      const summerOffset = getTimezoneOffset('America/New_York', summer);
      // EST = -300, EDT = -240
      expect(winterOffset).toBe(-300);
      expect(summerOffset).toBe(-240);
    });
  });

  describe('toTimeZone', () => {
    it('converts UTC noon to Tokyo evening', () => {
      const utcNoon = new Date('2024-06-15T12:00:00Z');
      const tokyo = toTimeZone(utcNoon, 'Asia/Tokyo');
      expect(tokyo.year).toBe(2024);
      expect(tokyo.month).toBe(6);
      expect(tokyo.day).toBe(15);
      expect(tokyo.hour).toBe(21);
      expect(tokyo.minute).toBe(0);
    });

    it('handles date rollover across timezone', () => {
      // 2024-06-15 23:30 UTC → 2024-06-16 08:30 in Tokyo
      const utcLate = new Date('2024-06-15T23:30:00Z');
      const tokyo = toTimeZone(utcLate, 'Asia/Tokyo');
      expect(tokyo.day).toBe(16);
      expect(tokyo.hour).toBe(8);
      expect(tokyo.minute).toBe(30);
    });

    it('handles timestamp input', () => {
      const ts = new Date('2024-06-15T12:00:00Z').getTime();
      const result = toTimeZone(ts, 'UTC');
      expect(result.hour).toBe(12);
    });
  });

  describe('formatDateInTimeZone', () => {
    it('formats date in yyyy-MM-dd for a timezone', () => {
      const date = new Date('2024-06-15T23:30:00Z');
      expect(formatDateInTimeZone(date, 'Asia/Tokyo', 'yyyy-MM-dd')).toBe('2024-06-16');
      expect(formatDateInTimeZone(date, 'UTC', 'yyyy-MM-dd')).toBe('2024-06-15');
    });

    it('formats date with time for a timezone', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      expect(formatDateInTimeZone(date, 'UTC', 'yyyy-MM-dd HH:mm:ss')).toBe('2024-06-15 12:00:00');
    });

    it('defaults to yyyy-MM-dd HH:mm:ss format', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDateInTimeZone(date, 'UTC');
      expect(result).toBe('2024-06-15 12:00:00');
    });
  });

  describe('isDST', () => {
    it('detects DST in summer for New York', () => {
      expect(isDST('America/New_York', new Date('2024-07-15T12:00:00Z'))).toBe(true);
    });

    it('detects no DST in winter for New York', () => {
      expect(isDST('America/New_York', new Date('2024-01-15T12:00:00Z'))).toBe(false);
    });

    it('returns false for timezone without DST', () => {
      // Tokyo never observes DST
      expect(isDST('Asia/Tokyo', new Date('2024-07-15T12:00:00Z'))).toBe(false);
      expect(isDST('Asia/Tokyo', new Date('2024-01-15T12:00:00Z'))).toBe(false);
    });

    it('detects DST in southern hemisphere (reversed seasons)', () => {
      // Australia/Sydney: DST in January (southern summer), not in July
      expect(isDST('Australia/Sydney', new Date('2024-01-15T12:00:00Z'))).toBe(true);
      expect(isDST('Australia/Sydney', new Date('2024-07-15T12:00:00Z'))).toBe(false);
    });
  });

  describe('getTimezoneAbbreviation', () => {
    it('returns EST for New York in winter', () => {
      const result = getTimezoneAbbreviation('America/New_York', new Date('2024-01-15T12:00:00Z'));
      expect(result).toBe('EST');
    });

    it('returns EDT for New York in summer', () => {
      const result = getTimezoneAbbreviation('America/New_York', new Date('2024-07-15T12:00:00Z'));
      expect(result).toBe('EDT');
    });

    it('returns JST or GMT+9 for Tokyo', () => {
      const result = getTimezoneAbbreviation('Asia/Tokyo', new Date('2024-07-15T12:00:00Z'));
      expect(['JST', 'GMT+9']).toContain(result);
    });

    it('returns UTC for UTC timezone', () => {
      const result = getTimezoneAbbreviation('UTC', new Date('2024-07-15T12:00:00Z'));
      expect(result).toBe('UTC');
    });
  });

  describe('getCountries', () => {
    it('returns countries list with code and localized name', () => {
      const countries = getCountries('en');

      expect(Array.isArray(countries)).toBe(true);
      expect(countries.length).toBe(COUNTRY_CODES.length);
      expect(countries).toContainEqual(expect.objectContaining({ code: 'US', name: expect.any(String) }));
    });

    it('returns localized country names for different locales', () => {
      const enCountries = getCountries('en');
      const frCountries = getCountries('fr');

      const usEn = enCountries.find(c => c.code === 'US')?.name;
      const usFr = frCountries.find(c => c.code === 'US')?.name;

      expect(usEn).toBeDefined();
      expect(usFr).toBeDefined();
      expect(usFr).not.toBe(usEn);
    });
  });

  describe('getTimezones', () => {
    it('returns all supported IANA timezone names', () => {
      const timezones = getTimezones();

      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones).toBe(TIMEZONE_NAMES);
      expect(timezones.length).toBeGreaterThan(0);
    });

    it('includes UTC in supported timezone names', () => {
      const timezones = getTimezones();
      expect(timezones).toContain('UTC');
    });
  });
});
