import { RetryOptions, HttpMethod } from './types';

/**
 * Retry logic used by the HTTP client.
 */
export class RetryPolicy {
  private readonly retries: number;
  private readonly delay: number | ((attempt: number) => number);
  private readonly retryOn: number[];
  private readonly methods: HttpMethod[];
  private readonly retryNetworkErrors: boolean;

  /**
   * Create a retry policy from the provided options.
   */
  constructor(options?: RetryOptions) {
    this.retries = options?.retries ?? 0;
    this.delay = options?.delay ?? 1000;
    this.retryOn = options?.retryOn ?? [500, 502, 503, 504];
    this.methods = options?.methods ?? [HttpMethod.GET, HttpMethod.HEAD, HttpMethod.OPTIONS];
    this.retryNetworkErrors = options?.retryNetworkErrors ?? true;
  }

  /**
   * Determine whether a request can be retried.
   */
  public canRetry(attempt: number, status?: number, method?: HttpMethod): boolean {
    if (attempt >= this.retries) {
      return false;
    }

    if (method && !this.methods.includes(method)) {
      return false;
    }

    // Network error (no status or explicit status 0) - retry if enabled
    if (status == null || status === 0) {
      return this.retryNetworkErrors;
    }

    return this.retryOn.includes(status);
  }

  /**
   * Wait for the configured delay before retrying.
   */
  public async wait(attempt: number): Promise<void> {
    const ms = typeof this.delay === 'function' ? this.delay(attempt) : this.delay;
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}
