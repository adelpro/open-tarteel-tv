# Adapter Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the React Native TV app the same five reciter providers as `adelpro/open-tarteel` develop, with TV-specific credential names, a generic lazy-playlist contract, full Riwaya coverage and adapter tests.

**Architecture:** Keep the TV app's abortable fetch layer, AsyncStorage caches and on-disk audio cache. Add a config module that reads `EXPO_PUBLIC_OTTV_*` env values, port the web adapters' data mapping into RN-safe modules, and route all lazy playlists through one dispatcher so no provider is special-cased in `use-player.ts`.

**Tech Stack:** Expo 54 / React Native 0.81, TypeScript strict, Yarn 4, Vitest 4, AsyncStorage, expo-file-system.

**Spec:** `docs/superpowers/specs/2026-11-21-adapter-parity-design.md`

## Global Constraints

- Expo exposes only `EXPO_PUBLIC_*` variables at runtime; all new variables use the `OTTV_` prefix. Never reuse `QURAN_FOUNDATION_CLIENT_ID`, `QURAN_FOUNDATION_CLIENT_SECRET`, `ITQAN_API_KEY`, `MP3QURAN_V4_BASE_URL` or `NEXT_PUBLIC_*` names.
- Owner credentials live in the gitignored `.env.local`; `.env.example` holds placeholders only. Never commit real values or use them in tests.
- All env values are bundled into the app and extractable; this risk was accepted by the owner.
- React Native has no Node `Buffer`; use the new base64 helper for OAuth Basic auth.
- `Moshaf.id` and `surah_total` stay numeric; Qurani.ai edition identifiers go in `moshaf.recitationCode`.
- `LinkSource` and `Riwaya` keep TV short-slug values; 13 Riwaya values, 5 LinkSource values.
- Keep TV's `retryFetch` (abort + jitter), AsyncStorage catalog/playlist caches and `expo-file-system` audio cache unchanged.
- Feature flag `EXPO_PUBLIC_OTTV_ENABLE_MP3QURAN_V4` defaults to `false`; a disabled source is neither registered nor shown.
- No write API calls, no production data changes.

## Review Focus

- **Credentials present vs absent:** QF must use OAuth when both credentials exist and the public `api.quran.com` fallback otherwise; Itqan must send `X-API-Key` only when its env value exists. Pinned in Task 6 (QF) and Task 4 (Itqan).
- **Malformed provider payloads:** missing `riwayah`, `reciter`, `audio_url`, `data`/`results` arrays must skip the bad record, not throw or blank the whole source. Pinned in Tasks 5, 6, 7.
- **Abort and timeout:** an aborted request must not be retried and must not produce an unhandled rejection. Pinned in Task 4 via `retryFetch` mock assertions.
- **Failure vs empty catalog:** a failing source must produce `ReciterSourceResult.error` and a single UI warning, never look like "no reciters". Pinned in Task 8.
- **Old cached data and flag-off v4:** previously cached reciters with 4-value Riwaya slugs must still parse, and a flag-disabled v4 must have no settings toggle. Pinned in Tasks 2 and 8.

---

### Task 1: Provider config, source IDs and base64 helper

**Files:**
- Create: `src/config/providers.ts`
- Create: `src/utils/base64.ts`
- Create: `.env.example`
- Create: `src/config/providers.test.ts`
- Modify: `src/types/index.ts` (add the three `LinkSource` members)

**Interfaces:**
- Produces: `getItqanConfig(): { baseUrl: string; apiKey?: string }`
- Produces: `getQuranAiConfig(): { baseUrl: string }`
- Produces: `getQfConfig(): { clientId?: string; clientSecret?: string; tokenUrl: string; apiBase: string; publicApiBase: string; rateLimitMs: number }`
- Produces: `getMp3QuranV4Config(): { enabled: boolean; baseUrl: string }`
- Produces: `ACTIVE_SOURCES: readonly LinkSource[]`
- Produces: `encodeBase64(input: string): string`
- Consumes: `LinkSource` from `src/types/index.ts`

- [ ] **Step 1: Write the failing config test**

`src/config/providers.test.ts` must assert, with `vi.stubEnv` + `vi.resetModules()` + dynamic `import()` so the module re-reads env:
- defaults: Itqan `https://api.cms.itqan.dev`, Qurani.ai `https://api.qurani.ai/gw/qh/v1`, QF token `https://oauth2.quran.foundation/oauth2/token`, QF api `https://apis.quran.foundation`, QF public `https://api.quran.com/api/v4`, rate limit `1100`, v4 disabled, v4 base `https://api-staging.mp3quran.net/v4`.
- `EXPO_PUBLIC_OTTV_ENABLE_MP3QURAN_V4='true'` makes `getMp3QuranV4Config().enabled === true`.
- `ACTIVE_SOURCES` contains `mp3quran`, `itqan`, `qurani`, `quran-foundation` and excludes `mp3quran-v4` by default; includes it when the flag is on.
- `encodeBase64('client:secret') === 'Y2xpZW50OnNlY3JldA=='`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/config/providers.test.ts`
Expected: FAIL — modules do not exist.

- [ ] **Step 3: Implement the modules**

`src/types/index.ts`: add `QURANAI = 'qurani'`, `QURAN_FOUNDATION = 'quran-foundation'`, `MP3QURAN_V4 = 'mp3quran-v4'` to `LinkSource`.

`src/config/providers.ts`: read each `EXPO_PUBLIC_OTTV_*` variable once at module load, apply the defaults above, and export the typed getters and `ACTIVE_SOURCES`.

`src/utils/base64.ts`: implement ASCII-safe base64 encoding for Basic auth without Node APIs.

`.env.example`: list every variable with placeholder values and a comment that values are bundled into the app binary.

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/config/providers.test.ts`
Expected: PASS.

- [ ] **Step 5: Check types and commit**

Run: `yarn type-check`
Expected: PASS.
Commit: `feat: add TV provider config and source IDs`

---

### Task 2: Riwaya expansion and name mapping

**Files:**
- Create: `src/utils/get-riwaya-from-mushaf.ts`
- Create: `src/utils/get-riwaya-from-mushaf.test.ts`
- Modify: `src/types/index.ts` (Riwaya enum)
- Modify: `src/services/reciters/mp3quran.helpers.ts`
- Modify: `src/locales/en.json`, `src/locales/ar.json`

**Interfaces:**
- Produces: `getRiwayaKeyFromMoshafName(name: string, lang: 'ar' | 'en'): Riwaya`
- Consumes: `Riwaya` from `src/types/index.ts`

- [ ] **Step 1: Write the failing mapping test**

Test cases: Arabic `ورش عن نافع` and English `Warsh A'n Nafi'` → `WARSH_AN_NAFI`; `Hafs an Aasim` → `HAFS_A_ASIM`; `AlDorai A'n Al-Kisa'ai` → the existing `ALDURI_AN_ALKAISSAI`; unknown name → `HAFS_A_ASIM`; a name containing `الدوري عن أبي عمرو` → the new `AL_DOORI_AN_ABU_AMR`. Include one assertion that all four pre-existing enum slugs are unchanged.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/utils/get-riwaya-from-mushaf.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement enum and helper**

Add these nine members to `Riwaya` (values are the TV slugs): `KHALAF_AN_HAMZAH='khalaf-an-hamzah'`, `AL_BAZZI_AN_IBN_KATHIR='al-bazzi-an-ibn-kathir'`, `AL_SOOSI_AN_ABU_AMR='al-soosi-an-abu-amr'`, `AL_DOORI_AN_ABU_AMR='al-doori-an-abu-amr'`, `SHUABA_AN_ASIM='shuaba-an-asim'`, `IBN_ZAKWAN='ibn-zakwan'`, `HISHAM='hisham'`, `IBN_JAMMAZ='ibn-jammaz'`, `YAQOUB='yaqoub'` (13 total including the four existing). The web enum's `AlDooriKisai` maps to the existing `ALDURI_AN_ALKAISSAI` — do not add a second Kisai member.

Port the ar/en phrase map from `adelpro/open-tarteel@develop:src/utils/get-riwaya-from-mushaf.ts`, replacing its return values with these TV enum members (with `AlDooriKisai` → `ALDURI_AN_ALKAISSAI`) and defaulting to `Riwaya.HAFS_A_ASIM`. Make `mp3quran.helpers.ts` re-export a one-argument wrapper that calls the new helper with `'ar'` so existing callers keep compiling. Add the nine matching `riwaya.*` keys to both locale files.

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/utils/get-riwaya-from-mushaf.test.ts`
Expected: PASS.

- [ ] **Step 5: Check types and commit**

Run: `yarn type-check`
Expected: PASS.
Commit: `feat: expand riwaya coverage and localized name mapping`

---

### Task 3: Riwaya UI maps and 13 filter chips

**Files:**
- Modify: `src/components/riwaya-tag.tsx`
- Modify: `src/components/reciter-card.tsx`
- Modify: `src/components/section-filters.tsx`
- Create: `src/components/section-filters.test.ts`

**Interfaces:**
- Produces: `RIWAYA_FILTER_VALUES: readonly Riwaya[]` exported from `section-filters.tsx`
- Consumes: `Riwaya` from Task 2

- [ ] **Step 1: Write the failing test**

`src/components/section-filters.test.ts` asserts `RIWAYA_FILTER_VALUES.length === 13` and that `Object.values(Riwaya)` is fully contained in it (no React rendering required).

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/components/section-filters.test.ts`
Expected: FAIL — export does not exist.

- [ ] **Step 3: Update the three maps**

Add entries for all 13 Riwaya values to `RIWAYA_TAG` (reuse existing colours for the original four, assign distinct Material colours to the nine new ones) and `RIWAYA_LABEL` in `reciter-card.tsx`. Replace the four hardcoded chips in `section-filters.tsx` with a horizontally scrollable row generated from `RIWAYA_FILTER_VALUES`, preserving the existing `selectedRiwaya: Riwaya | 'all'` prop signature.

- [ ] **Step 4: Run the test and type check**

Run: `yarn test src/components/section-filters.test.ts` — expect PASS.
Run: `yarn type-check` — expect PASS (this is what proves both `Record<Riwaya, …>` maps are exhaustive).

- [ ] **Step 5: Commit**

Commit: `feat: show all riwayas in tags and filters`

---

### Task 4: Adapter contract, Itqan env wiring and generic playlist loader

**Files:**
- Modify: `src/services/reciters/reciter-source.ts`
- Modify: `src/services/api.ts`
- Modify: `src/services/reciters/itqan.adapter.ts`
- Modify: `src/hooks/use-player.ts`
- Create: `src/services/reciters/itqan.adapter.test.ts`
- Create: `src/services/api.test.ts`

**Interfaces:**
- Produces: `ReciterSource.getPlaylist?(reciter: Reciter, lang: 'ar' | 'en', signal?: AbortSignal): Promise<Playlist>`
- Produces: `getReciterPlaylist(source: LinkSource, reciter: Reciter, lang: 'ar' | 'en', signal?: AbortSignal): Promise<Playlist | null>`
- Produces: `ReciterSourceResult.error?: string`
- Consumes: `getItqanConfig()` from Task 1, `getCachedItqanPlaylist` / `setCachedItqanPlaylist`

- [ ] **Step 1: Write failing tests**

`itqan.adapter.test.ts`: mock `retryFetch`; assert request headers contain `Accept-Language: ar`, `X-Client-Name: open-tarteel-tv`, `X-Client-Version: 2.0.1`, and `X-API-Key` only when the config supplies one; assert `getPlaylist(reciter, 'ar')` uses `reciter.id` as the AsyncStorage cache key; assert a malformed recitation is skipped and an aborted request is not retried.

`api.test.ts`: register two fake sources, one throwing; assert `fetchRecitersBySource` returns the failing source with `error` set and the other with reciters intact; assert `getReciterPlaylist` returns the adapter's playlist and `null` for a source without `getPlaylist`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/services/api.test.ts src/services/reciters/itqan.adapter.test.ts`
Expected: FAIL — signatures/exports missing.

- [ ] **Step 3: Implement the contract changes**

Extend `ReciterSource` with optional `getPlaylist`. In `api.ts`, add `error?: string` to `ReciterSourceResult`, record thrown messages in `doFetchRecitersBySource`, and add `getReciterPlaylist`. Move Itqan playlist fetching into `ItqanAdapter.getPlaylist`, keeping its AsyncStorage cache and malformed-record guard; build its base URL and optional `X-API-Key` from `getItqanConfig()` while keeping the client-name/version header constants from `app-info.ts`. Refactor `use-player.ts` to call `getReciterPlaylist` instead of importing `getItqanPlaylist`.

- [ ] **Step 4: Run tests and type check**

Run: `yarn test src/services/api.test.ts src/services/reciters/itqan.adapter.test.ts` — expect PASS.
Run: `yarn type-check` — expect PASS.

- [ ] **Step 5: Commit**

Commit: `feat: generic playlist loader and configurable Itqan client`

---

### Task 5: Qurani.ai adapter

**Files:**
- Create: `src/services/reciters/quranai.adapter.ts`
- Create: `src/services/reciters/quranai.helpers.ts`
- Create: `src/services/reciters/quranai.types.ts`
- Create: `src/services/reciters/quranai-bases.json`
- Create: `src/services/reciters/quranai.adapter.test.ts`
- Modify: `src/services/api.ts` (register adapter when active)

**Interfaces:**
- Produces: `QuranAiAdapter: ReciterSource` (with `getPlaylist`)
- Consumes: `getQuranAiConfig()` from Task 1, `retryFetch`, `getRiwayaKeyFromMoshafName` from Task 2

- [ ] **Step 1: Write the failing adapter test**

Mock `retryFetch` with: an editions response containing one `type: 'surah'` edition and one `type: 'ayah'` edition; a probe surah response with a full-surah audio URL; then assert only the surah edition becomes a reciter, `moshaf.recitationCode` equals the edition identifier, `moshaf.id` is a positive integer derived from a stable hash of that identifier, `getPlaylist` returns 114 items with URLs built from the probed base, and an edition with no audio is skipped. Add a case where the editions payload has no `data` array and expect an empty list.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/services/reciters/quranai.adapter.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the adapter**

Copy `quranai-bases.json` verbatim from `adelpro/open-tarteel@develop:src/services/reciters/quranai-bases.json`. Port the web helper's endpoint builders and narrator→riwaya map (no `next` fetch options). Port the adapter's de-duplication, concurrency-3 edition probing, base-map lookup and playlist generation, omitting ayah-range/timing functions. Derive `moshaf.id` from a stable 32-bit hash of the edition identifier (e.g. FNV-1a, forced positive) and keep the identifier in `recitationCode`. Use `getQuranAiConfig().baseUrl` instead of the hardcoded web URL. Register `QuranAiAdapter` in `RECITER_SOURCES`.

- [ ] **Step 4: Run test, lint and type check**

Run: `yarn test src/services/reciters/quranai.adapter.test.ts`
Run: `yarn lint`
Run: `yarn type-check`
Expected: all PASS.

- [ ] **Step 5: Commit**

Commit: `feat: add Qurani.ai reciter adapter`

---

### Task 6: Quran Foundation client and adapter

**Files:**
- Create: `src/services/reciters/quran-foundation.client.ts`
- Create: `src/services/reciters/quranfoundation.adapter.ts`
- Create: `src/services/reciters/quranfoundation.types.ts`
- Create: `src/services/reciters/quran-foundation.client.test.ts`
- Create: `src/services/reciters/quranfoundation.adapter.test.ts`
- Modify: `src/services/api.ts` (register adapter)
- Modify: `src/context/settings.context.tsx` (wire cache reset)

**Interfaces:**
- Produces: `qfFetch(path: string, options?: RequestInit): Promise<Response>`
- Produces: `getAccessToken(forceRefresh?: boolean): Promise<string>`
- Produces: `resetQuranFoundationClientCache(): void`
- Produces: `QuranFoundationAdapter: ReciterSource` (with `getPlaylist`)
- Produces: `resetQuranFoundationCache(): void`
- Consumes: `getQfConfig()` from Task 1, `encodeBase64()` from Task 1, `retryFetch`

- [ ] **Step 1: Write the failing client test**

`quran-foundation.client.test.ts` must assert: with no credentials the request goes to `https://api.quran.com/api/v4/...` with no auth headers; with credentials the Basic header is built by `encodeBase64`, the token is cached across two calls, a 401 forces one token refresh and one retry, and `resetQuranFoundationClientCache()` clears the token. Never use real credential values — use test placeholders.

- [ ] **Step 2: Write the failing adapter test**

`quranfoundation.adapter.test.ts`: mock `qfFetch`; assert reciter mapping uses `translated_name.name` with `name` fallback, riwaya comes from `qirat.name`, playlist is sorted by `chapter_id`, a reciter with no name is skipped, and `resetQuranFoundationCache()` empties the 55-minute results cache.

- [ ] **Step 3: Run tests to verify they fail**

Run: `yarn test src/services/reciters/quran-foundation.client.test.ts src/services/reciters/quranfoundation.adapter.test.ts`
Expected: FAIL — modules do not exist.

- [ ] **Step 4: Implement client and adapter**

Port the web OAuth flow: token fetch with Basic header via `encodeBase64`, cache with a 60-second expiry margin, `x-auth-token` + `x-client-id` headers, one 401 refresh, configurable pacing, three attempts. Keep the public fallback path by stripping `/content/api/v4` from the path. Port the adapter's 55-minute per-language results cache, serialized queue, reciter mapping and lazy playlist; use the API's numeric `reciter.id` as `moshaf.id`. Register the adapter and wire `resetQuranFoundationCache()` into `clearCaches()`.

- [ ] **Step 5: Run tests and type check**

Run: `yarn test src/services/reciters/quran-foundation.client.test.ts src/services/reciters/quranfoundation.adapter.test.ts`
Run: `yarn type-check`
Expected: all PASS.

- [ ] **Step 6: Commit**

Commit: `feat: add Quran Foundation adapter with TV credentials`

---

### Task 7: MP3Quran v4 adapter behind a flag

**Files:**
- Create: `src/services/reciters/mp3quran-v4.adapter.ts`
- Create: `src/services/reciters/mp3quran-v4.types.ts`
- Create: `src/services/reciters/mp3quran-v4.adapter.test.ts`
- Modify: `src/services/api.ts` (conditional registration)

**Interfaces:**
- Produces: `Mp3QuranV4Adapter: ReciterSource` (with `getPlaylist`)
- Consumes: `getMp3QuranV4Config()` from Task 1, `retryFetch`, `Riwaya` from Task 2

- [ ] **Step 1: Write the failing adapter test**

Mock `retryFetch`: assert `getReciters()` returns `[]` when the flag is off; with the flag on, follow `links.next` to fetch all pages, map the 15 riwaya codes (including `qunbul_an_ibn_kathir` → `AL_BAZZI_AN_IBN_KATHIR`), put `coverage.surahs.join(',')` in `moshaf.surahIds`, and build a playlist from those IDs using `moshaf.server`. Assert a non-array `data` payload throws.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/services/reciters/mp3quran-v4.adapter.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement and register conditionally**

Port the web adapter's pagination, riwaya-code map and playlist generation using `getMp3QuranV4Config()`; use the API's numeric `recitation.id` as `moshaf.id`. In `api.ts`, include the adapter in `RECITER_SOURCES` only when `getMp3QuranV4Config().enabled` is true.

- [ ] **Step 4: Run test and type check**

Run: `yarn test src/services/reciters/mp3quran-v4.adapter.test.ts`
Run: `yarn type-check`
Expected: all PASS.

- [ ] **Step 5: Commit**

Commit: `feat: add feature-flagged MP3Quran v4 adapter`

---

### Task 8: Source UI, error reporting and final verification

**Files:**
- Modify: `src/components/source-tag.tsx`
- Modify: `src/context/settings.context.tsx`
- Modify: `src/screens/home-screen.tsx`
- Modify: `src/locales/en.json`, `src/locales/ar.json`
- Create: `src/services/source-errors.test.ts`

**Interfaces:**
- Consumes: `ACTIVE_SOURCES` from Task 1, `ReciterSourceResult.error` from Task 4, `fetchRecitersBySource` from `api.ts`
- Produces: `getSourceErrorCount(results: ReciterSourceResult[]): number` exported from `src/services/api.ts`

- [ ] **Step 1: Write the failing test**

`src/services/source-errors.test.ts`: one result with `error` and one without → count `1`; all clean → `0`; a source with zero reciters and no error → `0`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/services/source-errors.test.ts`
Expected: FAIL — export does not exist.

- [ ] **Step 3: Implement UI wiring**

Add `getSourceErrorCount`. Add `Record<LinkSource, …>` tag entries and settings defaults for the three new sources; make the settings screen iterate `ACTIVE_SOURCES` so v4 has no toggle when disabled. In `home-screen.tsx`, derive the count from the existing `fetchRecitersBySource` result and render one `t('sources_unavailable')` line when positive. Add that key to both locales.

- [ ] **Step 4: Run the full verification suite**

Run: `yarn test`
Run: `yarn test:coverage`
Run: `yarn lint`
Run: `yarn type-check`
Expected: all PASS with no skipped adapter tests.

- [ ] **Step 5: Smoke-test live endpoints without writing anything**

Run read-only requests to the Itqan, Qurani.ai and Quran Foundation endpoints using the configured defaults; expect HTTP 200 and JSON with the documented top-level arrays. Do not log credential values.

- [ ] **Step 6: Commit**

Commit: `feat: register new sources and report source failures`

---

## Self-Review Notes

- Every spec section has an owning task: env config (1), Riwaya + i18n (2, 3), contract + Itqan (4), three adapters (5, 6, 7), UI/error/tests (8).
- Review Focus items are pinned in Tasks 2, 4, 5, 6, 7 and 8.
- Signatures are consistent across tasks: `getPlaylist(reciter, lang, signal)`, `getReciterPlaylist(source, reciter, lang, signal)`, `ReciterSourceResult.error`, `ACTIVE_SOURCES`, `resetQuranFoundationCache`.
