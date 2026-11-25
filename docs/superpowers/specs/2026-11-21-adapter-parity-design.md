# Adapter parity for Open Tarteel TV — design

Date: 2026-11-21
Branch: `feat/adapters-parity` (off `develop`)
Source of truth for missing work: `adelpro/open-tarteel` **develop**

## Intent and why

Issue #8 asks for more reciter sources. The sibling web app (`adelpro/open-tarteel`, develop) already has five reciter adapters and tests for all of them; this React Native TV app has two adapters and no adapter tests. The goal is to give the TV app the same provider coverage without importing the web app's server-side assumptions or weakening the TV app's runtime behaviour.

## Current comparison (verified 2026-11-21)

|                 | TV app (`develop`)                                 | Web app (`develop`)                                          |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| Adapters        | mp3quran v3, Itqan                                 | mp3quran v3, mp3quran v4, Qurani.ai, Quran Foundation, Itqan |
| `ReciterSource` | `getReciters()` only                               | `getReciters()` + optional `getPlaylist()`                   |
| Lazy playlist   | Itqan-specific call in `use-player.ts`             | generic `getReciterPlaylist()`                               |
| Riwaya          | 4 enum values, helper recognises 3 names           | 13 values, ar/en phrase map                                  |
| Tests           | none                                               | 13 adapter/helper/contract test files                        |
| Fetch layer     | abortable, timeout aborts fetch, jitter retry      | `Promise.race`, no abort, fixed delay                        |
| Caching         | AsyncStorage catalog + playlist, on-disk audio LRU | in-memory `Map`s                                             |
| Secrets         | none in app                                        | OAuth client id/secret via `process.env`                     |

Measured live: mp3quran returns 244 reciters / 299 moshafs, of which 254 are labelled Hafs by the current helper; Itqan returns 73 recitations / 114 tracks per recitation. All three new provider endpoints respond publicly.

## Goals

1. Add these three sources to the TV app: **Qurani.ai**, **Quran Foundation** (public endpoints), **MP3Quran v4** (feature-flagged).
2. Expand Riwaya from 4 to 13 values and fix the mislabelling.
3. Add a generic lazy-playlist contract so no source is special-cased in `use-player.ts`.
4. Add Vitest coverage for adapters, helpers and the contract.
5. Make provider endpoints/flags configurable through **TV-specific** environment variables.

## Non-goals

- Copying the web app's Node-only `Buffer` call or its `NEXT_PUBLIC_*` variable names. The OAuth **flow** is ported with an RN-safe base64 helper and TV-specific names. `next: { revalidate }`, cookie-based source selection and in-memory-only caching are still out.
- Follow-along / ayah-timing features (`getAyahAudioRange`, word segments, `capabilities.ts`) — separate project.
- Replacing the TV fetch layer, AsyncStorage caches or `expo-file-system` audio cache.
- Changing any production data or calling write endpoints.

## Anti-goals (what would make this a failure)

- Committing actual credential values to the repository. The owner chose to bundle credentials as `EXPO_PUBLIC_*`, accepting that they are inlined into the app binary and extractable by anyone who installs the app; `.env.example` contains placeholders only and real values stay in local/CI env.
- Reusing the web repo's variable names (`QURAN_FOUNDATION_CLIENT_ID`, `QURAN_FOUNDATION_CLIENT_SECRET`, `ITQAN_API_KEY`, `NEXT_PUBLIC_ENABLE_MP3QURAN_V4`, `MP3QURAN_V4_BASE_URL`) or its credential values.
- Registering a source in `api.ts` without also adding its tag, settings entry, i18n strings and tests.
- A new source that fails silently with no way for the user to tell it apart from "no reciters".

## Constraints and decisions already made

- The TV app is React Native / Expo 54 with AsyncStorage and `expo-file-system`; there is no Node runtime, no `Buffer`, no CORS problem and no server. RN can call the APIs directly, so no Next.js proxy route is needed.
- Environment variables must use Expo's `EXPO_PUBLIC_` prefix to be visible at runtime. They are build-time constants inlined into the bundle; changing them requires a restart/rebuild and they are readable by anyone who installs the app. The owner explicitly accepted this exposure for the Itqan and QF credentials. All names use the `OTTV_` (Open Tarteel TV) prefix so they cannot collide with or imply reuse of the web app's keys.

### TV-specific environment variables (exact names)

| Variable                                | Default                                        | Used by     | Purpose                                                        |
| --------------------------------------- | ---------------------------------------------- | ----------- | -------------------------------------------------------------- |
| `EXPO_PUBLIC_OTTV_ITQAN_BASE_URL`       | `https://api.cms.itqan.dev`                    | Itqan       | API root                                                       |
| `EXPO_PUBLIC_OTTV_ITQAN_API_KEY`        | unset                                          | Itqan       | Optional `X-API-Key` header; bundled, extractable              |
| `EXPO_PUBLIC_OTTV_QURANAI_BASE_URL`     | `https://api.qurani.ai/gw/qh/v1`               | Qurani.ai   | API root                                                       |
| `EXPO_PUBLIC_OTTV_QF_CLIENT_ID`         | unset                                          | QF          | OAuth client id; bundled, extractable                          |
| `EXPO_PUBLIC_OTTV_QF_CLIENT_SECRET`     | unset                                          | QF          | OAuth client secret; bundled, extractable                      |
| `EXPO_PUBLIC_OTTV_QF_TOKEN_URL`         | `https://oauth2.quran.foundation/oauth2/token` | QF          | Token endpoint                                                 |
| `EXPO_PUBLIC_OTTV_QF_API_BASE`          | `https://apis.quran.foundation`                | QF          | Authenticated API root (`/content/api/v4/...`)                 |
| `EXPO_PUBLIC_OTTV_QF_PUBLIC_API_BASE`   | `https://api.quran.com/api/v4`                 | QF          | Fallback used when credentials are absent (same branch as web) |
| `EXPO_PUBLIC_OTTV_QF_RATE_LIMIT_MS`     | `1100`                                         | QF          | Minimum spacing between API calls                              |
| `EXPO_PUBLIC_OTTV_ENABLE_MP3QURAN_V4`   | `false`                                        | MP3Quran v4 | Kill switch; disabled source is not registered at all          |
| `EXPO_PUBLIC_OTTV_MP3QURAN_V4_BASE_URL` | `https://api-staging.mp3quran.net/v4`          | MP3Quran v4 | API root (no key in the web app)                               |

No web key, web name or web credential value is copied — only the auth **logic**. A central `src/config/providers.ts` reads these once with defaults and exposes typed getters; adapters never read `process.env` directly. `.env.example` ships placeholders only. The owner-supplied values live in the gitignored `.env.local` (verified by `git check-ignore`) and must be supplied through CI/build secrets under the same names; they must never be committed.

Itqan request headers are fixed as follows: `Accept-Language` from the caller's language, `X-Client-Name` from `getClientName()` (currently the app slug `open-tarteel-tv`), `X-Client-Version` from `getAppVersion()` (currently `2.0.1`), and `X-API-Key` only when `EXPO_PUBLIC_OTTV_ITQAN_API_KEY` is set. This keeps the TV app name and version in the header as requested.

## Approaches considered

1. **Full web parity** — copy all five adapters, the 13-value enum, the OAuth client and all tests. Rejected: the OAuth client depends on Node `Buffer` and secrets that cannot be shipped in a TV binary, and the web fetch/eager-Itqan behaviour is worse for this device.
2. **TV-adapted parity (chosen)** — port the three missing providers adapted to RN, keep TV's fetch/caching/lazy-loading, take the web's riwaya mapping and tests.
3. **Staged** — only the two no-secret providers first, defer v4. Rejected as the default: it leaves the app inconsistent and needs a second round anyway.

## Design

### Phase 0 — foundation

- Add `src/config/providers.ts` with the environment table above, typed getters and defaults. Add a short `.env.example` with **placeholders only** and a comment stating the values are bundled into the app. Add an RN-safe base64 helper (`src/utils/base64.ts`) to replace the web client's Node `Buffer.from(...).toString('base64')`.
- Add `src/utils/get-riwaya-from-mushaf.ts` adapted from the web app but exporting the TV enum values. Replace the 4-riwaya helper in `mp3quran.helpers.ts` with a thin wrapper so both existing adapters benefit.
- Extend `Riwaya` in `src/types/index.ts` to 13 values **keeping the TV kebab-case slug values** (`hafs-a-asim`, …); the web enum's PascalCase keys are used only as lookup keys in the ported helper and mapped to TV slugs. This preserves deep links (`?riwaya=`) and already-cached reciter data. Add the missing `riwaya.*` keys to `src/locales/en.json` and `src/locales/ar.json`. Update the exhaustive `Record<Riwaya, …>` maps in `reciter-card.tsx` and `riwaya-tag.tsx` (reuse the existing 4 colours, pick distinct Material colours for the 9 new ones).
- Keep `Moshaf.id` numeric and `surah_total` numeric; add only the optional fields actually needed by new adapters (`surahIds?: string`, `recitationCode?: string`, `hasTimings?: boolean`). Qurani.ai stores its alphanumeric edition identifier in `recitationCode`, not `id`. Existing cached data keeps parsing.
- The riwaya helper takes `lang: 'ar' | 'en'` and uses the web app's ar/en phrase maps, with `hafs-a-asim` as the fallback (no new "unknown" bucket — the enum stays at 13).

### Phase 1 — adapter contract

- Extend `ReciterSource` with optional `getPlaylist?(reciter: Reciter, lang, signal)`. Passing the whole reciter keeps Itqan's AsyncStorage cache keyed by `reciter.id`, so existing cached playlists are not orphaned.
- Add `getReciterPlaylist(source, reciter, lang, signal)` in `src/services/api.ts` that dispatches to the adapter and returns `null` when none exists. Playlist failures throw into the existing `use-player.ts` error/retry UI rather than returning an empty list that looks like "no reciters".
- Move Itqan's playlist loading behind `ItqanAdapter.getPlaylist()` while keeping `getCachedItqanPlaylist` / `setCachedItqanPlaylist` and the client headers. Make its API root and optional `X-API-Key` come from `providers.ts`; keep `Accept-Language`, `X-Client-Name`/`X-Client-Version`, individual malformed-record guards, Arabic name lookup and graceful failure.
- Refactor `use-player.ts` to call the generic dispatcher instead of importing the Itqan adapter directly. Keep its `playlistAttemptedRef`, error state and retry UI.

### Phase 2 — new adapters

Each adapter uses the TV `retryFetch` (abort + jitter), returns `Reciter[]`, and is registered in `RECITER_SOURCES`.

1. **Qurani.ai** — adapt the web adapter: editions endpoint, `type === 'surah'` de-duplication, concurrency 3, CDN base from `quranai-bases.json` with a single-surah probe fallback, narrator→riwaya map, 114-track playlist built from the base URL. Store the edition identifier in `moshaf.recitationCode`. Drop the Next-only `fetch` options and the ayah-range/timing functions.
2. **Quran Foundation (web-equivalent auth)** — port the web client's logic with TV variable names: when both credentials are set, fetch an OAuth token with a Basic header built by the base64 helper, cache it with a 60-second expiry margin, send `x-auth-token` + `x-client-id` on every call, refresh once on 401, and pace requests by the configured interval. When credentials are absent, fall back to the public `api.quran.com/api/v4` paths exactly as the web does (verified: 14 reciters, 114 audio files with `audio_url`). Add a 55-minute in-process results cache keyed by language, exported as `resetQuranFoundationCache()`; keep AsyncStorage catalog caching in `reciters-cache.ts` as the persistent layer.
3. **MP3Quran v4** — adapt pagination, 16 riwaya-code mapping and lazy playlist from `coverage.surahs`. Register only when `EXPO_PUBLIC_OTTV_ENABLE_MP3QURAN_V4 === 'true'`; default off because the upstream base is staging.

### Phase 3 — UI and settings

- Add the three `LinkSource` values using the TV app's short-slug convention (`qurani`, `quran-foundation`, `mp3quran-v4`) — not the web app's domain-style strings. These values are persisted in settings and reciter IDs, so the convention must stay consistent.
- Add their `Record<LinkSource, …>` entries in `source-tag.tsx` and `settings.context.tsx`. Export an `ACTIVE_SOURCES` list from `src/config/providers.ts`; the settings screen iterates that list instead of `Object.values(LinkSource)`, so a flag-disabled MP3Quran v4 has no toggle. Existing settings are merged with defaults, so the two public sources become enabled automatically.
- Add source labels/colours to i18n where displayed. No new settings screens. `section-filters.tsx` expands from four to **13 riwaya chips** (owner decision 3), using a horizontally scrollable row so TV remote navigation stays usable.

### Phase 4 — tests and verification

- Port the web Vitest suites, rewriting mocks for TV path aliases and `retryFetch`: riwaya helper mapping (both languages), each adapter (success, empty, malformed, failure), `getReciterPlaylist` dispatch, `providers.ts` env defaults/overrides, QF token caching/401 refresh/public fallback, and a contract test that every **active** `LinkSource` has a tag and a settings default. Never use real credentials in tests.
- Add `error?: string` to `ReciterSourceResult`; `doFetchRecitersBySource` records the failure instead of discarding it. `getAllReciters` still returns reciters, and the home screen shows a single "some sources unavailable" line when any source errored, so a failed source is not confused with an empty catalog.
- Wire `resetQuranFoundationCache()` into `settings.context.tsx`'s `clearCaches()` so "Clear Cache" also drops the 55-minute in-process cache.
- Run `yarn type-check`, `yarn lint`, `yarn test`, then smoke-test the three live APIs with the configured defaults. No write operations.

## Decisions settled by the builder review (my calls, recorded here)

- Riwaya keeps TV slug values; web PascalCase keys are only helper lookups.
- `Moshaf.id` stays numeric; Qurani.ai edition identifier goes in `recitationCode`.
- `getPlaylist` receives the whole `Reciter`, preserving the Itqan cache key.
- New `LinkSource` strings use TV short slugs; `ACTIVE_SOURCES` hides flag-disabled sources.
- Riwaya helper takes `lang` and falls back to Hafs; no 14th "unknown" bucket.
- Quran Foundation's in-process cache is reset by Settings → Clear Cache.
- Failed sources are reported via `ReciterSourceResult.error` and a single UI line.

## What is left to the builder

- The shape of the test mocks for AsyncStorage and `retryFetch`.
- Minor refactor details in `use-player.ts` (where the dispatcher is called, how `selectedSurah` is preserved).

## Owner decisions (all resolved)

1. **Resolved:** `section-filters.tsx` expands to all 13 riwaya chips.
2. **Resolved:** credentials are bundled as `EXPO_PUBLIC_OTTV_*` values. The owner accepted that they are extractable from the installed app; real values must never be committed, and `.env.example` holds placeholders only.
3. **Noted:** MP3Quran v4 uses no key in the web app — only a feature flag and a base URL — so the TV adapter keeps just those two variables.
