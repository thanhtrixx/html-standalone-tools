# English Shadowing Player — Backlog & Roadmap

## 🎯 Milestone 4: Listening-First Audio Engine, Clean Navigation & View-Only Transcript

### Epic: Listening-First Audio Precision & Streamlined Shadowing Ergonomics

- **Status:** Phase 1 Ready for Implementation ([ADR-0005](./docs/adr/0005-listening-first-audio-engine-clean-navigation-and-read-only-transcript.md))

---

### Vertical Slices Breakdown

#### Slice 1: Clean Player Top Bar & View-Only Transcript Feed
- **Title**: `feat(shadowing): clean player top bar and view-only transcript card`
- **Scope**:
  - [ ] Remove Export LRC and Export SRT buttons from player top bar.
  - [ ] Restyle "Back to Catalog" into a clean, sleek ghost/breadcrumb navigation button with subtle arrow on top-left of player bar.
  - [ ] Refactor `transcriptCard` into a pure view & sentence selection feed; remove all `<input>` fields and editing instructions.
  - [ ] Make entire sentence card/row clickable for instantaneous sentence jumping with hover and active emerald highlight states.
  - [ ] Update bilingual labels and test suites in `tests/english-shadowing-ui.test.js`.

#### Slice 2: Zero-Seek Continuous Playback Engine & Stutter Elimination
- **Title**: `fix(shadowing): zero-seek continuous playback and stutter elimination`
- **Scope**:
  - [ ] Redesign continuous mode playback loop to stream HTML5 `<audio>` naturally without forced re-seeks or redundant `.play()` invocations at sentence boundaries.
  - [ ] Implement seamless cue boundary tracking in RAF / time update loop to update active sentence index, transcript auto-scrolling, and karaoke word highlights.
  - [ ] Ensure explicit seek operations (scrubbing, transcript clicking, next/prev navigation) still accurately reposition audio.
  - [ ] Add automated unit and playback synchronizer tests in `tests/english-shadowing-engine.test.js`.

#### Slice 3: Speed Selection Popover & Precision Loop Mode Boundaries
- **Title**: `feat(shadowing): speed selection popover and loop mode acoustic boundary padding`
- **Scope**:
  - [ ] Implement interactive speed selection popover menu triggered from transport dock with direct presets: `0.5x`, `0.75x`, `0.85x`, `1.0x (Normal)`, `1.15x`, `1.25x`, `1.5x`.
  - [ ] Retain keyboard shortcuts (`[` and `]`) for stepping playback speed.
  - [ ] Implement loop mode acoustic lead-out padding (+150ms clamped to next cue start) and micro lead-in (-50ms) to preserve trailing/leading phonemes.
  - [ ] Ensure clean auto-pause, repeat prompt activation, and instant replay in loop mode without audio bleed.
  - [ ] Add automated seam tests verifying speed popover presets, boundary margin calculations, and keyboard shortcuts.

---

## 🏁 Completed Milestones

- ✅ **Milestone 1**: Standalone PWA Architecture, Leitner SRS & Smart SRT Engine ([ADR-0001](./docs/adr/0001-english-shadowing-pwa-architecture-and-data-model.md), [ADR-0002](./docs/adr/0002-voice-recorder-leitner-srs-and-smart-srt-engine.md))
- ✅ **Milestone 2**: Enhanced LRC Karaoke Engine, Neural Audio Pipeline & Integrated Transport Dock ([ADR-0003](./docs/adr/0003-enhanced-lrc-karaoke-engine-audio-cdn-and-integrated-player.md))
- ✅ **Milestone 3**: App-Shell Layout, URL Scenario Deep-Linking, Default Continuous Mode & Dedicated Insights Modal ([ADR-0004](./docs/adr/0004-app-shell-url-routing-and-insights-reports.md))
