# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

[UNRELEASED]

[2.0.1]

### Added

- Audio caching with LRU eviction (10 surah limit) for smoother playback
- Pre-fetch next 2 surahs during playback
- API response caching for reciters list (24h TTL, language-aware)

## [2.0.0-athar] - 2025-12-22

### Fixed

- Dark mode + fix reciters not showing (Mar 12)
- Ddd vertical gap between reciter cards in home grid (Mar 10)
- Resolve settings toggler click issue on TV (Feb 22)
- Use dynamic itemHeight for reciters grid (Feb 19)

### Added

- Improve Search Input Scaling and Alignment for TV
- Implement TV Player Seeking Functionality
- Dark mode + fix reciters not showing
- Implement recently played feature with context and UI integration
- Enhance search input focus visibility for TV
- Add empty state illustration for search results

### Changed

- Perf: remove hardcoded timeout from splash screen
- Docs: add local development environment setup

## [1.4.0]

### Added

- Add settings screen
- add adapters for multiple recitations sources and make it reusable (Itqan and MP3Quran)
- add ascript tp buildthe app for android locally
- add virtualized grid to fast load reciters list and optimize performance
- Integrate EmptyState component into HomeScreen for improved empty state handling in reciters and search results
- Add search results localization for Arabic and English
- Add GitHub workflows for greeting and package manager detection

### Fixed

- fixed reciters names in playlist for arabic language
- fixed layout and navigation for android tv
- fixed eng reciter cards display
- Add vertical gap between reciter cards in home grid

### Changed

- Switch from npm to yarn as package manager

## [1.3.0]

### Added

- Splash screen animation

### Fixed

- assets background and dimention fix for android tv, ios tv and app icon

- fixed Layout orientation

- fixed rtl d-pad navigation

- fixed reciters names in playlist for arabic language

## [1.2.0] - 2025-12-20

### Added

- Voice search and fazed search
- Pinned reciters

## [1.1.0] - 2025-12-19

### Added

- Initial public release of the Open Tarteel TV app.
- Home screen with searchable and filterable reciter grid.
- Player screen with playlist navigation and TV remote support.
- Multi-language support for Arabic and English.
- Themed UI with light and dark mode support.
- About and Privacy informational screens.
