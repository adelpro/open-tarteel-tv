import type { QuranAiEdition, QuranAiSurahResponse } from './quranai.types';
import { Riwaya } from '../../types';
import { getRiwayaKeyFromMoshafName } from '../../utils/get-riwaya-from-mushaf';

type Lang = 'ar' | 'en';

function buildSurahQueryParams(options?: {
  limit?: number;
  offset?: number;
}): string {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) {
    params.set('limit', String(options.limit));
  }
  if (options?.offset !== undefined) {
    params.set('offset', String(options.offset));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Build a surah endpoint against the configured (not hardcoded) API root. */
export function buildSurahEndpoint(
  baseUrl: string,
  surahNumber: number,
  editionIdentifier: string,
  options?: { limit?: number; offset?: number },
): string {
  const encodedEditionIdentifier = encodeURIComponent(editionIdentifier);
  if (encodedEditionIdentifier.includes('..')) {
    throw new Error('editionIdentifier must not contain ".."');
  }
  const query = buildSurahQueryParams(options);
  return `${baseUrl}/surah/${surahNumber}/${encodedEditionIdentifier}${query}`;
}

// APPROXIMATION (ported from the web adapter): Quran.ai exposes 'quran-qunbul'
// as its own narrator but TV's Riwaya enum has no Qunbul member, so it is
// collapsed onto AlBazzi (the two rawis of the Ibn Kathir reading). Likewise
// 'quran-aldouri' does not disambiguate between Al-Doori 'an Abi 'Amr and
// Al-Doori 'an Al-Kisai; it is mapped to AlDooriAnAbuAmr from known recordings.
const NARRATOR_RIWAYA_MAP = new Map<string, Riwaya>([
  ['quran-hafs', Riwaya.HAFS_A_ASIM],
  ['quran-warsh', Riwaya.WARSH_AN_NAFI],
  ['quran-qaloon', Riwaya.QALUN_AN_NAFI],
  ['quran-albazzi', Riwaya.AL_BAZZI_AN_IBN_KATHIR],
  ['quran-qunbul', Riwaya.AL_BAZZI_AN_IBN_KATHIR],
  ['quran-aldouri', Riwaya.AL_DOORI_AN_ABU_AMR],
  ['quran-alsoosi', Riwaya.AL_SOOSI_AN_ABU_AMR],
  ['quran-shoba', Riwaya.SHUABA_AN_ASIM],
]);

/** Returns null when the narrator is absent or not in the known map. */
export function resolveRiwayaFromNarrator(
  narratorIdentifier: string | null,
): Riwaya | null {
  if (narratorIdentifier === null) return null;
  return NARRATOR_RIWAYA_MAP.get(narratorIdentifier) ?? null;
}

/**
 * Narrator map first; fall back to matching the edition name against the
 * localized riwaya phrases (getRiwayaKeyFromMoshafName defaults to Hafs).
 */
export function resolveRiwayaFromEdition(
  edition: QuranAiEdition,
  lang: Lang,
): Riwaya {
  return (
    resolveRiwayaFromNarrator(edition.narratorIdentifier) ??
    getRiwayaKeyFromMoshafName(
      lang === 'ar' ? edition.name : edition.englishName,
      lang,
    )
  );
}

export function resolveReciterName(
  edition: QuranAiEdition,
  lang: Lang,
): string {
  if (lang !== 'ar') {
    return edition.englishName || edition.name;
  }
  return edition.name || edition.englishName;
}

export function extractSurahAudio(
  data: QuranAiSurahResponse['data'] | undefined,
): string | null {
  const audio = data?.audio;
  return typeof audio === 'string' && audio.length > 0 ? audio : null;
}

export function extractSurahAudioBaseUrl(probeAudioUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(probeAudioUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return null;
  }
  const filename = url.pathname.split('/').pop() ?? '';
  if (!/^\d+\.mp3$/i.test(filename)) {
    return null;
  }
  const directoryEnd = url.pathname.lastIndexOf('/') + 1;
  return `${url.origin}${url.pathname.slice(0, directoryEnd)}`;
}

export function buildSurahAudioUrl(
  baseUrl: string,
  surahNumber: number,
): string {
  return `${baseUrl}${surahNumber}.mp3`;
}

/**
 * Stable numeric Moshaf.id for an edition identifier. FNV-1a 32-bit, forced
 * unsigned so it stays a positive integer as required by the TV Moshaf type.
 * The original identifier is preserved separately in `recitationCode`.
 */
export function stableIdFromIdentifier(identifier: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < identifier.length; i++) {
    hash ^= identifier.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
