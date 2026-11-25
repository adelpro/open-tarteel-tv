# Playback Reliability and Autoplay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Autoplay the selected surah on entering the player, fix all found provider/config/cache issues, and prove playback for every source on the TV emulator.

**Architecture:** Keep the existing adapter, fetch, and audio-cache layers. Extract player decisions into pure helpers (no new rendering dependencies), wire them into `usePlayer`, add a one-time settings migration, replace the single oversized AsyncStorage catalog row with chunked keys, then verify each provider on device.

**Tech Stack:** Expo 54 / React Native 0.81, TypeScript strict, Yarn 4, Vitest 4 (node environment), AsyncStorage, expo-audio, React Navigation.

**Spec:** `docs/superpowers/specs/2026-11-22-playback-reliability-design.md`

## Global Constraints

- No new test dependencies: no `@testing-library/react-native`, jsdom, or native-module mocks; all behavior tests use pure helpers in the existing Vitest node setup.
- Expo exposes only `EXPO_PUBLIC_*`; credentials stay in gitignored `.env.local`. No real values in tracked files or tests.
- `getPlaylist(reciter, lang, signal)` and numeric `Moshaf.id` stay unchanged.
- Autoplay fires at most once per reciter visit, only after playlist is ready, and never before a lazy playlist resolves.
- Partial playlist fallback: if the selected surah is absent, select and play the first available item.
- Settings migration runs once at version 2; all other stored toggles are preserved.
- Cache chunk size is exactly 50 reciters; keys: `@open_tarteel_reciters_index` and `@open_tarteel_reciters_chunk/<source>/<index>`. Never read the legacy `@open_tarteel_reciters_cache` row.
- v4 flag is `true` only in gitignored `.env.local` for verification; `.env.example` and code default stay `false`.
- QF credentials remain external; public `api.quran.com` fallback is the working path.

## Review Focus

- **Partial playlist where surah 1 is absent** — must autoplay the first available surah, not sit idle. Test in Task 1.
- **Deep link with unknown reciter or explicit surah** — must not crash or autoplay a wrong surah. Test in Task 2 and Task 3.
- **Oversized legacy cache row** — must never be read, must be removed, and no new stored value may exceed the chunk limit. Test in Task 5.
- **Repeated settings migration** — stored `qurani: false` becomes enabled once; other toggles and later user choices survive. Test in Task 4.
- **Lazy playlist failure / QF 401** — must show error/retry or fall back, never look like an empty catalog or false "sources unavailable". Test in Task 6.

---

### Task 1: Pure player decision helpers

**Files:**

- Create: `src/utils/player-autoplay.ts`
- Create: `src/utils/player-autoplay.test.ts`
- Create: `src/utils/player-label.ts`
- Create: `src/utils/player-label.test.ts`

**Interfaces:**

- Produces: `resolveAutoplay(input: AutoplayInput): AutoplayDecision`
- Produces: `getPlayerStatusLabel(isPlaying: boolean): 'now_playing' | 'selected_surah'`

`AutoplayInput` = `{ reciterId: string | null; selectedSurah: number | null; playlist: Playlist; playlistLoading: boolean; alreadyAttempted: boolean }`.
`AutoplayDecision` = `{ shouldPlay: boolean; surahId: number | null }`.

- [ ] **Step 1: Write the failing helper tests**

`player-autoplay.test.ts` must assert:

- no reciter → `{ shouldPlay: false, surahId: null }`
- `alreadyAttempted: true` → `shouldPlay: false`
- `playlistLoading: true` or empty playlist → `shouldPlay: false`
- selected surah present in playlist → `{ shouldPlay: true, surahId: selectedSurah }`
- selected surah absent but playlist has items → `{ shouldPlay: true, surahId: Number(playlist[0].surahId) }`
- `selectedSurah: null` with a playlist → plays `Number(playlist[0].surahId)`.

`player-label.test.ts` must assert `true → 'now_playing'` and `false → 'selected_surah'`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/utils/player-autoplay.test.ts src/utils/player-label.test.ts`
Expected: FAIL — modules do not exist.

- [ ] **Step 3: Implement the pure helpers**

Write the two functions with the exact signatures above. `resolveAutoplay` reads `item.surahId` via `Number(...)` and does not import React, navigation, or Expo modules.

- [ ] **Step 4: Run tests and type check**

Run: `yarn test src/utils/player-autoplay.test.ts src/utils/player-label.test.ts`
Run: `yarn type-check`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: add pure autoplay and player-label helpers`

---

### Task 2: Deep-link reciter lookup

**Files:**

- Modify: `src/services/api.ts`
- Create: `src/services/reciter-lookup.test.ts`

**Interfaces:**

- Produces: `findReciterById(reciterId: string | number, lang: 'ar' | 'en'): Promise<Reciter | null>`

- [ ] **Step 1: Write the failing test**

Mock `getCachedRecitersInfo` and `getAllReciters`; assert: a cached reciter is returned without a fresh fetch; a missing cached reciter falls back to a fresh fetch and is found; a bogus ID returns `null`; comparison uses `String(reciter.id) === String(reciterId)` so numeric and string IDs both work.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/services/reciter-lookup.test.ts`
Expected: FAIL — export does not exist.

- [ ] **Step 3: Implement `findReciterById`**

Add the function to `src/services/api.ts`. It reads the cached catalog first (via existing `getCachedRecitersInfo`) and calls existing `getAllReciters(lang)` only on a miss. Do not change any existing export signature.

- [ ] **Step 4: Run test and type check**

Run: `yarn test src/services/reciter-lookup.test.ts`
Run: `yarn type-check`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: resolve deep-link reciter IDs from catalog`

---

### Task 3: Wire autoplay, deep links and honest label

**Files:**

- Modify: `src/hooks/use-player.ts`
- Modify: `src/screens/player-screen.tsx`
- Modify: `src/components/player.tsx`
- Modify: `src/locales/en.json`, `src/locales/ar.json`

**Interfaces:**

- Consumes: `resolveAutoplay`, `getPlayerStatusLabel` from Task 1; `findReciterById` from Task 2
- Produces: no new public interface; `usePlayer()` keeps its current return shape

- [ ] **Step 1: Write a failing integration-style test using the pure helpers**

In `src/utils/player-autoplay.test.ts`, add a case proving an explicit deep-link `surahId` takes precedence over surah 1 when both are supplied to `resolveAutoplay` (pin the behavior at the helper level; the component wiring is checked by type-check and device run).

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/utils/player-autoplay.test.ts`
Expected: FAIL until the helper accepts an explicit `surahId` override.

- [ ] **Step 3: Extend the helper signature and implement wiring**

Extend `AutoplayInput` with `explicitSurahId?: number | null`; when set and present in the playlist, it wins over `selectedSurah`. In `usePlayer`: read `route.params.reciterId` and `surahId`, resolve the reciter with `findReciterById` when no direct reciter param exists, initialize `selectedSurah` from `explicitSurahId` or the first playlist item, keep `autoPlayAttemptedRef: Set<string>`, and call `resolveAutoplay(...)` in an effect; when `shouldPlay`, set `selectedSurah` to `surahId` and call `handleSurahPress(surahId)`. In `src/components/player.tsx:157`, render `t(getPlayerStatusLabel(isPlaying))` plus the surah name. Add `now_playing` and `selected_surah` keys to both locales.

- [ ] **Step 4: Run tests, type check and lint**

Run: `yarn test src/utils/player-autoplay.test.ts`
Run: `yarn type-check`
Run: `yarn lint`
Expected: all PASS.

- [ ] **Step 5: Commit**

Commit: `feat: autoplay current surah on player entry`

---

### Task 4: One-time settings migration and v4 test flag

**Files:**

- Create: `src/utils/settings-migration.ts`
- Create: `src/utils/settings-migration.test.ts`
- Modify: `src/context/settings.context.tsx`
- Modify: `.env.local` (gitignored; no tracked change)

**Interfaces:**

- Produces: `migrateEnabledSources(stored: Record<string, unknown>, version: number | undefined): { enabledSources: Record<string, boolean>; version: number }`

- [ ] **Step 1: Write the failing migration test**

Assert: `version === undefined` with stored `{ qurani: false }` returns `qurani: true` and version 2; `version === 2` preserves a user's later `{ qurani: false }`; other stored toggles are unchanged in both cases.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/utils/settings-migration.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement migration and wire it**

Create the pure helper; in `SettingsProvider`'s load effect, read `@open_tarteel_settings_version`, run `migrateEnabledSources`, apply the result and write the version key once. Set `EXPO_PUBLIC_OTTV_ENABLE_MP3QURAN_V4=true` in `.env.local` only.

- [ ] **Step 4: Run tests and type check**

Run: `yarn test src/utils/settings-migration.test.ts`
Run: `yarn type-check`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: migrate stale source settings and enable v4 for testing`

---

### Task 5: Chunked reciter cache

**Files:**

- Modify: `src/services/reciters-cache.ts`
- Create: `src/services/reciters-cache.test.ts`

**Interfaces:**

- Preserve existing exports unchanged: `getCachedReciters`, `getCachedRecitersInfo`, `setCachedReciters(sources, lang)`, `getRecitersCacheTimestamp`, `clearRecitersCache`
- Produces: `chunkReciters(reciters: Reciter[], size?: number): Reciter[][]` (default 50)

- [ ] **Step 1: Write the failing cache tests**

Mock AsyncStorage with an in-memory map; assert: 120 reciters produce 3 chunks; `setCachedReciters` then `getCachedRecitersInfo` round-trips data, sources, sourcesKey, timestamp and lang; no single stored value contains all 120 reciters; a legacy `@open_tarteel_reciters_cache` value with a huge string is never read and is removed by `clearRecitersCache`; `clearRecitersCache` removes index and every chunk; stale (older than 3 days) cache returns `null`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/services/reciters-cache.test.ts`
Expected: FAIL — chunk export does not exist / behavior differs.

- [ ] **Step 3: Implement chunked storage**

Rewrite `reciters-cache.ts` using `@open_tarteel_reciters_index` and `@open_tarteel_reciters_chunk/<source>/<index>` with chunks of 50. Keep the existing return shape of `getCachedRecitersInfo`. Never call `AsyncStorage.getItem` on the legacy key; remove it best-effort during write/clear.

- [ ] **Step 4: Run tests and type check**

Run: `yarn test src/services/reciters-cache.test.ts`
Run: `yarn type-check`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `fix: store reciter catalog in bounded AsyncStorage chunks`

---

### Task 6: Lazy playlist verification and adapter fixes

**Files:**

- Modify (only if a test fails): `src/services/reciters/itqan.adapter.ts`, `src/services/reciters/quranfoundation.adapter.ts`
- Test: existing adapter test files plus any added case

**Interfaces:**

- Consumes: existing `getReciterPlaylist(source, reciter, lang, signal)` from `api.ts`

- [ ] **Step 1: Write or confirm failing adapter tests**

For Itqan and QF, assert: successful playlist mapping from a mocked detail response; malformed payload throws; Itqan empty cached playlist is treated as a miss; QF token 401 falls back to the public path. Use placeholders only.

- [ ] **Step 2: Run the focused tests**

Run: `yarn test src/services/reciters/itqan.adapter.test.ts src/services/reciters/quranfoundation.adapter.test.ts src/services/reciters/quran-foundation.client.test.ts`
Expected: PASS; if a case fails, fix that adapter only.

- [ ] **Step 3: Device verification**

On the TV emulator, cold-start the app, wait for the catalog, and for each source — mp3quran, Itqan, QF, Qurani, v4 — open one reciter, confirm autoplay starts, and record the source, surah, displayed progress advancing for at least five seconds, and a screenshot. For QF expect public fallback (401 credentials are external). If a source's playlist fails, capture the exact log and fix its adapter before re-running that source.

- [ ] **Step 4: Verify a deep link**

Open `opentarteel://player/<reciterId>/<surahId>` on the emulator; confirm the reciter resolves, the explicit surah is selected, and audio starts.

- [ ] **Step 5: Run full verification and commit any fixes**

Run: `yarn test`, `yarn type-check`, `yarn lint`.
Expected: all PASS. Commit any adapter fix with `fix: <provider> lazy playlist`.

---

### Task 7: Final verification and runbook

**Files:**

- Create: `docs/runbooks/tv-playback-check.md`

**Interfaces:**

- Consumes: all earlier tasks

- [ ] **Step 1: Write the runbook**

Document: cold start, expected catalog counts (mp3quran 299, Itqan ~75, QF 14, Qurani and v4 after enablement), per-source playback steps, deep-link check, and the Metro note: if the screen is blank or bundle download fails with a chunk/CRLF error, restart Metro and cold-launch rather than using Reload.

- [ ] **Step 2: Run final checks**

Run: `yarn test`, `yarn type-check`, `yarn lint`.
Expected: all PASS; record the full-suite count.

- [ ] **Step 3: Commit**

Commit: `docs: TV playback verification runbook`

---

## Self-Review Notes

- Spec coverage: autoplay + label (T1/T3), deep links (T2/T3), settings migration (T4), v4 flag (T4), chunked cache (T5), provider verification (T6), runbook (T7).
- Review Focus items pinned in T1, T2, T4, T5 and T6.
- Consistent names: `resolveAutoplay`, `getPlayerStatusLabel`, `findReciterById`, `migrateEnabledSources`, `chunkReciters`, `getReciterPlaylist`.
- No rendering dependencies; no transcript-level component code; the plan stays shorter than a full implementation.
