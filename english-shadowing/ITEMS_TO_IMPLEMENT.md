# English Shadowing Player — Backlog & Roadmap

## 🎯 Milestone 7: Manifest-Driven Scenario Architecture, On-Demand LRC Streaming & Curated Content Lifecycle

### Epic: Scalable Scenario Management, On-Demand Subtitle Streaming & Progress Tracking

- **Status:** ✅ Milestone Completed & Verified ([ADR-0008](./docs/adr/0008-manifest-driven-scenario-architecture-on-demand-lrc-streaming-and-curated-content-lifecycle.md))

---

### Vertical Slices Breakdown

#### Slice 1: Manifest Compiler, Convention Media Routing & Compact Build Pipeline

- **Title**: `feat(shadowing): manifest compiler, convention media routing, and compact build sync`
- **Scope**:
  - [x] Update `scripts/generate-scenario-audio.py` to scan `scenarios/<id>/scenario.md` and export `scenarios.json` and sync lightweight `const SCENARIOS_MANIFEST = [...]` into `index.html` (metadata only, omitting default `audioUrl` and `lrcUrl`).
  - [x] Enforce convention-over-configuration routing (`audio/<id>.mp3` and `audio/<id>.lrc`).
  - [x] Update `scripts/build.js` to package `scenarios.json` into `dist/`.
  - [x] Add automated unit tests verifying manifest schema validation and compact sync.

#### Slice 2: On-Demand Dynamic LRC Streaming & Legacy Import Retirement

- **Title**: `feat(shadowing): on-demand dynamic LRC streaming, memory cue cache, and legacy code retirement`
- **Scope**:
  - [x] Refactor `selectScenario` in `english-shadowing/index.html` to dynamically fetch `audio/<id>.lrc` via `fetch()` with an in-memory parsed cue cache `Map<string, ParsedCue[]>`.
  - [x] Completely remove `#importModal`, `openImportModal()`, `closeImportModal()`, and `handleCustomScenarioSubmit()`.
  - [x] Completely retire `parseSrt()` from runtime and unit tests, standardizing 100% on `parseEnhancedLrc`.
  - [x] Add automated unit and integration tests verifying on-demand subtitle loading, error handling, and offline fallback.

#### Slice 3: Multi-Dimensional Catalog Taxonomy, Progress Tracking & Collection Filtering

- **Title**: `feat(shadowing): multi-dimensional catalog taxonomy, scenario progress store, and collection filters`
- **Scope**:
  - [x] Implement `shadowing_scenario_progress_v1` in `localStorage` tracking bookmarks (`bookmarkedIds`) and scenario completion status (`new`, `in_progress`, `completed`, `mastered`).
  - [x] Update Catalog UI with status tabs (`[ All ]`, `[ ⭐ Bookmarked ]`, `[ 🔄 In Progress ]`, `[ ✅ Mastered ]`).
  - [x] Add Curated Collections (`daily-social`, `workplace`, `travel`, `academic`) and Thematic Tag filtering.
  - [x] Add completion progress ring/bars on scenario cards.
  - [x] Ensure 100% bilingual parity for all new filter labels and status badges in `I18N.md` and `index.html`.
  - [x] Add automated unit and UI tests for catalog filtering and progress persistence.

---

## 🎯 Milestone 6: PWA Zero-Stale Cache Lifecycle, Network-Only Navigation & On-Demand Media Streaming

### Epic: Zero-Stale App Refreshes, Silent Upgrades & On-Demand Media PWA Cache

- **Status:** ✅ Milestone Completed & Verified ([ADR-0007](./docs/adr/0007-pwa-zero-stale-cache-lifecycle-and-on-demand-media-streaming.md))

---

### Vertical Slices Breakdown

#### Slice 1: Zero-Stale Service Worker Engine & Lightweight Shell Precache (#668)

- **Title**: `feat(shadowing): network-only navigation, lightweight shell precache, and controllerchange auto-reload`
- **Scope**:
  - [x] Rewrite `english-shadowing/sw.js` with Network-Only strategy for navigation requests (`request.mode === 'navigate'`), fetching fresh HTML online and updating cache, falling back to cache when offline.
  - [x] Prune legacy `.srt` files and heavy audio files from `ASSETS_TO_CACHE` install precache list, keeping only core app shell assets (`./`, `./index.html`, `./manifest.json`, `./manifest.webmanifest`, `./icon.svg`).
  - [x] Implement `self.skipWaiting()` on install, cache version migration/cleanup on activate, and `self.clients.claim()`.
  - [x] Register `controllerchange` listener in `english-shadowing/index.html` to automatically reload active tabs when an updated service worker activates.
  - [x] Add automated unit tests verifying navigation fetch strategy, cache pruning, and service worker update cycle.

#### Slice 2: On-Demand Runtime Media Caching & In-App Storage Maintenance (#669)

- **Title**: `feat(shadowing): on-demand runtime media caching and safe clear media cache action`
- **Scope**:
  - [x] Implement on-demand runtime caching for media assets (`.mp3`, `.lrc`, `.md`) in `sw.js` into dedicated `shadowing-media-v3` Cache Storage on first playback.
  - [x] Add "Clear Media Cache" action inside the Insights / Settings modal in `english-shadowing/index.html` with bilingual confirmation dialog.
  - [x] Guarantee 100% isolation of user learning data (SRS Leitner boxes, vocabulary notes, streaks, recordings in IndexedDB) during media cache clearing.
  - [x] Add bilingual translation keys in `I18N.md` and `index.html` for storage status, clear media cache buttons, and confirmation toasts.
  - [x] Add automated test assertions verifying on-demand media caching and data persistence isolation.

---

## 🎯 Milestone 5: Markdown Scenario Pipeline, Precision Acoustic Stitching & Full LRC Standardization

### Epic: Extended 1–5 Minute Scenarios & Enhanced LRC Single Source of Truth

- **Status:** ✅ Milestone Completed & Verified ([ADR-0006](./docs/adr/0006-markdown-scenario-authoring-precision-acoustic-stitching-and-lrc-standardization.md))

---

### Vertical Slices Breakdown

#### Slice 1: Markdown Scenario Parser, Precision Audio Generator & Enhanced LRC Pipeline

- **Title**: `feat(shadowing): markdown scenario parser, acoustic silence stitching, and LRC generation CLI`
- **Scope**:
  - [x] Implement `scripts/generate-scenario-audio.py` supporting Markdown frontmatter parsing, multi-speaker voice mapping, Edge TTS synthesis, synthetic MP3 silence frame byte insertion (500ms between turns, 300ms intra-speaker), and syllable/punctuation-weighted Enhanced LRC generation.
  - [x] Implement CLI flags: `--scenario <id>`, `--all`, `--dry-run`, `--sync-only`, `--format mp3|opus`.
  - [x] Add `bun run audio:shadowing` and `bun run audio:shadowing:sync` shortcuts in `package.json`.
  - [x] Add automated unit tests in `tests/english-shadowing-engine.test.js` validating Markdown parser logic, timecode formatting, and zero-drift timestamp alignment.

#### Slice 2: 6 Curated 1–3 Minute Scenarios & Enhanced LRC Audio Assets

- **Title**: `feat(shadowing): author 6 extended 1-3 minute scenarios and generate acoustic assets`
- **Scope**:
  - [x] Author `scenario.md` for 6 rich multi-turn scenarios (15–25 turns each) inside `english-shadowing/scenarios/<id>/`:
    1. `specialty-coffee` (A2 Daily, US)
    2. `tech-standup` (B2 Workplace, US)
    3. `airport-security` (B1 Travel, UK)
    4. `academic-ai-future` (C1 Academic, US)
    5. `job-interview` (B2 Workplace, US)
    6. `doctor-consultation` (A2-B1 Health & Daily, AU)
  - [x] Generate `.mp3` and `.lrc` assets for all 6 scenarios using the new pipeline.
  - [x] Delete legacy `.srt` files from `english-shadowing/audio/`.

#### Slice 3: Full LRC Standardization in PWA, Clean Catalog Sync & Test Suite Updates

- **Title**: `feat(shadowing): full enhanced LRC standardization, scenario catalog sync, and test assertions`
- **Scope**:
  - [x] Update `CURATED_SCENARIOS` in `english-shadowing/index.html` to reference all 6 extended scenarios with `lrcContent` only, completely removing `srtContent`.
  - [x] Update scenario catalog rendering, duration formatting, and sentence count badges in the UI.
  - [x] Retain backward-compatible `.srt` parser in `index.html` strictly for custom user subtitle file uploads.
  - [x] Update and pass all test suites in `tests/english-shadowing-engine.test.js`, `tests/english-shadowing-ui.test.js`, `tests/english-shadowing-i18n.test.js`, and `tests/english-shadowing-storage.test.js`.

---

---

## 🎯 Milestone 8: Active Voice Shadowing, Hands-Free Echoic Mode, IndexedDB Vault & FTUX Overhaul ([ADR-0009](./docs/adr/0009-voice-recording-echoic-shadowing-and-indexeddb-vault.md))

### 🎯 Objective

Complete the speech-production feedback loop, restore the microphone recording dock, implement hands-free echoic repetition, persist user takes in IndexedDB, expand the offline IPA dictionary to ~3,000 words, and streamline beginner onboarding.

### 🧩 Vertical Slice Breakdown

#### Slice 1: FTUX Scaffolding, Difficulty Sort, Pitch Preservation & Bug Fixes ([#688](https://github.com/thanhtrixx/html-standalone-tools/issues/688))

- **Scope**:
  - [ ] Reorder curated scenarios in `#catalogCardsGrid` by CEFR difficulty: A2 (`specialty-coffee`) -> B1 -> B2 -> C1.
  - [ ] Add 3-step "How to Shadow" visual guide in catalog header.
  - [ ] Remove `-0.1s / +0.1s Nudge` timing controls from `#subtitleStage` (relocate to settings).
  - [ ] Enforce `audio.preservesPitch = true` on `<audio id="playerAudio">` across all speed rates (`0.5x`–`1.5x`).
  - [ ] Fix streak pre-award bug in `loadPracticeStats()` and replace blocking `window.alert()` with `showToast()`.
  - [ ] Clamp mobile `#wordPopover` coordinates inside viewport boundaries.
  - [ ] Update `tests/e2e/english-shadowing-devices.spec.js` card count assertion (4 -> 6).

#### Slice 2: Voice Recording Dock, Waveform Visualizer & IndexedDB Vault ([#689](https://github.com/thanhtrixx/html-standalone-tools/issues/689))

- **Scope**:
  - [ ] Mount 1-tap `#btnDockRecord` in pinned transport dock with `KeyM` hotkey and pulsing recording indicator.
  - [ ] Render dual waveform comparison canvas (Native reference vs learner take) via Web Audio API `AudioContext` and `AnalyserNode`.
  - [ ] Persist recorded takes as Blobs in IndexedDB (`shadowing_recordings_vault`) keyed by `[scenarioId, cueIndex]`.
  - [ ] Implement automated A/B comparative playback (`Native` -> `0.4s pause` -> `Learner Take`).

#### Slice 3: Hands-Free Echoic Shadowing Mode with Dynamic Recording Timer ([#690](https://github.com/thanhtrixx/html-standalone-tools/issues/690))

- **Scope**:
  - [ ] Add `Echoic` (Delay Repeat) mode toggle to the transport bar alongside `Continuous` and `Loop`.
  - [ ] Compute dynamic pause window: $T_{\text{pause}} = \max(2.0\text{s}, \text{Cue Duration} \times 1.25)$.
  - [ ] Implement automated turn-taking: Play Cue $N$ -> Visual countdown & auto-record learner take -> Save to IndexedDB -> Auto-advance to Cue $N+1$.

#### Slice 4: Offline 3,000-Word IPA/VI Dictionary & Specification Parity ([#691](https://github.com/thanhtrixx/html-standalone-tools/issues/691))

- **Scope**:
  - [ ] Embed compressed ~3,000-word CEFR A1–C1 offline dictionary database with accurate IPA, parts of speech, and Vietnamese translations.
  - [ ] Add simple lemmatization for inflections and plural forms.
  - [ ] Reconcile `PRODUCT.md`, `DESIGN.md`, `CONTEXT.md`, and clean up dead code.

---

## 🏁 Completed Milestones

- ✅ **Milestone 1**: Standalone PWA Architecture, Leitner SRS & Smart SRT Engine ([ADR-0001](./docs/adr/0001-english-shadowing-pwa-architecture-and-data-model.md), [ADR-0002](./docs/adr/0002-voice-recorder-leitner-srs-and-smart-srt-engine.md))
- ✅ **Milestone 2**: Enhanced LRC Karaoke Engine, Neural Audio Pipeline & Integrated Transport Dock ([ADR-0003](./docs/adr/0003-enhanced-lrc-karaoke-engine-audio-cdn-and-integrated-player.md))
- ✅ **Milestone 3**: App-Shell Layout, URL Scenario Deep-Linking, Default Continuous Mode & Dedicated Insights Modal ([ADR-0004](./docs/adr/0004-app-shell-url-routing-and-insights-reports.md))
- ✅ **Milestone 4**: Listening-First Audio Engine, Clean Navigation & View-Only Transcript ([ADR-0005](./docs/adr/0005-listening-first-audio-engine-clean-navigation-and-read-only-transcript.md))
- ✅ **Milestone 5**: Markdown Scenario Pipeline, Precision Acoustic Stitching & Full LRC Standardization ([ADR-0006](./docs/adr/0006-markdown-scenario-authoring-precision-acoustic-stitching-and-lrc-standardization.md))
- ✅ **Milestone 6**: PWA Zero-Stale Cache Lifecycle & On-Demand Media Streaming ([ADR-0007](./docs/adr/0007-pwa-zero-stale-cache-lifecycle-and-on-demand-media-streaming.md))
- ✅ **Milestone 7**: Manifest-Driven Scenario Architecture & Curated Content Lifecycle ([ADR-0008](./docs/adr/0008-manifest-driven-scenario-architecture-on-demand-lrc-streaming-and-curated-content-lifecycle.md))
