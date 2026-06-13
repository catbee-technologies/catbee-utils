import { HttpRequest, HttpResponse } from './types';

export interface HttpContext<T = unknown> {
  request: HttpRequest;

  response?: HttpResponse<T>;

  error?: unknown;

  state: Record<string, unknown>;
}
