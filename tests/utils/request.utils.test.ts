import {
  parseNumberParam,
  parseBooleanParam,
  extractPaginationParams,
  extractSortParams,
  extractFilterParams
} from '../../src/utils/request.utils';

describe('parseNumberParam', () => {
  it('parses valid number', () => {
    expect(parseNumberParam('42')).toEqual({ isValid: true, value: 42 });
  });

  it('returns defaultValue if missing', () => {
    expect(parseNumberParam(undefined, { defaultValue: 5 })).toEqual({
      isValid: true,
      value: 5
    });
  });

  it('fails if required and missing', () => {
    expect(parseNumberParam(undefined, { required: true })).toEqual({
      isValid: false,
      value: null,
      error: 'Required number parameter is missing'
    });
  });

  it('throws if required and throwOnError', () => {
    expect(() => parseNumberParam(undefined, { required: true, throwOnError: true })).toThrow(
      'Required number parameter is missing'
    );
  });

  it('returns error for NaN', () => {
    expect(parseNumberParam('abc')).toEqual({
      isValid: false,
      value: null,
      error: 'Invalid number parameter'
    });
  });
});

describe('parseBooleanParam', () => {
  it('parses true values', () => {
    ['true', 't', 'yes', 'y', '1'].forEach(v => {
      expect(parseBooleanParam(v)).toEqual({ isValid: true, value: true });
    });
  });

  it('parses false values', () => {
    ['false', 'f', 'no', 'n', '0'].forEach(v => {
      expect(parseBooleanParam(v)).toEqual({ isValid: true, value: false });
    });
  });

  it('returns defaultValue if missing', () => {
    expect(parseBooleanParam(undefined, { defaultValue: false })).toEqual({
      isValid: true,
      value: false
    });
  });

  it('fails if required and missing', () => {
    expect(parseBooleanParam(undefined, { required: true })).toEqual({
      isValid: false,
      value: null,
      error: 'Required boolean parameter is missing'
    });
  });

  it('throws on invalid input when throwOnError', () => {
    expect(() => parseBooleanParam('maybe', { throwOnError: true })).toThrow('Invalid boolean parameter');
  });

  it('returns error on invalid input', () => {
    expect(parseBooleanParam('maybe')).toEqual({
      isValid: false,
      value: null,
      error: 'Invalid boolean parameter'
    });
  });
});

describe('extractPaginationParams', () => {
  it('uses defaults if no params', () => {
    expect(extractPaginationParams({})).toEqual({ page: 1, limit: 20 });
  });

  it('parses valid page and limit', () => {
    expect(extractPaginationParams({ page: '3', limit: '15' })).toEqual({
      page: 3,
      limit: 15
    });
  });

  it('enforces min page and limit', () => {
    expect(extractPaginationParams({ page: '0', limit: '0' })).toEqual({
      page: 1,
      limit: 20
    });
  });

  it('caps limit at maxLimitSize', () => {
    expect(extractPaginationParams({ limit: '999' }, 1, 20, 100)).toEqual({
      page: 1,
      limit: 100
    });
  });
});

describe('extractSortParams', () => {
  const allowedFields = ['name', 'createdAt', 'updatedAt'];

  it('uses defaults when no params', () => {
    expect(extractSortParams({}, allowedFields)).toEqual({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  });

  it('parses sortBy field', () => {
    expect(extractSortParams({ sortBy: 'name' }, allowedFields)).toEqual({
      sortBy: 'name',
      sortOrder: 'desc'
    });
  });

  it('parses sort with prefix "-"', () => {
    expect(extractSortParams({ sort: '-updatedAt' }, allowedFields)).toEqual({
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });
  });

  it('overrides with explicit sortOrder', () => {
    expect(extractSortParams({ sort: '-name', sortOrder: 'asc' }, allowedFields)).toEqual({
      sortBy: 'name',
      sortOrder: 'asc'
    });
  });

  it('falls back to default if field not allowed', () => {
    expect(extractSortParams({ sortBy: 'invalid' }, allowedFields)).toEqual({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  });
});

describe('extractFilterParams', () => {
  const allowedFilters = ['status', 'type'];

  it('extracts allowed filters', () => {
    expect(extractFilterParams({ status: 'active', foo: 'bar' }, allowedFilters)).toEqual({ status: 'active' });
  });

  it('returns empty object if no allowed filters', () => {
    expect(extractFilterParams({ foo: 'bar' }, allowedFilters)).toEqual({});
  });

  it('handles array values in filters', () => {
    expect(extractFilterParams({ type: ['a', 'b'] }, allowedFilters)).toEqual({ type: ['a', 'b'] });
  });
});
