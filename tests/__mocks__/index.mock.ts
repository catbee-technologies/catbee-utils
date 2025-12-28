import { Env } from '../../src/env';

/**
 * Stores the original environment variables so we can restore them later.
 */
const ORIGINAL_ENV = { ...process.env };

/**
 * Set multiple environment variables for a test.
 * Returns a cleanup function (`resetEnvs`) to restore the originals.
 */
export function setEnvs(envs: Record<string, string | undefined>) {
  const previous: Record<string, string | undefined> = {};

  for (const key of Object.keys(envs)) {
    previous[key] = process.env[key];
    if (envs[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = envs[key];
    }
  }

  return () => resetEnvs(previous);
}

/**
 * Reset environment variables to the provided values
 * (or fully back to the original snapshot if none are passed).
 */
export function resetEnvs(envs: Record<string, string | undefined> = ORIGINAL_ENV) {
  process.env = { ...ORIGINAL_ENV, ...envs };
}

type EnvMockOverrides = Partial<Record<keyof typeof Env, jest.Mock>>;

/**
 * Creates a mocked version of the `Env` utility module for Jest testing.
 * Supports partial mocking and custom overrides for any `Env` method.
 *
 * @param overrides - Optional mock implementations to override specific `Env` methods.
 * @returns A mocked `Env` module wrapped inside `{ Env: mockModule }`.
 *
 * @example
 * const mockEnv = getEnvMockModule({
 *   get: jest.fn().mockReturnValue("mocked-value"),
 *   isDev: jest.fn().mockReturnValue(true)
 * });
 */
export function getEnvMockModule(overrides: EnvMockOverrides = {}) {
  const mockModule = {
    isDev: jest.fn(() => true),
    get: jest.fn((_key: string, fallback: any) => fallback),
    getBoolean: jest.fn(() => false),
    getNumber: jest.fn((_key: string, fallback: number) => fallback),
    getPath: jest.fn((_key: string, fallback: string) => fallback),
    getJSON: jest.fn((_key: string, fallback: object) => fallback),
    getDuration: jest.fn((_key: string, fallback: number) => fallback),
    ...overrides
  } as Record<keyof typeof Env, jest.Mock> & EnvMockOverrides;

  return { Env: mockModule };
}
