# Home Virtualized Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Home's all-at-once reciter grid with the TV library's virtualized grid, keeping header sections, RTL behavior and remote focus intact.

**Architecture:** Extract the scrolling Home content into a measured `HomeHeader`, then make `SpatialNavigationVirtualizedGrid` the single vertical scroller for reciters. Pure helpers decide focus/clamping (no rendering harness is installed); device verification covers scroll and focus behavior that unit tests cannot see.

**Tech Stack:** Expo 54 / React Native 0.81, `react-tv-space-navigation@6.0.0-beta1`, TypeScript strict, Vitest 4 (node environment).

**Spec:** `docs/superpowers/specs/2026-11-23-home-virtual-grid-design.md`

## Global Constraints

- Library version `6.0.0-beta1`; it is npm-latest, so no upgrade and no new dependencies.
- Use the library's exported `SpatialNavigationVirtualizedGrid`; `SpatialNavigationScrollView` does not virtualize.
- Grid virtualizes rows only, vertical scrolling only; navigate in any direction via the library.
- `header` plus numeric `headerSize` are required; header height is reactive via `onLayout`.
- If `headerSize` changes require a remount, use a `key` derived from height and restore focus to the previous valid index.
- `SectionTopNav`, `BrandHeader` and `sourceWarning` stay outside the grid as fixed elements.
- Search/filters/featured sections/Reciters title move into `HomeHeader`.
- Focus: never steal from search while focused; on search-exit or initial entry, focus index 0; on data shrink, clamp to the last valid index.
- RTL: `rowContainerStyle` uses `flexDirection: isRTL ? 'row-reverse' : 'row'`.
- No changes to provider fetching, caching, settings, adapters or deep links.
- No real credentials in files or tests.

## Review Focus

- **Header height changes** when a featured section appears/disappears or language changes — grid must relayout, not keep a stale visible-row calculation. Test: `normalizeHeaderHeight` in Task 2 + device check in Task 4.
- **Search focus** must not be stolen while typing, and must return to the first card on exit. Test: pure focus helper in Task 1.
- **Filter/data shrink** must not leave focus pointing at a removed row. Test: pure clamp helper in Task 1.
- **Nested horizontal scroll** in featured rows inside a virtualized vertical grid must not break scrolling or focus. Test: device check in Task 4.
- **RTL row direction and cross-row navigation** must still work with the grid's `rowContainerStyle`. Test: device check in Task 4.

---

### Task 1: Pure focus helpers

**Files:**
- Create: `src/utils/home-grid-focus.ts`
- Create: `src/utils/home-grid-focus.test.ts`

**Interfaces:**
- Produces: `clampGridIndex(index: number, length: number): number`
- Produces: `resolveGridFocus(input: GridFocusInput): GridFocusDecision`

`GridFocusInput` = `{ searchFocused: boolean; justLeftSearch: boolean; dataReady: boolean; itemCount: number; currentIndex: number }`.
`GridFocusDecision` = `{ focusIndex: number | null }`.

- [ ] **Step 1: Write the failing helper tests**

`home-grid-focus.test.ts` must assert:
- `clampGridIndex(7, 3) === 2`, `clampGridIndex(-1, 3) === 0`, `clampGridIndex(0, 0) === 0`.
- `searchFocused: true` → `{ focusIndex: null }`.
- `justLeftSearch: true`, `dataReady: true`, `itemCount > 0` → `{ focusIndex: 0 }`.
- `dataReady: false` → `{ focusIndex: null }`.
- `itemCount === 0` → `{ focusIndex: null }`.
- data shrink case: `currentIndex: 9`, `itemCount: 4`, no search transition → `{ focusIndex: 3 }`.
- stable data case: `currentIndex: 6`, `itemCount: 40`, no search transition → `{ focusIndex: 6 }` (used for remount focus restoration).

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/utils/home-grid-focus.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the pure helpers**

Write the two functions with exact signatures. No React, navigation or Expo imports.

- [ ] **Step 4: Run tests and type check**

Run: `yarn test src/utils/home-grid-focus.test.ts`
Run: `yarn type-check`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: add pure Home grid focus helpers`

---

### Task 2: Extract measured Home header

**Files:**
- Create: `src/components/home-header.tsx`
- Create: `src/utils/home-header.ts`
- Create: `src/utils/home-header.test.ts`
- Modify: `src/screens/home-screen.tsx`

**Interfaces:**
- Produces: `normalizeHeaderHeight(height: number): number`
- Produces: `HomeHeader` component props: all current search/filter/featured props plus `onHeight: (height: number) => void`
- Consumes: none from Task 1

- [ ] **Step 1: Write the failing height test**

`home-header.test.ts` must assert: `normalizeHeaderHeight(0) === 0`, `normalizeHeaderHeight(-5) === 0`, `normalizeHeaderHeight(312.5) === 312.5`, and `Number.isFinite(normalizeHeaderHeight(NaN))` is true with result `0`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/utils/home-header.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Extract the header**

Add `normalizeHeaderHeight`. Create `HomeHeader` containing the current `SearchInput`, `SectionFilters`, `SectionLetterFilter`, the four `SectionFeatured` blocks and the Reciters title/empty state. It calls `onHeight(normalizeHeaderHeight(event.nativeEvent.layout.height))` from its root `View` `onLayout`. In `HomeScreen`, keep `SectionTopNav`, `BrandHeader` and `sourceWarning` outside; replace the existing inline search/filters/featured/title block with one `<HomeHeader ... onHeight={setHeaderHeight} />` inside the current scroll view, and add state `headerHeight: number | null`. Do not render the header twice and do not swap the grid in this task.

- [ ] **Step 4: Run tests, type check and lint**

Run: `yarn test src/utils/home-header.test.ts`
Run: `yarn type-check`
Run: `yarn lint`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `refactor: extract measured Home header`

---

### Task 3: Swap in the virtualized grid

**Files:**
- Modify: `src/screens/home-screen.tsx`
- Create: `src/utils/home-grid-key.ts`
- Create: `src/utils/home-grid-key.test.ts`
- Delete: `src/components/section-reciters-grid.tsx`

**Interfaces:**
- Consumes: `clampGridIndex`, `resolveGridFocus` from Task 1; `HomeHeader`, `headerHeight` from Task 2
- Produces: no new public interface

- [ ] **Step 1: Write the failing key test**

`home-grid-key.test.ts` must assert `buildHomeGridKey(312, true, 3) === 'grid:312:rtl:3'`, `buildHomeGridKey(312, false, 3) === 'grid:312:ltr:3'`, and that changing only the height changes the key.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/utils/home-grid-key.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the grid**

Add `buildHomeGridKey(headerHeight: number, isRTL: boolean, cardsPerRow: number): string` with the exact format above. In `HomeScreen`: remove the outer `SpatialNavigationScrollView` around the list. If `headerHeight === null`, render `HomeHeader` alone in a measuring `View` so `onHeight` can fire, then render the grid. Grid props: `key={buildHomeGridKey(headerHeight, isRTL, cardsPerRow)}`, `data={filteredReciters}`, `renderItem` producing `ReciterCard` with the same props minus `preferredFocus`, `numberOfColumns={cardsPerRow}`, `itemHeight={itemHeight}`, `additionalRenderedRows={2}`, `header={<HomeHeader ... />}`, `headerSize={headerHeight}`, `rowContainerStyle={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}`, and a ref. Keep `SectionTopNav`, `BrandHeader`, `sourceWarning` above the grid. Store `lastFocusedIndexRef`; after a keyed remount restore it with `clampGridIndex(lastFocusedIndexRef.current, filteredReciters.length)`. Use `resolveGridFocus` for initial mount, the `searchFocused` false transition, and data shrink. Delete `src/components/section-reciters-grid.tsx`.

- [ ] **Step 4: Run full verification**

Run: `yarn test`
Run: `yarn type-check`
Run: `yarn lint`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: virtualize Home reciter grid`

---

### Task 4: Device verification and runbook

**Files:**
- Modify: `docs/runbooks/tv-playback-check.md` (or create `docs/runbooks/tv-home-grid-check.md` if cleaner)
- No product code changes unless a device finding requires a fix

**Interfaces:**
- Consumes: all earlier tasks

- [ ] **Step 1: Device matrix**

On `emulator-5554`, cold-start Home; verify: header sections visible, grid scrolls with DPAD down, DPAD left/right moves across a row, DPAD down reaches later rows, opening a reciter still plays audio, RTL layout remains inverted, and source warning still appears when a source fails. Record screenshot paths.

- [ ] **Step 2: Search/filter focus checks**

Verify search typing does not lose focus, leaving search focuses the first card, and narrowing by riwaya/letter does not strand focus. Record results.

- [ ] **Step 3: Document and final checks**

Add the Home-grid checks to the runbook. Run `yarn test`, `yarn type-check`, `yarn lint` once more and record counts. Commit the runbook update (and any verified device fix separately).

---

## Self-Review Notes

- Spec coverage: header extraction + measurement (T2), grid swap + RTL + key/focus (T3), focus rules (T1/T3), device proof (T4), no provider/cache changes.
- Review Focus items pinned in T1, T2 and T4.
- Consistent names: `clampGridIndex`, `resolveGridFocus`, `normalizeHeaderHeight`, `buildHomeGridKey`, `HomeHeader`, `headerHeight`.
- No new test dependencies; pure helpers only; device checks cover what unit tests cannot see.
