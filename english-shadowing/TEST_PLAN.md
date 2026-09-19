# English Shadowing Player — Test Plan & Quality Verification Strategy

## 🎯 Scope & Objectives

Verify the App-Shell layout, URL scenario deep-linking engine, default continuous playback flow, dedicated Insights & Reports modal, and pinned bottom player dock across unit, integration, and multi-device E2E levels.

---

## 🧪 Seam Test Matrix

### 1. Pure Engine Math & URL Routing Seams (`tests/english-shadowing-engine.test.js`)

- `parseScenarioUrl`: Validates extraction of `scenario` and `cue` query parameters from URL strings and edge-case sanitization.
- `buildScenarioUrl`: Validates serializing scenario identifiers and optional cue positions to clean URL search parameters.
- `parseEnhancedLrc`: Validates intra-line word timestamp parsing (`<mm:ss.xx>`), dual-line translation matching, cue start/end extraction.
- `exportToEnhancedLrc`: Validates serialization back to standard LRC format with intact word tags.
- `calculateKaraokeWordIndex`: Validates instantaneous resolution of active word token given `audio.currentTime`.

### 2. Audio Engine & Preference Persistence Seams (`tests/english-shadowing-storage.test.js`)

- Continuous mode playback defaults (`continuous` default state) and `localStorage` preference loading (`shadowing_playback_mode`).
- Practice stats persistence (daily streak, practice minutes, sentences shadowed count).
- Leitner SRS 5-box deck operations and vocabulary state.
- Service Worker offline caching for audio assets and scripts.

### 3. UI, App-Shell & Navigation Seams (`tests/english-shadowing-ui.test.js`)

- URL deep-linking on load: auto-transitions to Player view with matched scenario.
- Two-way history sync: URL updates on scenario select and catalog return; `popstate` navigation.
- Pinned bottom player dock: `#player-container` pinned at bottom edge with scrubber, milestone markers, and transport buttons.
- Central Workspace hierarchy: `#subtitleStage` on top, `#transcriptCard` in middle with auto-scrolling active sentence highlighting.
- Insights & Reports Modal: Opening modal displays accurate streak, practice minutes progress, sentences shadowed, and SRS distribution.
- Record UI cleanup: verifies `waveformComparisonBox` and `btnDockRecord` are cleanly hidden/removed.

### 4. Bilingual i18n Parity (`tests/english-shadowing-i18n.test.js`)

- 100% dictionary parity between `en` and `vi` tables for all new Insights keys (`navInsights`, `insightsTitle`, `streakDays`, etc.).

### 5. Multi-Device Playwright E2E (`tests/e2e/english-shadowing-devices.spec.js`)

- Mobile (iPhone 14 Pro, Android Pixel 7), Tablet (iPad Pro 11), and Desktop Chrome viewports.
- Deep link direct scenario loading (`/?scenario=daily-routine-01`).
- Continuous audio playback with auto-scrolling transcript and active word karaoke glow.
- Pinned bottom transport controls interaction across responsive breakpoints.
