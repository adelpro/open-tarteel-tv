# Player autoplay and playback reliability — design

Date: 2026-11-22
Branch: `feat/playback-reliability` (off `develop`)

## Intent and why

Opening a reciter currently lands on a player that says "Now Playing: Al-Faatiha" with 00:00/00:00 and a ▶ icon, but nothing starts until the user presses a playlist item. That reads as broken. At the same time, four provider issues remain from the previous work: Itqan and QF lazy playlists were never verified end-to-end, Qurani.ai is switched off by a stale saved setting, v4 is hidden by its flag, and the reciter catalog cache throws `SQLiteBlobTooBigException` on every launch because one AsyncStorage row exceeds Android's CursorWindow limit. This change closes all of them and finishes with per-source device proof.

## Evidence gathered before this design

- Catalog fetch (in-app log): mp3quran 299, Itqan 75, QF 14, all with `error: undefined`; total 388. Qurani.ai absent because stored settings contain `qurani: false`. v4 absent because flag is off.
- Playback proven only for mp3quran: Al-Baqara reached 00:52 / 93:05 with pause icon; another reciter reached 00:09 / 00:36. Cached MP3 files exist (e.g. 602 KB for surah 1, 80 MB for surah 2 — legitimate long recitation).
- `usePlayer` sets `selectedSurah` to surah 1 but never calls `handleSurahPress` on entry.
- `src/components/player.tsx:157` renders `Now Playing: …` regardless of `isPlaying`.
- `src/services/reciters-cache.ts` stores the entire catalog in one `@open_tarteel_reciters_cache` row; Android logs `SQLiteBlobTooBigException: Row too big to fit into CursorWindow` when reading it.
- QF credentials return 401 `invalid_client`; the public `api.quran.com` fallback returns 14 reciters and works. This is external and cannot be fixed in app code.
- All five upstream endpoints return HTTP 200 from this PC.

## Goals

1. Auto-play the selected surah (first by default) on entering the player, exactly once per reciter visit, and only after its playlist is available; if that surah is missing from the playlist, fall back to the first available item and update the selection.
2. Support deep-link entry (`opentarteel://player/:reciterId?/:surahId?`) by resolving the reciter from the catalog and honoring an explicit `surahId`, then applying the same autoplay rule.
3. Replace the misleading "Now Playing" label with an honest pre-play state.
4. Verify and, if needed, fix lazy playlist loading for Itqan and QF; prove playback for both.
5. Re-enable Qurani.ai via a one-time settings migration, and verify it on device.
6. Enable the v4 flag for this test environment and verify v4 appears and plays; keep the shipped default off until upstream is promoted.
7. Replace the single oversized cache row with chunked storage so the catalog cache actually loads.
8. Add automated tests for every changed behavior and a device runbook with per-source evidence.

## Non-goals

- Changing QF credentials or provider-side configuration (still in review; fallback is the intended path).
- Changing the feature-flag default in `.env.example` or source code (v4 stays opt-in by default).
- Reworking audio caching, `retryFetch`, or the adapter contracts beyond what the lazy-playlist fix requires.
- Follow-along / ayah timings, capabilities matrix, or UI redesign.
- Fixing the dev-only blank screen caused by a stale Metro bundle; that is covered by a runbook note, not product code.

## Anti-goals

- Autoplay firing repeatedly on re-render, after pause, or before a lazy playlist is ready.
- Silently resetting a user's deliberate source toggles on every launch; the migration must run once.
- Writing credential values into tracked files.
- Treating a 401 credential as a source failure when the public fallback already works.

## Constraints and decisions

- Expo `EXPO_PUBLIC_*` env values are build-time constants; `.env.local` is gitignored and holds the owner's test credentials.
- React Native AsyncStorage on Android is SQLite-backed with a ~2 MB CursorWindow limit per row — no single key may hold the full catalog.
- `getPlaylist` signature is `getPlaylist(reciter, lang, signal)`; Itqan cache is keyed by `reciter.id`.
- Existing settings shape is `Record<string, boolean>` merged as `{...defaults, ...stored}`; a stored `false` therefore overrides a new default forever.

### Decision: autoplay trigger

Use an effect in `usePlayer` keyed on `reciter?.id`, `selectedSurah`, `playlistLoading` and playlist availability. A ref `autoPlayAttemptedRef: Set<string>` records reciter IDs already auto-played; it is cleared when the user picks a different reciter or taps retry. The effect calls `handleSurahPress(selectedSurah)` only when `reciter.moshaf.playlist.length > 0`, `!playlistLoading` and not already attempted. "Current surah" means the highlighted `selectedSurah` (surah 1 by default), not a persisted last-played surah. If that surah ID is absent from the loaded playlist, set `selectedSurah` to `playlist[0].surahId` and autoplay that item instead — never leave the player idle because a reciter has a partial playlist.

### Decision: deep links (in scope)

`usePlayer` must also accept `route.params.reciterId` and `route.params.surahId`. `reciterId` is compared loosely (`String(reciter.id)`) against the cached catalog first, then a fresh `getAllReciters()` fetch if absent; an explicit `surahId` overrides the surah-1 default. If the explicit surah is not in the playlist, apply the same first-available fallback. Deep-link entry then follows the identical autoplay gate. `src/navigation/app-navigator.tsx` already declares the `Player` path; no new prefix is needed.

### Decision: tests (builder call, recorded)

Do not add a rendering stack (`@testing-library/react-native`, jsdom, native-module mocks). Extract the decisions into pure helpers in the existing node-environment Vitest setup: a helper that, given `{ reciterId, selectedSurah, playlist, playlistLoading, alreadyAttempted }`, returns `{ shouldPlay, surahId }`; a pure label selector over `isPlaying` and surah name; and pure functions for settings migration and cache chunking. Component wiring stays thin and is verified by `yarn type-check` plus the device runbook.

### Decision: pre-play label

`src/components/player.tsx` shows `t('now_playing')` only when `isPlaying`; otherwise `t('selected_surah')`. Add both keys to `en.json` and `ar.json`.

### Decision: settings migration

Add `@open_tarteel_settings_version` (integer). On load, if the version is missing or < 2, delete the stored `qurani` key so the default `true` applies, then write version 2. All other stored toggles are preserved. The migration runs once and is covered by a test that seeds a stored `qurani: false` and asserts it becomes enabled only on the first upgraded load.

### Decision: cache layout

Replace the single key with:

- `@open_tarteel_reciters_index` — small JSON: `{ lang, sourcesKey, timestamp, chunks: Record<source, number> }`.
- `@open_tarteel_reciters_chunk/<source>/<index>` — arrays of at most 50 reciters.

Reads load the index, then only the chunks for the requested sources. Writes create chunks and the index atomically enough for AsyncStorage, then best-effort remove the legacy `@open_tarteel_reciters_cache` key (never read it, so the oversized row cannot throw). `clearRecitersCache()` removes the index, every chunk recorded in it, and the legacy key. `getCachedRecitersInfo()` keeps the same return shape so HomeScreen is unchanged.

### Decision: v4 for this PC

Set `EXPO_PUBLIC_OTTV_ENABLE_MP3QURAN_V4=true` in gitignored `.env.local` for verification only. `.env.example` and code defaults stay `false`. Device run must show v4 in settings and play one v4 surah.

## Approaches considered

1. **Player-only** — autoplay + label, leave providers alone. Rejected: leaves three of the six issues open.
2. **Full reliability pass (chosen)** — all six items in one branch, ending with a per-source device matrix.
3. **Two plans** — player UX and provider/cache separately. Rejected: extra approval cycles and duplicated device testing.

## Phasing

### Phase 1 — player behavior

- Add `autoPlayAttemptedRef` and the autoplay effect in `src/hooks/use-player.ts`.
- Resolve `route.params.reciterId` / `surahId` (cached catalog first, then a fresh fetch) and apply the explicit surah or the first-available fallback.
- Fix the label in `src/components/player.tsx` and add locale keys.
- Tests (pure helpers only): autoplay fires once per reciter; does not fire before a lazy playlist resolves; does not re-fire after pause; missing surah falls back to the first available item; explicit deep-link surah wins; label switches on `isPlaying`.

### Phase 2 — settings migration and v4 verification

- Implement versioned settings migration in `src/context/settings.context.tsx`.
- Set the v4 flag in `.env.local` for this PC.
- Tests: one-time migration, other toggles preserved, v4 included in `ACTIVE_SOURCES` only when flag is on.

### Phase 3 — chunked reciter cache

- Rewrite `src/services/reciters-cache.ts` to the layout above, keeping its public API.
- Wire `clearCaches()` (already clears other caches) to the new clear function.
- Tests: round-trip, 50-reciter chunk boundary, legacy key ignored/removed, clear removes all chunks, no single stored value contains the full catalog.

### Phase 4 — lazy playlist verification and fixes

- Add focused Vitest coverage for Itqan and QF `getPlaylist` (already partly present) covering success, malformed payload, cache hit, empty-cache-as-miss, 401 fallback.
- On device, open one reciter from each source and play a surah for at least five seconds; record source, surah, duration and screenshot.
- If a source's playlist fails, fix that adapter only; do not change the shared contract. QF 401 remains expected and must still fall back.
- Device runbook: cold start, wait for catalog, verify per-source cards, open each source, autoplay, confirm progress advances, then return and confirm no false "sources unavailable" warning.

### Phase 5 — verification and handoff

- Run `yarn test`, `yarn type-check`, `yarn lint`.
- Run the device matrix: mp3quran, Itqan, QF, Qurani, v4 — catalog count and playback result for each.
- Verify one deep link (`opentarteel://player/<reciterId>/<surahId>`) resolves and autoplays the requested surah.
- If Metro serves a corrupt bundle again, restart Metro and cold-launch; note in the runbook.

## What is left to the builder

- Exact chunk size and key naming are fixed above; implementation details of atomic writes are the builder's call.
- Test mock shapes for AsyncStorage and `retryFetch`.
- Whether to keep the autoplay effect in `usePlayer` or extract a helper — builder's call, but behavior must match the decision above.

## Owner decisions

None pending. Credentials remain in review; the app must keep working through the public QF fallback.
