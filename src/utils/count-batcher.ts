/**
 * Batching helper for GUN count updates.
 *
 * GUN's `map().on()` fires once per key, so a peer-connect burst delivers a
 * handful of count events in the same tick. Each event used to trigger its own
 * state update, which re-rendered the Home screen repeatedly and recomputed
 * the full-catalog sorts. These helpers coalesce a burst into a single
 * state update per animation frame.
 *
 * This module is intentionally plain: no React imports, no hooks, no
 * component-local state. It must stay lowerable by React Compiler v1.0.
 */

export type CountEvent = [string, number];

export type CountBatcher = {
  push(key: string, count: number): void;
  flush(): void;
  dispose(): void;
};

/**
 * Merge a batch of count events into the previous counts.
 *
 * - Last event wins for a repeated key.
 * - An empty event list returns the previous object *by reference* so callers
 *   (e.g. a `setState` updater) can bail out of a re-render.
 * - If no value actually changes, the previous object is returned by
 *   reference as well.
 */
export function mergeCountEvents(
  previous: Record<string, number>,
  events: [string, number][],
): Record<string, number> {
  if (events.length === 0) return previous;

  let changed = false;
  const next: Record<string, number> = { ...previous };

  for (const [key, count] of events) {
    if (next[key] !== count) {
      changed = true;
      next[key] = count;
    }
  }

  return changed ? next : previous;
}

/**
 * Create a batcher that delivers queued events to `onFlush` once per
 * animation frame (available in React Native / Hermes).
 *
 * The queue lives on the batcher instance, so one batcher per subscription
 * keeps independent streams isolated. No frame is scheduled while the queue
 * is empty.
 */
export function createCountBatcher(
  onFlush: (events: [string, number][]) => void,
): CountBatcher {
  let queue: [string, number][] = [];
  let frameId: number | null = null;
  let disposed = false;

  const deliver = () => {
    frameId = null;

    if (disposed) return;
    if (queue.length === 0) return;

    const events = queue;
    queue = [];
    onFlush(events);
  };

  const schedule = () => {
    if (disposed) return;
    if (frameId !== null) return;

    frameId = requestAnimationFrame(deliver);
  };

  return {
    push(key: string, count: number) {
      if (disposed) return;

      queue.push([key, count]);
      schedule();
    },

    flush() {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }

      deliver();
    },

    dispose() {
      disposed = true;

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }

      queue = [];
    },
  };
}
