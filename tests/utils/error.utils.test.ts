import { ensureError, hasErrorMessage, serializeError, type SerializedError } from '../../src/error';

describe('ensureError', () => {
  it('should return the same Error instance', () => {
    const error = new Error('Something went wrong');

    expect(ensureError(error)).toBe(error);
  });

  it('should convert a string to an Error', () => {
    const error = ensureError('Failure');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Failure');
    expect(error.cause).toBe('Failure');
  });

  it('should use the message property from an object', () => {
    const input = { message: 'Custom message', code: 500 };

    const error = ensureError(input);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Custom message');
    expect(error.cause).toBe(input);
  });

  it('should stringify objects without a message property', () => {
    const input = { foo: 'bar' };

    const error = ensureError(input);

    expect(error.message).toBe('[object Object]');
    expect(error.cause).toBe(input);
  });

  it('should stringify numbers', () => {
    const error = ensureError(123);

    expect(error.message).toBe('123');
    expect(error.cause).toBe(123);
  });

  it('should stringify booleans', () => {
    const error = ensureError(false);

    expect(error.message).toBe('false');
    expect(error.cause).toBe(false);
  });

  it('should stringify null', () => {
    const error = ensureError(null);

    expect(error.message).toBe('null');
    expect(error.cause).toBeNull();
  });

  it('should stringify undefined', () => {
    const error = ensureError(undefined);

    expect(error.message).toBe('undefined');
    expect(error.cause).toBeUndefined();
  });
});

describe('hasErrorMessage', () => {
  it('should return true for objects with a string message', () => {
    expect(hasErrorMessage({ message: 'hello' })).toBe(true);
  });

  it('should return true for Error instances', () => {
    expect(hasErrorMessage(new Error('boom'))).toBe(true);
  });

  it('should return false for objects with a non-string message', () => {
    expect(hasErrorMessage({ message: 123 })).toBe(false);
  });

  it('should return false for objects without a message property', () => {
    expect(hasErrorMessage({ foo: 'bar' })).toBe(false);
  });

  it('should return false for null', () => {
    expect(hasErrorMessage(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(hasErrorMessage(undefined)).toBe(false);
  });

  it('should return false for primitive values', () => {
    expect(hasErrorMessage('hello')).toBe(false);
    expect(hasErrorMessage(123)).toBe(false);
    expect(hasErrorMessage(true)).toBe(false);
  });
});

describe('serializeError', () => {
  it('should serialize an Error', () => {
    const cause = new Error('Root cause');
    const error = new Error('Failure', { cause });

    const serialized = serializeError(error);

    expect(serialized).toEqual(
      expect.objectContaining<SerializedError>({
        name: 'Error',
        message: 'Failure',
        cause
      })
    );

    expect(serialized.stack).toEqual(expect.any(String));
  });

  it('should serialize a string', () => {
    const serialized = serializeError('Failure');

    expect(serialized).toEqual(
      expect.objectContaining({
        name: 'Error',
        message: 'Failure',
        cause: 'Failure'
      })
    );

    expect(serialized.stack).toEqual(expect.any(String));
  });

  it('should serialize an object with a message property', () => {
    const input = { message: 'Oops', code: 400 };

    const serialized = serializeError(input);

    expect(serialized).toEqual(
      expect.objectContaining({
        name: 'Error',
        message: 'Oops',
        cause: input
      })
    );
  });

  it('should serialize objects without a message property', () => {
    const input = { foo: 'bar' };

    const serialized = serializeError(input);

    expect(serialized).toEqual(
      expect.objectContaining({
        name: 'Error',
        message: '[object Object]',
        cause: input
      })
    );
  });
});
