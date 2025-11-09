# Array Utilities

A collection of functions for handling arrays with type-safety and efficiency. Includes chunking, deduplication, flattening, grouping, sorting, partitioning, and more. All methods are fully typed.

## API Summary

- [**`chunk<T>(array: T[], size: number): T[][]`**](#chunk) - splits an array into chunks of the specified size.
- [**`unique<T>(array: T[], keyFn?: (item: T) => unknown): T[]`**](#unique) - removes duplicate items from an array, optionally by a key function.
- [**`flattenDeep<T>(array: any[]): T[]`**](#flattendeep) - deeply flattens a nested array.
- [**`random<T>(array: T[]): T | undefined`**](#random) - returns a random element from an array.
- [**`groupBy<T>(array: T[], keyOrFn: keyof T | ((item: T) => string | number | symbol)): Record<string | number | symbol, T[]>`**](#groupby) - groups array items by a key or function.
- [**`shuffle<T>(array: T[]): T[]`**](#shuffle) - shuffles array elements randomly.
- [**`pluck<T, K extends keyof T>(array: T[], key: K): T[K][]`**](#pluck) - extracts values for a given key from an array of objects.
- [**`difference<T>(a: T[], b: T[]): T[]`**](#difference) - returns elements in array `a` not present in array `b`.
- [**`intersect<T>(a: T[], b: T[]): T[]`**](#intersect) - returns elements common to both arrays.
- [**`mergeSort<T>(array: T[], key: string | ((item: T) => any), direction?: "asc" | "desc"): T[]`**](#mergesort) - sorts array by key or function using merge sort.
- [**`zip<T>(...arrays: T[][]): T[][]`**](#zip) - combines multiple arrays element-wise.
- [**`partition<T>(array: T[], predicate: (item: T, index: number, array: T[]) => boolean): [T[], T[]]`**](#partition) - splits array into two arrays based on a predicate function.
- [**`range(start: number, end: number, step?: number): number[]`**](#range) - creates an array of numbers in a range.
- [**`take<T>(array: T[], n?: number): T[]`**](#take) - takes the first `n` elements from an array.
- [**`takeWhile<T>(array: T[], predicate: (item: T, index: number) => boolean): T[]`**](#takewhile) - takes elements from array while predicate is true.
- [**`compact<T>(array: T[]): NonNullable<T>[]`**](#compact) - removes falsy values from an array.
- [**`countBy<T>(array: T[], keyFn: (item: T) => string | number | symbol): Record<string, number>`**](#countby) - counts occurrences of items in an array by a key function.

---

## Function Documentation & Usage Examples

### `chunk()`
Splits an array into chunks of the specified size.

**Method Signature:**
```ts
function chunk<T>(array: T[], size: number): T[][]
```

**Parameters:**
- `array`: The input array to be chunked.
- `size`: The size of each chunk.

**Returns:**
- An array of chunks, each containing up to `size` elements.

**Examples:**
```ts
import { chunk } from '@catbee/utils';

chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
```

---

### `unique()`
Removes duplicate items from an array, optionally by a key function.

**Method Signature:**
```ts
function unique<T>(array: T[], keyFn?: (item: T) => unknown): T[]
```

**Parameters:**
- `array`: The input array to remove duplicates from.
- `keyFn`: An optional function to determine the key for each item.

**Returns:**
- A new array with unique items. Does not mutate the original array.

**Examples:**
```ts
import { unique } from '@catbee/utils';

unique([1, 2, 2, 3, 1]); // [1, 2, 3]
unique(users, user => user.id); // [{ id: 1, ... }, { id: 2, ... }]
```

---

### `flattenDeep()`
Deeply flattens a nested array.

**Method Signature:**
```ts 
function flattenDeep<T>(array: any[]): T[]
```

**Parameters:**
- `array`: The input array to deeply flatten.

**Returns:**
- A new flattened array of type `T[]`. Does not mutate the original array.

**Examples:**
```ts
import { flattenDeep } from '@catbee/utils';

flattenDeep([1, [2, [3, [4]], 5]]); // [1, 2, 3, 4, 5]
```

---

### `random()`
Returns a random element from an array.

**Method Signature:**
```ts
function random<T>(array: T[]): T | undefined
```

**Parameters:**
- `array`: The input array to select a random element from.

**Returns:**
- A random element of type `T` or `undefined` if the array is empty.

**Examples:**
```ts
import { random } from '@catbee/utils';

random(['a', 'b', 'c']); // 'a' or 'b' or 'c'
```

---

### `groupBy()`
Groups array items by a key or function.

**Method Signature:**
```ts
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]>
```
```ts
function groupBy<T, K extends string | number | symbol>(array: T[], keyFn: (item: T) => K): Record<K, T[]>
```
```ts
function groupBy<T>(array: T[], keyOrFn: keyof T | ((item: T) => string | number | symbol)): Record<string | number | symbol, T[]>
```

**Parameters:**
- `array`: The input array to group items from.
- `keyOrFn`: The key or function to group items by.

**Returns:**
- An object where keys are the group identifiers and values are arrays of grouped items.

**Examples:**
```ts
import { groupBy } from '@catbee/utils';

const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Charlie', role: 'admin' },
];
groupBy(users, 'role'); // { admin: [...], user: [...] }
groupBy(users, user => user.name[0]); // { A: [...], B: [...], ... }
```

---

### `shuffle()`
Shuffles array elements randomly.

**Method Signature:**
```ts
function shuffle<T>(array: T[]): T[]
```

**Parameters:**
- `array`: The input array to shuffle.

**Returns:**
- A new shuffled array of type `T[]`. Does not mutate the original array.

**Examples:**
```ts

import { shuffle } from '@catbee/utils';

shuffle([1, 2, 3, 4]); // [3, 1, 4, 2] (order will vary)
```

---

### `pluck()`
Extracts values for a given key from an array of objects.

**Method Signature:**
```ts
function pluck<T, K extends keyof T>(array: T[], key: K): T[K][]
```

**Parameters:**
- `array`: The input array to pluck values from.
- `key`: The key to pluck values for.

**Returns:**
- An array of plucked values.

**Examples:**
```ts
import { pluck } from '@catbee/utils';

const users = [{ name: 'Alice' }, { name: 'Bob' }];
pluck(users, 'name'); // ['Alice', 'Bob']
```

---

### `difference()`
Returns elements in array `a` not present in array `b`.

**Method Signature:**
```ts
function difference<T>(a: T[], b: T[]): T[]
```

**Parameters:**
- `a`: The first array to compare.
- `b`: The second array to compare.

**Examples:**
```ts
import { difference } from '@catbee/utils';

difference([1, 2, 3, 4], [2, 4]); // [1, 3]
```

---

### `intersect()`
Returns elements common to both arrays.

**Method Signature:**
```ts
function intersect<T>(a: T[], b: T[]): T[]
```

**Parameters:**
- `a`: The first array to compare.
- `b`: The second array to compare.

**Examples:**
```ts
import { intersect } from '@catbee/utils';

intersect([1, 2, 3], [2, 3, 4]); // [2, 3]
```

---

### `mergeSort()`
Sorts array by key or function using merge sort.

**Method Signature:**
```ts
function mergeSort<T>(array: T[], key: string | ((item: T) => any), direction?: "asc" | "desc"): T[]
```

**Parameters:**
- `array`: The input array to sort.
- `key`: The key or function to sort by.
- `direction`: The sort direction, either "asc" or "desc".

**Returns:**
- A new sorted array of type `T[]`. Does not mutate the original array.

**Examples:**
```ts
import { mergeSort } from '@catbee/utils';

const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
mergeSort(items, (item) => item.value); // [{ value: 1 }, { value: 2 }, { value: 3 }]
mergeSort(items, (item) => item.value, 'desc'); // [{ value: 3 }, { value: 2 }, { value: 1 }]
```

---

### `zip()`
Combines multiple arrays element-wise.

**Method Signature:**
```ts
function zip<T>(...arrays: T[][]): T[][]
```

**Parameters:**
- `arrays`: The input arrays to combine.

**Returns:**
- A new array of type `T[][]`. Does not mutate the original arrays.

**Examples:**
```ts
import { zip } from '@catbee/utils';

zip([1, 2], ['a', 'b'], [true, false]); // [[1, 'a', true], [2, 'b', false]]
```

---

### `partition()`
Splits array into two arrays based on a predicate function.

**Method Signature:**
```ts
function partition<T>(array: T[], predicate: (item: T, index: number, array: T[]) => boolean): [T[], T[]]
```

**Parameters:**
- `arrays`: The input arrays to combine.
- `predicate`: A function that returns true to include the item in the first array.
  - `item`: The current item being processed.
  - `index`: The index of the current item.
  - `array`: The original array being processed.

**Returns:**
- A new array of type `T[][]`. Does not mutate the original arrays.

**Examples:**
```ts
import { partition } from '@catbee/utils';

partition([1, 2, 3, 4], n => n % 2 === 0); // [[2, 4], [1, 3]]
```

---

### `range()`
Creates an array of numbers in a range.

**Method Signature:**
```ts
function range(start: number, end: number, step?: number): number[]
```

**Parameters:**
- `start`: The starting number of the range (inclusive).
- `end`: The ending number of the range (exclusive).
- `step`: The increment between numbers in the range (default is 1).

**Returns:**
- An array of numbers in the specified range.

**Examples:**
```ts
import { range } from '@catbee/utils';

range(0, 5); // [0, 1, 2, 3, 4]
range(2, 10, 2); // [2, 4, 6, 8]
```

---

### `take()`
Takes the first `n` elements from an array.

**Method Signature:**
```ts
function take<T>(array: T[], n?: number): T[]
```

**Parameters:**
- `array`: The input array to take elements from.
- `n`: The number of elements to take (default is 1).

**Returns:**
- A new array containing the first `n` elements. Does not mutate the original array.

**Examples:**
```ts
import { take } from '@catbee/utils';

take([1, 2, 3, 4], 2); // [1, 2]
```

---

### `takeWhile()`
Takes elements from array while predicate is true.

**Method Signature:**
```ts
function takeWhile<T>(array: T[], predicate: (item: T, index: number) => boolean): T[]
```

**Parameters:**
- `array`: The input array to take elements from.
- `predicate`: A function that returns true to keep taking elements.
  - `item`: The current item being processed.
  - `index`: The index of the current item.

**Returns:**
- A new array containing the leading elements that satisfy the predicate. Does not mutate the original array

**Examples:**
```ts
import { takeWhile } from '@catbee/utils';

takeWhile([1, 2, 3, 2, 1], n => n < 3); // [1, 2]
```

---

### `compact()`
Removes falsy values from an array.

**Method Signature:**
```ts
function compact<T>(array: T[]): NonNullable<T>[]
```

**Parameters:**
- `array`: The input array to compact.

**Returns:**
- A new array with all falsy values removed. Does not mutate the original array.

**Examples:**
```ts
import { compact } from '@catbee/utils';

compact([0, 1, false, 2, '', 3, null, undefined]); // [1, 2, 3]
```

---

### `countBy()`
Counts occurrences by key or function.

**Method Signature:**
```ts
function countBy<T>(array: T[], keyFn: (item: T) => string | number | symbol): Record<string, number>
```

**Parameters:**
- `array`: The input array to count occurrences from.
- `keyFn`: A function that returns the key to count by.

**Returns:**
- An object where keys are the counted identifiers and values are their counts.

**Examples:**
```ts
import { countBy } from '@catbee/utils';

countBy(['cat', 'dog', 'cat'], pet => pet); // { cat: 2, dog: 1 }
```
