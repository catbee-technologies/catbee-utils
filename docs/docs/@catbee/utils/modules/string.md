# String Utilities

Helpers for manipulating and formatting strings. Includes casing conversions, masking, slugifying, truncating, reversing, counting, and more. All methods are fully typed.

## API Summary

- [**`capitalize(str: string)`**](#capitalize) - Capitalizes the first character of a string.
- [**`toKebabCase(str: string)`**](#tokebabcase) - Converts a string to kebab-case.
- [**`toCamelCase(str: string)`**](#tocamelcase) - Converts a string to camelCase.
- [**`slugify(str: string)`**](#slugify) - Converts a string to a URL-friendly slug.
- [**`truncate(str: string, len: number)`**](#truncate) - Truncates a string to a specific length, appending '...' if truncated.
- [**`toPascalCase(str: string)`**](#topascalcase) - Converts a string to PascalCase.
- [**`toSnakeCase(str: string)`**](#tosnakecase) - Converts a string to snake_case.
- [**`mask(str: string, visibleStart?: number, visibleEnd?: number, maskChar?: string)`**](#mask) - Masks a string by replacing characters with a mask character.
- [**`stripHtml(str: string)`**](#striphtml) - Removes all HTML tags from a string.
- [**`equalsIgnoreCase(a: string, b: string)`**](#equalsignorecase) - Performs case-insensitive string comparison.
- [**`reverse(str: string)`**](#reverse) - Reverses a string.
- [**`countOccurrences(str: string, substring: string, caseSensitive?: boolean)`**](#countoccurrences) - Counts occurrences of a substring within a string.

---

## Function Documentation & Usage Examples

### `capitalize()`
Capitalizes the first character of a string.

**Method Signature:**
```ts
function capitalize(str: string): string;
```

**Parameters:**
- `str`: The string to capitalize.

**Returns:**
- The capitalized string.

**Example:**
```ts
import { capitalize } from '@catbee/utils';

capitalize("hello world"); // "Hello world"
```

---

### `toKebabCase()`
Converts a string to kebab-case.

**Method Signature:**
```ts
function toKebabCase(str: string): string;
```

**Parameters:**
- `str`: The string to convert.

**Returns:**
- The kebab-case string.

**Example:**
```ts
import { toKebabCase } from '@catbee/utils';

toKebabCase("FooBar test"); // "foo-bar-test"
```

---

### `toCamelCase()`
Converts a string to camelCase.

**Method Signature:**
```ts
function toCamelCase(str: string): string;
```

**Parameters:**
- `str`: The string to convert.

**Returns:**
- The camelCase string.

**Example:**
```ts
import { toCamelCase } from '@catbee/utils';

toCamelCase("foo-bar_test"); // "fooBarTest"
```

---

### `slugify()`
Converts a string to a URL-friendly slug.

**Method Signature:**
```ts
function slugify(str: string): string;
```

**Parameters:**
- `str`: The string to convert.

**Returns:**
- The URL-friendly slug.

**Example:**
```ts
import { slugify } from '@catbee/utils';

slugify("Hello World!"); // "hello-world"
```

---

### `truncate()`
Truncates a string to a specific length, appending '...' if truncated.

**Method Signature:**
```ts
function truncate(str: string, len: number): string;
```

**Parameters:**
- `str`: The string to truncate.
- `len`: The maximum length of the truncated string.

**Returns:**
- The truncated string.

**Example:**
```ts
import { truncate } from '@catbee/utils';

truncate("This is a long sentence.", 10); // "This is a ..."
```

---

### `toPascalCase()`
Converts a string to PascalCase.

**Method Signature:**
```ts
function toPascalCase(str: string): string;
```

**Parameters:**
- `str`: The string to convert.

**Returns:**
- The PascalCase string.

**Example:**
```ts
import { toPascalCase } from '@catbee/utils';

toPascalCase("foo-bar"); // "FooBar"
```

---

### `toSnakeCase()`
Converts a string to snake_case.

**Method Signature:**
```ts
function toSnakeCase(str: string): string;
```

**Parameters:**
- `str`: The string to convert.

**Returns:**
- The snake_case string.

**Example:**
```ts
import { toSnakeCase } from '@catbee/utils';

toSnakeCase("FooBar test"); // "foo_bar_test"
```

---

### `mask()`
Masks a string by replacing characters with a mask character.

**Method Signature:**
```ts
function mask(str: string, visibleStart?: number, visibleEnd?: number, maskChar?: string): string;
```

**Parameters:**
- `str`: The string to mask.
- `visibleStart`: Number of characters to leave visible at the start (default is 0).
- `visibleEnd`: Number of characters to leave visible at the end (default is 0).
- `maskChar`: The character to use for masking (default is '*').

**Returns:**
- The masked string.

**Example:**
```ts
import { mask } from '@catbee/utils';

mask("hello world", 2, 5, "*"); // "he***world"
```

---

### `stripHtml()`
Removes all HTML tags from a string.

**Method Signature:**
```ts
function stripHtml(str: string): string;
```

**Parameters:**
- `str`: The string to process.

**Returns:**
- The string without HTML tags.

**Example:**
```ts
import { stripHtml } from '@catbee/utils';

stripHtml("<div>Hello <b>world</b></div>"); // "Hello world"
```

---

### `equalsIgnoreCase()`
Performs case-insensitive string comparison.

**Method Signature:**
```ts
function equalsIgnoreCase(a: string, b: string): boolean;
```

**Parameters:**
- `a`: The first string to compare.
- `b`: The second string to compare.

**Returns:**
- `true` if the strings are equal ignoring case, otherwise `false`.

**Example:**
```ts
import { equalsIgnoreCase } from '@catbee/utils';

equalsIgnoreCase("Hello", "hello"); // true
```

---

### `reverse()`
Reverses a string.

**Method Signature:**
```ts
function reverse(str: string): string;
```

**Parameters:**
- `str`: The string to reverse.

**Returns:**
- The reversed string.

**Example:**
```ts
import { reverse } from '@catbee/utils';

reverse("abc"); // "cba"
```

---

### `countOccurrences()`
Counts occurrences of a substring within a string.

**Method Signature:**
```ts
function countOccurrences(str: string, substring: string, caseSensitive?: boolean): number;
```

**Parameters:**
- `str`: The string to search within.
- `substring`: The substring to count.
- `caseSensitive`: Whether the search should be case-sensitive (default is false).

**Returns:**
- The number of occurrences of the substring.

**Example:**
```ts
import { countOccurrences } from '@catbee/utils';

countOccurrences("banana", "an"); // 2
countOccurrences("Banana", "an", false); // 2
```
