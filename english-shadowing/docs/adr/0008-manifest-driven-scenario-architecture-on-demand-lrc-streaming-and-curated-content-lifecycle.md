# ADR-0008: Manifest-Driven Scenario Architecture, On-Demand LRC Streaming, and Curated Content Lifecycle

- **Status:** Accepted
- **Date:** 2026-09-20
- **Scope:** `english-shadowing`

---

## 1. Context & Problem Statement

In previous iterations of the English Shadowing Player:

1. **Monolithic Inlined Subtitles (`CURATED_SCENARIOS`)**: All curated scenarios—including full Enhanced LRC lyrics, intra-line millisecond word timestamps, and Vietnamese translations—were compiled directly into `const CURATED_SCENARIOS` inside `index.html`. While suitable for 3–6 short scenarios, scaling the library to 20–100+ rich dialogues bloats the initial HTML bundle by multiple megabytes, increasing memory usage and slowing initial render times.
2. **Redundant Path Redundancy**: Manifest schemas and scenario objects explicitly required `audioUrl` and `lrcUrl` keys even when matching predictable canonical paths (`audio/<id>.mp3` and `audio/<id>.lrc`).
3. **Ephemeral & Incomplete User Imports**: The legacy Custom Scenario import modal held uploaded `.srt`/`.lrc` files in a temporary in-memory array (`CURATED_SCENARIOS.unshift`) without audio storage or persistence across page reloads. Retaining this incomplete feature added UI complexity and maintained a redundant `parseSrt` fallback parser.
4. **Unstructured Catalog Navigation**: As the scenario library expands, learners require structured filtering (Categories, CEFR levels, Accents, Duration ranges, Thematic Tags, and Curated Collections/Playlists) along with persistent learner progress tracking (Bookmarking, In Progress, Mastered).

---

## 2. Decision Drivers

- **Zero-Bloat App Shell & Sub-Millisecond Startup**: Keep `index.html` lightweight (< 50KB core payload) regardless of scenario catalog size.
- **Convention-over-Configuration Media Routing**: Default `audioUrl` and `lrcUrl` resolution to canonical asset paths (`audio/<id>.mp3` and `audio/<id>.lrc`), omitting redundant URL fields from the manifest unless explicitly overridden.
- **On-Demand Subtitle & Audio Streaming**: Fetch and parse Enhanced LRC subtitle cues (`.lrc`) dynamically only when a scenario is selected for practice, leveraging Service Worker runtime media caching (`shadowing-media-v3`) for 100% offline PWA practice.
- **Curated Quality Focus & Legacy Code Retirement**: Completely retire ephemeral user-import modals and the legacy `parseSrt()` parser, standardizing 100% on Enhanced LRC and high-quality curated curriculum.
- **Rich Multi-Dimensional Taxonomy & Learner Progress**: Provide categorized collections (`daily-social`, `workplace`, `travel`, `academic`), thematic tags (`#coffee`, `#standup`, `#ai`), and persistent localStorage tracking of scenario practice states (`new`, `in_progress`, `completed`, `mastered`) and favorited bookmarks.
- **Automated Directory-to-Manifest Build Pipeline**: Enable automated CLI scripts to scan `english-shadowing/scenarios/<id>/scenario.md`, generate audio/LRC assets, produce `scenarios.json`, and synchronize the lightweight manifest array (`SCENARIOS_MANIFEST`) in `index.html`.

---

## 3. Considered Options & Decision Outcome

### A. Scenario Catalog Delivery & Runtime Loading

- **Option 1 (Full Inlining Status Quo)**: Continue inlining all scenario LRC text in `index.html`. (Rejected: Fails scalability as catalog expands).
- **Option 2 (Pure Async Network Fetch on Boot)**: Fetch `scenarios.json` on app startup. (Rejected: Adds render-blocking network latency and breaks offline first-view unless pre-cached).
- **Option 3 (Chosen - Dual Deliverable: Embedded Lightweight Manifest + On-Demand Dynamic LRC Streaming)**:
  - Embed `const SCENARIOS_MANIFEST = [...]` containing lightweight metadata only (ID, Title, Category, Level, Accent, Duration, Description, Tags, Collection, Sentence Count) in `index.html` (~250 bytes per scenario).
  - Generate external `scenarios.json` during build for standalone integrations.
  - Fetch `audio/<id>.lrc` dynamically via `fetch()` upon scenario selection, caching parsed cues in memory and in Service Worker CacheStorage (`shadowing-media-v3`).
  - _Outcome_: Chosen. Instant boot, zero initial layout shift, full offline reliability, and 85%+ bundle size reduction.

### B. Media Routing: Convention over Configuration

- **Option 1 (Explicit URLs)**: Mandate explicit `audioUrl` and `lrcUrl` strings in every manifest entry.
- **Option 2 (Chosen - Convention with Optional Override)**:
  - By default, `audioUrl` resolves to `audio/${id}.mp3` and `lrcUrl` resolves to `audio/${id}.lrc`.
  - Manifest omits `audioUrl` and `lrcUrl` keys unless an explicit custom or external CDN URL is specified.
  - _Outcome_: Chosen. Reduces manifest payload bytes by ~30% and enforces strict naming consistency across `scenarios/<id>/` and `audio/`.

### C. Scope Refinement & Code Retirement

- **Option 1**: Keep user import modal and `parseSrt()` fallback parser.
- **Option 2 (Chosen - Complete Retirement & Standardization)**:
  - Remove `#importModal`, `openImportModal()`, `closeImportModal()`, and `handleCustomScenarioSubmit()`.
  - Remove `parseSrt()` from runtime and test suites.
  - Standardize 100% on Enhanced LRC (`parseEnhancedLrc`).
  - _Outcome_: Chosen. Eliminates dead code paths and keeps the codebase lean, robust, and maintainable.

### D. Learner Scenario Progress & Storage Architecture

- **Option 1 (No Progress Tracking)**: Ephemeral session-only tracking.
- **Option 2 (Chosen - Unified Scenario Progress Store `shadowing_scenario_progress_v1`)**:
  - Persisted in `localStorage`:
    ```ts
    interface ScenarioProgressStore {
      bookmarkedIds: string[];
      scenarios: {
        [scenarioId: string]: {
          status: "new" | "in_progress" | "completed" | "mastered";
          completedSentences: number[];
          practiceCount: number;
          lastPracticedAt: number;
        };
      };
    }
    ```
  - Powers Catalog filter tabs (`[ All ]`, `[ ⭐ Bookmarked ]`, `[ 🔄 In Progress ]`, `[ ✅ Mastered ]`), progress indicators on scenario cards, and practice statistics.
  - _Outcome_: Chosen. Delivers clear completion feedback and motivates structured learning paths.

### E. Scenario Directory Structure & Build Automation

- **Structure**:
  ```text
  english-shadowing/scenarios/
  ├── specialty-coffee/
  │   ├── scenario.md
  │   ├── audio.mp3
  │   └── subtitles.lrc
  ├── tech-standup/
  │   ├── scenario.md
  │   ├── audio.mp3
  │   └── subtitles.lrc
  └── ...
  ```
- **CLI Commands**:
  - `python3 scripts/generate-scenario-audio.py --all`: Generate audio/LRC from Markdown and compile manifest.
  - `python3 scripts/generate-scenario-audio.py --sync-only`: Fast manifest compilation and `index.html` synchronization.
  - `bun run build:shadowing`: Minifies application, packages `dist/scenarios.json`, and syncs companion assets.

---

## 4. Consequences

### Positive

- **Unconstrained Library Scalability**: The player can easily support 100+ scenarios without increasing the core HTML bundle size.
- **Instantaneous Initial Startup**: Zero layout shift and immediate catalog rendering with embedded lightweight metadata.
- **Cleaner, Leaner Codebase**: Retirement of legacy `parseSrt` and unpersisted import modals reduces code bloat.
- **Enhanced Discoverability & Motivation**: Filter tabs, thematic tags, curated collections, and persistent progress tracking guide learners through systematic deliberate practice.

### Negative / Trade-offs

- First-time playback of a scenario requires fetching its `.lrc` file (under 5KB, cached permanently offline after first fetch).
