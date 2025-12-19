import "react-native-get-random-values";
import "fast-text-encoding";
import Gun from "gun";
import {
  GUNCONFIG,
  FAVORITE_COUNTS_KEY,
  VIEW_COUNTS_KEY,
} from "../constants/gun";

// TextEncoder / TextDecoder Polyfill for Gun/RN
if (typeof (global as any).TextEncoder === "undefined") {
  console.log("[Gun] Polyfilling TextEncoder/TextDecoder");
  const pkg = require("fast-text-encoding");
  (global as any).TextEncoder = pkg.TextEncoder;
  (global as any).TextDecoder = pkg.TextDecoder;
}

// Fix for Gun in environments where Root might not be defined or other shims needed
if (typeof global !== "undefined" && !(global as any).window) {
  (global as any).window = global;
}

const gun = Gun({
  ...GUNCONFIG,
  retry: 1000, // Retry peer connection every second
});

(gun as any).on("hi", (peer: any) => {
  console.log("[Gun] Peer connected:", peer.url || peer.id);
});

(gun as any).on("bye", (peer: any) => {
  console.log("[Gun] Peer disconnected:", peer.url || peer.id);
});

const favoriteCountsNode = gun.get(FAVORITE_COUNTS_KEY);
const viewCountsNode = gun.get(VIEW_COUNTS_KEY);

console.log("[Gun] Initialized", {
  FAVORITE_COUNTS_KEY,
  VIEW_COUNTS_KEY,
  peers: GUNCONFIG.peers,
});

/**
 * Subscribe to global favorite count updates in real time.
 */
export function subscribeToFavoriteCounts(
  callback: (counts: Record<string, number>) => void
): () => void {
  console.log("[Gun] Subscribing to favorites...");
  const counts: Record<string, number> = {};

  const onUpdate = (count: number, key: string) => {
    console.log(`[Gun] Favorite Update: ${key} = ${count}`);
    if (!key || typeof count !== "number") return;
    counts[key] = count;
    callback({ ...counts });
  };

  favoriteCountsNode.map().on(onUpdate);

  return () => {
    console.log("[Gun] Unsubscribing from favorites");
    favoriteCountsNode.map().off();
  };
}

/**
 * Sync favorite toggle state with Gun
 */
export function syncFavorite(id: string, isFavorited: boolean): void {
  console.log(`[Gun] Syncing Favorite: ${id} (${isFavorited})`);
  const ref = favoriteCountsNode.get(id);

  // Use a timeout to ensure we don't hang if offline
  let done = false;
  setTimeout(() => {
    if (!done)
      console.warn(`[Gun] syncFavorite(${id}) once() is taking long...`);
  }, 5000);

  ref.once((currentCount: any) => {
    done = true;
    const count = typeof currentCount === "number" ? currentCount : 0;
    console.log(`[Gun] Current favorite count for ${id}: ${count}`);
    const updated = isFavorited ? count + 1 : Math.max(0, count - 1);
    ref.put(updated, (ack: any) => {
      if (ack.err)
        console.error(`[Gun] Error syncing favorite ${id}:`, ack.err);
      else
        console.log(`[Gun] Successfully synced favorite ${id} to ${updated}`);
    });
  });
}

/**
 * Subscribe to global view count updates in real time.
 */
export function subscribeToViewCounts(
  callback: (counts: Record<string, number>) => void
): () => void {
  console.log("[Gun] Subscribing to views...");
  const counts: Record<string, number> = {};

  const onUpdate = (count: number, key: string) => {
    console.log(`[Gun] View Update: ${key} = ${count}`);
    if (!key || typeof count !== "number") return;
    counts[key] = count;
    callback({ ...counts });
  };

  viewCountsNode.map().on(onUpdate);

  return () => {
    console.log("[Gun] Unsubscribing from views");
    viewCountsNode.map().off();
  };
}

/**
 * Increment view count
 */
export function syncView(id: string) {
  console.log(`[Gun] Syncing View: ${id}`);
  const ref = viewCountsNode.get(id);

  let done = false;
  setTimeout(() => {
    if (!done) console.warn(`[Gun] syncView(${id}) once() is taking long...`);
  }, 5000);

  ref.once((currentCount: any) => {
    done = true;
    const count = typeof currentCount === "number" ? currentCount : 0;
    console.log(`[Gun] Current view count for ${id}: ${count}`);
    const updated = count + 1;
    ref.put(updated, (ack: any) => {
      if (ack.err) console.error(`[Gun] Error syncing view ${id}:`, ack.err);
      else console.log(`[Gun] Successfully synced view ${id} to ${updated}`);
    });
  });
}
