import { QuerySerializer } from '../query-serializer';

export function buildURL(baseURL: string | undefined, path: string, query?: Record<string, unknown>): string {
  const url = new URL(path, baseURL);

  const qs = QuerySerializer.serialize(query);

  if (qs) {
    url.search = qs;
  }

  return url.toString();
}
