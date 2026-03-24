import { Directory, File, Paths } from 'expo-file-system';

const MAX_CACHED_SURAH = 10;
const PRE_FETCH_COUNT = 2;

interface CacheEntry {
  reciterId: string;
  surahId: number;
  localUri: string;
  accessedAt: number;
}

const cache: Map<string, CacheEntry> = new Map();
let initialized = false;

function getCacheDir(): Directory {
  return new Directory(Paths.cache, 'audio');
}

function getCacheFile(reciterId: string, surahId: number): File {
  return new File(Paths.cache, 'audio', `${reciterId}_${surahId}.mp3`);
}

function getCacheKey(reciterId: string, surahId: number): string {
  return `${reciterId}_${surahId}`;
}

async function ensureCacheDir(): Promise<void> {
  const dir = getCacheDir();
  if (!dir.exists) {
    dir.create();
  }
}

async function loadCacheMetadata(): Promise<void> {
  if (initialized) return;
  await ensureCacheDir();

  try {
    const dir = getCacheDir();
    const contents = dir.list();

    for (const item of contents) {
      if (item instanceof File && item.name.endsWith('.mp3')) {
        const nameWithoutExt = item.name.replace('.mp3', '');
        const parts = nameWithoutExt.split('_');
        if (parts.length >= 2) {
          const reciterId = parts[0];
          const surahId = parseInt(parts[1], 10);
          cache.set(nameWithoutExt, {
            reciterId,
            surahId,
            localUri: item.uri,
            accessedAt: Date.now(),
          });
        }
      }
    }
  } catch {
    cache.clear();
  }

  initialized = true;
}

async function evictOldest(): Promise<void> {
  if (cache.size < MAX_CACHED_SURAH) return;

  const sorted = Array.from(cache.values()).sort(
    (a, b) => a.accessedAt - b.accessedAt,
  );
  const toRemove = sorted.slice(0, cache.size - MAX_CACHED_SURAH + 1);

  for (const entry of toRemove) {
    try {
      const file = new File(
        getCacheDir(),
        `${entry.reciterId}_${entry.surahId}.mp3`,
      );
      if (file.exists) {
        file.delete();
      }
    } catch {}
    cache.delete(getCacheKey(entry.reciterId, entry.surahId));
  }
}

export async function getCachedAudioPath(
  reciterId: string,
  surahId: number,
): Promise<string | null> {
  await loadCacheMetadata();

  const key = getCacheKey(reciterId, surahId);
  const entry = cache.get(key);

  if (entry) {
    const file = new File(getCacheDir(), `${reciterId}_${surahId}.mp3`);
    if (file.exists) {
      entry.accessedAt = Date.now();
      return entry.localUri;
    }
    cache.delete(key);
  }

  return null;
}

export async function cacheAudio(
  reciterId: string,
  surahId: number,
  remoteUrl: string,
): Promise<string | null> {
  await loadCacheMetadata();

  const key = getCacheKey(reciterId, surahId);
  const file = getCacheFile(reciterId, surahId);

  if (cache.has(key)) {
    if (file.exists) {
      const entry = cache.get(key)!;
      entry.accessedAt = Date.now();
      return entry.localUri;
    }
  }

  await evictOldest();

  try {
    const destination = new File(getCacheDir(), `${reciterId}_${surahId}.mp3`);
    const downloaded = await File.downloadFileAsync(remoteUrl, destination);

    if (downloaded) {
      cache.set(key, {
        reciterId,
        surahId,
        localUri: destination.uri,
        accessedAt: Date.now(),
      });
      return destination.uri;
    }
  } catch {}

  return null;
}

export async function preFetchAudio(
  reciterId: string,
  playlist: { surahId: string; link: string }[],
  currentSurahId: number,
): Promise<void> {
  await loadCacheMetadata();

  const currentIndex = playlist.findIndex(
    (item) => parseInt(item.surahId, 10) === currentSurahId,
  );
  if (currentIndex === -1) return;

  for (let i = 1; i <= PRE_FETCH_COUNT; i++) {
    const nextIndex = currentIndex + i;
    if (nextIndex >= playlist.length) break;

    const nextItem = playlist[nextIndex];
    const surahId = parseInt(nextItem.surahId, 10);
    const key = getCacheKey(reciterId, surahId);

    if (!cache.has(key)) {
      cacheAudio(reciterId, surahId, nextItem.link).catch(() => {});
    }
  }
}

export async function clearCache(): Promise<void> {
  await ensureCacheDir();
  try {
    const dir = getCacheDir();
    if (dir.exists) {
      dir.delete();
    }
  } catch {}
  cache.clear();
  initialized = false;
}

export async function getCacheSize(): Promise<number> {
  await loadCacheMetadata();
  return cache.size;
}

export { PRE_FETCH_COUNT, MAX_CACHED_SURAH };
