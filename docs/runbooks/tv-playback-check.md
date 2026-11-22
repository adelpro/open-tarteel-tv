# TV playback verification runbook

Purpose: reproduce the per-source playback proof for the playback-reliability
work and verify the deep-link entry point on the Android TV emulator. Every code
change in this work is also covered by `yarn test` / `yarn type-check` /
`yarn lint`; this runbook is the on-device half of that proof.

Scope: five reciter sources — mp3quran, Itqan, QF (Quran Foundation), Qurani.ai,
and mp3quran v4 — plus one deep-link check. The app under test is the Android TV
build of `kg.us.quran.tarteel.twa` running against a local Metro server.

All commands below are copy-pasteable from PowerShell. Where a command is
platform-specific it is labelled. Replace every `<PLACEHOLDER>` before use;
never commit real credentials.

---

## 0. Metro failure mode — read this first

A stale Metro bundle can leave the app on a blank screen, or make the bundle
download fail with a **chunk / CRLF error** (the downloaded JS is corrupted).
This is a dev-server artifact, **not** a product regression.

**Do not just tap Reload** — Reload re-requests the same corrupt bundle. Instead,
restart Metro with a cleared cache and cold-launch the app:

```powershell
# 1. Stop the running Metro/Expo dev server (Ctrl+C in its terminal), then start fresh:
yarn start --reset-cache

# 2. Wait for `http://localhost:8081/status` to return `packager-status:running`,
#    then force-stop and cold-launch the app:
adb shell am force-stop kg.us.quran.tarteel.twa
adb shell monkey -p kg.us.quran.tarteel.twa -c android.intent.category.LAUNCHER 1
```

Verify Metro is healthy from PowerShell:

```powershell
(Invoke-WebRequest http://localhost:8081/status).Content
# expected: packager-status:running
```

Only proceed to the steps below once Metro reports healthy and the app has been
cold-launched after the restart.

---

## 1. Prerequisites

- Android TV emulator (e.g. `Television_720p`) booted:
  `adb shell getprop sys.boot_completed` → `1`.
- App installed: `adb shell pm list packages kg.us.quran.tarteel.twa`.
- Metro healthy (step 0).
- Environment in the gitignored `.env.local` (placeholders only — never commit
  real values):

```dotenv
# .env.local (gitignored)
EXPO_PUBLIC_OTTV_ITQAN_API_KEY=<YOUR_ITQAN_API_KEY>
EXPO_PUBLIC_OTTV_QF_CLIENT_ID=<YOUR_QF_CLIENT_ID>
EXPO_PUBLIC_OTTV_QF_CLIENT_SECRET=<YOUR_QF_CLIENT_SECRET>
EXPO_PUBLIC_OTTV_ENABLE_MP3QURAN_V4=true
```

Notes:
- QF credentials are external and currently return 401 `invalid_client`. The
  app falls back to the public `api.quran.com` path, so QF still works without
  valid credentials — a 401 is expected and must **not** be logged as a source
  failure.
- `EXPO_PUBLIC_*` values are build-time constants. Enabling the v4 flag requires
  a rebuild/restart of Metro and a cold launch; editing `.env.local` alone while
  the bundle is running has no effect.
- The settings migration re-enables Qurani.ai once on first upgraded load
  (`@open_tarteel_settings_version` → 2). If Qurani.ai is still off on a device
  with old persisted settings, clear the app data and cold-launch again.

---

## 2. Cold start and catalog counts

1. Force-stop and cold-launch (from step 0), then wait for the catalog cards to
   finish loading.
2. Confirm no "Some sources are temporarily unavailable" warning is shown once
   loading completes.
3. Confirm the reciter count for each source below. Counts are from the catalog
   fetch log / in-app source cards.

| Source | Expected reciters | Notes |
| --- | --- | --- |
| mp3quran | **299** | Baseline source. |
| Itqan (itqan) | **~75** | Was ~75 at time of writing; small drift is acceptable. |
| QF (quran-foundation) | **14** | Public fallback (`api.quran.com`) — 401 credentials are expected. |
| Qurani.ai (qurani) | **present (count not pinned)** | Only after the one-time settings migration re-enables it. |
| mp3quran v4 (mp3quran-v4) | **present (count not pinned)** | Only after `EXPO_PUBLIC_OTTV_ENABLE_MP3QURAN_V4=true` is in the running build; no toggle appears otherwise. |

Baseline total for mp3quran + Itqan + QF is **388**; the total rises once Qurani
and v4 are enabled. Absence of Qurani or v4 with the prerequisites above met is
a failure; absence of QF *cards* (source warning) is a failure, but a QF 401 in
the log is not.

Capture a screenshot of the loaded catalog (e.g. `evidence/screen-catalog-final.png`).

---

## 3. Per-source playback steps

Repeat for each of the five sources. The goal is to prove **autoplay starts on
entry** and that **displayed progress advances for at least five seconds**.

1. From the home/catalog screen, focus a reciter card belonging to the source.
   A technique proven on the TV emulator: with the app foregrounded and the
   catalog loaded, press `KEYCODE_DPAD_DOWN` six times (~350 ms apart) to land on
   a "Recently Played" mp3quran card, then `KEYCODE_DPAD_CENTER` to open it:

   ```powershell
   1..6 | ForEach-Object { adb shell input keyevent KEYCODE_DPAD_DOWN; Start-Sleep -Milliseconds 350 }
   adb shell input keyevent KEYCODE_DPAD_CENTER
   ```

   The exact number of DOWN presses depends on the focus layout; use whichever
   DPAD path reaches a card for the target source, and confirm visually.
   Touch/`input tap` is ignored by this TV UI.

2. The Player should open and **autoplay without a second press**. Confirm the
   status label reads "Now Playing" (not the pre-play "Selected Surah" label)
   and the **pause** icon is visible. If the selected surah is absent from a
   partial playlist, the first available surah is played instead — that is
   expected, not a failure.

3. Record the source, reciter name and surah, then capture two screenshots at
   least five seconds apart. Verify the displayed time advanced ≥5 s between
   them while the pause icon stayed visible:

   ```powershell
   # PowerShell redirection corrupts PNG bytes — use cmd.exe for screencap:
   cmd.exe /c "adb exec-out screencap -p > evidence\<source>-t1.png"
   Start-Sleep -Seconds 6
   cmd.exe /c "adb exec-out screencap -p > evidence\<source>-t2.png"
   ```

   Replace `<source>` with `mp3quran`, `itqan`, `qf`, `qurani`, or `v4`.

4. Press back to the catalog and confirm the "sources unavailable" warning is
   still absent.

### Source-specific expectations

| Source | What to expect |
| --- | --- |
| mp3quran | Autoplay chains from Al-Faatiha to the next surah; long surahs (e.g. Al-Baqarah, ~93:05) show steady progress. |
| Itqan | Playlist resolves lazily; autoplay must wait for it, then start. Do not treat a brief loading state as a failure. |
| QF | Playlist comes from the public fallback after the 401. Any token/401 message in the log is expected; the player must still play. |
| Qurani.ai | Present only after the settings migration; plays like any other source. |
| v4 | Toggle/source appears only in a build with the flag enabled; confirm it plays one surah. |

If a source's playlist fails (error/retry state, or no autoplay after loading),
capture the exact log line:

```powershell
adb logcat -d | Select-String -Pattern "itqan|quran-foundation|qurani|mp3quran" | Select-Object -Last 100
```

Attach the log to the task report; a real adapter defect is fixed in that
adapter only, never by weakening the shared `getReciterPlaylist` contract.

---

## 4. Deep-link check

The **registered** scheme is `opentarteeltv` (`app.json:8`). The older
`opentarteel://` prefix is still understood in JS but is **not** OS-registered
by the current APK, so on-device checks must use `opentarteeltv://`.

Format: `opentarteeltv://player/<reciterId>/<surahId>`

- `<reciterId>` is the **string** id produced by the adapters, e.g.
  `mp3quran-21193-10913` (not a number). Copy a real id from the catalog/log;
  do not invent one.
- `<surahId>` is numeric, e.g. `2` for Al-Baqarah.

Send it with:

```powershell
adb shell am start -a android.intent.action.VIEW `
  -d 'opentarteeltv://player/<RECITER_ID>/<SURAH_ID>' `
  -p kg.us.quran.tarteel.twa
```

Example using an id in the adapter's format (replace with a real id from your catalog):

```powershell
adb shell am start -a android.intent.action.VIEW `
  -d 'opentarteeltv://player/mp3quran-21193-10913/2' `
  -p kg.us.quran.tarteel.twa
```

Pass criteria: the reciter resolves (no crash / no "reciter not found"), the
explicit surah is selected rather than surah 1, and audio starts with advancing
progress. Capture a screenshot as `evidence/deep-link.png`.

If the URL is delivered but nothing happens, confirm the scheme with
`adb shell dumpsys package kg.us.quran.tarteel.twa` and check that the JS
linking prefixes include `opentarteeltv://` (see `src/navigation/deep-link.ts`).

---

## 5. Pass checklist

- [ ] Metro healthy; app cold-launched after any bundle/CRLF problem (no Reload-only retry).
- [ ] Catalog counts match section 2; no source-unavailable warning.
- [ ] mp3quran: autoplay + ≥5 s progress + screenshot.
- [ ] Itqan: autoplay + ≥5 s progress + screenshot.
- [ ] QF: autoplay via public fallback + ≥5 s progress + screenshot (401 is expected).
- [ ] Qurani.ai: present + autoplay + ≥5 s progress + screenshot.
- [ ] v4: present in flag-enabled build + autoplay + ≥5 s progress + screenshot.
- [ ] Deep link `opentarteeltv://player/<reciterId>/<surahId>` resolves and autoplays the requested surah.
- [ ] `yarn test`, `yarn type-check`, `yarn lint` all pass (full suite: 17 files / 115 tests at task base).

Record results, the exact source/surah/durations and screenshot paths in the
task report. Report any unmet item as NOT VERIFIED with the exact reason rather
than inferring success from unit tests.
