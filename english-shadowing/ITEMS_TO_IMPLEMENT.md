# English Shadowing Player — Backlog & Roadmap

## 🎯 Milestone 9: Canonical Scenario Architecture, Dynamic Streaming & Build Fix (#696)

### Epic: Canonical Scenario Directory Architecture, Dynamic Subtitle Streaming & Scoped Build Compilation

- **Status:** ✅ Milestone Completed & Verified ([ADR-0008](./docs/adr/0008-manifest-driven-scenario-architecture-on-demand-lrc-streaming-and-curated-content-lifecycle.md))
- **Scope**:
  - [x] Standardize scenario media in canonical `scenarios/<id>/` (`audio.mp3`, `subtitles.lrc`) and retire flat `audio/` directory.
  - [x] Update convention-over-configuration routing in `resolveScenarioAudioUrl()` and `resolveScenarioLrcUrl()`.
  - [x] Stream subtitles dynamically via on-demand `fetch()` without inlining lyrics in the HTML bundle.
  - [x] Reorder Service Worker `sw.js` fetch handling to give media files (`.mp3`, `.webm`, `.opus`) Cache-First + HTTP 206 byte-range slicing priority.
  - [x] Scope Tailwind config script regex in `scripts/build.js` to preserve head scripts and compiled stylesheet in `dist/`.
  - [x] Update all test suites to assert canonical scenario directory structure and build packaging.

---

## 🎯 Milestone 8: English Shadowing UX & Pedagogical Maturity Overhaul (Epic #687)

### Epic: Pedagogical Maturity, Echoic Shadowing Mode, Real Waveform Analysis & Offline 3,000-Word Dictionary

- **Status:** ✅ Milestone Completed & Verified ([ADR-0009](./docs/adr/0009-voice-recording-echoic-shadowing-and-indexeddb-vault.md))

---

### Vertical Slices Breakdown

#### Slice 1: Tri-Modal Engine Controls, Guided Mode Tooltips & Keyboard-Centric Workflow (#688)

- **Title**: `feat(shadowing): tri-modal engine controls, guided mode tooltips, and keyboard workflow`
- **Scope**:
  - [x] Implement Tri-Modal Engine switcher (`continuous`, `loop`, `echoic`) in `#player-container` with distinct badge indicators and tooltips.
  - [x] Wire up dedicated hotkeys (`Space` for play/pause, `R` for replay sentence, `←` / `→` for sentence navigation, `M` for mic recording, `L` for loop toggle, `E` for echoic toggle, `1`–`5` for SRS box grading).
  - [x] Add 3-step beginner onboarding modal / visual banner ("1. Listen", "2. Shadow", "3. Master") with CEFR A2 on-ramp.
  - [x] Clean up developer timing buttons from primary stage to reduce beginner cognitive overload.
  - [x] Add automated unit and UI tests for tri-modal switching and hotkey bindings.

#### Slice 2: Web Audio Real Amplitude Envelopes, Waveform Rendering & Mic Gate Resiliency (#689)

- **Title**: `feat(shadowing): real Web Audio amplitude envelopes, dual waveform canvas, and mic gate resiliency`
- **Scope**:
  - [x] Replace mock Math.sin waveform rendering with true Web Audio API `AudioContext` and `AnalyserNode` amplitude envelopes (30 bins).
  - [x] Render dual visualizer canvas (`#dualWaveformCanvas`) comparing Emerald Green (Native Reference) vs Cyan (Learner Voice).
  - [x] Add resilient mic permission handling with non-blocking toast notifications and visual status indicators.
  - [x] Enable `preservesPitch` on `audio` element across all playback speeds (`0.5x`–`1.5x`) on WebKit, Gecko, and Blink.
  - [x] Add automated unit and UI tests for Web Audio envelope extraction and permission state handling.

#### Slice 3: Hands-Free Echoic Shadowing Mode, Dynamic Pause Scaling & WebKit Mobile Layout Height (#690)

- **Title**: `feat(shadowing): hands-free echoic shadowing mode, dynamic pause scaling, and mobile height fix`
- **Scope**:
  - [x] Implement automated Echoic turn-taking with dynamic pause scaling:
        $$T_{\text{pause}} = \max\left(2.0\text{s}, \, \text{Cue Duration} \times 1.25\right)$$
  - [x] Build visual SVG countdown ring (`#echoicCountdownRing`) around the recording dock.
  - [x] Auto-arm microphone on pause, capture learner voice, persist take to IndexedDB vault, and auto-advance to next cue.
  - [x] Optimize mobile viewport layout for iPhone WebKit (`#player-view`, `#subtitleStage`, `#waveformComparisonBox`, `#player-container`) allowing pinned transport dock within viewport.
  - [x] Add multi-device E2E tests verifying echoic turn-taking and responsive layout across desktop, iPhone, iPad, and Android.

#### Slice 4: Offline 3,000-Word Essential IPA/Vietnamese Dictionary & Morphological Lemmatizer (#691)

- **Title**: `feat(shadowing): offline 3,000-word IPA/VI dictionary and morphological lemmatizer`
- **Scope**:
  - [x] Compile curated 2,942-entry offline dictionary (`BUILTIN_VOCAB_DB` and `dictionary.json`) covering 100% of scenario vocabulary and essential CEFR A1–C1 words with IPA, part-of-speech, and Vietnamese definitions.
  - [x] Implement smart morphological lemmatizer (`lookupDictionary`) resolving contractions (`it's`, `let's`, `don't`), plurals (`-s`, `-es`, `-ies`), past tense (`-ed`, `-d`, `-ied`), gerunds (`-ing`), and adverbs (`-ly`, `-ily`).
  - [x] Update `#wordPopover`, `setWordStatus()`, and CSV export to use rich offline dictionary lookups.
  - [x] Update Service Worker `sw.js` to cache `dictionary.json` in PWA shell cache for 100% offline access.
  - [x] Add automated unit tests verifying dictionary coverage, exact domain lookups, and lemmatizer edge cases.

---

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
  - [x] Embed compressed ~3,000-word CEFR A1–C1 offline dictionary database with accurate IPA, parts of speech, and Vietnamese translations.
  - [x] Add simple lemmatization for inflections and plural forms.
  - [x] Reconcile `PRODUCT.md`, `DESIGN.md`, `CONTEXT.md`, and clean up dead code.

---

## 🎯 Milestone 9: Monolingual English UI, Permanent Dark Theme & Ergonomic Keyboard Navigation ([#698](https://github.com/thanhtrixx/html-standalone-tools/issues/698), [ADR-0010](./docs/adr/0010-monolingual-english-ui-permanent-dark-theme-and-ergonomic-hotkeys.md))

### 🎯 Objective

- **Status:** ✅ Milestone Completed & Verified ([ADR-0010](./docs/adr/0010-monolingual-english-ui-permanent-dark-theme-and-ergonomic-hotkeys.md))

Remove client-side UI i18n switcher boilerplate, lock the app permanently into a focused high-contrast dark theme, and implement a full-spectrum keyboard-first interaction engine with multi-layout transport, shadowing workflow controls, SRS flashcard shortcuts, and a redesigned cheatsheet modal.

### 🧩 Vertical Slice Breakdown

#### Slice 1: Monolingual English UI & Permanent Dark Mode ([#699](https://github.com/thanhtrixx/html-standalone-tools/issues/699))

- **Scope**:
  - [x] Hardcode all UI labels, navigation buttons, empty states, and modal copy in clean, natural English.
  - [x] Remove `#langBtnEn`, `#langBtnVi`, `setLanguage()`, `state.lang`, `TRANSLATIONS` dictionary, and `data-i18n` attributes.
  - [x] Remove `#themeToggleBtn`, `#themeIconDark`, `#themeIconLight`, `setTheme()`, `toggleTheme()`, and localStorage theme loading.
  - [x] Enforce permanent dark theme styling on `<html>` and clean up unused light theme CSS selectors.
  - [x] Retain Vietnamese subtitle lines in `.lrc` and Vietnamese definitions in `BUILTIN_VOCAB_DB`.

#### Slice 2: Full-Spectrum Ergonomic Keyboard Shortcuts Engine ([#700](https://github.com/thanhtrixx/html-standalone-tools/issues/700))

- **Scope**:
  - [x] Multi-layout transport navigation: `Space` / `K` (Play/Pause), `R` / `Up` (Replay), `A` / `Left` / `J` (Prev cue), `D` / `Right` / `L` (Next cue), `Home` / `0` (First cue), `End` (Last cue), `[` / `]` (Speed adjustment).
  - [x] Shadowing practice triggers: `P` (Cycle Continuous ➔ Loop ➔ Echoic mode), `M` (Toggle Mic Take), `C` (Play A/B Comparative take), `B` (Bookmark current scenario).
  - [x] Subtitle masking modes: `1`, `2`, `3`, `4` (Dual, EN only, VI only, Blur).
  - [x] Leitner SRS flashcard review controls: `Space` / `Enter` / `F` / `Up` to flip card, `1` (Hard), `2` (Good), `3` (Mastered), `Left` / `Right` to navigate cards.
  - [x] Global & catalog navigation: `/` to focus catalog search input, `V` for Vocab Drawer, `I` for Insights, `?` for Cheat Sheet, and `Escape` for dismissal.

#### Slice 3: Redesigned Shortcuts Cheat Sheet Modal & Automated Verification ([#701](https://github.com/thanhtrixx/html-standalone-tools/issues/701))

- **Scope**:
  - [x] Redesign `#hotkeyModal` into categorized sections (Transport & Navigation, Shadowing & Mic, Subtitles & Masking, Leitner SRS Flashcards, Global & Search).
  - [x] Update `tests/english-shadowing-ui.test.js` to assert all hotkeys, modal structures, and dark theme invariants.
  - [x] Update `tests/english-shadowing-engine.test.js` and retire/update `tests/english-shadowing-i18n.test.js`.
  - [x] Validate 100% test pass via `bun run test:shadowing`.

---

## 🏁 Completed Milestones

- ✅ **Milestone 1**: Standalone PWA Architecture, Leitner SRS & Smart SRT Engine ([ADR-0001](./docs/adr/0001-english-shadowing-pwa-architecture-and-data-model.md), [ADR-0002](./docs/adr/0002-voice-recorder-leitner-srs-and-smart-srt-engine.md))
- ✅ **Milestone 2**: Enhanced LRC Karaoke Engine, Neural Audio Pipeline & Integrated Transport Dock ([ADR-0003](./docs/adr/0003-enhanced-lrc-karaoke-engine-audio-cdn-and-integrated-player.md))
- ✅ **Milestone 3**: App-Shell Layout, URL Scenario Deep-Linking, Default Continuous Mode & Dedicated Insights Modal ([ADR-0004](./docs/adr/0004-app-shell-url-routing-and-insights-reports.md))
- ✅ **Milestone 4**: Listening-First Audio Engine, Clean Navigation & View-Only Transcript ([ADR-0005](./docs/adr/0005-listening-first-audio-engine-clean-navigation-and-read-only-transcript.md))
- ✅ **Milestone 5**: Markdown Scenario Pipeline, Precision Acoustic Stitching & Full LRC Standardization ([ADR-0006](./docs/adr/0006-markdown-scenario-authoring-precision-acoustic-stitching-and-lrc-standardization.md))
- ✅ **Milestone 6**: PWA Zero-Stale Cache Lifecycle & On-Demand Media Streaming ([ADR-0007](./docs/adr/0007-pwa-zero-stale-cache-lifecycle-and-on-demand-media-streaming.md))
- ✅ **Milestone 7**: Manifest-Driven Scenario Architecture & Curated Content Lifecycle ([ADR-0008](./docs/adr/0008-manifest-driven-scenario-architecture-on-demand-lrc-streaming-and-curated-content-lifecycle.md))
- ✅ **Milestone 8**: Pedagogical Maturity, Echoic Shadowing Mode, Real Waveform Analysis & Offline 3,000-Word Dictionary ([ADR-0009](./docs/adr/0009-voice-recording-echoic-shadowing-and-indexeddb-vault.md))
- ✅ **Milestone 9**: Monolingual English UI, Permanent Dark Theme & Ergonomic Keyboard Navigation ([ADR-0010](./docs/adr/0010-monolingual-english-ui-permanent-dark-theme-and-ergonomic-hotkeys.md))
