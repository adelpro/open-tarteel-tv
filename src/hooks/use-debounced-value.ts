import { useEffect, useState } from 'react';

export type Debouncer<T> = {
  /** Schedules `value`; the last scheduled value wins after `delayMs`. */
  schedule: (value: T) => void;
  /** Drops a pending delivery. */
  cancel: () => void;
};

/**
 * Trailing-edge debounce core: every `schedule` call restarts the timer, and
 * only the most recent value is delivered once the caller stops scheduling.
 * The final value is never dropped.
 */
export function createDebouncer<T>(
  delayMs: number,
  deliver: (value: T) => void,
): Debouncer<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { value: T } | null = null;

  return {
    schedule(value: T) {
      pending = { value };
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        timer = null;
        const next = pending;
        pending = null;
        if (next) {
          deliver(next.value);
        }
      }, delayMs);
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      pending = null;
    },
  };
}

/**
 * Returns `value` once it has stayed unchanged for `delayMs`.
 *
 * The value is never delivered early (no leading call) and the last value is
 * always delivered (trailing edge), unless the component unmounts before the
 * timer fires - the pending delivery is then cancelled.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const debouncer = createDebouncer<T>(delayMs, (next) => {
      // Wrapped in an updater so a function value is not mistaken for an
      // updater by React.
      setDebounced(() => next);
    });
    debouncer.schedule(value);

    return () => {
      debouncer.cancel();
    };
  }, [value, delayMs]);

  return debounced;
}
