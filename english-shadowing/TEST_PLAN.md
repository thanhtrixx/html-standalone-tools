# English Shadowing Player — Test Plan & Quality Verification Strategy

## 🎯 Scope & Objectives

Verify the listening-first audio playback engine (zero-seek continuous streaming, loop mode acoustic boundary padding), clean minimalist player top bar, view-only transcript navigation feed, and speed selection popover across unit, integration, and multi-device E2E levels.

---

## 🧪 Seam Test Matrix

### 1. Pure Engine Math, Cues & Boundary Padding Seams (`tests/english-shadowing-engine.test.js`)

- `calculateAcousticBoundary`: Validates lead-out grace buffer (+150ms) clamped to next cue start and lead-in margin (-50ms clamped to ≥ 0).
- `calculateKaraokeWordIndex`: Validates instantaneous resolution of active word token given `audio.currentTime`.
- `parseEnhancedLrc` & `parseSrt`: Validates subtitle parsing, dual-line translation matching, cue start/end extraction.
- `parseScenarioUrl` & `buildScenarioUrl`: Validates URL query parameter routing and history state synchronization.

### 2. Audio Engine, Playback Synchronization & Storage Seams (`tests/english-shadowing-storage.test.js`)

- Continuous mode playback flow: verifies uninterrupted audio streaming across sentence transitions without forced seeks.
- Loop mode auto-pause: verifies clean pause at padded boundary without bleeding into subsequent cues.
- Playback speed persistence and direct rate preset application (`0.5x` through `1.5x`).
- Practice statistics tracking (streak, practice minutes, sentences shadowed count).

### 3. UI, Navigation & Ergonomics Seams (`tests/english-shadowing-ui.test.js`)

- Minimalist Player Top Bar: verifies removal of Export LRC/SRT buttons and existence of clean ghost "Back to Catalog" button.
- View-Only Transcript Card: verifies replacement of `<input>` elements with static typography and full-row click-to-jump handler.
- Speed Selection Popover: verifies opening popover, rendering presets (`0.5x`, `0.75x`, `0.85x`, `1.0x`, `1.15x`, `1.25x`, `1.5x`), selecting speed, and keyboard shortcut stepping (`[` / `]`).
- Subtitle Masking Modes (`Dual`, `EN Only`, `VI Only`, `Blur`) in player top bar.

### 4. Bilingual i18n Parity (`tests/english-shadowing-i18n.test.js`)

- 100% dictionary parity between `en` and `vi` tables for updated navigation and speed labels (`btnBackToCatalog`, `speedNormal`, etc.).

### 5. Multi-Device Playwright E2E (`tests/e2e/english-shadowing-devices.spec.js`)

- Mobile (iPhone 14 Pro, Android Pixel 7), Tablet (iPad Pro 11), and Desktop Chrome viewports.
- Click-to-jump navigation from transcript feed across responsive breakpoints.
- Speed popover interaction on touch and desktop.
- Uninterrupted continuous audio streaming and loop mode shadowing repetitions.
