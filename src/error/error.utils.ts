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

export interface ServerListenError extends Error {
  code?: string;
  errno?: number;
  syscall?: string;
  address?: string;
  port?: number;
}

export interface ServerListenErrorContext {
  serverName?: string;
  port?: number | string;
  host?: string;
  configEnvVar?: string;
}

/**
 * Enhances a Node.js network listen error (e.g., EADDRINUSE, EACCES) with human-readable,
 * actionable context while preserving all original error properties (code, errno, syscall, address, port).
 *
 * @param err - The Error or ErrnoException thrown/emitted during server listen.
 * @param context - Optional context including server name, target port, host, and configuration hint.
 * @returns The enhanced Error with improved message and stack.
 */
export function formatServerListenError<T extends Error = Error>(err: T, context: ServerListenErrorContext = {}): T {
  if (!err || typeof err !== 'object') {
    return err;
  }

  const nodeErr = err as ServerListenError;
  const port = nodeErr.port ?? context.port;
  const host = nodeErr.address ?? context.host ?? '0.0.0.0';
  const serverPrefix = context.serverName ? `${context.serverName}: ` : '';
  const envHint = context.configEnvVar ? ` via ${context.configEnvVar}` : '';
  const portDisplay = port !== undefined ? port : 'unknown';

  let enhancedMessage: string | null = null;

  if (nodeErr.code === 'EADDRINUSE') {
    enhancedMessage = `${serverPrefix}Port ${portDisplay} is already in use (${host}:${portDisplay}). Another process is already listening on this address. Please choose a different port${envHint} or terminate the conflicting process.`;
  } else if (nodeErr.code === 'EACCES') {
    enhancedMessage = `${serverPrefix}Permission denied to bind to ${host}:${portDisplay} (EACCES). Ports below 1024 typically require elevated administrative privileges. Please choose a different port${envHint} or run with elevated permissions.`;
  } else if (nodeErr.code === 'EADDRNOTAVAIL') {
    enhancedMessage = `${serverPrefix}Address ${host}:${portDisplay} is not available on this system (EADDRNOTAVAIL). Please verify the configured host or network interfaces.`;
  }

  if (enhancedMessage) {
    nodeErr.message = enhancedMessage;
    if (typeof nodeErr.stack === 'string') {
      nodeErr.stack = nodeErr.stack.replace(
        /^([A-Za-z0-9_]*Error:[^\n]*)/,
        `${nodeErr.name || 'Error'}: ${enhancedMessage}`
      );
    }
  }

  return err;
}
