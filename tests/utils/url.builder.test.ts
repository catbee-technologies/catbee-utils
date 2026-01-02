import { UrlBuilder } from '../../src/url/url.builder';

describe('UrlBuilder', () => {
  describe('Constructor and Factory Methods', () => {
    it('should create with default localhost URL', () => {
      const builder = new UrlBuilder();
      expect(builder.toString()).toBe('http://localhost/');
    });

    it('should create from URL string', () => {
      const builder = new UrlBuilder('https://example.com/path');
      expect(builder.toString()).toBe('https://example.com/path');
    });

    it('should create from URL using from static method', () => {
      const builder = UrlBuilder.from('https://api.example.com/users');
      expect(builder.getHost()).toBe('api.example.com');
      expect(builder.getPath()).toBe('/users');
    });

    it('should create HTTP URL using http static method', () => {
      const builder = UrlBuilder.http('example.com');
      expect(builder.toString()).toBe('http://example.com/');
    });

    it('should create HTTP URL with path', () => {
      const builder = UrlBuilder.http('example.com', '/api/users');
      expect(builder.toString()).toBe('http://example.com/api/users');
    });

    it('should create HTTPS URL using https static method', () => {
      const builder = UrlBuilder.https('example.com');
      expect(builder.toString()).toBe('https://example.com/');
    });

    it('should create HTTPS URL with path', () => {
      const builder = UrlBuilder.https('example.com', '/api');
      expect(builder.toString()).toBe('https://example.com/api');
    });

    it('should handle invalid URL gracefully', () => {
      const builder = new UrlBuilder('invalid-url');
      expect(builder.toString()).toBe('http://localhost/');
    });

    it('should clone builder', () => {
      const original = UrlBuilder.https('example.com', '/api');
      const cloned = original.clone();
      expect(cloned.toString()).toBe(original.toString());
      expect(cloned).not.toBe(original);
    });
  });

  describe('Protocol Methods', () => {
    it('should set protocol', () => {
      const builder = new UrlBuilder('http://example.com').protocol('https');
      expect(builder.getProtocol()).toBe('https:');
    });

    it('should handle protocol with colon', () => {
      const builder = new UrlBuilder('http://example.com').protocol('https:');
      expect(builder.getProtocol()).toBe('https:');
    });

    it('should set protocol to HTTP', () => {
      const builder = UrlBuilder.https('example.com').http();
      expect(builder.getProtocol()).toBe('http:');
    });

    it('should set protocol to HTTPS', () => {
      const builder = UrlBuilder.http('example.com').https();
      expect(builder.getProtocol()).toBe('https:');
    });

    it('should set custom protocol', () => {
      const builder = new UrlBuilder('http://example.com').protocol('ftp');
      expect(builder.getProtocol()).toBe('ftp:');
    });
  });

  describe('Host/Domain Methods', () => {
    it('should set hostname', () => {
      const builder = new UrlBuilder().host('example.com');
      expect(builder.getHost()).toBe('example.com');
    });

    it('should set hostname using hostname method', () => {
      const builder = new UrlBuilder().hostname('api.example.com');
      expect(builder.getHostname()).toBe('api.example.com');
    });

    it('should set port', () => {
      const builder = new UrlBuilder('http://example.com').port(8080);
      expect(builder.getPort()).toBe('8080');
      expect(builder.toString()).toBe('http://example.com:8080/');
    });

    it('should set port as string', () => {
      const builder = new UrlBuilder('http://example.com').port('3000');
      expect(builder.getPort()).toBe('3000');
    });

    it('should remove port', () => {
      const builder = new UrlBuilder('http://example.com:8080').removePort();
      expect(builder.getPort()).toBe('');
      expect(builder.toString()).toBe('http://example.com/');
    });

    it('should set subdomain', () => {
      const builder = new UrlBuilder('http://example.com').subdomain('api');
      expect(builder.getHost()).toBe('api.example.com');
    });

    it('should replace existing subdomain', () => {
      const builder = new UrlBuilder('http://www.example.com').subdomain('api');
      expect(builder.getHost()).toBe('api.example.com');
    });

    it('should remove subdomain', () => {
      const builder = new UrlBuilder('http://api.example.com').subdomain('');
      expect(builder.getHost()).toBe('example.com');
    });

    it('should handle single-part hostname when setting subdomain', () => {
      const builder = new UrlBuilder('http://localhost').subdomain('api');
      expect(builder.getHost()).toBe('api.localhost');
    });

    it('should handle single-part hostname when removing subdomain', () => {
      const builder = new UrlBuilder('http://localhost').subdomain('');
      expect(builder.getHost()).toBe('localhost');
    });
  });

  describe('Path Methods', () => {
    it('should set path', () => {
      const builder = new UrlBuilder('http://example.com').path('/api/users');
      expect(builder.getPath()).toBe('/api/users');
    });

    it('should set path without leading slash', () => {
      const builder = new UrlBuilder('http://example.com').path('api/users');
      expect(builder.getPath()).toBe('/api/users');
    });

    it('should append path segments', () => {
      const builder = new UrlBuilder('http://example.com/api').appendPath('users', '123');
      expect(builder.getPath()).toBe('/api/users/123');
    });

    it('should handle trailing slashes in appendPath', () => {
      const builder = new UrlBuilder('http://example.com/api/').appendPath('/users/', '/123/');
      expect(builder.getPath()).toBe('/api/users/123');
    });

    it('should prepend path segments', () => {
      const builder = new UrlBuilder('http://example.com/users').prependPath('api', 'v1');
      expect(builder.getPath()).toBe('/api/v1/users');
    });

    it('should replace path segment', () => {
      const builder = new UrlBuilder('http://example.com/api/users/123').replacePathSegment(1, 'posts');
      expect(builder.getPath()).toBe('/api/posts/123');
    });

    it('should not replace segment with invalid index', () => {
      const builder = new UrlBuilder('http://example.com/api/users').replacePathSegment(10, 'posts');
      expect(builder.getPath()).toBe('/api/users');
    });

    it('should get path segments', () => {
      const builder = new UrlBuilder('http://example.com/api/v1/users');
      expect(builder.getPathSegments()).toEqual(['api', 'v1', 'users']);
    });
  });

  describe('Query Parameter Methods', () => {
    it('should set single query parameter', () => {
      const builder = new UrlBuilder('http://example.com').queryParam('page', 1);
      expect(builder.getQueryParam('page')).toBe('1');
      expect(builder.toString()).toBe('http://example.com/?page=1');
    });

    it('should set multiple query parameters', () => {
      const builder = new UrlBuilder('http://example.com').queryParam('page', 1).queryParam('limit', 10);
      expect(builder.getQueryParams()).toEqual({ page: '1', limit: '10' });
    });

    it('should handle boolean query parameters', () => {
      const builder = new UrlBuilder('http://example.com').queryParam('active', true);
      expect(builder.getQueryParam('active')).toBe('true');
    });

    it('should delete parameter when value is null', () => {
      const builder = new UrlBuilder('http://example.com?page=1').queryParam('page', null);
      expect(builder.hasQueryParam('page')).toBe(false);
    });

    it('should delete parameter when value is undefined', () => {
      const builder = new UrlBuilder('http://example.com?page=1').queryParam('page', undefined);
      expect(builder.hasQueryParam('page')).toBe(false);
    });

    it('should add multiple query parameters at once', () => {
      const builder = new UrlBuilder('http://example.com').addQueryParams({ page: 1, limit: 10, active: true });
      expect(builder.getQueryParams()).toEqual({
        page: '1',
        limit: '10',
        active: 'true'
      });
    });

    it('should set query parameters (replacing all)', () => {
      const builder = new UrlBuilder('http://example.com?old=value').setQueryParams({ page: 1, limit: 10 });
      expect(builder.getQueryParams()).toEqual({ page: '1', limit: '10' });
      expect(builder.hasQueryParam('old')).toBe(false);
    });

    it('should remove single query parameter', () => {
      const builder = new UrlBuilder('http://example.com?page=1&limit=10').removeQueryParam('page');
      expect(builder.hasQueryParam('page')).toBe(false);
      expect(builder.hasQueryParam('limit')).toBe(true);
    });

    it('should remove multiple query parameters', () => {
      const builder = new UrlBuilder('http://example.com?page=1&limit=10&sort=name').removeQueryParams([
        'page',
        'limit'
      ]);
      expect(builder.getQueryParams()).toEqual({ sort: 'name' });
    });

    it('should clear all query parameters', () => {
      const builder = new UrlBuilder('http://example.com?page=1&limit=10').clearQueryParams();
      expect(builder.getQueryParams()).toEqual({});
      expect(builder.getSearch()).toBe('');
    });

    it('should append query parameter (array-style)', () => {
      const builder = new UrlBuilder('http://example.com')
        .appendQueryParam('tags', 'javascript')
        .appendQueryParam('tags', 'typescript');
      expect(builder.getQueryParamAll('tags')).toEqual(['javascript', 'typescript']);
    });

    it('should check if query parameter exists', () => {
      const builder = new UrlBuilder('http://example.com?page=1');
      expect(builder.hasQueryParam('page')).toBe(true);
      expect(builder.hasQueryParam('limit')).toBe(false);
    });

    it('should get all query parameters as object', () => {
      const builder = new UrlBuilder('http://example.com?page=1&limit=10');
      expect(builder.getQueryParams()).toEqual({ page: '1', limit: '10' });
    });

    it('should get search string', () => {
      const builder = new UrlBuilder('http://example.com?page=1');
      expect(builder.getSearch()).toBe('?page=1');
    });
  });

  describe('Hash/Fragment Methods', () => {
    it('should set hash', () => {
      const builder = new UrlBuilder('http://example.com').hash('section');
      expect(builder.getHash()).toBe('#section');
    });

    it('should set hash with # prefix', () => {
      const builder = new UrlBuilder('http://example.com').hash('#section');
      expect(builder.getHash()).toBe('#section');
    });

    it('should remove hash', () => {
      const builder = new UrlBuilder('http://example.com#section').removeHash();
      expect(builder.getHash()).toBe('');
      expect(builder.hasHash()).toBe(false);
    });

    it('should check if has hash', () => {
      const withHash = new UrlBuilder('http://example.com#section');
      const withoutHash = new UrlBuilder('http://example.com');
      expect(withHash.hasHash()).toBe(true);
      expect(withoutHash.hasHash()).toBe(false);
    });
  });

  describe('Authentication Methods', () => {
    it('should set username', () => {
      const builder = new UrlBuilder('http://example.com').username('admin');
      expect(builder.getUsername()).toBe('admin');
      expect(builder.toString()).toBe('http://admin@example.com/');
    });

    it('should set password', () => {
      const builder = new UrlBuilder('http://example.com').password('secret');
      expect(builder.getPassword()).toBe('secret');
    });

    it('should set both username and password', () => {
      const builder = new UrlBuilder('http://example.com').auth('admin', 'secret');
      expect(builder.getUsername()).toBe('admin');
      expect(builder.getPassword()).toBe('secret');
      expect(builder.toString()).toBe('http://admin:secret@example.com/');
    });

    it('should remove authentication', () => {
      const builder = new UrlBuilder('http://admin:secret@example.com').removeAuth();
      expect(builder.getUsername()).toBe('');
      expect(builder.getPassword()).toBe('');
      expect(builder.hasAuth()).toBe(false);
    });

    it('should check if has authentication', () => {
      const withAuth = new UrlBuilder('http://admin@example.com');
      const withoutAuth = new UrlBuilder('http://example.com');
      expect(withAuth.hasAuth()).toBe(true);
      expect(withoutAuth.hasAuth()).toBe(false);
    });
  });

  describe('Validation Methods', () => {
    it('should validate URL', () => {
      const valid = UrlBuilder.https('example.com');
      expect(valid.isValid()).toBe(true);
    });

    it('should check if HTTPS', () => {
      const httpsUrl = UrlBuilder.https('example.com');
      const httpUrl = UrlBuilder.http('example.com');
      expect(httpsUrl.isHttps()).toBe(true);
      expect(httpUrl.isHttps()).toBe(false);
    });

    it('should check if HTTP', () => {
      const httpUrl = UrlBuilder.http('example.com');
      const httpsUrl = UrlBuilder.https('example.com');
      expect(httpUrl.isHttp()).toBe(true);
      expect(httpsUrl.isHttp()).toBe(false);
    });
  });

  describe('Transformation Methods', () => {
    it('should normalize URL', () => {
      const builder = new UrlBuilder('HTTP://EXAMPLE.COM/foo/../bar').normalize();
      expect(builder.toString()).toContain('example.com');
    });

    it('should sanitize URL with default allowed protocols', () => {
      const valid = new UrlBuilder('https://example.com').sanitize();
      expect(valid).not.toBeNull();
      expect(valid?.toString()).toBe('https://example.com/');
    });

    it('should sanitize URL and reject disallowed protocols', () => {
      const invalid = new UrlBuilder('javascript:alert(1)').sanitize();
      expect(invalid).toBeNull();
    });

    it('should sanitize with custom allowed protocols', () => {
      const ftpUrl = new UrlBuilder('ftp://example.com').sanitize(['ftp']);
      expect(ftpUrl).not.toBeNull();
    });

    it('should lowercase hostname', () => {
      const builder = new UrlBuilder('http://EXAMPLE.COM').lowercaseHost();
      expect(builder.getHost()).toBe('example.com');
    });
  });

  describe('Conversion Methods', () => {
    const testUrl = 'https://user:pass@example.com:8080/api/users?page=1&limit=10#section';

    it('should build URL string', () => {
      const builder = new UrlBuilder(testUrl);
      const built = builder.build();
      expect(typeof built).toBe('string');
      expect(built).toContain('example.com');
    });

    it('should convert to string', () => {
      const builder = new UrlBuilder(testUrl);
      const str = builder.toString();
      expect(typeof str).toBe('string');
      expect(str).toContain('example.com');
    });

    it('should convert to URL object', () => {
      const builder = new UrlBuilder(testUrl);
      const urlObj = builder.toURL();
      expect(urlObj).toBeInstanceOf(URL);
      expect(urlObj.hostname).toBe('example.com');
    });

    it('should convert to JSON', () => {
      const builder = new UrlBuilder(testUrl);
      const json = builder.toJSON();
      expect(typeof json).toBe('string');
    });

    it('should get href', () => {
      const builder = new UrlBuilder(testUrl);
      const href = builder.href();
      expect(typeof href).toBe('string');
      expect(href).toContain('example.com');
    });

    it('should convert to object', () => {
      const builder = UrlBuilder.https('example.com').port(8080).path('/api').queryParam('page', 1).hash('section');

      const obj = builder.toObject();

      expect(obj.protocol).toBe('https:');
      expect(obj.hostname).toBe('example.com');
      expect(obj.port).toBe('8080');
      expect(obj.pathname).toBe('/api');
      expect(obj.hash).toBe('#section');
      expect(obj.queryParams).toEqual({ page: '1' });
      expect(obj.href).toContain('https://example.com:8080/api?page=1#section');
    });

    it('should get origin', () => {
      const builder = UrlBuilder.https('example.com').port(8080);
      expect(builder.getOrigin()).toBe('https://example.com:8080');
    });
  });

  describe('Immutability', () => {
    it('should not modify original instance when chaining', () => {
      const original = UrlBuilder.https('example.com');
      const modified = original.path('/api').queryParam('page', 1);

      expect(original.getPath()).toBe('/');
      expect(original.hasQueryParam('page')).toBe(false);
      expect(modified.getPath()).toBe('/api');
      expect(modified.hasQueryParam('page')).toBe(true);
    });

    it('should create independent instances', () => {
      const builder1 = UrlBuilder.https('example.com');
      const builder2 = builder1.path('/api');

      expect(builder1).not.toBe(builder2);
      expect(builder1.toString()).not.toBe(builder2.toString());
    });
  });

  describe('Complex Chaining', () => {
    it('should chain multiple operations', () => {
      const url = new UrlBuilder()
        .https()
        .host('api.example.com')
        .port(8080)
        .appendPath('v1', 'users', '123')
        .addQueryParams({ page: 1, limit: 10, active: true })
        .hash('profile')
        .build();

      expect(url).toBe('https://api.example.com:8080/v1/users/123?page=1&limit=10&active=true#profile');
    });

    it('should build complex API URL', () => {
      const url = UrlBuilder.https('api.github.com')
        .appendPath('repos', 'owner', 'repo', 'issues')
        .addQueryParams({
          state: 'open',
          labels: 'bug',
          sort: 'created',
          direction: 'desc'
        })
        .build();

      expect(url).toContain('https://api.github.com/repos/owner/repo/issues');
      expect(url).toContain('state=open');
      expect(url).toContain('labels=bug');
    });

    it('should modify existing URL', () => {
      const url = UrlBuilder.from('https://example.com/old?old=param')
        .path('/new')
        .clearQueryParams()
        .addQueryParams({ new: 'value', count: 42 })
        .hash('section')
        .build();

      expect(url).toBe('https://example.com/new?new=value&count=42#section');
    });

    it('should build URL with authentication', () => {
      const url = UrlBuilder.https('example.com').auth('admin', 'secret').path('/admin/dashboard').build();

      expect(url).toBe('https://admin:secret@example.com/admin/dashboard');
    });

    it('should build localhost development URL', () => {
      const url = new UrlBuilder()
        .http()
        .host('localhost')
        .port(3000)
        .appendPath('api', 'v1', 'users')
        .queryParam('debug', true)
        .build();

      expect(url).toBe('http://localhost:3000/api/v1/users?debug=true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty path segments', () => {
      const builder = new UrlBuilder('http://example.com').appendPath('', 'users', '', '123', '');
      expect(builder.getPath()).toBe('/users/123');
    });

    it('should handle multiple slashes in path', () => {
      const builder = new UrlBuilder('http://example.com///api///users///');
      expect(builder.getPath()).toBe('/api/users/');
    });

    it('should handle special characters in query params', () => {
      const builder = new UrlBuilder('http://example.com').queryParam('search', 'hello world');
      expect(builder.getQueryParam('search')).toBe('hello world');
    });

    it('should handle URL with all components', () => {
      const builder = new UrlBuilder('https://user:pass@example.com:8080/path?query=1#hash');
      expect(builder.getProtocol()).toBe('https:');
      expect(builder.getUsername()).toBe('user');
      expect(builder.getPassword()).toBe('pass');
      expect(builder.getHost()).toBe('example.com');
      expect(builder.getPort()).toBe('8080');
      expect(builder.getPath()).toBe('/path');
      expect(builder.getQueryParam('query')).toBe('1');
      expect(builder.getHash()).toBe('#hash');
    });
  });
});
