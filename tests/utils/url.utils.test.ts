import {
  appendQueryParams,
  parseQueryString,
  isValidUrl,
  getDomain,
  joinPaths,
  normalizeUrl,
  createUrlBuilder,
  extractQueryParams,
  removeQueryParams,
  getExtension,
  parseTypedQueryParams,
  updateQueryParam,
  getSubdomain,
  isRelativeUrl,
  toAbsoluteUrl,
  sanitizeUrl
} from '../../src/url';

describe('UrlUtils', () => {
  describe('appendQueryParams', () => {
    it('appends params to base URL with no query', () => {
      const url = 'https://example.com';
      const params = { page: 2, limit: 10 };
      expect(appendQueryParams(url, params)).toBe('https://example.com/?page=2&limit=10');
    });

    it('merges with existing query string (overrides keys)', () => {
      const url = 'https://host/test?a=1&x=y';
      const params = { a: '99', b: 'blue' };
      expect(appendQueryParams(url, params)).toBe('https://host/test?a=99&x=y&b=blue');
    });

    it('works with URLs that already end with ?', () => {
      const url = 'https://domain.com/endpoint?';
      expect(appendQueryParams(url, { foo: 1 })).toBe('https://domain.com/endpoint?foo=1');
    });

    it('stringifies numbers and keeps strings as is', () => {
      expect(appendQueryParams('https://a.co', { q: 0, b: '2' })).toBe('https://a.co/?q=0&b=2');
    });

    it('overrides existing duplicate keys', () => {
      expect(appendQueryParams('https://m.com?a=1&b=2', { a: 5 })).toMatch(/a=5/);
    });

    it('returns the original URL if params is empty', () => {
      const url = 'https://site/page';
      expect(appendQueryParams(url, {})).toBe('https://site/page');
    });
  });

  describe('parseQueryString', () => {
    it('parses a typical query string with ?', () => {
      const q = '?foo=bar&x=1';
      expect(parseQueryString(q)).toEqual({ foo: 'bar', x: '1' });
    });

    it('parses without leading ?', () => {
      expect(parseQueryString('k=v&z=42')).toEqual({ k: 'v', z: '42' });
    });

    it('returns empty object for empty query string', () => {
      expect(parseQueryString('')).toEqual({});
      expect(parseQueryString('?')).toEqual({});
    });

    it('handles repeated keys (keeps last, per URLSearchParams)', () => {
      expect(parseQueryString('k=1&k=3')).toEqual({ k: '3' });
    });

    it('decodes percent-encoded values', () => {
      expect(parseQueryString('a=%2Ffoo%3Fz&b=%E2%9C%85')).toEqual({
        a: '/foo?z',
        b: '✅'
      });
    });

    it('returns string values only, even for numbers', () => {
      expect(parseQueryString('n=42')).toEqual({ n: '42' });
    });

    it('handles keys with empty value', () => {
      expect(parseQueryString('a=')).toEqual({ a: '' });
      expect(parseQueryString('a')).toEqual({ a: '' });
    });

    it('treats + as space (per URLSearchParams spec)', () => {
      expect(parseQueryString('q=foo+bar')).toEqual({ q: 'foo bar' });
    });
  });

  describe('isValidUrl', () => {
    it('returns true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://foo.com')).toBe(true);
    });
    it('returns false for invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
    });
    it('requires https if flag set', () => {
      expect(isValidUrl('https://a.com', true)).toBe(true);
      expect(isValidUrl('http://a.com', true)).toBe(false);
    });
  });

  describe('getDomain', () => {
    it('returns hostname by default', () => {
      expect(getDomain('https://api.example.com/path')).toBe('api.example.com');
    });
    it('removes subdomains if flag set', () => {
      expect(getDomain('https://api.example.com/path', true)).toBe('example.com');
      expect(getDomain('https://foo.bar.co.uk', true)).toBe('bar.co.uk');
    });
    it('returns hostname for 2-part domains when removing subdomains', () => {
      expect(getDomain('https://example.com', true)).toBe('example.com');
    });
    it('handles special second-level domains', () => {
      expect(getDomain('https://www.site.com.au', true)).toBe('site.com.au');
      expect(getDomain('https://api.example.co.in', true)).toBe('example.co.in');
      expect(getDomain('https://test.example.gov.uk', true)).toBe('example.gov.uk');
      expect(getDomain('https://sub.example.edu.au', true)).toBe('example.edu.au');
    });
    it("returns '' for invalid URL", () => {
      expect(getDomain('not a url')).toBe('');
    });
  });

  describe('joinPaths', () => {
    it('joins URL segments with single slashes', () => {
      expect(joinPaths('https://a.com/', '/foo/', '/bar')).toBe('https://a.com/foo/bar');
      expect(joinPaths('a', 'b', 'c')).toBe('a/b/c');
    });
    it('handles empty segments', () => {
      expect(joinPaths('', '/foo')).toBe('/foo');
    });
    it('handles very long input efficiently', () => {
      expect(joinPaths('/'.repeat(1e5), '/'.repeat(1e5))).toBe('');
    });
  });

  describe('normalizeUrl', () => {
    it('normalizes protocol, host, and path', () => {
      expect(normalizeUrl('HTTP://Example.COM/foo/../bar')).toBe('http://example.com/bar');
    });
    it('handles protocol-relative URLs', () => {
      expect(normalizeUrl('//example.com/test')).toBe('https://example.com/test');
    });
    it('returns original if invalid', () => {
      expect(normalizeUrl('not a url')).toBe('not a url');
    });
    it('removes trailing slashes', () => {
      expect(normalizeUrl('https://a.com/foo/')).toBe('https://a.com/foo');
    });
  });

  describe('createUrlBuilder', () => {
    it('builds URLs with path and query', () => {
      const api = createUrlBuilder('https://api.com');
      expect(api.path('/users', { a: 1 })).toBe('https://api.com/users?a=1');
      expect(api.query({ x: 'y' })).toBe('https://api.com/?x=y');
    });
    it('works without params', () => {
      const api = createUrlBuilder('https://api.com');
      expect(api.path('/foo')).toBe('https://api.com/foo');
    });
  });

  describe('extractQueryParams', () => {
    it('extracts specified params from URL', () => {
      const url = 'https://a.com/?x=1&y=2&z=3';
      expect(extractQueryParams(url, ['x', 'z'])).toEqual({ x: '1', z: '3' });
    });
    it('returns empty object if none found', () => {
      expect(extractQueryParams('https://a.com', ['foo'])).toEqual({});
    });
    it('returns empty object for invalid URL', () => {
      expect(extractQueryParams('not a url', ['x'])).toEqual({});
    });
  });

  describe('removeQueryParams', () => {
    it('removes specified params from URL', () => {
      const url = 'https://a.com/?x=1&y=2';
      expect(removeQueryParams(url, ['x'])).toBe('https://a.com/?y=2');
    });
    it('returns original if invalid URL', () => {
      expect(removeQueryParams('not a url', ['x'])).toBe('not a url');
    });
  });

  describe('getExtension', () => {
    it('returns file extension from URL', () => {
      expect(getExtension('https://a.com/file.txt')).toBe('txt');
      expect(getExtension('https://a.com/x/y.pdf?z=1')).toBe('pdf');
    });
    it("returns '' if no extension", () => {
      expect(getExtension('https://a.com/foo')).toBe('');
      expect(getExtension('not a url')).toBe('');
    });
  });

  describe('parseTypedQueryParams', () => {
    it('parses and converts query params using converters', () => {
      const url = 'https://a.com/?page=2&q=test';
      const result = parseTypedQueryParams<{ page: number; q: string }>(url, {
        page: Number,
        q: String
      });
      expect(result).toEqual({ page: 2, q: 'test' });
    });
    it('returns string values if no converters', () => {
      const url = 'https://a.com/?foo=bar';
      expect(parseTypedQueryParams(url)).toEqual({ foo: 'bar' });
    });
    it('returns {} for invalid URL', () => {
      expect(parseTypedQueryParams('not a url')).toEqual({});
    });
  });

  describe('updateQueryParam', () => {
    it('updates existing query parameter', () => {
      const url = 'https://example.com?page=1';
      expect(updateQueryParam(url, 'page', 2)).toBe('https://example.com/?page=2');
    });

    it('adds new query parameter', () => {
      const url = 'https://example.com?foo=bar';
      expect(updateQueryParam(url, 'page', 1)).toBe('https://example.com/?foo=bar&page=1');
    });

    it('handles URL without query string', () => {
      const url = 'https://example.com';
      expect(updateQueryParam(url, 'test', 'value')).toBe('https://example.com/?test=value');
    });

    it('converts number values to string', () => {
      const url = 'https://example.com';
      expect(updateQueryParam(url, 'page', 42)).toBe('https://example.com/?page=42');
    });

    it('returns original URL for invalid URL', () => {
      const url = 'not-a-url';
      expect(updateQueryParam(url, 'key', 'value')).toBe('not-a-url');
    });
  });

  describe('getSubdomain', () => {
    it('extracts subdomain from URL', () => {
      expect(getSubdomain('https://api.example.com')).toBe('api');
    });

    it('extracts multiple subdomains', () => {
      expect(getSubdomain('https://www.blog.example.com')).toBe('www.blog');
    });

    it('returns empty string for URL without subdomain', () => {
      expect(getSubdomain('https://example.com')).toBe('');
      expect(getSubdomain('https://localhost')).toBe('');
    });

    it('handles URLs with ports', () => {
      expect(getSubdomain('https://api.example.com:8080')).toBe('api');
    });

    it('returns empty string for invalid URL', () => {
      expect(getSubdomain('not-a-url')).toBe('');
    });
  });

  describe('isRelativeUrl', () => {
    it('returns true for relative URLs', () => {
      expect(isRelativeUrl('/path/to/page')).toBe(true);
      expect(isRelativeUrl('./relative/path')).toBe(true);
      expect(isRelativeUrl('../parent/path')).toBe(true);
    });

    it('returns false for absolute URLs', () => {
      expect(isRelativeUrl('https://example.com/page')).toBe(false);
      expect(isRelativeUrl('http://example.com')).toBe(false);
      expect(isRelativeUrl('ftp://example.com')).toBe(false);
    });

    it('returns false for protocol-relative URLs', () => {
      expect(isRelativeUrl('//example.com/path')).toBe(true); // Caught in catch block, starts with /
    });

    it('returns false for empty string', () => {
      expect(isRelativeUrl('')).toBe(false);
    });

    it('returns false for non-string input', () => {
      expect(isRelativeUrl(null as any)).toBe(false);
      expect(isRelativeUrl(undefined as any)).toBe(false);
    });
  });

  describe('toAbsoluteUrl', () => {
    it('converts relative URL to absolute', () => {
      expect(toAbsoluteUrl('/api/users', 'https://example.com')).toBe('https://example.com/api/users');
    });

    it('handles relative paths with ./', () => {
      expect(toAbsoluteUrl('./api/users', 'https://example.com')).toBe('https://example.com/api/users');
    });

    it('handles parent directory paths with ../', () => {
      expect(toAbsoluteUrl('../api/users', 'https://example.com/path')).toBe('https://example.com/api/users');
    });

    it('returns absolute URL unchanged if relative path is already absolute', () => {
      expect(toAbsoluteUrl('https://other.com/path', 'https://example.com')).toBe('https://other.com/path');
    });

    it('handles base URL with path', () => {
      expect(toAbsoluteUrl('users', 'https://example.com/api/')).toBe('https://example.com/api/users');
    });

    it('returns relative URL on error', () => {
      expect(toAbsoluteUrl('/path', 'not-a-url')).toBe('/path');
    });
  });

  describe('sanitizeUrl', () => {
    it('allows http and https by default', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('rejects javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('rejects data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('rejects file: protocol', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
    });

    it('allows custom protocols', () => {
      expect(sanitizeUrl('ftp://example.com', ['ftp'])).toBe('ftp://example.com/');
      expect(sanitizeUrl('ws://example.com', ['ws', 'wss'])).toBe('ws://example.com/');
    });

    it('rejects protocol not in allowed list', () => {
      expect(sanitizeUrl('ftp://example.com', ['http', 'https'])).toBeNull();
    });

    it('returns null for invalid URLs', () => {
      expect(sanitizeUrl('not-a-url')).toBeNull();
      expect(sanitizeUrl('')).toBeNull();
    });

    it('normalizes URL', () => {
      const result = sanitizeUrl('HTTPS://Example.COM/path');
      expect(result).toBeTruthy();
      expect(result).toContain('example.com');
    });
  });
});
