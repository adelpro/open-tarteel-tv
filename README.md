# Open Tarteel TV

[![Expo](https://img.shields.io/badge/Expo-54.0-000020.svg)](https://expo.dev/)
[![React Native TV](https://img.shields.io/badge/React%20Native-TV%20OS-61dafb.svg)](https://github.com/react-native-tvos/react-native-tvos)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

Open Tarteel TV is a modern, open-source TV app for browsing and listening to Quran recitations on TV platforms (Android TV, tvOS).  
It focuses on a simple, beautiful, and remote-friendly experience.

---

## Features

- Searchable grid of reciters with rich metadata
- Filter reciters by riwaya (Hafs, Warsh, Qalun, Ad-Duri, and more)
- TV-remote friendly navigation and focus management
- Dedicated player screen with playlist of surahs
- Light and dark themes with system theme support
- Multi-language UI (Arabic and English) using i18n
- About and Privacy screens

See the full list of changes in the [changelog](./CHANGELOG.md).

---

## Tech Stack

- `Expo` / `React Native` (TV platforms via `react-native-tvos`)
- `TypeScript` with strict type checking
- `react-tv-space-navigation` for TV remote focus handling
- `i18next` and `react-i18next` for localization

Key packages are declared in `package.json:1` and used throughout `src/`.

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- Yarn (`corepack enable` or `npm install -g yarn`)
- Android TV emulator / device, or Apple TV simulator / device

### Install dependencies

```bash
yarn install
```

> The project uses Expo and React Native TV support via `react-native-tvos`.

### Run on Android TV

```bash
yarn android
```

This runs `expo run:android` for TV (see `package.json:5-13`).

### Run on tvOS

```bash
yarn ios
```

### Run in development web mode (optional)

```bash
yarn web
```

> Web mode is mainly for quick UI checks; TV navigation is best tested on an actual TV target.

---

## Project Structure

High-level folders:

- `assets/` – app icons, splash screens, and TV images
- `src/components/` – shared UI components (cards, headers, filters, player UI)
- `src/screens/` – top-level screens like home, player, about, privacy
- `src/navigation/` – app navigation configuration
- `src/hooks/` – reusable hooks for player behavior and state
- `src/constants/` – theme, colors, and other constants
- `src/locales/` – localization JSON files (Arabic, English)
- `src/services/` – API access and data fetching
- `src/types/` – shared TypeScript types

Entry point:

- `App.tsx` and `index.ts` – Expo / React Native entry configuration

---

## Internationalization (i18n)

The app supports Arabic and English:

- Translation JSON files live in `src/locales/`
- i18n is initialized in `src/i18n.ts`
- Components use `useTranslation()` from `react-i18next`

You can add additional languages by:

1. Adding a new `<lang>.json` in `src/locales/`
2. Registering it in `src/i18n.ts`
3. Updating any language switch UI to include the new language

---

## TV Navigation

The app is designed for TV remote use:

- Uses `react-tv-space-navigation` to manage focus between elements
- Home screen renders reciters in a grid with directional navigation
- Player screen focuses currently selected surah in the playlist

When contributing UI changes, keep TV focus behavior and accessibility in mind.

---

## Testing

Tests are not wired up yet in this repository.  
If you would like to help:

- Add unit tests for components and hooks (recommended: Jest + React Testing Library)
- Add end-to-end tests for TV navigation flows if possible

See the [Contributing](#contributing) section for how to propose changes.

---

## Contributing

Contributions, issues, and feature requests are very welcome.

### Ways to contribute

- Report bugs and UI issues
- Suggest new features or improvements
- Improve TV navigation and accessibility
- Add tests (unit / integration / E2E)
- Help with localization (new languages, better translations)

### Pull request guidelines

- Use TypeScript and keep types strict
- Follow existing code style and folder structure
- Keep components small and focused
- Make sure the app starts without errors on at least one platform (Android TV or tvOS)
- Update documentation (`README`, `CHANGELOG`) when you add or change features

More details are in [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## License

This project is licensed under the **Apache License 2.0**.  
This means:

- You **can use** the code, including in **commercial** projects
- You **must keep** the copyright and license notice
- You **should provide attribution** to this project in your documentation or about page

See the full text in [`LICENSE`](./LICENSE).

---

## Acknowledgements

- The TV-specific React Native support provided by the `react-native-tvos` community
- The broader React Native and Expo ecosystems
