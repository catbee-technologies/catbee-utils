import * as loggerUtils from "../../src/utils/logger.utils";
import { Config } from "../../src/config";
import { ContextStore } from "../../src/utils/context-store.utils";
import pino, { stdTimeFunctions } from "pino";

jest.mock("pino");

jest.mock("../../src/config", () => ({
  Config: {
    Logger: {
      name: "TestLogger",
      level: "info",
      isoTimestamp: false,
    },
  },
}));

jest.mock("../../src/utils/context-store.utils", () => ({
  ContextStore: {
    get: jest.fn(),
  },
  StoreKeys: {
    LOGGER: Symbol("MOCK_LOGGER_KEY"),
  },
}));

describe("LoggerUtils", () => {
  const mockPino = pino as unknown as jest.Mock;
  let origGlobal: any;

  beforeEach(() => {
    // Save and reset the global singleton key
    origGlobal = { ...globalThis };
    delete (globalThis as any)[Symbol.for("logger")];

    // Clear global logger singleton
    (globalThis as any)[Symbol.for("logger")] = undefined;

    // Clear mock call history
    mockPino.mockClear();

    // Reset mock return values
    mockPino.mockReset();

    // Reset ContextStore mock
    (ContextStore.get as jest.Mock).mockReset();

    // Reset config flag
    Config.Logger.isoTimestamp = false;
  });

  afterEach(() => {
    // Restore globalThis to avoid test leaks
    Object.keys(globalThis).forEach((k) => {
      if (!(k in origGlobal)) delete (globalThis as any)[k];
    });
  });

  it("setupLogger sets logger on global and logs debug", () => {
    const logMock = { debug: jest.fn() };
    mockPino.mockReturnValue(logMock);

    // To access the internal key, call the setup function via getLogger()
    loggerUtils.getLogger();

    const globalLogger = (globalThis as any)[Symbol.for("logger")];
    expect(globalLogger).toBe(logMock);

    // The logger's debug method should be called to confirm initialization
    expect(logMock.debug).toHaveBeenCalledWith("Logger initialized");

    // Should have passed correct LoggerOptions to pino
    const loggerCall = mockPino.mock.calls[0][0];

    expect(loggerCall.name).toBe(Config.Logger.name);
    expect(loggerCall.level).toBe(Config.Logger.level);
    expect(loggerCall.redact).toBeDefined();
    expect(typeof loggerCall.redact.censor).toBe("function");
  });

  it("redaction censor works for url and authorization", () => {
    mockPino.mockReturnValue({ debug: jest.fn() });
    loggerUtils.getLogger(); // triggers setupLogger

    // Find the redact.censor function passed to pino
    const [opts] = mockPino.mock.calls[0];
    const censor = opts.redact.censor;

    // Redact access_token in URL
    expect(censor("hello?access_token=mytok123&x=1", ["url"])).toEqual(
      "hello?access_token=***&x=1",
    );

    // Redact Bearer tokens in authorization
    expect(censor("Bearer secret", ["req", "authorization"])).toEqual(
      "Bearer ***",
    );

    // Redact other fields
    expect(censor("should hide", ["password"])).toEqual("***");
  });

  it("includes iso timestamp if Config.Logger.isoTimestamp is true", () => {
    (Config.Logger as any).isoTimestamp = true;
    const mockLog = { debug: jest.fn() };
    mockPino.mockReturnValue(mockLog);

    loggerUtils.getLogger();

    const callOpts = mockPino.mock.calls[0][0];
    expect(callOpts.timestamp).toBe(stdTimeFunctions.isoTime);

    (Config.Logger as any).isoTimestamp = false; // reset for other tests
  });

  it("returns request-scoped logger if in ContextStore", () => {
    const reqLogger = { log: jest.fn() };
    (ContextStore.get as jest.Mock).mockReturnValue(reqLogger);

    const result = loggerUtils.getLogger();
    expect(result).toBe(reqLogger);

    // Should not call pino or global logger setup at all
    expect(pino).not.toHaveBeenCalled();
  });

  it("always returns same logger unless request logger is set", () => {
    // Should create on first call, then reuse on next
    const gLogger = { debug: jest.fn() };
    mockPino.mockReturnValue(gLogger);

    expect(loggerUtils.getLogger()).toBe(gLogger);
    expect(loggerUtils.getLogger()).toBe(gLogger);

    expect(mockPino).toHaveBeenCalledTimes(1);
  });

  it("handles CJS and globalThis environments", () => {
    (global as any)[Symbol.for("logger")] = undefined;
    delete (global as any)[Symbol.for("logger")];
    // In practice, the code abstracts this access, so test just confirms code loads and sets
    mockPino.mockReturnValue({ debug: jest.fn() });

    expect(loggerUtils.getLogger()).toBeDefined();

    if ((global as any)[Symbol.for("logger")]) {
      expect((global as any)[Symbol.for("logger")]).toBeDefined();
    } else {
      expect((globalThis as any)[Symbol.for("logger")]).toBeDefined();
    }
  });
});
