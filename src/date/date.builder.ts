import {
  addToDate,
  startOf,
  endOf,
  isBetween,
  isToday,
  isFuture,
  isPast,
  isWeekend,
  isLeapYear,
  quarterOf,
  weekOfYear,
  daysInMonth,
  dateDiff,
  getDateFromDuration,
  DateFormatOptions,
  formatDate,
  formatRelativeTime,
  formatDateInTimeZone,
  toTimeZone,
  getTimezoneOffset,
  isDST,
  getTimezoneAbbreviation
} from './date.utils';

/**
 * DateBuilder class for fluent date manipulation and building.
 * Provides a chainable API similar to Java's date builders.
 * All methods return a new instance, making it immutable.
 *
 * @example
 * ```typescript
 * // Create a date builder
 * const date = new DateBuilder()
 *   .year(2024)
 *   .month(5)
 *   .day(15)
 *   .hour(14)
 *   .minute(30)
 *   .build();
 *
 * // Chain operations
 * const nextWeek = new DateBuilder()
 *   .addDays(7)
 *   .startOfDay()
 *   .build();
 *
 * // Use with existing date
 * const modified = DateBuilder.from(new Date())
 *   .addMonths(2)
 *   .endOfMonth()
 *   .format('yyyy-MM-dd');
 * ```
 */
export class DateBuilder {
  private readonly date: Date;

  /**
   * Creates a new DateBuilder instance.
   * @param date - Initial date (default: current date/time)
   */
  constructor(date?: Date | number | string) {
    if (date === undefined) {
      this.date = new Date();
    } else if (date instanceof Date) {
      this.date = new Date(date);
    } else if (typeof date === 'number') {
      this.date = new Date(date);
    } else {
      this.date = new Date(date);
    }
  }

  /**
   * Create a DateBuilder from an existing date.
   * @param date - Date to build from
   */
  static from(date: Date | number | string): DateBuilder {
    return new DateBuilder(date);
  }

  /**
   * Create a DateBuilder for the current moment.
   */
  static now(): DateBuilder {
    return new DateBuilder();
  }

  /**
   * Create a DateBuilder for a specific date.
   * @param year - Year
   * @param month - Month (1-12, not 0-11)
   * @param day - Day of month
   * @param hour - Hour (default: 0)
   * @param minute - Minute (default: 0)
   * @param second - Second (default: 0)
   * @param millisecond - Millisecond (default: 0)
   */
  static of(
    year: number,
    month: number,
    day: number,
    hour: number = 0,
    minute: number = 0,
    second: number = 0,
    millisecond: number = 0
  ): DateBuilder {
    const d = new Date(year, month - 1, day, hour, minute, second, millisecond);
    return new DateBuilder(d);
  }

  /**
   * Parse a date string into a DateBuilder.
   * @param dateString - Date string to parse
   */
  static parse(dateString: string): DateBuilder {
    return new DateBuilder(new Date(dateString));
  }

  /**
   * Create a DateBuilder from a duration string (e.g., "5m", "2h", "1d" from now).
   * @param duration - Duration string
   */
  static fromDuration(duration: string): DateBuilder {
    return new DateBuilder(getDateFromDuration(duration));
  }

  /**
   * Clone this DateBuilder instance.
   */
  clone(): DateBuilder {
    return new DateBuilder(this.date);
  }

  // ========== Setters (return new instance) ==========

  /**
   * Set the year.
   * @param year - Year to set
   */
  year(year: number): DateBuilder {
    const newDate = new Date(this.date);
    newDate.setFullYear(year);
    return new DateBuilder(newDate);
  }

  /**
   * Set the month (1-12, not 0-11).
   * @param month - Month to set (1-12)
   */
  month(month: number): DateBuilder {
    const newDate = new Date(this.date);
    newDate.setMonth(month - 1);
    return new DateBuilder(newDate);
  }

  /**
   * Set the day of the month.
   * @param day - Day to set
   */
  day(day: number): DateBuilder {
    const newDate = new Date(this.date);
    newDate.setDate(day);
    return new DateBuilder(newDate);
  }

  /**
   * Set the hour.
   * @param hour - Hour to set
   */
  hour(hour: number): DateBuilder {
    const newDate = new Date(this.date);
    newDate.setHours(hour);
    return new DateBuilder(newDate);
  }

  /**
   * Set the minute.
   * @param minute - Minute to set
   */
  minute(minute: number): DateBuilder {
    const newDate = new Date(this.date);
    newDate.setMinutes(minute);
    return new DateBuilder(newDate);
  }

  /**
   * Set the second.
   * @param second - Second to set
   */
  second(second: number): DateBuilder {
    const newDate = new Date(this.date);
    newDate.setSeconds(second);
    return new DateBuilder(newDate);
  }

  /**
   * Set the millisecond.
   * @param millisecond - Millisecond to set
   */
  millisecond(millisecond: number): DateBuilder {
    const newDate = new Date(this.date);
    newDate.setMilliseconds(millisecond);
    return new DateBuilder(newDate);
  }

  // ========== Addition/Subtraction Methods ==========

  /**
   * Add years to the date.
   * @param years - Number of years to add (can be negative)
   */
  addYears(years: number): DateBuilder {
    return new DateBuilder(addToDate(this.date, years, 'years'));
  }

  /**
   * Add months to the date.
   * @param months - Number of months to add (can be negative)
   */
  addMonths(months: number): DateBuilder {
    return new DateBuilder(addToDate(this.date, months, 'months'));
  }

  /**
   * Add days to the date.
   * @param days - Number of days to add (can be negative)
   */
  addDays(days: number): DateBuilder {
    return new DateBuilder(addToDate(this.date, days, 'days'));
  }

  /**
   * Add hours to the date.
   * @param hours - Number of hours to add (can be negative)
   */
  addHours(hours: number): DateBuilder {
    return new DateBuilder(addToDate(this.date, hours, 'hours'));
  }

  /**
   * Add minutes to the date.
   * @param minutes - Number of minutes to add (can be negative)
   */
  addMinutes(minutes: number): DateBuilder {
    return new DateBuilder(addToDate(this.date, minutes, 'minutes'));
  }

  /**
   * Add seconds to the date.
   * @param seconds - Number of seconds to add (can be negative)
   */
  addSeconds(seconds: number): DateBuilder {
    return new DateBuilder(addToDate(this.date, seconds, 'seconds'));
  }

  /**
   * Add milliseconds to the date.
   * @param milliseconds - Number of milliseconds to add (can be negative)
   */
  addMilliseconds(milliseconds: number): DateBuilder {
    return new DateBuilder(addToDate(this.date, milliseconds, 'milliseconds'));
  }

  /**
   * Subtract years from the date.
   * @param years - Number of years to subtract
   */
  subtractYears(years: number): DateBuilder {
    return this.addYears(-years);
  }

  /**
   * Subtract months from the date.
   * @param months - Number of months to subtract
   */
  subtractMonths(months: number): DateBuilder {
    return this.addMonths(-months);
  }

  /**
   * Subtract days from the date.
   * @param days - Number of days to subtract
   */
  subtractDays(days: number): DateBuilder {
    return this.addDays(-days);
  }

  /**
   * Subtract hours from the date.
   * @param hours - Number of hours to subtract
   */
  subtractHours(hours: number): DateBuilder {
    return this.addHours(-hours);
  }

  /**
   * Subtract minutes from the date.
   * @param minutes - Number of minutes to subtract
   */
  subtractMinutes(minutes: number): DateBuilder {
    return this.addMinutes(-minutes);
  }

  /**
   * Subtract seconds from the date.
   * @param seconds - Number of seconds to subtract
   */
  subtractSeconds(seconds: number): DateBuilder {
    return this.addSeconds(-seconds);
  }

  // ========== Start/End of Period Methods ==========

  /**
   * Set to the start of the second.
   */
  startOfSecond(): DateBuilder {
    return new DateBuilder(startOf(this.date, 'second'));
  }

  /**
   * Set to the start of the minute.
   */
  startOfMinute(): DateBuilder {
    return new DateBuilder(startOf(this.date, 'minute'));
  }

  /**
   * Set to the start of the hour.
   */
  startOfHour(): DateBuilder {
    return new DateBuilder(startOf(this.date, 'hour'));
  }

  /**
   * Set to the start of the day (midnight).
   */
  startOfDay(): DateBuilder {
    return new DateBuilder(startOf(this.date, 'day'));
  }

  /**
   * Set to the start of the week (Sunday).
   */
  startOfWeek(): DateBuilder {
    return new DateBuilder(startOf(this.date, 'week'));
  }

  /**
   * Set to the start of the month.
   */
  startOfMonth(): DateBuilder {
    return new DateBuilder(startOf(this.date, 'month'));
  }

  /**
   * Set to the start of the quarter.
   */
  startOfQuarter(): DateBuilder {
    return new DateBuilder(startOf(this.date, 'quarter'));
  }

  /**
   * Set to the start of the year.
   */
  startOfYear(): DateBuilder {
    return new DateBuilder(startOf(this.date, 'year'));
  }

  /**
   * Set to the end of the second.
   */
  endOfSecond(): DateBuilder {
    return new DateBuilder(endOf(this.date, 'second'));
  }

  /**
   * Set to the end of the minute.
   */
  endOfMinute(): DateBuilder {
    return new DateBuilder(endOf(this.date, 'minute'));
  }

  /**
   * Set to the end of the hour.
   */
  endOfHour(): DateBuilder {
    return new DateBuilder(endOf(this.date, 'hour'));
  }

  /**
   * Set to the end of the day (23:59:59.999).
   */
  endOfDay(): DateBuilder {
    return new DateBuilder(endOf(this.date, 'day'));
  }

  /**
   * Set to the end of the week (Saturday).
   */
  endOfWeek(): DateBuilder {
    return new DateBuilder(endOf(this.date, 'week'));
  }

  /**
   * Set to the end of the month.
   */
  endOfMonth(): DateBuilder {
    return new DateBuilder(endOf(this.date, 'month'));
  }

  /**
   * Set to the end of the quarter.
   */
  endOfQuarter(): DateBuilder {
    return new DateBuilder(endOf(this.date, 'quarter'));
  }

  /**
   * Set to the end of the year.
   */
  endOfYear(): DateBuilder {
    return new DateBuilder(endOf(this.date, 'year'));
  }

  // ========== Comparison Methods ==========

  /**
   * Check if the date is before another date.
   * @param other - Date to compare with
   */
  isBefore(other: Date | DateBuilder): boolean {
    const otherDate = other instanceof DateBuilder ? other.toDate() : other;
    return this.date.getTime() < otherDate.getTime();
  }

  /**
   * Check if the date is after another date.
   * @param other - Date to compare with
   */
  isAfter(other: Date | DateBuilder): boolean {
    const otherDate = other instanceof DateBuilder ? other.toDate() : other;
    return this.date.getTime() > otherDate.getTime();
  }

  /**
   * Check if the date is the same as another date.
   * @param other - Date to compare with
   */
  isSame(other: Date | DateBuilder): boolean {
    const otherDate = other instanceof DateBuilder ? other.toDate() : other;
    return this.date.getTime() === otherDate.getTime();
  }

  /**
   * Check if the date is between two dates.
   * @param start - Start date
   * @param end - End date
   * @param inclusive - Whether to include boundaries
   */
  isBetween(start: Date | DateBuilder, end: Date | DateBuilder, inclusive: boolean = true): boolean {
    const startDate = start instanceof DateBuilder ? start.toDate() : start;
    const endDate = end instanceof DateBuilder ? end.toDate() : end;
    return isBetween(this.date, startDate, endDate, inclusive);
  }

  /**
   * Check if the date is today.
   */
  isToday(): boolean {
    return isToday(this.date);
  }

  /**
   * Check if the date is in the future.
   */
  isFuture(): boolean {
    return isFuture(this.date);
  }

  /**
   * Check if the date is in the past.
   */
  isPast(): boolean {
    return isPast(this.date);
  }

  /**
   * Check if the date is on a weekend.
   */
  isWeekend(): boolean {
    return isWeekend(this.date);
  }

  /**
   * Check if the year is a leap year.
   */
  isLeapYear(): boolean {
    return isLeapYear(this.date);
  }

  // ========== Getters ==========

  /**
   * Get the year.
   */
  getYear(): number {
    return this.date.getFullYear();
  }

  /**
   * Get the month (1-12, not 0-11).
   */
  getMonth(): number {
    return this.date.getMonth() + 1;
  }

  /**
   * Get the day of the month.
   */
  getDay(): number {
    return this.date.getDate();
  }

  /**
   * Get the day of the week (0-6, Sunday is 0).
   */
  getDayOfWeek(): number {
    return this.date.getDay();
  }

  /**
   * Get the hour.
   */
  getHour(): number {
    return this.date.getHours();
  }

  /**
   * Get the minute.
   */
  getMinute(): number {
    return this.date.getMinutes();
  }

  /**
   * Get the second.
   */
  getSecond(): number {
    return this.date.getSeconds();
  }

  /**
   * Get the millisecond.
   */
  getMillisecond(): number {
    return this.date.getMilliseconds();
  }

  /**
   * Get the quarter (1-4).
   */
  getQuarter(): 1 | 2 | 3 | 4 {
    return quarterOf(this.date);
  }

  /**
   * Get the ISO week number.
   */
  getWeekOfYear(): number {
    return weekOfYear(this.date);
  }

  /**
   * Get the number of days in the current month.
   */
  getDaysInMonth(): number {
    return daysInMonth(this.date);
  }

  /**
   * Get the Unix timestamp in milliseconds.
   */
  getTime(): number {
    return this.date.getTime();
  }

  /**
   * Get the Unix timestamp in seconds.
   */
  getUnixTimestamp(): number {
    return Math.floor(this.date.getTime() / 1000);
  }

  // ========== Difference Methods ==========

  /**
   * Calculate the difference from another date.
   * @param other - Date to compare with
   * @param unit - Unit of time
   */
  diff(
    other: Date | DateBuilder,
    unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years' = 'milliseconds'
  ): number {
    const otherDate = other instanceof DateBuilder ? other.toDate() : other;
    return dateDiff(this.date, otherDate, unit);
  }

  /**
   * Get the difference from now.
   * @param unit - Unit of time
   */
  diffFromNow(
    unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years' = 'milliseconds'
  ): number {
    return dateDiff(this.date, new Date(), unit);
  }

  // ========== Formatting Methods ==========

  /**
   * Format the date.
   * @param options - Formatting options
   */
  format(options?: DateFormatOptions | string): string {
    if (typeof options === 'string') {
      return formatDate(this.date, { format: options });
    }
    return formatDate(this.date, options);
  }

  /**
   * Format as relative time (e.g., "5 minutes ago").
   * @param locale - Locale for formatting
   */
  formatRelative(locale?: string | string[]): string {
    return formatRelativeTime(this.date, new Date(), locale);
  }

  /**
   * Format as ISO 8601 string.
   */
  toISOString(): string {
    return this.date.toISOString();
  }

  /**
   * Format as UTC string.
   */
  toUTCString(): string {
    return this.date.toUTCString();
  }

  /**
   * Format as date string.
   */
  toDateString(): string {
    return this.date.toDateString();
  }

  /**
   * Format as time string.
   */
  toTimeString(): string {
    return this.date.toTimeString();
  }

  /**
   * Format as locale string.
   */
  toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string {
    return this.date.toLocaleString(locales, options);
  }

  /**
   * Convert to JSON string.
   */
  toJSON(): string {
    return this.date.toJSON();
  }

  // ========== Conversion Methods ==========

  /**
   * Build and return the Date object.
   */
  build(): Date {
    return new Date(this.date);
  }

  /**
   * Get the Date object (alias for build).
   */
  toDate(): Date {
    return new Date(this.date);
  }

  /**
   * Get the internal Date object value.
   */
  valueOf(): number {
    return this.date.valueOf();
  }

  /**
   * Convert to string.
   */
  toString(): string {
    return this.date.toString();
  }

  // ========== Timezone Methods ==========

  /**
   * Format the date in a specific timezone.
   * @param timeZone - IANA timezone identifier (e.g., 'America/New_York')
   * @param format - Format pattern (default: 'yyyy-MM-dd HH:mm:ss')
   */
  formatInTimeZone(timeZone: string, format: string = 'yyyy-MM-dd HH:mm:ss'): string {
    return formatDateInTimeZone(this.date, timeZone, format);
  }

  /**
   * Get the wall-clock components in a specific timezone.
   * @param timeZone - IANA timezone identifier
   */
  toTimeZone(timeZone: string) {
    return toTimeZone(this.date, timeZone);
  }

  /**
   * Get the UTC offset in minutes for a specific timezone at this date's instant.
   * @param timeZone - IANA timezone identifier
   */
  getTimezoneOffset(timeZone: string): number {
    return getTimezoneOffset(timeZone, this.date);
  }

  /**
   * Check if the specified timezone is observing DST at this date's instant.
   * @param timeZone - IANA timezone identifier
   */
  isDST(timeZone: string): boolean {
    return isDST(timeZone, this.date);
  }

  /**
   * Get the timezone abbreviation (e.g., 'EST', 'EDT') for a specific timezone.
   * @param timeZone - IANA timezone identifier
   */
  getTimezoneAbbreviation(timeZone: string): string {
    return getTimezoneAbbreviation(timeZone, this.date);
  }
}
