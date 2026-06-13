export interface Interceptor<T> {
  fulfilled: (value: T) => T | Promise<T>;

  rejected?: (error: unknown) => T | Promise<T> | undefined;
}

export class HttpInterceptorManager<T> {
  private readonly handlers: Array<Interceptor<T> | null> = [];

  public use(
    fulfilled: (value: T) => T | Promise<T>,

    rejected?: (error: unknown) => T | Promise<T> | undefined
  ): number {
    this.handlers.push({
      fulfilled,
      rejected
    });

    return this.handlers.length - 1;
  }

  public eject(id: number): void {
    this.handlers[id] = null;
  }

  public clear(): void {
    this.handlers.length = 0;
  }

  public clone(): HttpInterceptorManager<T> {
    const cloned = new HttpInterceptorManager<T>();
    // Deep copy handlers array to maintain independence
    cloned.handlers.length = 0;
    for (const handler of this.handlers) {
      if (handler) {
        cloned.handlers.push({ ...handler });
      } else {
        cloned.handlers.push(null);
      }
    }
    return cloned;
  }

  public async execute(value: T): Promise<T> {
    let current = value;

    for (const handler of this.handlers) {
      if (!handler) {
        continue;
      }

      try {
        current = await handler.fulfilled(current);
      } catch (error) {
        if (handler.rejected) {
          const result = await handler.rejected(error);
          // If rejected handler returns a value, use it (recovery)
          // If it returns undefined, re-throw the error
          if (result !== undefined) {
            current = result;
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    return current;
  }

  public async executeError(error: unknown): Promise<void> {
    for (const handler of this.handlers) {
      if (!handler?.rejected) {
        continue;
      }

      await handler.rejected(error);
    }
  }
}
