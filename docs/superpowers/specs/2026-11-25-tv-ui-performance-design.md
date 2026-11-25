# TV UI Performance — Design/Spec

**Date:** 2026-11-25

## Goal

Make the Android TV UI responsive on low-powered TV hardware: no visible jank on
Home (scroll, search typing, GUN count sync) or Player (audio progress updates).

## Evidence gathered (read-only audit + compiler run)

### Render-cost findings

| ID  | Finding                                                                                                                                                                                    | Evidence                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | `useAudioPlayerStatus` drives a `PlayerScreen` re-render on every audio status tick; `memo(Player)` and `memo(Playlist)` are defeated because `usePlayer()` returns a fresh object literal | `src/hooks/use-player.ts:29-31,254-274`, `src/screens/player-screen.tsx:27,96-97`, `src/components/player.tsx:318`, `src/components/play-list.tsx:219`         |
| F2  | `ReciterCard` subscribes to two contexts plus i18n/window dimensions and builds 6 styles per render; four featured rails render all cards unvirtualized                                    | `src/components/reciter-card.tsx:53-125`, `src/components/section-featured.tsx:87-107`                                                                         |
| F3  | All three providers pass fresh inline object values, so any provider state change re-renders every consumer                                                                                | `src/context/settings.context.tsx:187-201`, `src/context/favorites.context.tsx:76-84`, `src/context/recently-played.context.tsx:77-83`                         |
| F4  | GUN `.map().on()` calls `setState` per key; each event re-renders Home and recomputes full-catalog sorts                                                                                   | `src/services/gun-service.ts:47,91`, `src/context/favorites.context.tsx:44-46`, `src/hooks/use-view-counts.ts:9-11`, `src/screens/home-screen.tsx:301-361`     |
| F5  | Fuse index is rebuilt and every name normalized on each keystroke; no debounce                                                                                                             | `src/screens/home-screen.tsx:380-438`                                                                                                                          |
| F6  | `StyleSheet.create()` runs inside render in several components; `reciterRows` is built but never used                                                                                      | `src/screens/home-screen.tsx:122`, `src/components/home-header.tsx:83`, `src/components/section-featured.tsx:43`, `src/hooks/use-reciter-grid-layout.ts:34-44` |

### React Compiler findings (verified on this repo)

- Installed: React `19.1.0`, `react-native-tvos@0.81.5-2`, Expo `54.0.29`,
  `babel-preset-expo@54.0.10`, `babel-plugin-react-compiler@1.0.0`,
  `eslint-plugin-react-compiler@19.1.0-rc.2`. SDK 54 + RNTV 0.81 supports the
  compiler; no version upgrade is required.
- React 19 alone does **not** auto-memoize. The compiler was off: no
  `experiments.reactCompiler`, no Babel config, compiler ESLint rules not enabled.
- After opt-in, `expo start` logs "React Compiler enabled" and a Metro dev bundle
  fetched with `&transform.reactCompiler=true` contains 34 `react/compiler-runtime`
  imports and 73 `memo_cache_sentinel` occurrences in app code.
- The compiler **skips** functions it cannot lower. Diagnostics with
  `panicThreshold: 'all_errors'`:
  - `HomeScreen`: `try/finally` unsupported; then ref write during render; then
    "value blocks (conditional, logical, optional chaining) within a try/catch".
  - `ReciterCard`: conditional expression used as a computed object key.
- React Compiler memoizes work _inside_ a render. It cannot prevent renders
  caused by changed state, context values, or new prop identity. F1, F3, F4 and F5
  still require explicit fixes even with full compiler coverage.
- React docs recommend **keeping** existing `useMemo`/`useCallback`/`memo` rather
  than removing them after enabling the compiler.

## Requirements

1. `HomeScreen`, `ReciterCard`, `Player`, `Playlist` must all be covered by the
   React Compiler transform (verified by inspecting transformed output).
2. Playback progress updates must re-render only the progress display, not
   `Player` or `Playlist`.
3. Provider values must be referentially stable while their underlying data is
   unchanged.
4. GUN count events must be coalesced so a burst of keys causes at most one
   state update per frame, without losing counts.
5. Search must be debounced, with the final typed character always processed;
   the Fuse index must be rebuilt only when the catalog or language changes.
6. No behavior regressions: remote focus/remount rules, RTL, cache/soft-TTL,
   request cancellation, offline/error states, and deep links must still work.
7. No new runtime dependencies.

## Non-goals

- No upgrade of Expo / RN TV / React, no native module work.
- No redesign of navigation, adapters, or the visual layout.
- No attempt to remove manual memoization.

## Verification definition of done

- `yarn type-check`, `yarn lint`, `yarn test` all pass.
- `yarn expo export --platform android --clear` succeeds.
- Metro bundle check confirms compiler cache output for the four hot components.
- On-device profiler (or TV emulator) shows no long frames during home search,
  GUN sync and playback. Device-only checks must be labelled as unverified if
  no device is available.
