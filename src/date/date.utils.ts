/**
 * Named date format presets
 *
 * | Preset        | Equivalent                            | Example (en-US)                                    |
 * |---------------|---------------------------------------|----------------------------------------------------|
 * | 'short'       | 'M/d/yy, h:mm a'                      | 6/15/15, 9:03 AM                                   |
 * | 'medium'      | 'MMM d, y, h:mm:ss a'                 | Jun 15, 2015, 9:03:01 AM                           |
 * | 'long'        | 'MMMM d, y, h:mm:ss a z'              | June 15, 2015 at 9:03:01 AM GMT+1                  |
 * | 'full'        | 'EEEE, MMMM d, y, h:mm:ss a zzzz'     | Monday, June 15, 2015 at 9:03:01 AM GMT+01:00      |
 * | 'shortDate'   | 'M/d/yy'                              | 6/15/15                                            |
 * | 'mediumDate'  | 'MMM d, y'                            | Jun 15, 2015                                       |
 * | 'longDate'    | 'MMMM d, y'                           | June 15, 2015                                      |
 * | 'fullDate'    | 'EEEE, MMMM d, y'                     | Monday, June 15, 2015                              |
 * | 'shortTime'   | 'h:mm a'                              | 9:03 AM                                            |
 * | 'mediumTime'  | 'h:mm:ss a'                           | 9:03:01 AM                                         |
 * | 'longTime'    | 'h:mm:ss a z'                         | 9:03:01 AM GMT+1                                   |
 * | 'fullTime'    | 'h:mm:ss a zzzz'                      | 9:03:01 AM GMT+01:00                               |
 */
export type DateFormatPreset =
  | 'short'
  | 'medium'
  | 'long'
  | 'full'
  | 'shortDate'
  | 'mediumDate'
  | 'longDate'
  | 'fullDate'
  | 'shortTime'
  | 'mediumTime'
  | 'longTime'
  | 'fullTime';

/**
 * Format options for the formatDate function
 */
export interface DateFormatOptions {
  /** Date format pattern, named preset, or 'relative' (default: 'yyyy-MM-dd') */
  format?: DateFormatPreset | string;
  /** Locale to use for formatting (default: system locale) */
  locale?: string | string[];
  /** Time zone to use (default: system time zone) */
  timeZone?: string;
}

/** @internal Intl options for each named preset */
const DATE_FORMAT_PRESETS: Record<DateFormatPreset, Intl.DateTimeFormatOptions> = {
  short: { year: '2-digit', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true },
  medium: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  },
  long: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
    timeZoneName: 'short'
  },
  full: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
    timeZoneName: 'long'
  },
  shortDate: { year: '2-digit', month: 'numeric', day: 'numeric' },
  mediumDate: { year: 'numeric', month: 'short', day: 'numeric' },
  longDate: { year: 'numeric', month: 'long', day: 'numeric' },
  fullDate: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  shortTime: { hour: 'numeric', minute: 'numeric', hour12: true },
  mediumTime: { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true },
  longTime: { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true, timeZoneName: 'short' },
  fullTime: { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true, timeZoneName: 'long' }
};

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

  // Custom formatter for common patterns (use fast path only when no timeZone override)
  if (format === 'yyyy-MM-dd' && !timeZone) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (format === 'yyyy-MM-dd' && timeZone) {
    return formatDateInTimeZone(d, timeZone, 'yyyy-MM-dd');
  }
  if (format === 'yyyy-MM-dd HH:mm:ss' && !timeZone) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const MM = String(d.getMinutes()).padStart(2, '0');
    const SS = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
  }
  if (format === 'yyyy-MM-dd HH:mm:ss' && timeZone) {
    return formatDateInTimeZone(d, timeZone, 'yyyy-MM-dd HH:mm:ss');
  }
  if (format === 'relative') {
    return formatRelativeTime(date);
  }

  // Named preset formats
  if (Object.hasOwn(DATE_FORMAT_PRESETS, format)) {
    return new Intl.DateTimeFormat(locale, {
      ...DATE_FORMAT_PRESETS[format as DateFormatPreset],
      timeZone
    }).format(d);
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
 * **Timezone Behavior:**
 * - Date-only strings (e.g., '2023-05-15') are parsed as **local midnight**,
 *   not UTC midnight (differs from `new Date()` native behavior)
 * - ISO strings with timezone (e.g., '2023-05-15T10:30:00Z') use the specified timezone
 * - This follows Luxon's "local time first" philosophy
 *
 * @param input - Date string or timestamp to parse
 * @param fallback - Fallback date if parsing fails
 * @returns Parsed Date object or fallback
 *
 * @example
 * ```typescript
 * parseDate('2023-05-15'); // Local midnight on May 15, 2023
 * parseDate('2023-05-15T10:30:00Z'); // 10:30 AM UTC on May 15, 2023
 * parseDate('invalid', new Date()); // Returns current date as fallback
 * ```
 */
export function parseDate(input: string | number, fallback?: Date): Date | null {
  if (typeof input === 'number') return new Date(input);

  if (!/^\d{4}-\d{2}-\d{2}/.test(input)) {
    return fallback ?? null;
  }

  const date = new Date(input.includes('T') ? input : input + 'T00:00:00');

  return Number.isNaN(date.getTime()) ? (fallback ?? null) : date;
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
    case 'days': {
      // Use calendar-day counting to avoid DST issues (23h/25h days)
      const n1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
      const n2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
      return Math.round((n1.getTime() - n2.getTime()) / (1000 * 60 * 60 * 24));
    }
    case 'months':
      return (d1.getFullYear() - d2.getFullYear()) * 12 + d1.getMonth() - d2.getMonth();
    case 'years':
      return d1.getFullYear() - d2.getFullYear();
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
}

/**
 * Calculate the difference in calendar days between two dates as observed in a specific timezone.
 * Both dates are converted to calendar year/month/day values in the supplied IANA timezone, and
 * the difference between those calendar dates is returned.
 *
 * JavaScript `Date` instances do not retain timezone identity, so this function does not detect
 * whether the input dates originated from different timezones.
 *
 * @param d1 - First date
 * @param d2 - Second date
 * @param tz - IANA timezone identifier used to interpret both dates (e.g., 'America/New_York')
 * @return Number of calendar days difference between the two dates in the specified timezone
 * @throws {RangeError} If `tz` is not a valid IANA timezone identifier, as thrown by the underlying `Intl` APIs
 * @example
 * ```typescript
 * // Calculate days difference in New York timezone
 * dateDiffDaysTZ(new Date('2023-05-15T00:00:00'), new Date('2023-05-14T23:00:00'), 'America/New_York'); // 1
 * ```
 */
export function dateDiffDaysTZ(d1: Date, d2: Date, tz: string): number {
  const p1 = getTimeZoneParts(d1, tz);
  const p2 = getTimeZoneParts(d2, tz);

  const a = Date.UTC(p1.year, p1.month - 1, p1.day);
  const b = Date.UTC(p2.year, p2.month - 1, p2.day);

  return Math.round((a - b) / 86400000);
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
  unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years',
  options?: { timeZone?: string }
): Date {
  const d = new Date(date);

  // ABSOLUTE units
  if (unit === 'milliseconds') return new Date(d.getTime() + amount);
  if (unit === 'seconds') return new Date(d.getTime() + amount * 1000);
  if (unit === 'minutes') return new Date(d.getTime() + amount * 60_000);
  if (unit === 'hours') return new Date(d.getTime() + amount * 3_600_000);

  // CALENDAR units
  const tz = options?.timeZone;

  if (!tz) {
    // Use local time for calendar operations with clamping
    if (unit === 'days') return addDays(d, amount);

    if (unit === 'months') {
      const targetMonth = d.getMonth() + amount;
      const targetYear = d.getFullYear() + Math.floor(targetMonth / 12);
      const normalizedMonth = ((targetMonth % 12) + 12) % 12;
      const day = d.getDate();

      // Get last day of target month
      const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
      const clampedDay = Math.min(day, lastDay);

      return new Date(
        targetYear,
        normalizedMonth,
        clampedDay,
        d.getHours(),
        d.getMinutes(),
        d.getSeconds(),
        d.getMilliseconds()
      );
    }

    if (unit === 'years') {
      const targetYear = d.getFullYear() + amount;
      const month = d.getMonth();
      const day = d.getDate();

      // Get last day of target month
      const lastDay = new Date(targetYear, month + 1, 0).getDate();
      const clampedDay = Math.min(day, lastDay);

      return new Date(targetYear, month, clampedDay, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
    }

    throw new Error(`Unsupported unit: ${unit}`);
  }

  const parts = getTimeZoneParts(d, tz as string);
  const ms = d.getMilliseconds();

  const result = {
    ...parts,
    day: parts.day,
    month: parts.month,
    year: parts.year,
    millisecond: ms
  };

  if (unit === 'days') result.day += amount;
  if (unit === 'months') {
    result.month += amount;
    // Normalize month to 1-12 range
    result.year += Math.floor((result.month - 1) / 12);
    result.month = ((((result.month - 1) % 12) + 12) % 12) + 1;
    // Clamp day to last day of target month (use UTC to avoid timezone issues)
    const lastDay = new Date(Date.UTC(result.year, result.month, 0)).getUTCDate();
    result.day = Math.min(result.day, lastDay);
  }
  if (unit === 'years') {
    result.year += amount;
    const lastDay = new Date(Date.UTC(result.year, result.month, 0)).getUTCDate();
    result.day = Math.min(result.day, lastDay);
  }

  return zonedTimeToUtc(result, tz as string);
}

/**
 * Convert wall-clock time components in a specific timezone to a UTC Date.
 * Uses double-offset technique to handle DST transitions.
 *
 * **DST Handling:**
 * - Spring forward (gap): Returns time after the transition
 * - Fall back (overlap): Returns the first occurrence (pre-transition)
 *
 * @internal
 */
function zonedTimeToUtc(
  parts: {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
  },
  timeZone: string
): Date {
  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour ?? 0, parts.minute ?? 0, parts.second ?? 0)
  );

  // First offset
  const offset1 = getTimezoneOffset(timeZone, utcGuess);
  const adjusted = new Date(utcGuess.getTime() - offset1 * 60_000);

  // Recalculate offset after adjustment (handles DST transitions)
  const offset2 = getTimezoneOffset(timeZone, adjusted);

  const result = offset1 !== offset2 ? new Date(utcGuess.getTime() - offset2 * 60_000) : adjusted;

  // Preserve milliseconds if provided
  if (parts.millisecond !== undefined) {
    result.setMilliseconds(parts.millisecond);
  }

  return result;
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
  const d = new Date(date);

  switch (unit) {
    case 'second':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), 0);

    case 'minute':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), 0, 0);

    case 'hour':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 0, 0, 0);

    case 'day':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());

    case 'week': {
      const day = d.getDay();
      const diff = -day; // Go back to Sunday (day 0)
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
    }

    case 'month':
      return new Date(d.getFullYear(), d.getMonth(), 1);

    case 'quarter':
      return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);

    case 'year':
      return new Date(d.getFullYear(), 0, 1);

    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
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
  const d = new Date(date);

  switch (unit) {
    case 'second':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), 999);

    case 'minute':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), 59, 999);

    case 'hour':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 59, 59, 999);

    case 'day':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    case 'week': {
      const day = d.getDay();
      const diff = 6 - day; // Goto Saturday (day 6)
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff, 23, 59, 59, 999);
    }

    case 'month':
      return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    case 'quarter':
      return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3 + 3, 0, 23, 59, 59, 999);

    case 'year':
      return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);

    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
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

/**
 * Parse a duration string or number into milliseconds.
 * Supports formats like: 1y, 2w, 3d, 4h, 5m, 6s, 7ms, 1w2d3h, or plain milliseconds like "60000"
 *
 * @param value - Duration string or number
 * @returns Milliseconds
 */
export function parseDuration(value: string | number): number {
  const MAX_SAFE = Number.MAX_SAFE_INTEGER;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.min(value, MAX_SAFE);
  if (typeof value !== 'string' || !value.trim()) return 0;
  if (/^\d+$/.test(value)) return Math.min(Number(value), MAX_SAFE);

  const val = value.replace(/\s+/g, '').toLowerCase();
  const unitMap: Record<string, number> = {
    y: 31_536_000_000,
    w: 604_800_000,
    d: 86_400_000,
    h: 3_600_000,
    m: 60_000,
    s: 1_000,
    ms: 1
  };

  const unitKeys = Object.keys(unitMap).sort((a, b) => b.length - a.length);

  let total = 0;
  let i = 0;

  while (i < val.length) {
    const start = i;
    while (i < val.length && /\d/.test(val[i])) i++;
    if (start === i) {
      throw new Error(`Invalid duration at offset ${i} in "${value}"`);
    }

    const num = Number(val.slice(start, i));
    if (!Number.isSafeInteger(num)) throw new Error(`Invalid number at offset ${start} in "${value}"`);

    const unit = unitKeys.find(u => val.startsWith(u, i));
    if (!unit) throw new Error(`Unknown unit at offset ${i} in "${value}"`);

    const add = num * unitMap[unit];
    total = Math.min(total + add, MAX_SAFE);
    i += unit.length;
  }

  return total;
}

/**
 * Convert a duration string into a Date object representing the future time.
 *
 * @param input - Duration string (e.g., "5m", "2h", "1d")
 * @returns Date object representing the future time
 *
 * @example
 * ```typescript
 * toDateFromNow("5m"); // Date object 5 minutes from now
 * toDateFromNow("2h"); // Date object 2 hours from now
 * ```
 */
export function getDateFromDuration(input: string): Date {
  const ms = parseDuration(input);
  if (ms <= 0) {
    throw new Error(`Invalid duration: "${input}". Duration must be a positive value.`);
  }
  return new Date(Date.now() + ms);
}

/**
 * Checks if a date is on a weekend (Saturday or Sunday).
 *
 * @param {Date | number} date - The date to check.
 * @returns {boolean} True if weekend.
 *
 * @example
 * isWeekend(new Date('2024-01-06')); // true (Saturday)
 */
export function isWeekend(date: Date | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Checks if a date is today.
 *
 * @param {Date | number} date - The date to check.
 * @returns {boolean} True if today.
 *
 * @example
 * isToday(new Date()); // true
 */
export function isToday(date: Date | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  );
}

/**
 * Checks if a date is in the future.
 *
 * @param {Date | number} date - The date to check.
 * @returns {boolean} True if in the future.
 *
 * @example
 * isFuture(new Date('2099-01-01')); // true
 */
export function isFuture(date: Date | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  return d.getTime() > Date.now();
}

/**
 * Checks if a date is in the past.
 *
 * @param {Date | number} date - The date to check.
 * @returns {boolean} True if in the past.
 *
 * @example
 * isPast(new Date('2020-01-01')); // true
 */
export function isPast(date: Date | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  return d.getTime() < Date.now();
}

/**
 * Adds days to a date.
 *
 * @param {Date | number} date - The base date.
 * @param {number} days - Number of days to add (can be negative).
 * @returns {Date} New date with days added.
 *
 * @example
 * addDays(new Date('2024-01-15'), 7); // 2024-01-22
 */
export function addDays(date: Date | number, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Adds months to a date.
 *
 * @param {Date | number} date - The base date.
 * @param {number} months - Number of months to add (can be negative).
 * @returns {Date} New date with months added.
 *
 * @example
 * addMonths(new Date('2024-01-31'), 1); // 2024-02-29 (leap year)
 */
export function addMonths(date: Date | number, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Adds years to a date.
 *
 * @param {Date | number} date - The base date.
 * @param {number} years - Number of years to add (can be negative).
 * @returns {Date} New date with years added.
 *
 * @example
 * addYears(new Date('2024-01-15'), 5); // 2029-01-15
 */
export function addYears(date: Date | number, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/**
 * Gets the quarter of the year for a date (1-4).
 *
 * @param {Date | number} date - The date.
 * @returns {1 | 2 | 3 | 4} Quarter number.
 *
 * @example
 * quarterOf(new Date('2024-03-15')); // 1
 * quarterOf(new Date('2024-07-15')); // 3
 */
export function quarterOf(date: Date | number): 1 | 2 | 3 | 4 {
  const d = date instanceof Date ? date : new Date(date);
  return (Math.floor(d.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
}

/**
 * Gets the ISO week number of the year for a date.
 *
 * @param {Date | number} date - The date.
 * @returns {number} Week number (1-53).
 *
 * @example
 * weekOfYear(new Date('2024-01-15')); // 3
 */
export function weekOfYear(date: Date | number): number {
  const d = date instanceof Date ? date : new Date(date);
  // Use UTC to avoid DST issues in day counting
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7));
  const yearStart = Date.UTC(target.getUTCFullYear(), 0, 1);
  return Math.ceil(((target.getTime() - yearStart) / 86400000 + 1) / 7);
}

// ==================== Timezone Utilities ====================

/**
 * Get the UTC offset in minutes for a specific IANA timezone at a given instant.
 * Positive values mean ahead of UTC (e.g., +120 for UTC+2), negative behind.
 *
 * @param timeZone - IANA timezone identifier (e.g., 'America/New_York')
 * @param date - Point in time to evaluate (default: now)
 * @returns Offset in minutes from UTC
 *
 * @example
 * ```typescript
 * getTimezoneOffset('America/New_York'); // -300 (EST) or -240 (EDT)
 * getTimezoneOffset('Europe/Berlin');    // +60 (CET) or +120 (CEST)
 * ```
 */
export function getTimezoneOffset(timeZone: string, date: Date | number = new Date()): number {
  const d = date instanceof Date ? date : new Date(date);

  // Get parts in the target timezone
  const parts = getTimeZoneParts(d, timeZone);

  // Build a UTC date from those parts
  const tzDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second));

  // The offset is the difference between UTC representation and actual UTC
  return Math.round((tzDate.getTime() - d.getTime()) / 60_000);
}

/**
 * Convert a Date to the wall-clock components in a specific timezone.
 * Returns an object with year, month (1-12), day, hour, minute, second, millisecond.
 *
 * @param date - Date to convert
 * @param timeZone - IANA timezone identifier
 * @returns Date components in the target timezone
 *
 * @example
 * ```typescript
 * const utcNoon = new Date('2024-06-15T12:00:00Z');
 * toTimeZone(utcNoon, 'America/New_York');
 * // { year: 2024, month: 6, day: 15, hour: 8, minute: 0, second: 0, millisecond: 0 }
 * ```
 */
export function toTimeZone(
  date: Date | number,
  timeZone: string
): { year: number; month: number; day: number; hour: number; minute: number; second: number; millisecond: number } {
  const d = date instanceof Date ? date : new Date(date);
  const parts = getTimeZoneParts(d, timeZone);
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    millisecond: d.getMilliseconds()
  };
}

/**
 * Format a Date in a specific timezone using common format patterns.
 * Supports 'yyyy-MM-dd', 'yyyy-MM-dd HH:mm:ss', and Intl-based formatting.
 *
 * @param date - Date to format
 * @param timeZone - IANA timezone identifier
 * @param format - Format pattern (default: 'yyyy-MM-dd HH:mm:ss')
 * @param locale - Locale for Intl formatting
 * @returns Formatted date string in the target timezone
 *
 * @example
 * ```typescript
 * const utcDate = new Date('2024-06-15T18:30:00Z');
 * formatDateInTimeZone(utcDate, 'America/New_York', 'yyyy-MM-dd HH:mm:ss');
 * // '2024-06-15 14:30:00'
 *
 * formatDateInTimeZone(utcDate, 'Asia/Tokyo', 'yyyy-MM-dd');
 * // '2024-06-16'
 * ```
 */
export function formatDateInTimeZone(
  date: Date | number,
  timeZone: string,
  format: string = 'yyyy-MM-dd HH:mm:ss',
  locale?: string | string[]
): string {
  const d = date instanceof Date ? date : new Date(date);
  const parts = getTimeZoneParts(d, timeZone);

  if (format === 'yyyy-MM-dd') {
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  }
  if (format === 'yyyy-MM-dd HH:mm:ss') {
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')} ${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}`;
  }

  // Fall back to Intl for other patterns
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
 * Check if a given IANA timezone is currently observing DST.
 *
 * @param timeZone - IANA timezone identifier
 * @param date - Point in time to check (default: now)
 * @returns True if the timezone is in DST at the given moment
 *
 * @example
 * ```typescript
 * isDST('America/New_York', new Date('2024-07-01')); // true  (EDT)
 * isDST('America/New_York', new Date('2024-01-01')); // false (EST)
 * isDST('Asia/Tokyo');                               // false (no DST)
 * ```
 */
export function isDST(timeZone: string, date: Date | number = new Date()): boolean {
  const d = date instanceof Date ? date : new Date(date);

  // Compare the offset in January and July to find the standard offset
  // Use noon UTC to avoid edge cases at midnight boundaries
  const year = d.getUTCFullYear();
  const jan = getTimezoneOffset(timeZone, new Date(Date.UTC(year, 0, 15, 12, 0, 0)));
  const jul = getTimezoneOffset(timeZone, new Date(Date.UTC(year, 6, 15, 12, 0, 0)));
  const standardOffset = Math.min(jan, jul); // Standard time has the smaller offset

  return getTimezoneOffset(timeZone, d) > standardOffset;
}

/**
 * Get the IANA timezone abbreviation (e.g., "EST", "EDT", "CET") for a date.
 *
 * @param timeZone - IANA timezone identifier
 * @param date - Point in time (default: now)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Timezone abbreviation string
 *
 * @example
 * ```typescript
 * getTimezoneAbbreviation('America/New_York', new Date('2024-01-15')); // 'EST'
 * getTimezoneAbbreviation('America/New_York', new Date('2024-07-15')); // 'EDT'
 * ```
 */
export function getTimezoneAbbreviation(
  timeZone: string,
  date: Date | number = new Date(),
  locale: string = 'en-US'
): string {
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' }).formatToParts(d);
  return parts.find(p => p.type === 'timeZoneName')?.value ?? '';
}

/**
 * Internal helper: extract date/time components in a specific timezone using Intl.
 */
function getTimeZoneParts(
  date: Date,
  timeZone: string
): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });

  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const val = parts.find(p => p.type === type)?.value ?? '0';
    return parseInt(val, 10);
  };

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') === 24 ? 0 : get('hour'), // Intl can return 24 for midnight
    minute: get('minute'),
    second: get('second')
  };
}

/**
 * List of ISO 3166-1 alpha-2 country codes for use in timezone utilities.
 * This list is used to generate country names and filter timezones by country.
 */
// prettier-ignore
export const COUNTRY_CODES = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ',
  'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ',
  'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ',
  'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET',
  'FI', 'FJ', 'FK', 'FM', 'FO', 'FR',
  'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY',
  'HK', 'HM', 'HN', 'HR', 'HT', 'HU',
  'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT',
  'JE', 'JM', 'JO', 'JP',
  'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ',
  'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
  'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
  'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ',
  'OM',
  'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY',
  'QA',
  'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ',
  'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
  'UA', 'UG', 'UM', 'US', 'UY', 'UZ',
  'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU',
  'WF', 'WS',
  'YE', 'YT',
  'ZA', 'ZM', 'ZW'
];

type Country = {
  code: string;
  name: string;
};

/**
 * Get a list of countries with their ISO codes and localized names.
 * Uses Intl.DisplayNames to get the country names based on the provided locale.
 *
 * @param locale - Locale code for country names (default: 'en')
 * @returns Array of country objects with code and name
 *
 * @example
 * ```typescript
 * getCountries('en');
 * // [ { code: 'US', name: 'United States' }, { code: 'DE', name: 'Germany' }, ... ]
 *
 * getCountries('fr');
 * // [ { code: 'US', name: 'États-Unis' }, { code: 'DE', name: 'Allemagne' }, ... ]
 * ```
 */
export function getCountries(locale = 'en'): Country[] {
  const regionNames = new Intl.DisplayNames([locale], { type: 'region' });

  return COUNTRY_CODES.map<Country>(code => ({
    code,
    name: regionNames.of(code) as string
  }));
}

const SUPPORTED_TIMEZONE_NAMES = Intl.supportedValuesOf('timeZone');

/**
 * List of all IANA timezone identifiers supported by the environment.
 * This can be used to populate dropdowns or validate timezone inputs.
 */
export const TIMEZONE_NAMES = SUPPORTED_TIMEZONE_NAMES.includes('UTC')
  ? SUPPORTED_TIMEZONE_NAMES
  : [...SUPPORTED_TIMEZONE_NAMES, 'UTC'].sort((a, b) => a.localeCompare(b));

/**
 * Get a list of all IANA timezone identifiers supported by the environment.
 * This can be used to populate dropdowns or validate timezone inputs.
 *
 * @returns Array of timezone identifiers (e.g., 'America/New_York', 'Europe/Berlin')
 * @example
 * ```typescript
 * getTimezones();
 * // [ 'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', ... ]
 * ```
 */
export function getTimezones(): string[] {
  return TIMEZONE_NAMES;
}
