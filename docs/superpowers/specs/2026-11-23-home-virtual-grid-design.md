# Home virtualized grid design

Date: 2026-11-23
Branch: `feat/home-virtual-grid` (off `develop`)

## Intent and why

The Home screen currently mounts every reciter card at once. With all five providers enabled the catalog is ~849 reciters; `SectionRecitersGrid` chunks the full array into rows and maps every row/card (`src/components/section-reciters-grid.tsx:45–61`), so the TV device pays render, layout and focus-graph cost for the whole catalog even though only a few rows are visible. The installed TV navigation library already ships `SpatialNavigationVirtualizedGrid`, which virtualizes rows while keeping arbitrary-direction remote navigation. This change makes that component the single vertical scroller for the Home screen.

## Evidence gathered

- `HomeScreen` uses `SpatialNavigationScrollView` (`home-screen.tsx:460`) wrapping `SpatialNavigationView` with search, filters, four featured sections and `SectionRecitersGrid`.
- `SpatialNavigationScrollView` docs: a focus-aware wrapper around RN `ScrollView`; it scrolls the focused element into view. **It does not virtualize children.**
- `SpatialNavigationVirtualizedGrid` is exported by the installed library (`dist/index.d.ts:8`) and virtualizes **rows**, not items inside a row; vertical scrolling only; any-direction navigation; `ref.focus(index)` works, `ref.scrollTo(index)` does not work reliably for grids.
- Installed `react-tv-space-navigation@6.0.0-beta1`; `npm view` reports the same version as latest. Upstream main is older (`5.2.0`). No upgrade is needed or available.
- Library docs require `header: JSX.Element` and `headerSize: number` when a header is used; nested horizontal `SpatialNavigationScrollView` is used by `SectionFeatured`.

## Goals

1. Replace the all-at-once Reciters grid with `SpatialNavigationVirtualizedGrid` as the Home screen's sole vertical scroll container.
2. Keep top navigation, brand header, source warning, search, riwaya/letter filters, featured sections and the Reciters title.
3. Preserve TV remote behavior: focus rings, four-direction navigation, RTL inversion, and first-card focus when not searching.
4. Preserve provider filtering, cache behavior and source-error warning exactly as they are.
5. Verify on the TV emulator that scrolling, focus handoff between header and grid, and opening a reciter still work.

## Non-goals

- Changing how providers are fetched or when results are rendered (progressive per-source updates are a separate follow-up).
- Changing provider APIs, adapters, caching, settings or the deep-link code.
- Upgrading `react-tv-space-navigation` (no newer version exists).
- Relaxing RTL behavior or replacing the TV library with a generic RN virtualized list.

## Anti-goals

- A nested vertical scroll view inside another vertical scroll view (would produce competing scroll contexts).
- Rendering all ~849 cards in a hidden container just to measure the header.
- Losing default focus when entering Home from another screen.

## Constraints and decisions

- Library version `6.0.0-beta1`; use its exported `SpatialNavigationVirtualizedGrid` with `numberOfColumns`, `itemHeight`, `rowContainerStyle`, `additionalRenderedRows`, `header`, `headerSize`, and a `SpatialNavigationVirtualizedGridRef`.
- Grid supports vertical scrolling only; horizontal featured rows remain horizontal `SpatialNavigationScrollView`s inside the header.
- `headerSize` must be a number. Decision: extract header content into a `HomeHeader` component that reports its measured height via `onLayout`; store that height in state and pass it as `headerSize`. Render the grid only once a height is available; before that, render the header normally so measurement can occur. This is a one-frame pass, not duplicate card rendering.
- Keep `SectionTopNav`, `BrandHeader` and `sourceWarning` **outside** the virtualized grid as fixed elements above it, so the header contains only content that belongs to the scrolling list (search, filters, featured sections, Reciters title). This keeps the measured header smaller and avoids re-measuring on language/source changes.
- Data passed to the grid is the existing memoized `filteredReciters`; `renderItem` remains `ReciterCard` with the same props.
- RTL: `rowContainerStyle` uses `flexDirection: isRTL ? 'row-reverse' : 'row'`; the app already maps DPAD left/right inversely in `app-navigator.tsx`.
- Default focus: call `gridRef.current?.focus(0)` after the grid mounts/data is ready when `searchFocused` is false, replacing `preferredFirstFocus` on the first card.
- When `filteredReciters.length === 0`, render the existing `EmptyState` below the header instead of the grid (no behavior change).

## Approaches considered

1. **Swap only `SectionRecitersGrid`** for a virtualized grid inside the existing outer `SpatialNavigationScrollView`. Small diff, but leaves two vertical scroll contexts and only partially solves the render cost. Rejected.
2. **Single virtualized grid as the whole Home list, with header (chosen).** One vertical scroller, true row virtualization, featured sections preserved. Larger diff and requires careful header measurement/focus verification.
3. **Keep current layout and cap the catalog shown.** Avoids TV-component risk but does not scale and changes what users can browse. Rejected.

## What is left to the builder

- Exact extraction boundaries for `HomeHeader` and the measurement state are the builder's call, but `headerSize` must come from `onLayout`, not a hard-coded constant.
- Test mock shape for `SpatialNavigationVirtualizedGrid` in Jest/Vitest (no rendering harness is installed; use a shallow mock that records props).
- Device verification steps must be recorded in the existing TV playback runbook or a short new audit note.

## Success criteria

- `yarn test`, `yarn type-check`, `yarn lint` pass.
- On the emulator, Home shows header sections, then the virtualized grid; DPAD down from the header enters the grid, DPAD right/left moves across a row, and DPAD down scrolls to later rows.
- Opening a reciter from a virtualized row still plays audio.
- RTL layout and source warning remain correct.
