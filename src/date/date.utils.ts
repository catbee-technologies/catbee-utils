/**
 * Format options for the formatDate function
 */
export interface DateFormatOptions {
  /** Date format pattern (default: 'yyyy-MM-dd') */
  format?: string;
  /** Locale to use for formatting (default: system locale) */
  locale?: string | string[];
  /** Time zone to use (default: system time zone) */
  timeZone?: string;
}

/**
 * Format a date according to the specified format pattern.
 *
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * // Format as ISO date
 * formatDate(new Date(), { format: 'yyyy-MM-dd' }); // '2023-05-15'
 *
 * // Format with time
 * formatDate(new Date(), { format: 'yyyy-MM-dd HH:mm:ss' }); // '2023-05-15 14:30:22'
 *
 * // Format with locale
 * formatDate(new Date(), { format: 'PPPP', locale: 'fr-FR' }); // 'lundi 15 mai 2023'
 * ```
 */
export function formatDate(date: Date | number, options: DateFormatOptions = {}): string {
  const { format = 'yyyy-MM-dd', locale, timeZone } = options;
  const d = date instanceof Date ? date : new Date(date);

  // Custom formatter for common patterns
  if (format === 'yyyy-MM-dd') {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (format === 'yyyy-MM-dd HH:mm:ss') {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const MM = String(d.getMinutes()).padStart(2, '0');
    const SS = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
  }
  if (format === 'relative') {
    return formatRelativeTime(date);
  }

  // Fallback to Intl.DateTimeFormat for other formats
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: format.includes('yyyy') || format.includes('y') ? 'numeric' : undefined,
    month: format.includes('MM') || format.includes('M') ? 'numeric' : undefined,
    day: format.includes('dd') || format.includes('d') ? 'numeric' : undefined,
    hour: format.includes('HH') || format.includes('H') ? 'numeric' : undefined,
    minute: format.includes('mm') || format.includes('m') ? 'numeric' : undefined,
    second: format.includes('ss') || format.includes('s') ? 'numeric' : undefined,
    hour12: !format.includes('HH') && !format.includes('H')
  }).format(d);
}

/**
 * Format a date as relative time (e.g., "5 minutes ago", "in 3 days").
 *
 * @param date - Date to format
 * @param now - Reference date (default: current time)
 * @param locale - Locale to use for formatting
 * @returns Formatted relative time string
 */
export function formatRelativeTime(
  date: Date | number,
  now: Date | number = new Date(),
  locale?: string | string[]
): string {
  const d1 = date instanceof Date ? date : new Date(date);
  const d2 = now instanceof Date ? now : new Date(now);

  const diffMs = d1.getTime() - d2.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffSecs) < 60) return formatter.format(diffSecs, 'second');
  if (Math.abs(diffMins) < 60) return formatter.format(diffMins, 'minute');
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour');
  if (Math.abs(diffDays) < 30) return formatter.format(diffDays, 'day');
  if (Math.abs(diffMonths) < 12) return formatter.format(diffMonths, 'month');
  return formatter.format(diffYears, 'year');
}

/**
 * Parse a date string or timestamp into a Date object.
 *
 * @param input - Date string or timestamp to parse
 * @param fallback - Fallback date if parsing fails
 * @returns Parsed Date object or fallback
 *
 * @example
 * ```typescript
 * parseDate('2023-05-15'); // Date object for May 15, 2023
 * parseDate('invalid', new Date()); // Returns current date as fallback
 * ```
 */
export function parseDate(input: string | number, fallback?: Date): Date | null {
  if (typeof input === 'number') {
    return new Date(input);
  }

  try {
    const date = new Date(input);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback || null;
    }
    return date;
  } catch {
    return fallback || null;
  }
}

/**
 * Calculate the difference between two dates in the specified unit.
 *
 * @param date1 - First date
 * @param date2 - Second date (default: current time)
 * @param unit - Unit of time for the difference
 * @returns Difference in the specified unit
 *
 * @example
 * ```typescript
 * // Get difference in days
 * dateDiff(new Date('2023-05-15'), new Date('2023-05-10'), 'days'); // 5
 *
 * // Get difference in hours
 * dateDiff(new Date('2023-05-15T10:00:00'), new Date('2023-05-15T06:00:00'), 'hours'); // 4
 * ```
 */
export function dateDiff(
  date1: Date | number,
  date2: Date | number = new Date(),
  unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years' = 'days'
): number {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);

  const diffMs = d1.getTime() - d2.getTime();

  switch (unit) {
    case 'milliseconds':
      return diffMs;
    case 'seconds':
      return diffMs / 1000;
    case 'minutes':
      return diffMs / (1000 * 60);
    case 'hours':
      return diffMs / (1000 * 60 * 60);
    case 'days':
      return diffMs / (1000 * 60 * 60 * 24);
    case 'months':
      return (d1.getFullYear() - d2.getFullYear()) * 12 + d1.getMonth() - d2.getMonth();
    case 'years':
      return d1.getFullYear() - d2.getFullYear();
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
}

/**
 * Add a specified amount of time to a date.
 *
 * @param date - Base date
 * @param amount - Amount to add (can be negative)
 * @param unit - Unit of time to add
 * @returns New date with the addition
 *
 * @example
 * ```typescript
 * // Add 5 days
 * addToDate(new Date('2023-05-15'), 5, 'days'); // Date for May 20, 2023
 *
 * // Subtract 2 hours
 * addToDate(new Date('2023-05-15T10:00:00'), -2, 'hours'); // Date for May 15, 2023 08:00:00
 * ```
 */
export function addToDate(
  date: Date | number,
  amount: number,
  unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'
): Date {
  const d = date instanceof Date ? new Date(date) : new Date(date);

  switch (unit) {
    case 'milliseconds':
      d.setMilliseconds(d.getMilliseconds() + amount);
      break;
    case 'seconds':
      d.setSeconds(d.getSeconds() + amount);
      break;
    case 'minutes':
      d.setMinutes(d.getMinutes() + amount);
      break;
    case 'hours':
      d.setHours(d.getHours() + amount);
      break;
    case 'days':
      d.setDate(d.getDate() + amount);
      break;
    case 'months': {
      const origDate = d.getDate();
      const origMonth = d.getMonth();
      d.setDate(1); // Prevent overflow
      d.setMonth(origMonth + amount);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(origDate, lastDay));
      break;
    }
    case 'years':
      d.setFullYear(d.getFullYear() + amount);
      break;
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }

  return d;
}

/**
 * Get the start of a time period containing the specified date.
 *
 * @param date - Date to get the start from
 * @param unit - Time unit
 * @returns Date object representing the start of the time unit
 *
 * @example
 * ```typescript
 * // Get start of day (midnight)
 * startOf(new Date('2023-05-15T14:30:00'), 'day'); // Date for May 15, 2023 00:00:00
 *
 * // Get start of month
 * startOf(new Date('2023-05-15'), 'month'); // Date for May 1, 2023
 * ```
 */
export function startOf(
  date: Date | number,
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
): Date {
  const d = date instanceof Date ? new Date(date) : new Date(date);

  switch (unit) {
    case 'second':
      d.setMilliseconds(0);
      break;
    case 'minute':
      d.setSeconds(0, 0);
      break;
    case 'hour':
      d.setMinutes(0, 0, 0);
      break;
    case 'day':
      d.setHours(0, 0, 0, 0);
      break;
    case 'week':
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - d.getDay());
      break;
    case 'month':
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      break;
    case 'quarter':
      d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
      d.setHours(0, 0, 0, 0);
      break;
    case 'year':
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      break;
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }

  return d;
}

/**
 * Get the end of a time period containing the specified date.
 *
 * @param date - Date to get the end from
 * @param unit - Time unit
 * @returns Date object representing the end of the time unit
 *
 * @example
 * ```typescript
 * // Get end of day (23:59:59.999)
 * endOf(new Date('2023-05-15T14:30:00'), 'day'); // Date for May 15, 2023 23:59:59.999
 *
 * // Get end of month
 * endOf(new Date('2023-05-15'), 'month'); // Date for May 31, 2023 23:59:59.999
 * ```
 */
export function endOf(
  date: Date | number,
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
): Date {
  const d = date instanceof Date ? new Date(date) : new Date(date);

  switch (unit) {
    case 'second':
      d.setMilliseconds(999);
      break;
    case 'minute':
      d.setSeconds(59, 999);
      break;
    case 'hour':
      d.setMinutes(59, 59, 999);
      break;
    case 'day':
      d.setHours(23, 59, 59, 999);
      break;
    case 'week':
      d.setDate(d.getDate() - d.getDay() + 6);
      d.setHours(23, 59, 59, 999);
      break;
    case 'month':
      d.setMonth(d.getMonth() + 1, 0);
      d.setHours(23, 59, 59, 999);
      break;
    case 'quarter':
      d.setMonth(Math.floor(d.getMonth() / 3) * 3 + 3, 0);
      d.setHours(23, 59, 59, 999);
      break;
    case 'year':
      d.setMonth(11, 31);
      d.setHours(23, 59, 59, 999);
      break;
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }

  return d;
}

/**
 * Check if a date is between two other dates.
 *
 * @param date - Date to check
 * @param start - Start date of the range
 * @param end - End date of the range
 * @param inclusive - Whether the comparison should be inclusive of start/end
 * @returns True if the date is within the range
 *
 * @example
 * ```typescript
 * const date = new Date('2023-05-15');
 * const start = new Date('2023-05-10');
 * const end = new Date('2023-05-20');
 *
 * isBetween(date, start, end); // true
 * ```
 */
export function isBetween(
  date: Date | number,
  start: Date | number,
  end: Date | number,
  inclusive: boolean = true
): boolean {
  const d = date instanceof Date ? date.getTime() : date;
  const s = start instanceof Date ? start.getTime() : start;
  const e = end instanceof Date ? end.getTime() : end;

  return inclusive ? d >= s && d <= e : d > s && d < e;
}

/**
 * Check if a year is a leap year.
 *
 * @param year - Year to check (or date object)
 * @returns True if the year is a leap year
 */
export function isLeapYear(year: number | Date): boolean {
  const y = year instanceof Date ? year.getFullYear() : year;
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/**
 * Get the number of days in a month.
 *
 * @param year - Year
 * @param month - Month (0-11)
 * @returns Number of days in the month
 */
export function daysInMonth(year: number | Date, month?: number): number {
  if (year instanceof Date) {
    month = year.getMonth();
    year = year.getFullYear();
  }

  if (month === undefined) {
    throw new Error('Month is required when year is a number');
  }

  return new Date(year, month + 1, 0).getDate();
}

/**
 * Format a duration given in milliseconds to a human readable string.
 * Examples: 3661000 -> "1h 1m 1s", 90061 -> "1m 30s 61ms"
 *
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Human readable duration
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0ms';
  const parts: string[] = [];
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days) {
    parts.push(`${days}d`);
    ms -= days * 24 * 60 * 60 * 1000;
  }
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours) {
    parts.push(`${hours}h`);
    ms -= hours * 60 * 60 * 1000;
  }
  const minutes = Math.floor(ms / (60 * 1000));
  if (minutes) {
    parts.push(`${minutes}m`);
    ms -= minutes * 60 * 1000;
  }
  const seconds = Math.floor(ms / 1000);
  if (seconds) {
    parts.push(`${seconds}s`);
    ms -= seconds * 1000;
  }
  if (ms > 0) parts.push(`${ms}ms`);
  return parts.join(' ');
}
