# English Shadowing Player — Test Plan & Quality Verification Strategy

## 🎯 Scope & Objectives

Verify the Markdown scenario authoring schema, precision acoustic stitching pipeline (zero cumulative drift, syllable-weighted word timing, silence padding), full Enhanced LRC single-source-of-truth standardization (bundled `.srt` removal), and the expanded 6-scenario curated library across unit, integration, and multi-device E2E levels.

---

## 🧪 Seam Test Matrix

### 1. Manifest Compiler & Markdown Scenario Seams (`tests/english-shadowing-engine.test.js`)

- `parseMarkdownScenario`: Validates YAML frontmatter extraction (`id`, `title`, `category`, `level`, `accent`, `tags`, `collection`, `speakers`) and dialogue/monologue line parsing (`**Speaker**: text \n > translation`).
- `generateSyllableWeightedWords`: Validates syllable calculation, short function word compression, and punctuation pause distribution.
- `compileScenariosManifest`: Validates manifest generation (`scenarios.json`), convention-over-configuration URL resolution, schema invariants, and synchronization into `index.html`.
- `calculateKaraokeWordIndex`: Validates instantaneous resolution of active word token given `audio.currentTime`.
- `parseEnhancedLrc`: Validates Enhanced LRC parsing with intra-line `<mm:ss.xx>` word tags, dual-language pairing, and cue start/end bounds. (Legacy `parseSrt` permanently retired).

### 2. Scenario Manifest, On-Demand Streaming & Storage Seams (`tests/english-shadowing-storage.test.js`)

- `SCENARIOS_MANIFEST` Schema Integrity: Verifies all scenarios contain valid metadata (id, title, category, level, accent, duration, tags, collection, sentenceCount) and lightweight payload size.
- On-Demand Dynamic LRC Streaming: Verifies asynchronous fetching of `audio/<id>.lrc`, in-memory cue caching, and offline Service Worker caching.
- Scenario Progress Store (`shadowing_scenario_progress_v1`): Verifies bookmarks (`bookmarkedIds`), scenario progress state transitions (`new` -> `in_progress` -> `completed` -> `mastered`), completed sentences set, and persistence.
- Data Isolation: Verifies that clearing media cache leaves scenario progress, SRS flashcards, and practice streaks 100% intact.

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

### 7. PWA Zero-Stale Cache & Lifecycle Verification (`tests/english-shadowing-storage.test.js`)

- Navigation Request Network-Only Strategy: verifies that HTML navigation requests fetch live code over the network when online, update the cached app shell, and fall back to cache when offline.
- Lightweight Shell Precache: verifies that `install` precache contains only core app shell assets (`./`, `./index.html`, `./manifest.json`, `./manifest.webmanifest`, `./icon.svg`) and excludes legacy `.srt` or heavy media files.
- On-Demand Runtime Media Caching: verifies that requests to `.mp3`, `.lrc`, and `.md` scenario assets are dynamically cached into `shadowing-media-v3` Cache Storage on first playback.
- Service Worker Activation & Cache Migration: verifies that older cache stores (e.g. `shadowing-player-v2`) are pruned upon activation of a new version.
- User Data Isolation & Cache Reset: verifies that triggering "Clear Media Cache" empties media response caches while leaving IndexedDB SRS vocabulary, streaks, and recording blobs 100% intact.
