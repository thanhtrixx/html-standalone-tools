# English Shadowing Player — Test Plan & Quality Verification Strategy

## 🎯 Scope & Objectives

Verify the Markdown scenario authoring schema, precision acoustic stitching pipeline (zero cumulative drift, syllable-weighted word timing, silence padding), full Enhanced LRC single-source-of-truth standardization (bundled `.srt` removal), and the expanded 6-scenario curated library across unit, integration, and multi-device E2E levels.

---

## 🧪 Seam Test Matrix

### 1. Markdown Scenario Parser & Audio Sync Seams (`tests/english-shadowing-engine.test.js`)

- `parseMarkdownScenario`: Validates YAML frontmatter extraction (`id`, `title`, `category`, `level`, `accent`, `speakers`) and dialogue/monologue line parsing (`**Speaker**: text \n > translation`).
- `generateSyllableWeightedWords`: Validates syllable calculation, short function word compression, and punctuation pause distribution.
- `calculateAudioSilenceFrames`: Validates exact synthetic MP3 frame generation matching configured silence gaps (500ms between turns, 300ms intra-speaker).
- `calculateKaraokeWordIndex`: Validates instantaneous resolution of active word token given `audio.currentTime`.
- `parseEnhancedLrc`: Validates Enhanced LRC parsing with intra-line `<mm:ss.xx>` word tags, dual-language pairing, and cue start/end bounds.
- `parseSrt`: Validates backward-compatible fallback parsing for custom user uploads.

### 2. Scenario Catalog & Enhanced LRC Standardization (`tests/english-shadowing-engine.test.js`)

- `CURATED_SCENARIOS` Integrity: Verifies all 6 curated scenarios exist, contain valid `lrcContent`, valid `audioUrl`, valid metadata, and zero legacy `srtContent` keys.
- Cumulative Drift Invariant: Verifies that sum of turn durations + silence gaps equals total audio length within ±0.05s tolerance.
- Absence of bundled `.srt` files in `english-shadowing/audio/`.

### 3. Audio Engine, Playback Synchronization & Storage Seams (`tests/english-shadowing-storage.test.js`)

- Continuous mode playback flow: verifies uninterrupted audio streaming across sentence transitions without forced seeks on 1–3 minute tracks.
- Loop mode auto-pause: verifies clean pause at padded boundary (+150ms lead-out) without bleeding into subsequent cues.
- Playback speed persistence and direct rate preset application (`0.5x` through `1.5x`).
- Practice statistics tracking (streak, practice minutes, sentences shadowed count).

### 4. UI, Navigation & Ergonomics Seams (`tests/english-shadowing-ui.test.js`)

- Curated Catalog Grid: verifies rendering of 6 scenario cards with updated durations, CEFR badges, and sentence count chips.
- Minimalist Player Top Bar: verifies removal of Export LRC/SRT buttons and existence of clean ghost "Back to Catalog" button.
- View-Only Transcript Card: verifies static typography and full-row click-to-jump handler across 15–25 turns.
- Speed Selection Popover: verifies opening popover, rendering presets (`0.5x` to `1.5x`), selecting speed, and hotkeys.
- Subtitle Masking Modes (`Dual`, `EN Only`, `VI Only`, `Blur`) in player top bar.

### 5. Bilingual i18n Parity (`tests/english-shadowing-i18n.test.js`)

- 100% dictionary parity between `en` and `vi` tables for all scenario metadata, UI labels, and speed controls.

### 6. Multi-Device Playwright E2E (`tests/e2e/english-shadowing-devices.spec.js`)

- Mobile (iPhone 14 Pro, Android Pixel 7), Tablet (iPad Pro 11), and Desktop Chrome viewports.
- Click-to-jump navigation from transcript feed across responsive breakpoints on 1–3 minute scenarios.
- Speed popover interaction on touch and desktop.
- Uninterrupted continuous audio streaming and loop mode shadowing repetitions.
