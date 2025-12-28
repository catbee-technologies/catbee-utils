/**
 * A type that represents a configurable toggle.
 * Can be `true`, `false`, or a custom configuration object `T`.
 */
export type ToggleConfig<T> = boolean | T;

/**
 * A type representing a value that can be `null` or `undefined`.
 */
export type Nullable<T> = T | null | undefined;

/**
 * A type representing a value that may or may not be present.
 */
export type Optional<T> = T | undefined;

/**
 * A type that makes all properties of `T` deeply optional.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * A type that makes all properties of `T` readonly, recursively.
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * A type that converts a union of types into an intersection.
 */
export type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

/**
 * A type representing a promise or a plain value.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * A type representing a record with string keys and values of type `T`.
 */
export type StringKeyedRecord<T> = Record<string, T>;

/**
 * A type representing a function that returns `R` and optionally receives arguments `A`.
 */
export type Func<A extends any[] = any[], R = any> = (...args: A) => R;

/**
 * A type representing a partial pick from `T` (like Partial + Pick combined)
 */
export type PartialPick<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

/**
 * A type that deeply stringifies all properties of T or makes them null.
 */
export type DeepStringifyOrNull<T> = T extends string | number | bigint | boolean | symbol | null | undefined
  ? string | null
  : T extends Array<infer U>
    ? Array<DeepStringifyOrNull<U>>
    : T extends object
      ? { [K in keyof T]: DeepStringifyOrNull<T[K]> }
      : string | null;

/**
 * A type representing a non-empty array of T.
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * A type representing the union of all property values of T.
 */
export type ValueOf<T> = T[keyof T];

/**
 * A type that makes all properties of T mutable (removes readonly).
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * A type that gets the keys of T whose values are assignable to U.
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Require at least one of the keys in K to be present in T.
 */
export type RequireAtLeastOne<T, K extends keyof T = keyof T> = K extends keyof T
  ? { [P in K]-?: T[P] } & Omit<T, K>
  : never;

/**
 * A record type with optional keys.
 */
export type RecordOptional<K extends string | number | symbol, T> = {
  [P in K]?: T;
};

/**
 * Primitive types in TypeScript.
 */
export type Primitive = string | number | boolean | bigint | symbol | undefined | null;

/**
 * Recursively unwraps Promise types to get their resolved value type.
 */
export type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

/**
 * Picks properties from T that are of type U.
 */
export type PickByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

/**
 * Makes all properties of T required recursively.
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Checks if two types are exactly equal.
 * Returns true or false as type.
 */
export type IsEqual<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? true : false;

/**
 * Makes all properties of an object writable (removes readonly).
 */
export type Writable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * Makes specific keys K of type T optional.
 */
export type Optional2<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Creates a type with all properties of T except those with types assignable to U.
 */
export type Without<T, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P];
};
