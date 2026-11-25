# TV UI Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate TV UI jank by making the React Compiler actually cover the hot components and by removing the render _triggers_ the compiler cannot fix.

**Architecture:** Two layers. First, restructure the few functions the compiler refuses to lower out of component bodies so the render itself is cached. Second, isolate state that changes frequently (audio progress, GUN counts, search text, context values) behind narrow subscribers and memoized provider values, so a change re-renders only the small part that depends on it.

**Tech Stack:** Expo SDK 54 (`54.0.29`), `react-native-tvos@0.81.5-2`, React `19.1.0`, Hermes + new architecture, `react-tv-space-navigation@6.0.0-beta1`, `babel-plugin-react-compiler@1.0.0`, TypeScript strict, Vitest 4 (node environment).

**Spec:** `docs/superpowers/specs/2026-11-25-tv-ui-performance-design.md`

## Baseline already applied (verified, do not redo)

- `app.json` — `expo.experiments.reactCompiler: true`.
- `eslint.config.mjs` — `reactCompilerPlugin.configs.recommended` enabled.
- `src/components/reciter-card.tsx` — conditional computed key replaced with
  `const badgeSide: 'right' | 'left' = isRTL ? 'right' : 'left'`.
- `src/screens/home-screen.tsx` — `try/finally` in `loadReciters` replaced with a
  guarded `finish()` helper on every exit path; `enabledSourcesRef.current = ...`
  moved from render into a `useEffect` declared before the load effect.
- Verified on 2026-11-25: `yarn type-check` pass, `yarn lint` pass,
  `yarn test` 21 files / 154 tests pass, `expo export --platform android` pass,
  Metro dev bundle contains compiler output. `HomeScreen` is **still skipped** by
  the compiler (third limitation: value blocks inside `try/catch`); Task 1 fixes that.

## Global Constraints

- Versions above are fixed: no upgrade of Expo, `react-native-tvos`, React, or
  `react-tv-space-navigation`. No new dependencies.
- React Compiler v1.0.0 limitations observed here: no `try/finally`, no ref access
  during render, no conditional expression as a computed object key, no value
  blocks (conditional / logical / optional chaining) inside `try/catch`.
- Keep existing `useMemo` / `useCallback` / `memo` wrappers. Do not "simplify" them
  away — React docs advise leaving manual memoization in place after enabling the compiler.
- Metro serves compiler-transformed code only when the bundle request carries
  `transform.reactCompiler=true`. A dev bundle fetched without it will look uncompiled.
- Preserve: remote focus restoration, RTL row direction, soft-cache TTL, source
  merge semantics, abort/stale-response guards, deep links, and error states.
- No credentials in files or tests.

## Review Focus

- **Stale / aborted loads** — a superseded language or settings change must never
  overwrite state; unmount must cancel in-flight work. Task 1 tests the merge
  helper and the loader's stale guard.
- **Compiler coverage regressions** — a future edit can silently make the compiler
  skip `HomeScreen` or `ReciterCard` again. Task 1 verification step checks the
  transformed output for both; Task 7 repeats it for all four hot components.
- **GUN burst on peer connect** — many keys arriving together must produce one
  state update and no lost counts. Task 4 tests the batching helper.
- **Search debounce on a TV remote** — the final typed character must not be
  dropped, and the index must invalidate on language/catalog change. Task 5 tests
  the search helper.
- **Playback progress isolation** — progress ticks must not re-render `Player` or
  `Playlist`, while controls, focus and autoplay still work. Task 2 verifies via
  compiler coverage plus a device/emulator check in Task 7.

---

### Task 1: Extract reciter loading so `HomeScreen` is compiler-covered

**Files:**

- Create: `src/utils/reciters-merge.ts`
- Create: `src/utils/reciters-merge.test.ts`
- Create: `src/hooks/use-reciters-loader.ts`
- Modify: `src/screens/home-screen.tsx` (remove local load state/refs/`loadReciters`,
  consume the hook result)

**Interfaces:**

- Produces: `mergeRecitersBySource(results: ReciterSourceResult[], cachedSources: Record<string, Reciter[]>): { mergedSources: Record<string, Reciter[]>; merged: Reciter[] }`
  (`ReciterSourceResult` imported from `src/services/api.ts`).
- Produces: `useRecitersLoader(enabledSourcesRef: MutableRefObject<Record<string, boolean>>): RecitersLoaderState`
  where `RecitersLoaderState = { reciters: Reciter[]; loading: boolean; error: string | null; sourceErrorCount: number; loadReciters: (lang: 'ar' | 'en') => Promise<void> }`.
- Consumes: `getCachedRecitersInfo`, `setCachedReciters`, `SOFT_CACHE_TTL_MS`,
  `fetchRecitersBySource`, `getSourceErrorCount`, `isAbortError` (all existing exports).
- The hook owns `requestIdRef`, `abortRef`, its state setters, and the unmount
  cleanup effect. All `try/catch` logic lives in the hook (the compiler may skip
  the hook; it must not skip `HomeScreen`).

- [ ] **Step 1: Write the failing merge tests**

`reciters-merge.test.ts` must assert:

- source with non-empty `reciters` replaces that source's cached array.
- source with empty `reciters` keeps `cachedSources[source]`.
- a source absent from `results` is not present in `mergedSources` (current
  behavior: only fetched sources are merged).
- `merged` is the flat concatenation of `Object.values(mergedSources)`.
- an empty `results` array yields `{ mergedSources: {}, merged: [] }`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/utils/reciters-merge.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `mergeRecitersBySource` in `src/utils/reciters-merge.ts`**

No React imports. Preserve the existing precedence: fresh non-empty results win,
empty results fall back to cached data for the same source key.

- [ ] **Step 4: Implement `useRecitersLoader` in `src/hooks/use-reciters-loader.ts`**

Move the current `loadReciters` body verbatim (cache-first, soft-TTL skip, fetch,
stale/abort guards, merge via `mergeRecitersBySource`, cache write, `finish()`
guard) plus the unmount cleanup effect. Keep `useCallback` with `[]` deps and keep
reading enabled sources through the ref.

- [ ] **Step 5: Rewire `HomeScreen`**

Delete the local `reciters`/`loading`/`error`/`sourceErrorCount` states,
`requestIdRef`, `abortRef` and `loadReciters`; replace with
`const { reciters, loading, error, sourceErrorCount, loadReciters } = useRecitersLoader(enabledSourcesRef);`.
Keep `sourcesSignature`, the load effect, `handleRetry` and all focus/grid logic unchanged.

- [ ] **Step 6: Verify compilation and tests**

Run: `yarn test src/utils/reciters-merge.test.ts`
Run: `yarn test`
Run: `yarn type-check`
Expected: all PASS.

Run the compiler coverage probe (from repo root, Node 22+):

```bash
node -e "const b=require('D:/open-tarteel-tv/node_modules/@babel/core'),p=require('D:/open-tarteel-tv/node_modules/babel-plugin-react-compiler');for(const f of ['src/screens/home-screen.tsx','src/components/reciter-card.tsx']){try{const o=b.transformSync(require('fs').readFileSync(f,'utf8'),{configFile:false,babelrc:false,filename:f,plugins:[['@babel/plugin-syntax-jsx',{}],['@babel/plugin-syntax-typescript',{isTSX:true}],[p,{target:'19',panicThreshold:'all_errors'}]]});console.log(f,'COMPILED',o.code.includes('react/compiler-runtime'),/_c\([0-9]+\)/.test(o.code))}catch(e){console.log(f,'SKIPPED',e.message.split('\n')[0])}}"
```

Expected: `COMPILED true true` for both files. `memo_cache_sentinel` is NOT a valid
coverage marker — the compiler emits it only for scopes with no reactive
dependencies; fully compiled components can correctly omit it. If the probe prints
`SKIPPED`, read the compiler diagnostic and move the offending expression out of
the component; do not patch it in place.

- [ ] **Step 7: Commit**

Commit: `refactor: extract reciter loader so Home screen compiles`

---

### Task 2: Isolate playback progress from `Player` and `Playlist`

**Files:**

- Create: `src/components/player-progress.tsx`
- Modify: `src/hooks/use-player.ts`
- Modify: `src/components/player.tsx`
- Modify: `src/screens/player-screen.tsx`

**Interfaces:**

- Produces: `PlayerProgress({ player }: { player: AudioPlayer })` — calls
  `useAudioPlayerStatus(player)` internally and renders only the progress bar and
  `m:ss / m:ss` text. No props change per tick.
- `usePlayer()` gains `core: PlayerCoreState` — a `useMemo`'d object containing
  everything it returns today **except** `position` and `duration`, with a stable
  identity across progress ticks.
- Consumes: `player` object returned by `useAudioPlayer()` (stable per player id).

- [ ] **Step 1: Write the failing render-count test**

Create `src/components/player-progress.test.ts` with a pure formatting assertion:
`formatPlaybackTime(65) === '01:05'` and `formatPlaybackTime(0) === '00:00'`.
Export `formatPlaybackTime` from `player-progress.tsx`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/components/player-progress.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `PlayerProgress`**

`useAudioPlayerStatus(player)` inside this component only. Render the bar and time
text using `formatPlaybackTime`. Export the component as default and the formatter
as a named export.

- [ ] **Step 4: Add `core` to `usePlayer()`**

Wrap the existing return value in `useMemo` keyed on its current dependencies so
`core` keeps identity when only `currentTime`/`duration` change. Keep `position`
and `duration` as separate flat fields for `PlayerProgress`. Do not change any
handler's dependency list.

- [ ] **Step 5: Rewire the player UI**

`PlayerScreen` passes `player.core` to `<PlayerComponent />` and `<Playlist />`.
`Player` removes its inline progress JSX and renders `<PlayerProgress player={…} />`
using the stable audio player object from `core`. Keep `AudioSpectrum`, controls,
metadata and focus behavior unchanged.

- [ ] **Step 6: Verify**

Run: `yarn test src/components/player-progress.test.ts`
Run: `yarn test`
Run: `yarn type-check`
Run: `yarn lint`
Expected: all PASS. Then use the Task 1 compiler probe on
`src/components/player.tsx` and `src/components/play-list.tsx`; expected `true`
for both.

- [ ] **Step 7: Commit**

Commit: `perf: isolate playback progress updates from player and playlist`

---

### Task 3: Stabilize context provider values

**Files:**

- Modify: `src/context/settings.context.tsx`
- Modify: `src/context/favorites.context.tsx`
- Modify: `src/context/recently-played.context.tsx`

**Interfaces:**

- No API changes. Each provider's `value` must be a `useMemo`'d object whose
  dependencies are the actual fields it exposes.

- [ ] **Step 1: Wrap each provider value in `useMemo`**

`SettingsProvider`, `FavoritesProvider`, `RecentlyPlayedProvider`: replace
`value={{ … }}` with `value={contextValue}` where `contextValue` is
`useMemo(() => ({ … }), [<fields>])`. Include every exposed field in the
dependency list; all handlers are already `useCallback`'d.

- [ ] **Step 2: Verify no stale closures**

Read each effect/callback in the three files and confirm it still reads current
state (the memo only changes object identity, not the values). No test harness for
renders is installed, so this is a review step plus the device check in Task 7.

- [ ] **Step 3: Verify**

Run: `yarn type-check`
Run: `yarn lint`
Run: `yarn test`
Expected: all PASS.

- [ ] **Step 4: Commit**

Commit: `perf: memoize context provider values`

---

### Task 4: Coalesce GUN count updates

**Files:**

- Create: `src/utils/count-batcher.ts`
- Create: `src/utils/count-batcher.test.ts`
- Modify: `src/hooks/use-view-counts.ts`
- Modify: `src/context/favorites.context.tsx`

**Interfaces:**

- Produces: `mergeCountEvents(previous: Record<string, number>, events: Array<[string, number]>): Record<string, number>`
- Produces: `createCountBatcher(onFlush: (events: Array<[string, number]>) => void): { push(key: string, count: number): void; flush(): void; dispose(): void }`
  — one flush per animation frame in RN; no timer when the queue is empty.

- [ ] **Step 1: Write the failing batcher tests**

`count-batcher.test.ts` must assert:

- `mergeCountEvents({ a: 1 }, [['b', 2], ['a', 3]])` → `{ a: 3, b: 2 }`.
- last event wins for a repeated key within one batch.
- an empty event list returns the same object reference (so consumers can bail out).
- with a fake flush callback, three `push()` calls produce one `onFlush` with
  three ordered pairs.
- `dispose()` prevents a queued batch from flushing.

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/utils/count-batcher.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the helper in `src/utils/count-batcher.ts`**

No React imports. Use `requestAnimationFrame`/`cancelAnimationFrame` (available in
RN/Hermes); keep the queue local to the batcher instance.

- [ ] **Step 4: Wire the two subscribers**

In `use-view-counts.ts` and the GUN effect in `favorites.context.tsx`, create one
batcher per subscription, call `push(key, count)` from the GUN callback, and
`setState(prev => mergeCountEvents(prev, events))` in the flush callback. Call
`dispose()` in the effect cleanup. Keep the existing `subscribeToViewCounts` /
`subscribeToFavoriteCounts` signatures.

- [ ] **Step 5: Verify**

Run: `yarn test src/utils/count-batcher.test.ts`
Run: `yarn test`
Run: `yarn type-check`
Run: `yarn lint`
Expected: all PASS.

- [ ] **Step 6: Commit**

Commit: `perf: batch GUN count updates into one render per frame`

---

### Task 5: Debounce search and cache the Fuse index

**Files:**

- Create: `src/utils/reciter-search.ts`
- Create: `src/utils/reciter-search.test.ts`
- Create: `src/hooks/use-debounced-value.ts`
- Modify: `src/screens/home-screen.tsx`

**Interfaces:**

- Produces: `buildReciterSearchIndex(reciters: Reciter[], lang: 'ar' | 'en'): Fuse<ReciterSearchItem>`
- Produces: `searchReciters(index: Fuse<ReciterSearchItem>, query: string, lang: 'ar' | 'en'): Reciter[]`
- Produces: `useDebouncedValue<T>(value: T, delayMs: number): T` — trailing-edge
  debounce that always delivers the final value.
- `ReciterSearchItem` is the existing `Reciter & { searchName: string; searchMoshafName: string }`.

- [ ] **Step 1: Write the failing search tests**

`reciter-search.test.ts` must assert:

- an empty normalized query returns the input list unchanged by search
  (the caller still applies riwaya/letter filters and alphabetical sort).
- a query matching only `moshaf.name` still finds the reciter.
- Arabic diacritics/letter normalization makes a normalized query match.
- `buildReciterSearchIndex` is only called when `reciters` or `lang` changes:
  assert the index object identity is stable across two calls with the same array.

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/utils/reciter-search.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `reciter-search.ts`**

Move the Fuse options (`threshold: 0.4`, `ignoreLocation: true`,
`minMatchCharLength: 1`, weights 0.6/0.4) and normalization into this module.
No React imports.

- [ ] **Step 4: Implement `use-debounced-value.ts`**

Trailing-edge debounce with cleanup on unmount; no leading call.

- [ ] **Step 5: Rewire `HomeScreen`**

`const debouncedQuery = useDebouncedValue(searchQuery, 150);` Use `debouncedQuery`
only for the Fuse branch; keep `searchQuery` for the controlled `TextInput` and for
the no-query alphabetical path so the visible list does not lag the input. Build
the index with `useMemo(() => buildReciterSearchIndex(baseList, lang), [baseList, lang])`.
Keep the existing riwaya/letter filter and focus behavior unchanged.

- [ ] **Step 6: Verify**

Run: `yarn test src/utils/reciter-search.test.ts`
Run: `yarn test`
Run: `yarn type-check`
Run: `yarn lint`
Expected: all PASS.

- [ ] **Step 7: Commit**

Commit: `perf: debounce search and cache the Fuse index`

---

### Task 6: Remove dead and per-render work

**Files:**

- Modify: `src/hooks/use-reciter-grid-layout.ts`
- Modify: `src/screens/home-screen.tsx`
- Modify: `src/components/home-header.tsx`
- Modify: `src/components/section-featured.tsx`
- Modify: `src/components/reciter-card.tsx`
- Modify: `src/components/play-list.tsx`

- [ ] **Step 1: Remove unused grid layout outputs**

Delete `reciterRows` and `rowHeight` from `use-reciter-grid-layout.ts` (grep showed
no consumers). Keep `cardsPerRow` and `itemWidth` signatures unchanged.

- [ ] **Step 2: Hoist static styles**

Move `StyleSheet.create` calls that do not depend on render-time values to module
scope in the listed files. Styles that do depend on theme/width must be created
from a memoized factory (`useMemo` keyed on those primitives), not on every render.
Do not change any style values.

- [ ] **Step 3: Remove the no-op memo**

In `play-list.tsx`, delete `const memoizedData = useMemo(() => playlistData, [playlistData]);`
and use `playlistData` directly (`usePlayer` already memoizes it with `[]`).

- [ ] **Step 4: Verify**

Run: `yarn type-check`
Run: `yarn lint`
Run: `yarn test`
Expected: all PASS. Confirm no visual diff by comparing a Home and Player screenshot
on a TV/emulator in Task 7.

- [ ] **Step 5: Commit**

Commit: `perf: remove unused grid rows and per-render style allocation`

---

### Task 7: Final verification and device profiling

**Files:** none (verification only).

- [ ] **Step 1: Static checks**

Run: `yarn type-check`
Run: `yarn lint`
Run: `yarn test`
Run: `yarn expo export --platform android --clear`
Expected: all PASS.

- [ ] **Step 2: Compiler coverage probe**

Repeat the corrected Task 1 probe for `home-screen.tsx`, `reciter-card.tsx`,
`player.tsx`, `play-list.tsx`. Expected: `COMPILED true true` for all four
(no diagnostic thrown; `react/compiler-runtime` import + `_c(N)` present).
`memo_cache_sentinel` is not a valid marker and must not be used as the gate.

- [ ] **Step 3: Metro bundle check**

Run `yarn expo start --clear --port 8083`, then fetch
`http://127.0.0.1:8083/index.bundle?platform=android&dev=true&minify=false&hot=false&transform.reactCompiler=true`
and confirm `compiler-runtime` imports are present. (Without the
`transform.reactCompiler=true` param the bundle is transformed without the compiler
and will show none.)

- [ ] **Step 4: On-device / emulator profiling**

Run three scenarios with the RN performance overlay + React DevTools profiler on an
Android TV device or emulator: home idle scroll, typing a search query, and active
playback. Record whether any frames exceed 16 ms of JS work. If no device is
available, mark this step UNVERIFIED and report it explicitly — do not infer it
from bundle size.

- [ ] **Step 5: Behavior regression sweep**

Confirm remote focus restoration, RTL layout, source toggles, cache soft-TTL,
offline/error states and deep links still behave as before. Revert the task that
introduced a regression rather than stacking a fix on top.

- [ ] **Step 6: Final commit / handoff**

No code changes expected. If profiling found a remaining hot path, file a new task
instead of extending this plan.
