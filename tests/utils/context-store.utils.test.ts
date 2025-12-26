import { ContextStore, StoreKeys, getRequestId, getFromContext, TypedContextKey } from '../../src/context-store';

describe('ContextStoreUtils', () => {
  it('should return undefined for missing key outside run context', () => {
    expect(ContextStore.get(StoreKeys.REQUEST_ID)).toBeUndefined();
    expect(getRequestId()).toBeUndefined();
  });

  it('should set and get values within the same context', () => {
    const requestId = 'abc-123';
    ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId }, () => {
      expect(ContextStore.get(StoreKeys.REQUEST_ID)).toBe(requestId);
      expect(getRequestId()).toBe(requestId);
    });
  });

  it('should throw if set is called outside of run context', () => {
    expect(() => {
      ContextStore.set(StoreKeys.REQUEST_ID, 'xyz');
    }).toThrow(/AsyncLocalStorage store is not initialized/);
  });

  it('should isolate stores between parallel contexts', async () => {
    const requestId1 = 'req-1';
    const requestId2 = 'req-2';
    let value1: string | undefined;
    let value2: string | undefined;

    await Promise.all([
      new Promise<void>(resolve =>
        ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId1 }, () => {
          setTimeout(() => {
            value1 = ContextStore.get(StoreKeys.REQUEST_ID);
            resolve();
          }, 10);
        })
      ),
      new Promise<void>(resolve =>
        ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId2 }, () => {
          setTimeout(() => {
            value2 = ContextStore.get(StoreKeys.REQUEST_ID);
            resolve();
          }, 5);
        })
      )
    ]);
    expect(value1).toBe(requestId1);
    expect(value2).toBe(requestId2);
    expect(value1).not.toBe(value2);
  });

  it('should allow storing and retrieving custom objects', () => {
    const logger = { log: jest.fn() };
    ContextStore.run({ [StoreKeys.LOGGER]: logger }, () => {
      expect(ContextStore.get<typeof logger>(StoreKeys.LOGGER)).toBe(logger);
    });
  });

  it('should getAll returns correct store object within context', () => {
    const requestId = 'qwe-456';
    const logger = { name: 'mockLogger' };
    ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId, [StoreKeys.LOGGER]: logger }, () => {
      const all = ContextStore.getAll();
      expect(all).toBeDefined();
      expect(all![StoreKeys.REQUEST_ID]).toBe(requestId);
      expect(all![StoreKeys.LOGGER]).toBe(logger);
    });
  });

  it('should getInstance returns AsyncLocalStorage<Store> instance', () => {
    const instance = ContextStore.getInstance();
    expect(instance).toBeDefined();
    // Should at least have getStore method
    expect(typeof instance.getStore).toBe('function');
  });

  it('getFromContext returns correct value', () => {
    const requestId = 'id-xyz';
    ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId }, () => {
      expect(getFromContext<string>(StoreKeys.REQUEST_ID)).toBe(requestId);
      expect(getFromContext<string>(StoreKeys.USER_ID)).toBeUndefined();
    });
  });

  it('ContextStore.has returns true only if key exists in context', () => {
    ContextStore.run({ [StoreKeys.USER_ID]: 'u1' }, () => {
      expect(ContextStore.has(StoreKeys.USER_ID)).toBe(true);
      expect(ContextStore.has(StoreKeys.REQUEST_ID)).toBe(false);
    });
  });

  it('ContextStore.delete removes key and returns true, throws outside context', () => {
    ContextStore.run({ [StoreKeys.USER_ID]: 'u2' }, () => {
      expect(ContextStore.delete(StoreKeys.USER_ID)).toBe(true);
      expect(ContextStore.get(StoreKeys.USER_ID)).toBeUndefined();
    });
    expect(() => ContextStore.delete(StoreKeys.USER_ID)).toThrow(/AsyncLocalStorage store is not initialized/);
  });

  it('ContextStore.patch updates multiple values in context', () => {
    ContextStore.run({ [StoreKeys.REQUEST_ID]: 'r1' }, () => {
      const patchObj: Partial<Record<symbol, unknown>> = {};
      patchObj[StoreKeys.USER_ID] = 'patched-user';
      ContextStore.patch(patchObj);
      expect(ContextStore.get(StoreKeys.USER_ID)).toBe('patched-user');
    });
  });

  it('ContextStore.withValue temporarily overrides value in context', () => {
    ContextStore.run({ [StoreKeys.REQUEST_ID]: 'orig' }, () => {
      const result = ContextStore.withValue(StoreKeys.REQUEST_ID, 'temp', () => {
        return ContextStore.get(StoreKeys.REQUEST_ID);
      });
      expect(result).toBe('temp');
      expect(ContextStore.get(StoreKeys.REQUEST_ID)).toBe('orig');
    });
  });

  it('ContextStore.extend creates a new context inheriting from current', () => {
    ContextStore.run({ [StoreKeys.REQUEST_ID]: 'base' }, () => {
      const result = ContextStore.extend({ [StoreKeys.USER_ID]: 'extended' }, () => ({
        req: ContextStore.get(StoreKeys.REQUEST_ID),
        user: ContextStore.get(StoreKeys.USER_ID)
      }));
      expect(result.req).toBe('base');
      expect(result.user).toBe('extended');
      // Original context not affected
      expect(ContextStore.get(StoreKeys.USER_ID)).toBeUndefined();
    });
  });

  it('TypedContextKey works for get/set/exists/delete', () => {
    const key = new TypedContextKey<string>(StoreKeys.CORRELATION_ID, 'def');
    ContextStore.run({}, () => {
      expect(key.get()).toBe('def');
      key.set('corr-1');
      expect(key.get()).toBe('corr-1');
      expect(key.exists()).toBe(true);
      expect(key.delete()).toBe(true);
      expect(key.get()).toBe('def');
    });
  });

  it('ContextStore.createExpressMiddleware initializes context for requests', done => {
    const req = { headers: { 'x-request-id': 'req-abc' } };
    const middleware = ContextStore.createExpressMiddleware(r => ({
      [StoreKeys.REQUEST_ID]: r.headers['x-request-id']
    }));
    middleware(req, {}, () => {
      expect(ContextStore.get(StoreKeys.REQUEST_ID)).toBe('req-abc');
      done();
    });
  });
});
