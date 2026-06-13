export class HttpHeaders {
  private readonly headers = new Map<string, string>();

  constructor(initial?: Record<string, string | number | boolean>) {
    if (initial) {
      for (const [key, value] of Object.entries(initial)) {
        this.set(key, value);
      }
    }
  }

  public set(key: string, value: string | number | boolean): this {
    this.headers.set(key.toLowerCase(), String(value));
    return this;
  }

  public get(key: string): string | undefined {
    return this.headers.get(key.toLowerCase());
  }

  public has(key: string): boolean {
    return this.headers.has(key.toLowerCase());
  }

  public delete(key: string): boolean {
    return this.headers.delete(key.toLowerCase());
  }

  public clear(): void {
    this.headers.clear();
  }

  public merge(headers?: Record<string, string | number | boolean>): this {
    if (!headers) {
      return this;
    }

    for (const [key, value] of Object.entries(headers)) {
      this.set(key, value);
    }

    return this;
  }

  public toObject(): Record<string, string> {
    return Object.fromEntries(this.headers.entries());
  }

  public clone(): HttpHeaders {
    return new HttpHeaders(this.toObject());
  }
}
