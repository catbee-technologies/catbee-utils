/**
 * Ensures the provided value is returned as an {@link Error}.
 *
 * If the value is not already an Error, a new Error is created using the
 * value's message (if available) or its string representation. The original
 * value is attached as the error's `cause`.
 *
 * @param err - The value to convert to an Error.
 * @returns An Error instance.
 */
export function ensureError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }

  const message = typeof err === 'string' ? err : hasErrorMessage(err) ? err.message : String(err);

  return new Error(message, { cause: err });
}

/**
 * Returns the error message for the provided value.
 *
 * If the value is not already an Error, it is first converted using
 * {@link ensureError}.
 *
 * @param err - The value to extract the error message from.
 * @returns The error message.
 */
export function hasErrorMessage(value: unknown): value is { message: string } {
  return typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string';
}

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

/**
 * Serializes an error into a plain object containing its name, message, stack trace, and cause.
 * @param err - The error to serialize.
 * @returns An object representing the serialized error.
 */
export function serializeError(err: unknown): SerializedError {
  const error = ensureError(err);

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: error.cause
  };
}
