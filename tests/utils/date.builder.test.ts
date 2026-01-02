import { DateBuilder } from '../../src/date/date.builder';

describe('DateBuilder', () => {
  describe('Constructor and Factory Methods', () => {
    it('should create with current date when no arguments', () => {
      const builder = new DateBuilder();
      const date = builder.build();
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBeCloseTo(Date.now(), -2);
    });

    it('should create from Date object', () => {
      const inputDate = new Date('2024-05-15T10:30:00');
      const builder = new DateBuilder(inputDate);
      expect(builder.build().getTime()).toBe(inputDate.getTime());
    });

    it('should create from timestamp', () => {
      const timestamp = 1715772600000;
      const builder = new DateBuilder(timestamp);
      expect(builder.build().getTime()).toBe(timestamp);
    });

    it('should create from date string', () => {
      const builder = new DateBuilder('2024-05-15');
      expect(builder.getYear()).toBe(2024);
      expect(builder.getMonth()).toBe(5);
    });

    it('should create using from static method', () => {
      const inputDate = new Date('2024-05-15');
      const builder = DateBuilder.from(inputDate);
      expect(builder.build().getTime()).toBe(inputDate.getTime());
    });

    it('should create using now static method', () => {
      const builder = DateBuilder.now();
      expect(builder.build().getTime()).toBeCloseTo(Date.now(), -2);
    });

    it('should create using of static method', () => {
      const builder = DateBuilder.of(2024, 5, 15, 14, 30, 45, 123);
      const date = builder.build();
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(4); // 0-indexed
      expect(date.getDate()).toBe(15);
      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(30);
      expect(date.getSeconds()).toBe(45);
      expect(date.getMilliseconds()).toBe(123);
    });

    it('should create using parse static method', () => {
      const builder = DateBuilder.parse('2024-05-15T10:30:00');
      expect(builder.getYear()).toBe(2024);
      expect(builder.getMonth()).toBe(5);
    });

    it('should create using fromDuration static method', () => {
      const builder = DateBuilder.fromDuration('5m');
      const now = Date.now();
      const fiveMinutesFromNow = now + 5 * 60 * 1000;
      expect(builder.getTime()).toBeCloseTo(fiveMinutesFromNow, -2);
    });

    it('should clone builder', () => {
      const original = DateBuilder.of(2024, 5, 15);
      const cloned = original.clone();
      expect(cloned.build().getTime()).toBe(original.build().getTime());
      expect(cloned).not.toBe(original);
    });
  });

  describe('Setter Methods', () => {
    it('should set year', () => {
      const builder = DateBuilder.of(2024, 5, 15).year(2025);
      expect(builder.getYear()).toBe(2025);
      expect(builder.getMonth()).toBe(5);
      expect(builder.getDay()).toBe(15);
    });

    it('should set month (1-12)', () => {
      const builder = DateBuilder.of(2024, 5, 15).month(12);
      expect(builder.getMonth()).toBe(12);
    });

    it('should set day', () => {
      const builder = DateBuilder.of(2024, 5, 15).day(20);
      expect(builder.getDay()).toBe(20);
    });

    it('should set hour', () => {
      const builder = DateBuilder.of(2024, 5, 15, 10).hour(14);
      expect(builder.getHour()).toBe(14);
    });

    it('should set minute', () => {
      const builder = DateBuilder.of(2024, 5, 15, 10, 30).minute(45);
      expect(builder.getMinute()).toBe(45);
    });

    it('should set second', () => {
      const builder = DateBuilder.of(2024, 5, 15, 10, 30, 30).second(45);
      expect(builder.getSecond()).toBe(45);
    });

    it('should set millisecond', () => {
      const builder = DateBuilder.of(2024, 5, 15).millisecond(500);
      expect(builder.getMillisecond()).toBe(500);
    });

    it('should be immutable - setters return new instance', () => {
      const original = DateBuilder.of(2024, 5, 15);
      const modified = original.year(2025);
      expect(original.getYear()).toBe(2024);
      expect(modified.getYear()).toBe(2025);
    });
  });

  describe('Addition Methods', () => {
    const baseDate = DateBuilder.of(2024, 5, 15, 10, 30, 30, 500);

    it('should add years', () => {
      const result = baseDate.addYears(2);
      expect(result.getYear()).toBe(2026);
    });

    it('should add months', () => {
      const result = baseDate.addMonths(3);
      expect(result.getMonth()).toBe(8);
    });

    it('should add days', () => {
      const result = baseDate.addDays(10);
      expect(result.getDay()).toBe(25);
    });

    it('should add hours', () => {
      const result = baseDate.addHours(5);
      expect(result.getHour()).toBe(15);
    });

    it('should add minutes', () => {
      const result = baseDate.addMinutes(45);
      expect(result.getMinute()).toBe(75 % 60); // Should be 15
    });

    it('should add seconds', () => {
      const result = baseDate.addSeconds(45);
      expect(result.getSecond()).toBe(75 % 60); // Should be 15
    });

    it('should add milliseconds', () => {
      const result = baseDate.addMilliseconds(700);
      expect(result.getMillisecond()).toBe(200);
    });

    it('should handle negative additions', () => {
      const result = baseDate.addYears(-1);
      expect(result.getYear()).toBe(2023);
    });
  });

  describe('Subtraction Methods', () => {
    const baseDate = DateBuilder.of(2024, 5, 15, 10, 30, 30);

    it('should subtract years', () => {
      const result = baseDate.subtractYears(2);
      expect(result.getYear()).toBe(2022);
    });

    it('should subtract months', () => {
      const result = baseDate.subtractMonths(3);
      expect(result.getMonth()).toBe(2);
    });

    it('should subtract days', () => {
      const result = baseDate.subtractDays(10);
      expect(result.getDay()).toBe(5);
    });

    it('should subtract hours', () => {
      const result = baseDate.subtractHours(5);
      expect(result.getHour()).toBe(5);
    });

    it('should subtract minutes', () => {
      const result = baseDate.subtractMinutes(15);
      expect(result.getMinute()).toBe(15);
    });

    it('should subtract seconds', () => {
      const result = baseDate.subtractSeconds(15);
      expect(result.getSecond()).toBe(15);
    });
  });

  describe('Start of Period Methods', () => {
    const testDate = DateBuilder.of(2024, 5, 15, 14, 30, 45, 500);

    it('should get start of second', () => {
      const result = testDate.startOfSecond();
      expect(result.getMillisecond()).toBe(0);
    });

    it('should get start of minute', () => {
      const result = testDate.startOfMinute();
      expect(result.getSecond()).toBe(0);
      expect(result.getMillisecond()).toBe(0);
    });

    it('should get start of hour', () => {
      const result = testDate.startOfHour();
      expect(result.getMinute()).toBe(0);
      expect(result.getSecond()).toBe(0);
    });

    it('should get start of day', () => {
      const result = testDate.startOfDay();
      expect(result.getHour()).toBe(0);
      expect(result.getMinute()).toBe(0);
      expect(result.getSecond()).toBe(0);
    });

    it('should get start of week', () => {
      const result = testDate.startOfWeek();
      const dayOfWeek = result.getDayOfWeek();
      expect(dayOfWeek).toBe(0); // Sunday
    });

    it('should get start of month', () => {
      const result = testDate.startOfMonth();
      expect(result.getDay()).toBe(1);
      expect(result.getHour()).toBe(0);
    });

    it('should get start of quarter', () => {
      const result = testDate.startOfQuarter();
      expect(result.getMonth()).toBe(4); // April (Q2 starts)
      expect(result.getDay()).toBe(1);
    });

    it('should get start of year', () => {
      const result = testDate.startOfYear();
      expect(result.getMonth()).toBe(1);
      expect(result.getDay()).toBe(1);
    });

    it('should handle chaining start of periods', () => {
      const result = testDate.startOfMonth().startOfDay();
      expect(result.getDay()).toBe(1);
      expect(result.getHour()).toBe(0);
      expect(result.getMinute()).toBe(0);
    });
  });

  describe('End of Period Methods', () => {
    const testDate = DateBuilder.of(2024, 5, 15, 14, 30, 45, 500);

    it('should get end of second', () => {
      const result = testDate.endOfSecond();
      expect(result.getMillisecond()).toBe(999);
    });

    it('should get end of minute', () => {
      const result = testDate.endOfMinute();
      expect(result.getSecond()).toBe(59);
      expect(result.getMillisecond()).toBe(999);
    });

    it('should get end of hour', () => {
      const result = testDate.endOfHour();
      expect(result.getMinute()).toBe(59);
      expect(result.getSecond()).toBe(59);
    });

    it('should get end of day', () => {
      const result = testDate.endOfDay();
      expect(result.getHour()).toBe(23);
      expect(result.getMinute()).toBe(59);
      expect(result.getSecond()).toBe(59);
    });

    it('should get end of month', () => {
      const result = testDate.endOfMonth();
      expect(result.getDay()).toBe(31); // May has 31 days
      expect(result.getHour()).toBe(23);
    });

    it('should get end of year', () => {
      const result = testDate.endOfYear();
      expect(result.getMonth()).toBe(12);
      expect(result.getDay()).toBe(31);
    });

    it('should handle chaining end of periods', () => {
      const result = testDate.endOfMonth().endOfDay();
      expect(result.getDay()).toBe(31); // May has 31 days
      expect(result.getHour()).toBe(23);
      expect(result.getMinute()).toBe(59);
    });
  });

  describe('Comparison Methods', () => {
    const baseDate = DateBuilder.of(2024, 5, 15);
    const earlierDate = DateBuilder.of(2024, 5, 10);
    const laterDate = DateBuilder.of(2024, 5, 20);
    const sameDate = DateBuilder.of(2024, 5, 15);

    it('should check isBefore', () => {
      expect(baseDate.isBefore(laterDate)).toBe(true);
      expect(baseDate.isBefore(earlierDate)).toBe(false);
      expect(baseDate.isBefore(new Date('2024-05-20'))).toBe(true);
    });

    it('should check isAfter', () => {
      expect(baseDate.isAfter(earlierDate)).toBe(true);
      expect(baseDate.isAfter(laterDate)).toBe(false);
      expect(baseDate.isAfter(new Date('2024-05-10'))).toBe(true);
    });

    it('should check isSame', () => {
      expect(baseDate.isSame(sameDate)).toBe(true);
      expect(baseDate.isSame(earlierDate)).toBe(false);
    });

    it('should check isBetween inclusive', () => {
      expect(baseDate.isBetween(earlierDate, laterDate, true)).toBe(true);
      expect(baseDate.isBetween(baseDate, laterDate, true)).toBe(true);
      expect(DateBuilder.of(2024, 5, 9).isBetween(earlierDate, laterDate)).toBe(false);
    });

    it('should check isBetween exclusive', () => {
      expect(baseDate.isBetween(earlierDate, laterDate, false)).toBe(true);
      expect(baseDate.isBetween(baseDate, laterDate, false)).toBe(false);
    });

    it('should check isWeekend', () => {
      const saturday = DateBuilder.of(2024, 5, 18); // May 18, 2024 is Saturday
      const sunday = DateBuilder.of(2024, 5, 19); // May 19, 2024 is Sunday
      const monday = DateBuilder.of(2024, 5, 20); // May 20, 2024 is Monday

      expect(saturday.isWeekend()).toBe(true);
      expect(sunday.isWeekend()).toBe(true);
      expect(monday.isWeekend()).toBe(false);
    });

    it('should check isLeapYear', () => {
      expect(DateBuilder.of(2024, 1, 1).isLeapYear()).toBe(true);
      expect(DateBuilder.of(2023, 1, 1).isLeapYear()).toBe(false);
      expect(DateBuilder.of(2000, 1, 1).isLeapYear()).toBe(true);
      expect(DateBuilder.of(1900, 1, 1).isLeapYear()).toBe(false);
    });

    it('should check isPast', () => {
      const pastDate = DateBuilder.of(2020, 1, 1);
      expect(pastDate.isPast()).toBe(true);
    });

    it('should check isFuture', () => {
      const futureDate = DateBuilder.of(2099, 1, 1);
      expect(futureDate.isFuture()).toBe(true);
    });
  });

  describe('Getter Methods', () => {
    const testDate = DateBuilder.of(2024, 5, 15, 14, 30, 45, 500);

    it('should get year', () => {
      expect(testDate.getYear()).toBe(2024);
    });

    it('should get month (1-12)', () => {
      expect(testDate.getMonth()).toBe(5);
    });

    it('should get day', () => {
      expect(testDate.getDay()).toBe(15);
    });

    it('should get date from different DateBuilder instances', () => {
      const builder1 = DateBuilder.of(2024, 6, 20);
      const builder2 = DateBuilder.of(2024, 7, 25);
      expect(builder1.getDay()).toBe(20);
      expect(builder2.getDay()).toBe(25);
    });

    it('should get day of week', () => {
      expect(testDate.getDayOfWeek()).toBeGreaterThanOrEqual(0);
      expect(testDate.getDayOfWeek()).toBeLessThan(7);
    });

    it('should get hour', () => {
      expect(testDate.getHour()).toBe(14);
    });

    it('should get minute', () => {
      expect(testDate.getMinute()).toBe(30);
    });

    it('should get second', () => {
      expect(testDate.getSecond()).toBe(45);
    });

    it('should get millisecond', () => {
      expect(testDate.getMillisecond()).toBe(500);
    });

    it('should get quarter', () => {
      expect(DateBuilder.of(2024, 3, 15).getQuarter()).toBe(1);
      expect(DateBuilder.of(2024, 6, 15).getQuarter()).toBe(2);
      expect(DateBuilder.of(2024, 9, 15).getQuarter()).toBe(3);
      expect(DateBuilder.of(2024, 12, 15).getQuarter()).toBe(4);
    });

    it('should get week of year', () => {
      const week = testDate.getWeekOfYear();
      expect(week).toBeGreaterThan(0);
      expect(week).toBeLessThanOrEqual(53);
    });

    it('should get days in month', () => {
      expect(DateBuilder.of(2024, 1, 15).getDaysInMonth()).toBe(31);
      expect(DateBuilder.of(2024, 2, 15).getDaysInMonth()).toBe(29); // Leap year
      expect(DateBuilder.of(2023, 2, 15).getDaysInMonth()).toBe(28);
      expect(DateBuilder.of(2024, 4, 15).getDaysInMonth()).toBe(30);
    });

    it('should get time (milliseconds)', () => {
      expect(testDate.getTime()).toBe(testDate.build().getTime());
    });

    it('should get unix timestamp (seconds)', () => {
      const timestamp = testDate.getUnixTimestamp();
      expect(timestamp).toBe(Math.floor(testDate.getTime() / 1000));
    });
  });

  describe('Difference Methods', () => {
    const date1 = DateBuilder.of(2024, 5, 15, 10, 30, 0);
    const date2 = DateBuilder.of(2024, 5, 10, 8, 0, 0);

    it('should calculate difference in days', () => {
      const diff = date1.diff(date2, 'days');
      expect(Math.floor(diff)).toBe(5);
    });

    it('should calculate difference in hours', () => {
      const diff = date1.diff(date2, 'hours');
      expect(Math.floor(diff)).toBeGreaterThan(120); // More than 5 days
    });

    it('should calculate difference in minutes', () => {
      const diff = date1.diff(date2, 'minutes');
      expect(diff).toBeGreaterThan(0);
    });

    it('should calculate difference in months', () => {
      const date3 = DateBuilder.of(2024, 8, 15);
      const diff = date1.diff(date3, 'months');
      expect(diff).toBe(-3);
    });

    it('should calculate difference in years', () => {
      const date3 = DateBuilder.of(2026, 5, 15);
      const diff = date1.diff(date3, 'years');
      expect(diff).toBe(-2);
    });

    it('should calculate difference with DateBuilder', () => {
      const diff = date1.diff(date2, 'days');
      expect(Math.floor(diff)).toBe(5);
    });
  });

  describe('Formatting Methods', () => {
    const testDate = DateBuilder.of(2024, 5, 15, 14, 30, 45);

    it('should format with default pattern', () => {
      const formatted = testDate.format();
      expect(formatted).toBe('2024-05-15');
    });

    it('should format with custom pattern string', () => {
      const formatted = testDate.format('yyyy-MM-dd');
      expect(formatted).toBe('2024-05-15');
    });

    it('should format with options object', () => {
      const formatted = testDate.format({ format: 'yyyy-MM-dd HH:mm:ss' });
      expect(formatted).toBe('2024-05-15 14:30:45');
    });

    it('should format relative time', () => {
      const pastDate = DateBuilder.now().subtractDays(1);
      const relative = pastDate.formatRelative();
      expect(relative).toContain('yesterday');
    });

    it('should format as ISO string', () => {
      const iso = testDate.toISOString();
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should format as UTC string', () => {
      const utc = testDate.toUTCString();
      expect(utc).toContain('2024');
    });

    it('should format as date string', () => {
      const dateStr = testDate.toDateString();
      expect(dateStr).toContain('2024');
    });

    it('should format as time string', () => {
      const timeStr = testDate.toTimeString();
      expect(timeStr).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should format as locale string', () => {
      const localeStr = testDate.toLocaleString('en-US');
      expect(localeStr).toContain('2024');
    });

    it('should format as JSON', () => {
      const json = testDate.toJSON();
      expect(json).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('Conversion Methods', () => {
    const testDate = DateBuilder.of(2024, 5, 15, 14, 30, 45);

    it('should build Date object', () => {
      const date = testDate.build();
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2024);
    });

    it('should convert to Date object', () => {
      const date = testDate.toDate();
      expect(date).toBeInstanceOf(Date);
    });

    it('should get valueOf', () => {
      const value = testDate.valueOf();
      expect(typeof value).toBe('number');
      expect(value).toBe(testDate.getTime());
    });

    it('should convert to string', () => {
      const str = testDate.toString();
      expect(typeof str).toBe('string');
      expect(str).toContain('2024');
    });

    it('should create independent Date object', () => {
      const date1 = testDate.build();
      const date2 = testDate.build();
      expect(date1).not.toBe(date2);
      expect(date1.getTime()).toBe(date2.getTime());
    });
  });

  describe('Chaining Methods', () => {
    it('should chain multiple operations', () => {
      const result = DateBuilder.of(2024, 1, 1).addMonths(6).addDays(14).startOfDay().addHours(12).build();

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(6); // July (0-indexed)
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(12);
    });

    it('should chain with immutability', () => {
      const base = DateBuilder.of(2024, 5, 15);
      const step1 = base.addDays(5);
      const step2 = step1.addMonths(2);

      expect(base.getDay()).toBe(15);
      expect(base.getMonth()).toBe(5);
      expect(step1.getDay()).toBe(20);
      expect(step1.getMonth()).toBe(5);
      expect(step2.getMonth()).toBe(7);
    });

    it('should chain complex date manipulations', () => {
      const result = DateBuilder.now().startOfMonth().addMonths(1).subtractDays(1).endOfDay().build();

      // Should be the last second of current month
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
    });
  });
});
