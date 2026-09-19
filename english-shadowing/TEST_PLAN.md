# English Shadowing Player — Test Plan & Quality Verification Strategy

## 🎯 Scope & Objectives

Verify the Enhanced LRC parser, real-time Karaoke word synchronization engine, HTML5 audio playback pipeline with bundled MP3 assets, and integrated player card layout across unit, integration, and multi-device E2E levels.

---

## 🧪 Seam Test Matrix

### 1. Pure Engine Math & LRC/SRT Parser Seams (`tests/english-shadowing-engine.test.js`)

- `parseEnhancedLrc`: Validates intra-line word timestamp parsing (`<mm:ss.xx>`), dual-line translation matching, cue start/end extraction, and edge-case sanitization.
- `exportToEnhancedLrc`: Validates 1-click serialization back to standard LRC format with intact word tags.
- `calculateKaraokeWordIndex`: Validates instantaneous resolution of the active word token given `audio.currentTime` across varying playback speeds.
- `legacySrtToLrc`: Validates lossless conversion from `.srt` to LRC with interpolated word boundaries.

### 2. Audio Engine & Persistence Seams (`tests/english-shadowing-storage.test.js`)

- HTML5 Audio load state, play/pause transitions, sentence seek bounds, and error recovery.
- Service Worker offline asset caching for `english-shadowing/audio/*.mp3`.
- Leitner SRS 5-box deck operations and IndexedDB persistence.

### 3. UI, Hotkeys & Karaoke Visual Seams (`tests/english-shadowing-ui.test.js`)

- Integrated Player Card DOM hierarchy: `#transport-dock` position directly under `#subtitleStage`.
- Karaoke active word pill DOM styling and class transitions.
- Scrubber milestone markers and sentence jump triggers.
- Word chip click handling during active playback.
- Subtitle masking modes (Dual, English, Vietnamese, Blur) in karaoke mode.

### 4. Bilingual i18n Parity (`tests/english-shadowing-i18n.test.js`)

- 100% dictionary parity between `en` and `vi` tables for all new LRC and karaoke keys.

### 5. Multi-Device Playwright E2E (`tests/e2e/english-shadowing-devices.spec.js`)

- Android (Pixel 7), iPhone (14 Pro), iPad (Pro 11), and Desktop Chrome viewports.
- Real-time karaoke word tracking, sentence replay (`R`), mic recording comparison, and collapsible transcript drawer.
