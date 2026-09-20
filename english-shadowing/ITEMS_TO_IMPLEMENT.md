# English Shadowing Player — Backlog & Roadmap

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

## 🏁 Completed Milestones

- ✅ **Milestone 1**: Standalone PWA Architecture, Leitner SRS & Smart SRT Engine ([ADR-0001](./docs/adr/0001-english-shadowing-pwa-architecture-and-data-model.md), [ADR-0002](./docs/adr/0002-voice-recorder-leitner-srs-and-smart-srt-engine.md))
- ✅ **Milestone 2**: Enhanced LRC Karaoke Engine, Neural Audio Pipeline & Integrated Transport Dock ([ADR-0003](./docs/adr/0003-enhanced-lrc-karaoke-engine-audio-cdn-and-integrated-player.md))
- ✅ **Milestone 3**: App-Shell Layout, URL Scenario Deep-Linking, Default Continuous Mode & Dedicated Insights Modal ([ADR-0004](./docs/adr/0004-app-shell-url-routing-and-insights-reports.md))
- ✅ **Milestone 4**: Listening-First Audio Engine, Clean Navigation & View-Only Transcript ([ADR-0005](./docs/adr/0005-listening-first-audio-engine-clean-navigation-and-read-only-transcript.md))
- ✅ **Milestone 5**: Markdown Scenario Pipeline, Precision Acoustic Stitching & Full LRC Standardization ([ADR-0006](./docs/adr/0006-markdown-scenario-authoring-precision-acoustic-stitching-and-lrc-standardization.md))
