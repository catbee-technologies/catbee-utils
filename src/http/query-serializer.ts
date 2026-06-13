export type ArrayFormat = 'repeat' | 'indices' | 'brackets' | 'comma';

function isPlainObject(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // Exclude built-in types and special objects
  if (
    value instanceof Date ||
    value instanceof URL ||
    value instanceof Blob ||
    value instanceof File ||
    value instanceof FormData ||
    value instanceof ArrayBuffer ||
    value instanceof Uint8Array ||
    Array.isArray(value)
  ) {
    return false;
  }

  return Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null;
}

export class QuerySerializer {
  public static serialize(query?: Record<string, unknown>, arrayFormat: ArrayFormat = 'repeat'): string {
    if (!query) {
      return '';
    }
    const params = new URLSearchParams();
    this.append(params, '', query, arrayFormat);
    return params.toString();
  }

  private static append(params: URLSearchParams, prefix: string, value: unknown, arrayFormat: ArrayFormat): void {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      if (arrayFormat === 'comma') {
        params.append(prefix, value.map(item => String(item)).join(','));
      } else {
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          let key = prefix;

          if (arrayFormat === 'indices') {
            key = `${prefix}[${i}]`;
          } else if (arrayFormat === 'brackets') {
            key = `${prefix}[]`;
          }
          // 'repeat' uses the prefix as-is

          params.append(key, String(item));
        }
      }
      return;
    }

    if (isPlainObject(value)) {
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        const next = prefix ? `${prefix}[${key}]` : key;
        this.append(params, next, child, arrayFormat);
      }
      return;
    }

    params.append(prefix, String(value));
  }
}
