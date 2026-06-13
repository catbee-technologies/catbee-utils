export function createTimeoutSignal(timeout?: number): {
  signal?: AbortSignal;
  cleanup(): void;
} {
  if (timeout == null || timeout <= 0) {
    return {
      cleanup() {}
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timer);
    }
  };
}
