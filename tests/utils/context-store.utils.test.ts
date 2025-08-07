import {
  ContextStore,
  StoreKeys,
  getRequestId,
} from "../../src/utils/context-store.utils";

describe("ContextStoreUtils", () => {
  it("should return undefined for missing key outside run context", () => {
    expect(ContextStore.get(StoreKeys.REQUEST_ID)).toBeUndefined();
    expect(getRequestId()).toBeUndefined();
  });

  it("should set and get values within the same context", () => {
    const requestId = "abc-123";
    ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId }, () => {
      expect(ContextStore.get(StoreKeys.REQUEST_ID)).toBe(requestId);
      expect(getRequestId()).toBe(requestId);
    });
  });

  it("should throw if set is called outside of run context", () => {
    expect(() => {
      ContextStore.set(StoreKeys.REQUEST_ID, "xyz");
    }).toThrow(/AsyncLocalStorage store is not initialized/);
  });

  it("should isolate stores between parallel contexts", async () => {
    const requestId1 = "req-1";
    const requestId2 = "req-2";
    let value1: string | undefined;
    let value2: string | undefined;

    await Promise.all([
      new Promise<void>((resolve) =>
        ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId1 }, () => {
          setTimeout(() => {
            value1 = ContextStore.get(StoreKeys.REQUEST_ID);
            resolve();
          }, 10);
        }),
      ),
      new Promise<void>((resolve) =>
        ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId2 }, () => {
          setTimeout(() => {
            value2 = ContextStore.get(StoreKeys.REQUEST_ID);
            resolve();
          }, 5);
        }),
      ),
    ]);
    expect(value1).toBe(requestId1);
    expect(value2).toBe(requestId2);
    expect(value1).not.toBe(value2);
  });

  it("should allow storing and retrieving custom objects", () => {
    const logger = { log: jest.fn() };
    ContextStore.run({ [StoreKeys.LOGGER]: logger }, () => {
      expect(ContextStore.get<typeof logger>(StoreKeys.LOGGER)).toBe(logger);
    });
  });

  it("should getAll returns correct store object within context", () => {
    const requestId = "qwe-456";
    const logger = { name: "mockLogger" };
    ContextStore.run(
      { [StoreKeys.REQUEST_ID]: requestId, [StoreKeys.LOGGER]: logger },
      () => {
        const all = ContextStore.getAll();
        expect(all).toBeDefined();
        expect(all![StoreKeys.REQUEST_ID]).toBe(requestId);
        expect(all![StoreKeys.LOGGER]).toBe(logger);
      },
    );
  });

  it("should getInstance returns AsyncLocalStorage<Store> instance", () => {
    const instance = ContextStore.getInstance();
    expect(instance).toBeDefined();
    // Should at least have getStore method
    expect(typeof instance.getStore).toBe("function");
  });
});
