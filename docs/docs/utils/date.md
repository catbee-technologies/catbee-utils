# Date Utilities

A set of utilities for parsing, formatting, and manipulating dates in Node.js and TypeScript.  
These methods provide type-safe helpers for common date operations such as formatting, parsing, arithmetic, and comparison.

## API Summary

- [**`formatDate(date: Date | number, options?: DateFormatOptions): string`**](#formatdate) - Formats a date according to a pattern, locale, and time zone.
- [**`formatRelativeTime(date: Date | number, now?: Date | number, locale?: string | string[]): string`**](#formatrelativetime) - Formats a date as relative time (e.g., "5 minutes ago", "in 3 days").
- [**`parseDate(input: string | number, fallback?: Date): Date | null`**](#parsedate) - Parses a date string or timestamp into a Date object.
- [**`dateDiff(date1: Date | number, date2?: Date | number, unit?: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'): number`**](#datediff) - Calculates the difference between two dates in the specified unit.
- [**`addToDate(date: Date | number, amount: number, unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'): Date`**](#addtodate) - Adds a specified amount of time to a date.
- [**`startOf(date: Date | number, unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'): Date`**](#startof) - Gets the start of a date unit.
- [**`endOf(date: Date | number, unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'): Date`**](#endof) - Gets the end of a date unit.
- [**`isBetween(date: Date | number, start: Date | number, end: Date | number, inclusive?: boolean): boolean`**](#isbetween) - Checks if a date is between two other dates.
- [**`isLeapYear(year: number | Date): boolean`**](#isleapyear) - Checks if a year is a leap year.
- [**`daysInMonth(year: number | Date, month?: number): number`**](#daysinmonth) - Gets the number of days in a month.

---

## Interfaces & Types

```ts
export interface DateFormatOptions {
  format?: string;
  locale?: string | string[];
  timeZone?: string;
}
```

---

## Example Usage

```ts
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
  DateFormatOptions
} from "@catbee/utils";

// Format today's date
console.log(formatDate(new Date(), { format: 'yyyy-MM-dd' }));

// Get relative time
console.log(formatRelativeTime(Date.now() - 1000 * 60 * 60)); // "1 hour ago"

// Parse a date string
const d = parseDate('2023-05-15');

// Add 7 days
const nextWeek = addToDate(d!, 7, 'days');

// Get start and end of month
const startMonth = startOf(d!, 'month');
const endMonth = endOf(d!, 'month');

// Check leap year
console.log(isLeapYear(2024)); // true

// Days in month
console.log(daysInMonth(2023, 1)); // 28
```

---

## Function Documentation & Usage Examples

### `formatDate()`

Formats a date according to a pattern, locale, and time zone.

**Method Signature:**
```ts
function formatDate(date: Date | number, options?: DateFormatOptions): string
```

**Parameters:**
- `date`: The date to format (Date object or timestamp).
- `options`: Optional formatting options:
  - `format`: The date format pattern (default: 'PPpp').
  - `locale`: The locale(s) to use for formatting (default: system locale).
  - `timeZone`: The time zone to use (default: system time zone).

**Returns:**
- The formatted date string.

**Examples:**
```ts
import { formatDate } from "@catbee/utils";

formatDate(new Date(), { format: 'yyyy-MM-dd' }); // '2023-05-15'
formatDate(new Date(), { format: 'yyyy-MM-dd HH:mm:ss' }); // '2023-05-15 14:30:22'
formatDate(new Date(), { format: 'PPPP', locale: 'fr-FR' }); // 'lundi 15 mai 2023'
```

---

### `formatRelativeTime()`
Formats a date as relative time (e.g., "5 minutes ago", "in 3 days").

**Method Signature:**
```ts
function formatRelativeTime(date: Date | number, now?: Date | number, locale?: string | string[]): string
```

**Parameters:**
- `date`: The date to format (Date object or timestamp).
- `now`: Optional reference date (default: current date).
- `locale`: Optional locale(s) for formatting (default: system locale).

**Returns:**
- The relative time string.

**Examples:**
```ts
import { formatRelativeTime } from "@catbee/utils";

formatRelativeTime(Date.now() - 1000 * 60 * 5); // "5 minutes ago"
formatRelativeTime(Date.now() + 1000 * 60 * 60 * 24 * 3); // "in 3 days"
```

---

### `parseDate()`
Parses a date string or timestamp into a Date object.

**Method Signature:**
```ts
function parseDate(input: string | number, fallback?: Date): Date | null
```

**Parameters:**
- `input`: The date input (string or timestamp).
- `fallback`: Optional fallback date if parsing fails (default: `null`).

**Returns:**
- The parsed Date object or the fallback value if parsing fails.

**Examples:**
```ts
import { parseDate } from "@catbee/utils";

parseDate('2023-05-15'); // Date object for May 15, 2023
parseDate('invalid', new Date()); // Returns current date as fallback
```

---

### `dateDiff()`
Calculates the difference between two dates in the specified unit.

**Method Signature:**
```ts
function dateDiff(date1: Date | number, date2?: Date | number, unit?: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'): number
```

**Parameters:**
- `date1`: The first date (Date object or timestamp).
- `date2`: The second date (Date object or timestamp). Defaults to the current date if not provided.
- `unit`: The unit for the difference ('milliseconds', 'seconds', 'minutes', 'hours', 'days', 'months', 'years'). Default is 'milliseconds'. 

**Returns:**
- The difference between the two dates in the specified unit.

**Examples:**
```ts
import { dateDiff } from "@catbee/utils";

dateDiff(new Date('2023-05-15'), new Date('2023-05-10'), 'days'); // 5
dateDiff(new Date('2023-05-15T10:00:00'), new Date('2023-05-15T06:00:00'), 'hours'); // 4
```

---

### `addToDate()`
Adds a specified amount of time to a date.

**Method Signature:**
```ts
function addToDate(date: Date | number, amount: number, unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'): Date
```

**Parameters:**
- `date`: The original date (Date object or timestamp).
- `amount`: The amount of time to add (can be negative to subtract).
- `unit`: The unit of time to add ('milliseconds', 'seconds', 'minutes', 'hours', 'days', 'months', 'years'). 

**Returns:**
- The new date with the added time.

**Examples:**
```ts
import { addToDate } from "@catbee/utils";

addToDate(new Date('2023-05-15'), 5, 'days'); // Date for May 20, 2023
addToDate(new Date('2023-05-15T10:00:00'), -2, 'hours'); // Date for May 15, 2023 08:00:00
```

---

### `startOf()`
Gets the start of a time period containing the specified date.

**Method Signature:**
```ts
function startOf(date: Date | number, unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'): Date
```

**Parameters:**
- `date`: The date to evaluate (Date object or timestamp).
- `unit`: The unit of time to get the start of ('second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year').

**Returns:**
- The Date object representing the start of the specified time period.

**Examples:**
```ts
import { startOf } from "@catbee/utils";

startOf(new Date('2023-05-15T14:30:00'), 'day'); // Date for May 15, 2023 00:00:00
startOf(new Date('2023-05-15'), 'month'); // Date for May 1, 2023
```

---

### `endOf()`
Gets the end of a time period containing the specified date.

**Method Signature:**
```ts
function endOf(date: Date | number, unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'): Date
```

**Parameters:**
- `date`: The date to evaluate (Date object or timestamp).
- `unit`: The unit of time to get the end of ('second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year').

**Returns:**
- The Date object representing the end of the specified time period.

**Examples:**
```ts
import { endOf } from "@catbee/utils";

endOf(new Date('2023-05-15T14:30:00'), 'day'); // Date for May 15, 2023 23:59:59.999
endOf(new Date('2023-05-15'), 'month'); // Date for May 31, 2023 23:59:59.999
```

---

### `isBetween()`
Checks if a date is between two other dates.

**Method Signature:**
```ts
function isBetween(date: Date | number, start: Date | number, end: Date | number, inclusive?: boolean): boolean
```

**Parameters:**
- `date`: The date to check (Date object or timestamp).
- `start`: The start date of the range (Date object or timestamp).
- `end`: The end date of the range (Date object or timestamp).
- `inclusive`: Optional boolean to include the start and end dates in the check (default: `true`).

**Returns:**
- `true` if the date is between the start and end dates, otherwise `false`.


**Examples:**
```ts
import { isBetween } from "@catbee/utils";

const date = new Date('2023-05-15');
const start = new Date('2023-05-10');
const end = new Date('2023-05-20');
isBetween(date, start, end); // true
isBetween(date, start, end, false); // true (exclusive)
```

---

### `isLeapYear()`
Checks if a year is a leap year.

**Method Signature:**
```ts
function isLeapYear(year: number | Date): boolean
```

**Parameters:**
- `year`: The year to check (number or Date object).

**Returns:**
- `true` if the year is a leap year, otherwise `false`.

**Examples:**
```ts
import { isLeapYear } from "@catbee/utils";

isLeapYear(2024); // true
isLeapYear(new Date('2023-01-01')); // false
```

---

### `daysInMonth()`
Gets the number of days in a month.

**Method Signature:**
```ts
function daysInMonth(year: number | Date, month?: number): number
```

**Parameters:**
- `year`: The year to check (number or Date object).
- `month`: The month to check (0-based, optional).

**Returns:**
- The number of days in the specified month.

**Examples:**
```ts
import { daysInMonth } from "@catbee/utils";

daysInMonth(2024, 1); // 29 (February in a leap year)
daysInMonth(new Date('2023-05-15')); // 31 (May 2023)
```
