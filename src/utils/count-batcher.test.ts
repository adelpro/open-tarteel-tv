import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createCountBatcher, mergeCountEvents } from './count-batcher';

describe('mergeCountEvents', () => {
  it('merges new keys and overwrites existing ones', () => {
    expect(
      mergeCountEvents({ a: 1 }, [
        ['b', 2],
        ['a', 3],
      ]),
    ).toEqual({
      a: 3,
      b: 2,
    });
  });

  it('keeps the last event for a repeated key within one batch', () => {
    expect(
      mergeCountEvents({}, [
        ['a', 1],
        ['a', 2],
        ['a', 5],
      ]),
    ).toEqual({ a: 5 });
  });

  it('returns the same object reference for an empty event list', () => {
    const previous = { a: 1 };

    expect(mergeCountEvents(previous, [])).toBe(previous);
  });

  it('returns the same object reference when no value actually changes', () => {
    const previous = { a: 1 };

    expect(mergeCountEvents(previous, [['a', 1]])).toBe(previous);
  });
});

describe('createCountBatcher', () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrameId: number;

  beforeEach(() => {
    frames = new Map();
    nextFrameId = 1;

    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: FrameRequestCallback): number => {
        const id = nextFrameId;
        nextFrameId += 1;
        frames.set(id, callback);
        return id;
      },
    );

    vi.stubGlobal('cancelAnimationFrame', (id: number): void => {
      frames.delete(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not schedule a frame before the first push', () => {
    createCountBatcher(vi.fn());

    expect(frames.size).toBe(0);
  });

  it('coalesces three pushes into one flush with three ordered pairs', () => {
    const onFlush = vi.fn();
    const batcher = createCountBatcher(onFlush);

    batcher.push('a', 1);
    batcher.push('b', 2);
    batcher.push('c', 3);

    expect(onFlush).not.toHaveBeenCalled();
    expect(frames.size).toBe(1);

    const scheduled = [...frames.values()][0];
    scheduled?.(0);

    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
  });

  it('flushes pending events immediately when flush() is called', () => {
    const onFlush = vi.fn();
    const batcher = createCountBatcher(onFlush);

    batcher.push('a', 1);
    batcher.flush();

    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith([['a', 1]]);
    expect(frames.size).toBe(0);
  });

  it('does not flush a queued batch after dispose()', () => {
    const onFlush = vi.fn();
    const batcher = createCountBatcher(onFlush);

    batcher.push('a', 1);

    const scheduled = [...frames.values()][0];

    batcher.dispose();

    // Even if the cancelled frame callback still runs, it must not flush.
    scheduled?.(0);

    expect(onFlush).not.toHaveBeenCalled();
  });

  it('ignores pushes made after dispose()', () => {
    const onFlush = vi.fn();
    const batcher = createCountBatcher(onFlush);

    batcher.dispose();
    batcher.push('a', 1);

    expect(frames.size).toBe(0);
    expect(onFlush).not.toHaveBeenCalled();
  });
});
