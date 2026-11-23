# TV Home virtualized-grid verification runbook

Purpose: on-device proof for the Home virtualized-grid work (`SpatialNavigationVirtualizedGrid`
with a measured `HomeHeader`, pure focus helpers, header-inclusive row translation and RTL
row styling). Unit tests cover the pure helpers; this runbook covers what only the TV
emulator can show: focus movement, scrolling, playback and RTL inversion.

Scope: cold-start Home on `emulator-5554`, run the device matrix, then the search/filter
focus checks. This is complementary to `tv-playback-check.md` (per-source playback and
deep links); do not change provider fetching, caching, settings, adapters or deep links
as part of these checks.

All commands are copy-pasteable from PowerShell. No credentials are needed. Never commit
real credentials or device-specific state.

---

## 0. Read this first — two easy ways to get a false result

### 0.1 Metro must serve the worktree, not the main checkout

This work lives in a git worktree. A dev client gets its JavaScript from whichever
directory the running Metro process was started in. If Metro was started from
`D:\open-tarteel-tv` (main checkout, branch `feat/home-virtual-grid`) the bundle will be
the **pre-grid** code and every check below will pass against the wrong build.

Confirm the serving root and that the bundle contains the grid symbols:

```powershell
Get-CimInstance Win32_Process |
  Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'expo' } |
  Select-Object ProcessId, CommandLine | Format-List
# The expo CLI command line MUST contain \.worktrees\home-virtual-grid\.

$b = (Invoke-WebRequest 'http://localhost:8081/index.bundle?platform=android&dev=true&minify=false' -UseBasicParsing).Content
$b.Contains('clampGridIndex')   # expect True
$b.Contains('buildHomeGridKey') # expect True
$b.Contains('SpatialNavigationVirtualizedGrid') # expect True
```

If Metro serves the wrong root, stop that process tree and restart it from the worktree:

```powershell
# Stop the old Metro tree (replace <PID> with the corepack/yarn parent PID):
taskkill /PID <PID> /T /F
# Then, from D:\open-tarteel-tv\.worktrees\home-virtual-grid:
$env:EXPO_TV='1'; yarn expo start --dev-client --port 8081 --clear
```

Wait for `http://localhost:8081/status` → `packager-status:running` before launching.

### 0.2 Typed letters are React Native dev shortcuts

In a dev build, typing **`r` reloads the JS bundle** and **`d` opens the dev menu**.
A string such as `ibrahim` therefore blanks the app mid-test. Only type strings that
contain neither letter (e.g. `a`, `ali` typed one key at a time). A blank screen right
after typing is usually this, not a crash — check logcat for `handleReloadJS()`.

Also: the soft keyboard consumes the first DPAD key after focusing search, and pressing
BACK while it is up can exit to the launcher. Dismiss/blur deliberately when testing
"leaving search".

---

## 1. Prerequisites and capture conventions

- Emulator `Television_720p` booted: `adb devices` → `emulator-5554	device`;
  `adb shell getprop sys.boot_completed` → `1`. If stopped:
  `& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Television_720p` (background).
- App installed: `adb shell pm list packages kg.us.quran.tarteel.twa`.
- Metro healthy and confirmed to serve the worktree (section 0).
- Catalog load needs network and can take 30–60 s; a transient failure shows the source
  warning and empty state. Tap **Try Again** to recover (touch works on buttons, not cards).
- Navigate with DPAD, ~350 ms between keys. Touch/`input tap` cannot focus reciter cards.
- Capture PNGs with `cmd.exe`; PowerShell redirection corrupts the bytes:

```powershell
$ev = 'C:\Users\user\AppData\Local\Temp\opencode\home-grid-evidence'
New-Item -ItemType Directory -Force -Path $ev | Out-Null
cmd.exe /c "adb exec-out screencap -p > `"$ev\NN-name.png`""
```

Use a dedicated evidence folder (outside git) and record the absolute paths in the report.

---

## 2. Cold start

```powershell
adb shell am force-stop kg.us.quran.tarteel.twa
adb shell monkey -p kg.us.quran.tarteel.twa -c android.intent.category.LAUNCHER 1
```

Wait for the catalog to render. Confirm the header sections are present: language/settings/
privacy/about nav, search input, riwaya filter chips, featured rails (e.g.
`Recently played (10)`), and the `Reciters (N)` title above the card rows.
Capture `01-cold-start.png`.

Note: the source warning is expected if a fetch fails; it must appear as
`Some sources are temporarily unavailable.` (see section 5).

---

## 3. Device matrix

Perform on a freshly loaded Home. Each row is a separate check with a screenshot.

### 3.1 Grid scrolls with DPAD down

```powershell
1..6 | ForEach-Object { adb shell input keyevent KEYCODE_DPAD_DOWN; Start-Sleep -Milliseconds 350 }
```

From the top nav, ~3 DOWNs reach the search field; ~6 reach the card grid. Expect a
focus outline on a card and the header scrolled up. Capture `02-grid-down6.png`.

### 3.2 Left/right moves across a row (RTL inversion)

With a card focused:

```powershell
adb shell input keyevent KEYCODE_DPAD_LEFT; Start-Sleep -Milliseconds 600
```

Expect focus to move to the **visually adjacent card to the right** in RTL (inverted from
the physical key), then a second LEFT to the next one. RIGHT walks back left. Capture
`03-left.png`, `04-left2.png`, `05-right.png`.

### 3.3 Down reaches later rows

```powershell
1..3 | ForEach-Object { adb shell input keyevent KEYCODE_DPAD_DOWN; Start-Sleep -Milliseconds 400 }
```

Expect a different set of reciters, focus still on a card, and the grid scrolled further.
Capture `06-later-rows.png`.

### 3.4 Opening a reciter still plays audio

```powershell
adb shell input keyevent KEYCODE_DPAD_CENTER
Start-Sleep -Seconds 7
cmd.exe /c "adb exec-out screencap -p > `"$ev\07-player-t1.png`""
Start-Sleep -Seconds 7
cmd.exe /c "adb exec-out screencap -p > `"$ev\08-player-t2.png`""
```

Pass criteria: the player opens, autoplays without a second press, the label reads
`Now Playing` (not the pre-play `Selected Surah` label), the **pause** icon is visible,
and the displayed time advances ≥5 s between the two screenshots. A short first surah
(Al-Faatiha) advancing to the next track is expected, not a failure. The emulator audio
HAL commonly logs `pcm_writei ... I/O error`; that is an emulator artifact — rely on the
on-screen progress, not audible sound.

### 3.5 RTL layout remains inverted

Compare with the Arabic base screenshots: nav/branding placement, right-aligned search
icon and placeholder (old build), riwaya chips ordered right-to-left, and the DPAD
inversion in 3.2. If the build is switched to English (`العربية` button, DPAD CENTER),
row direction and horizontal DPAD should flip.

---

## 4. Search/filter focus checks

### 4.1 Search typing does not lose focus

```powershell
adb shell input tap 500 315   # focus the search field
Start-Sleep -Milliseconds 500
adb shell input text "a"      # NO 'r' or 'd' — see section 0.2
```

Expect the typed character in the field and the focus border still drawn. Capture
`09-search-typed.png`.

### 4.2 Leaving search focuses the first card

From a focused search field, blur it (dismiss the keyboard, or send further key events
that take focus out). Expect the virtualized grid to scroll to the top of the card rows
and put the **first card** under focus — not the header, not a stale deep index.
Capture `10-left-search.png`. The same state should survive a force-stop/relaunch.

### 4.3 Narrowing by riwaya does not strand focus

Navigate/tap a riwaya chip (e.g. `Khalaf` / خلف) and confirm:

```powershell
adb shell input tap <chip-x> <chip-y>
```

Expect the `Reciters (N)` count to shrink, the visible cards all to carry the selected
riwaya badge, and focus to stay on a valid card (the first of the narrowed set), not
stranded on the header or an off-screen index. Capture `11-riwaya-narrowed.png`.

### 4.4 Narrowing by letter does not strand focus

Repeat 4.3 with a letter chip from the `SectionLetterFilter` row. **If the letter chips
are not visible or hit-testable on the device, mark this NOT VERIFIED** with the exact
observation (do not infer success from the unit tests).

---

## 5. Source-warning check

A failed source must show one warning line without hiding the working sources:

```powershell
adb logcat -d | Select-String -Pattern "itqan|quran-foundation|qurani|mp3quran" | Select-Object -Last 100
```

Expect `Some sources are temporarily unavailable.` alongside the catalog, or on the
empty state if all sources failed. A transient outage is a valid opportunity to verify
this. Capture `12-source-warning.png`. A 401 from QF credentials is expected and must
not be logged as a source failure.

---

## 6. Final checks and record

```powershell
yarn test
yarn type-check
yarn lint
```

Record the exact counts and the per-check VERIFIED / NOT VERIFIED outcome (with screenshot
paths and exact failures for any unmet item) in the task report. Never infer an on-device
success from a passing unit test.
