import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createDebouncer } from './use-debounced-value';

describe('createDebouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not deliver before the delay has elapsed', () => {
    const deliver = vi.fn();
    const debouncer = createDebouncer<string>(150, deliver);

    debouncer.schedule('a');
    vi.advanceTimersByTime(149);

    expect(deliver).not.toHaveBeenCalled();
  });

  it('delivers only the last scheduled value', () => {
    const deliver = vi.fn();
    const debouncer = createDebouncer<string>(150, deliver);

    debouncer.schedule('a');
    vi.advanceTimersByTime(100);
    debouncer.schedule('ab');
    vi.advanceTimersByTime(100);
    debouncer.schedule('abc');
    vi.advanceTimersByTime(150);

    expect(deliver).toHaveBeenCalledTimes(1);
    expect(deliver).toHaveBeenCalledWith('abc');
  });

  it('keeps delivering the final value after a burst of schedules', () => {
    const delivered: string[] = [];
    const debouncer = createDebouncer<string>(150, (value) => {
      delivered.push(value);
    });

    'abcdefgh'.split('').forEach((char, index) => {
      debouncer.schedule(char);
      vi.advanceTimersByTime(20);
    });
    vi.advanceTimersByTime(150);

    expect(delivered).toEqual(['h']);
  });

  it('drops a pending delivery when cancelled', () => {
    const deliver = vi.fn();
    const debouncer = createDebouncer<string>(150, deliver);

    debouncer.schedule('a');
    debouncer.cancel();
    vi.advanceTimersByTime(150);

    expect(deliver).not.toHaveBeenCalled();
  });
});
