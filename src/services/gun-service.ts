import 'react-native-get-random-values';
import 'fast-text-encoding';
import Gun from 'gun';

import {
  FAVORITE_COUNTS_KEY,
  GUNCONFIG,
  VIEW_COUNTS_KEY,
} from '../constants/gun';

// TextEncoder / TextDecoder Polyfill for Gun/RN
if (typeof (global as any).TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pkg = require('fast-text-encoding');
  (global as any).TextEncoder = pkg.TextEncoder;
  (global as any).TextDecoder = pkg.TextDecoder;
}

// Fix for Gun in environments where Root might not be defined or other shims needed
if (typeof global !== 'undefined' && !(global as any).window) {
  (global as any).window = global;
}

const gun = Gun({
  ...GUNCONFIG,
  retry: 1000, // Retry peer connection every second
});

(gun as any).on('hi', (peer: any) => {});

(gun as any).on('bye', (peer: any) => {});

const favoriteCountsNode = gun.get(FAVORITE_COUNTS_KEY);
const viewCountsNode = gun.get(VIEW_COUNTS_KEY);

/**
 * Subscribe to global favorite count updates in real time.
 */
export function subscribeToFavoriteCounts(
  callback: (key: string, count: number) => void,
): () => void {
  const onUpdate = (count: number, key: string) => {
    if (!key || typeof count !== 'number') return;
    callback(key, count);
  };

  favoriteCountsNode.map().on(onUpdate);

  return () => {
    favoriteCountsNode.map().off();
  };
}

/**
 * Sync favorite toggle state with Gun
 */
export function syncFavorite(id: string, isFavorited: boolean): void {
  const ref = favoriteCountsNode.get(id);

  // Use a timeout to ensure we don't hang if offline
  let done = false;
  setTimeout(() => {
    if (!done) {
      // Still waiting
    }
  }, 5000);

  ref.once((currentCount: any) => {
    done = true;
    const count = typeof currentCount === 'number' ? currentCount : 0;
    const updated = isFavorited ? count + 1 : Math.max(0, count - 1);
    ref.put(updated, (ack: any) => {
      if (ack.err) {
        // Error syncing
      }
    });
  });
}

/**
 * Subscribe to global view count updates in real time.
 */
export function subscribeToViewCounts(
  callback: (key: string, count: number) => void,
): () => void {
  const onUpdate = (count: number, key: string) => {
    if (!key || typeof count !== 'number') return;
    callback(key, count);
  };

  viewCountsNode.map().on(onUpdate);

  return () => {
    viewCountsNode.map().off();
  };
}

/**
 * Increment view count
 */
export function syncView(id: string) {
  const ref = viewCountsNode.get(id);

  let done = false;
  setTimeout(() => {
    if (!done) {
      // Still waiting
    }
  }, 5000);

  ref.once((currentCount: any) => {
    done = true;
    const count = typeof currentCount === 'number' ? currentCount : 0;
    const updated = count + 1;
    ref.put(updated, (ack: any) => {
      if (ack.err) {
        // Error syncing
      }
    });
  });
}
