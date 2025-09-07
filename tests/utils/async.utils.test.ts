import {
  sleep,
  debounce,
  throttle,
  retry,
  withTimeout,
  runInBatches,
  singletonAsync,
  settleAll,
  createTaskQueue,
  runInSeries,
  memoizeAsync,
  abortable,
  createDeferred,
  waterfall,
  rateLimit,
  circuitBreaker,
  CircuitBreakerOpenError,
  runWithConcurrency
} from '../../src/utils/async.utils';

describe('sleep', () => {
  it('delays for at least the given ms', async () => {
    const start = Date.now();
    await sleep(30);
    expect(Date.now() - start).toBeGreaterThanOrEqual(30 - 5); // allow some margin for test environment
  });
});

describe('debounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('delays function invocation', async () => {
    const fn = jest.fn();
    const deb = debounce(fn, 100);
    deb();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(99);
    await Promise.resolve();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets timer if called again within delay', async () => {
    const fn = jest.fn();
    const deb = debounce(fn, 100);
    deb('a');
    jest.advanceTimersByTime(50);
    deb('b');
    jest.advanceTimersByTime(99);
    await Promise.resolve();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(fn).toHaveBeenLastCalledWith('b');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('supports .cancel()', async () => {
    const fn = jest.fn();
    const deb = debounce(fn, 100);
    deb();
    deb.cancel();
    jest.advanceTimersByTime(200);
    await Promise.resolve();
    expect(fn).not.toHaveBeenCalled();
  });

  it('supports .flush()', () => {
    const fn = jest.fn();
    const deb = debounce(fn, 100);
    deb('z');
    deb.flush();
    expect(fn).toHaveBeenCalledWith('z');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('calls function immediately when leading=true', () => {
    const fn = jest.fn();
    const thr = throttle(fn, 100, { leading: true });
    thr('x');
    expect(fn).toHaveBeenCalledWith('x');
    expect(fn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(50);
    thr('y');
    expect(fn).toHaveBeenCalledTimes(1); // throttled
    jest.advanceTimersByTime(50);
    thr('z');
    expect(fn).toHaveBeenCalledWith('z');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('calls trailing if enabled', async () => {
    const fn = jest.fn();
    const thr = throttle(fn, 100, { leading: false, trailing: true });
    thr('a');
    jest.advanceTimersByTime(50);
    thr('b');
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledWith('b');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('retry', () => {
  it('retries on rejection and succeeds eventually', async () => {
    let count = 0;
    const fn = jest.fn().mockImplementation(() => {
      count++;
      if (count < 3) return Promise.reject('fail');
      return Promise.resolve('ok');
    });
    const onRetry = jest.fn();
    await expect(retry(fn, 5, 1, false, onRetry)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('throws if all retries fail', async () => {
    const fn = jest.fn().mockRejectedValue('fail');
    await expect(retry(fn, 2, 1)).rejects.toBe('fail');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('uses exponential backoff if enabled', async () => {
    let count = 0;
    const calls: number[] = [];
    const setTimeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((cb: (...args: any[]) => void, delay?: number) => {
        calls.push(delay ?? 0);
        cb();
        return 0 as any;
      });
    const fn = jest.fn(() => {
      count++;
      if (count < 3) {
        return Promise.reject('fail');
      }
      return Promise.resolve('done');
    });
    await expect(retry(fn, 3, 10, true)).resolves.toBe('done');
    expect(calls[0]).toBe(10); // after first fail
    expect(calls[1]).toBe(20); // after second fail
    setTimeoutSpy.mockRestore();
  });
});

describe('withTimeout', () => {
  it('resolves if promise does in time', async () => {
    await expect(withTimeout(Promise.resolve('x'), 100)).resolves.toBe('x');
  });

  it('rejects if promise does not resolve in time', async () => {
    const slow = new Promise<void>(() => {});
    await expect(withTimeout(slow, 10, 'timeout!')).rejects.toThrow('timeout!');
  });
});

describe('runInBatches', () => {
  it('resolves tasks in correct batches', async () => {
    const tasks = [1, 2, 3, 4, 5].map(n => () => Promise.resolve(n));
    const result = await runInBatches(tasks, 2);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('singletonAsync', () => {
  it('returns the same promise if invoked concurrently', async () => {
    let count = 0;
    const fn = jest.fn().mockImplementation(() => {
      count++;
      return Promise.resolve(count);
    });
    const singleton = singletonAsync(fn);

    const [a, b] = await Promise.all([singleton(), singleton()]);
    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('rejects when drop=true and already running', async () => {
    let resolve!: (v: string) => void;
    const fn = jest.fn(
      () =>
        new Promise<string>(r => {
          resolve = r;
        })
    );
    const singleton = singletonAsync(fn, true);

    const promise1 = singleton();
    await expect(singleton()).rejects.toThrow('Busy');
    resolve('ok');
    await expect(promise1).resolves.toBe('ok');
  });
});

describe('settleAll', () => {
  it('returns both fulfilled and rejected results', async () => {
    const tasks = [() => Promise.resolve(1), () => Promise.reject('bad'), () => Promise.resolve(2)];
    const results = await settleAll(tasks);
    expect(results).toHaveLength(3);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
  });
});

describe('createTaskQueue', () => {
  it('processes tasks concurrently up to the limit', async () => {
    const q = createTaskQueue(2);
    let active = 0,
      max = 0;
    const fn = async () => {
      active++;
      max = Math.max(active, max);
      await sleep(10);
      active--;
      return 1;
    };
    const tasks = [q(fn), q(fn), q(fn)];
    const results = await Promise.all(tasks);
    expect(results).toHaveLength(3);
    expect(max).toBe(2);
  });

  it('pauses and resumes task processing', async () => {
    const q = createTaskQueue(1);
    let resolved = false;
    q.pause();
    const p = q(async () => {
      resolved = true;
      return 'x';
    });
    await sleep(10);
    expect(resolved).toBe(false);
    q.resume();
    await expect(p).resolves.toBe('x');
  });

  it('reports length and isPaused', async () => {
    const q = createTaskQueue(1);
    q.pause();
    q(async () => 'a');
    expect(q.length).toBe(1);
    expect(q['isPaused']).toBe(true);
  });
});

describe('runInSeries', () => {
  it('runs all tasks in serial order', async () => {
    const tasks = [1, 2, 3].map(n => () => Promise.resolve(n));
    const result = await runInSeries(tasks);
    expect(result).toEqual([1, 2, 3]);
  });
});

describe('memoizeAsync', () => {
  it('caches results for identical arguments', async () => {
    const fn = jest.fn(async (x: number) => x * 2);
    const memo = memoizeAsync(fn);
    expect(await memo(2)).toBe(4);
    expect(await memo(2)).toBe(4);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('respects TTL option', async () => {
    jest.useFakeTimers();
    const fn = jest.fn(async (x: number) => x + 1);
    const memo = memoizeAsync(fn, { ttl: 100 });
    await expect(memo(1)).resolves.toBe(2);
    jest.advanceTimersByTime(99);
    await expect(memo(1)).resolves.toBe(2);
    jest.advanceTimersByTime(2);
    await expect(memo(1)).resolves.toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('supports custom keyFn', async () => {
    const fn = jest.fn(async (a: number, b: number) => a + b);
    const memo = memoizeAsync(fn, { keyFn: ([a, b]) => `${a}-${b}` });
    await expect(memo(1, 2)).resolves.toBe(3);
    await expect(memo(1, 2)).resolves.toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('abortable', () => {
  it('resolves if not aborted', async () => {
    const ctrl = new AbortController();
    await expect(abortable(Promise.resolve('ok'), ctrl.signal)).resolves.toBe('ok');
  });

  it('rejects if aborted before promise resolves', async () => {
    const ctrl = new AbortController();
    const p = abortable(new Promise(r => setTimeout(() => r('late'), 50)), ctrl.signal, 'aborted');
    ctrl.abort();
    await expect(p).rejects.toBe('aborted');
  });

  it('rejects immediately if already aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(abortable(Promise.resolve('x'), ctrl.signal, 'gone')).rejects.toBe('gone');
  });
});

describe('createDeferred', () => {
  it('resolves externally', async () => {
    const [p, resolve] = createDeferred<number>();
    setTimeout(() => resolve(42), 10);
    await expect(p).resolves.toBe(42);
  });

  it('rejects externally', async () => {
    const [p, , reject] = createDeferred<number>();
    setTimeout(() => reject('fail'), 10);
    await expect(p).rejects.toBe('fail');
  });
});

describe('waterfall', () => {
  it('chains async functions in order', async () => {
    const fns = [async (x: number) => x + 1, async (x: number) => x * 2, async (x: number) => `Result: ${x}`];
    const wf = waterfall<string>(fns);
    await expect(wf(3)).resolves.toBe('Result: 8');
  });
});

describe('rateLimit', () => {
  it('limits calls per interval', async () => {
    jest.useFakeTimers();
    const fn = jest.fn(async (x: number) => x);
    const limited = rateLimit(fn, 2, 100);
    const p1 = limited(1);
    const p2 = limited(2);
    const p3 = limited(3);
    jest.advanceTimersByTime(101);
    const p4 = limited(4);
    jest.advanceTimersByTime(101);
    await expect(Promise.all([p1, p2, p3, p4])).resolves.toEqual([1, 2, 3, 4]);
    expect(fn).toHaveBeenCalledTimes(4);
    jest.useRealTimers();
  });
});

describe('circuitBreaker', () => {
  it('allows calls when closed and resets failures on success', async () => {
    let count = 0;
    const fn = async () => ++count;
    const breaker = circuitBreaker(fn, { failureThreshold: 2, resetTimeout: 50 });
    expect(await breaker()).toBe(1);
    expect(await breaker()).toBe(2);
  });

  it('opens circuit after failures and blocks calls', async () => {
    let fail = true;
    const fn = async () => {
      if (fail) throw new Error('fail');
      return 'ok';
    };
    let opened = false;
    const breaker = circuitBreaker(fn, {
      failureThreshold: 2,
      resetTimeout: 50,
      onOpen: () => {
        opened = true;
      }
    });
    await expect(breaker()).rejects.toThrow('fail');
    await expect(breaker()).rejects.toThrow('fail');
    expect(opened).toBe(true);
    await expect(breaker()).rejects.toBeInstanceOf(CircuitBreakerOpenError);
  });

  it('moves to half-open after resetTimeout and closes on success', async () => {
    let fail = true;
    let halfOpen = false,
      closed = false;
    const fn = async () => {
      if (fail) throw new Error('fail');
      return 'ok';
    };
    const breaker = circuitBreaker(fn, {
      failureThreshold: 1,
      resetTimeout: 10,
      successThreshold: 1,
      onHalfOpen: () => {
        halfOpen = true;
      },
      onClose: () => {
        closed = true;
      }
    });
    await expect(breaker()).rejects.toThrow('fail');
    await expect(breaker()).rejects.toBeInstanceOf(CircuitBreakerOpenError);
    await new Promise(res => setTimeout(res, 12));
    fail = false;
    expect(await breaker()).toBe('ok');
    expect(halfOpen).toBe(true);
    expect(closed).toBe(true);
  });

  it('throws CircuitBreakerOpenError when open', async () => {
    const fn = async () => {
      throw new Error('fail');
    };
    const breaker = circuitBreaker(fn, { failureThreshold: 1, resetTimeout: 100 });
    await expect(breaker()).rejects.toThrow('fail');
    await expect(breaker()).rejects.toBeInstanceOf(CircuitBreakerOpenError);
  });
});

describe('runWithConcurrency', () => {
  it('runs tasks with concurrency', async () => {
    const order: number[] = [];
    const tasks = [1, 2, 3, 4, 5].map(n => async () => {
      await sleep(10);
      order.push(n);
      return n;
    });
    const result = await runWithConcurrency(tasks, { concurrency: 2 });
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
    expect(order.length).toBe(5);
  });

  it('calls onProgress callback', async () => {
    const progress: number[] = [];
    const tasks = [1, 2, 3].map(n => async () => n);
    await runWithConcurrency(tasks, {
      concurrency: 2,
      onProgress: (completed, _total) => progress.push(completed)
    });
    expect(progress).toEqual([1, 2, 3]);
  });

  it('aborts if signal is triggered', async () => {
    const ctrl = new AbortController();
    const tasks = [
      async () => {
        await sleep(10);
        return 1;
      },
      async () => {
        await sleep(10);
        return 2;
      }
    ];
    setTimeout(() => ctrl.abort(), 5);
    await expect(runWithConcurrency(tasks, { concurrency: 1, signal: ctrl.signal })).rejects.toThrow('Aborted');
  });

  it('returns empty array for no tasks', async () => {
    const result = await runWithConcurrency([], { concurrency: 2 });
    expect(result).toEqual([]);
  });

  it('throws if already aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(runWithConcurrency([async () => 1], { signal: ctrl.signal })).rejects.toThrow('Aborted');
  });
});
