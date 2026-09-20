# English Shadowing Player

> **Lifecycle Phase:** `Active Feature Development` ([ADR-0003](../docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md))

A standalone, mobile-first Progressive Web Application (PWA) designed for deliberate English shadowing, auditory muscle memory, real-time karaoke word-by-word subtitle synchronization, authentic audio playback (CDN/bundled), instant keyboard-driven sentence looping, 1-tap microphone self-comparison, 5-box Leitner spaced repetition (SRS), smart Enhanced LRC & SRT parsing with live timing nudges, and private zero-backend offline persistence.

For Vietnamese domain vocabulary, copywriting standards, and bilingual translation dictionary, refer to [`I18N.md`](./I18N.md).
For visual design tokens, typography scales, dark/light themes, and audio transport ergonomics, refer to [`DESIGN.md`](./DESIGN.md).
For product positioning, user personas, and core jobs-to-be-done, refer to [`PRODUCT.md`](./PRODUCT.md).
For test matrix and quality verification strategy, refer to [`TEST_PLAN.md`](./TEST_PLAN.md).
For implementation roadmap and tracked milestones, refer to [`ITEMS_TO_IMPLEMENT.md`](./ITEMS_TO_IMPLEMENT.md).
For architectural decision records, refer to:

- [`docs/adr/0001-english-shadowing-pwa-architecture-and-data-model.md`](./docs/adr/0001-english-shadowing-pwa-architecture-and-data-model.md)
- [`docs/adr/0002-voice-recorder-leitner-srs-and-smart-srt-engine.md`](./docs/adr/0002-voice-recorder-leitner-srs-and-smart-srt-engine.md)
- [`docs/adr/0003-enhanced-lrc-karaoke-engine-audio-cdn-and-integrated-player.md`](./docs/adr/0003-enhanced-lrc-karaoke-engine-audio-cdn-and-integrated-player.md)
- [`docs/adr/0004-app-shell-url-routing-and-insights-reports.md`](./docs/adr/0004-app-shell-url-routing-and-insights-reports.md)
- [`docs/adr/0005-listening-first-audio-engine-clean-navigation-and-read-only-transcript.md`](./docs/adr/0005-listening-first-audio-engine-clean-navigation-and-read-only-transcript.md)
- [`docs/adr/0006-markdown-scenario-authoring-precision-acoustic-stitching-and-lrc-standardization.md`](./docs/adr/0006-markdown-scenario-authoring-precision-acoustic-stitching-and-lrc-standardization.md)
- [`docs/adr/0007-pwa-zero-stale-cache-lifecycle-and-on-demand-media-streaming.md`](./docs/adr/0007-pwa-zero-stale-cache-lifecycle-and-on-demand-media-streaming.md)
- [`docs/adr/0008-manifest-driven-scenario-architecture-on-demand-lrc-streaming-and-curated-content-lifecycle.md`](./docs/adr/0008-manifest-driven-scenario-architecture-on-demand-lrc-streaming-and-curated-content-lifecycle.md)
- [`docs/adr/0009-voice-recording-echoic-shadowing-and-indexeddb-vault.md`](./docs/adr/0009-voice-recording-echoic-shadowing-and-indexeddb-vault.md)

---

## 🏛️ Domain Concepts & Ubiquitous Language

### 1. The Core Shadowing Workflow & Modalities

- **Shadowing**: A deliberate language learning technique where the learner listens to natural spoken audio and repeats (shadows) the speaker in real-time or sentence-by-sentence with minimal delay, mirroring pronunciation, cadence, connected speech, and intonation.
  _Avoid_: Dictation, transcription, lecturing.
- **Scenario**: A curated dialogue or monologue consisting of an authentic audio track (`audio/<id>.mp3`), metadata (title, category, CEFR level, accent, duration, tags, collection), and synchronized bilingual subtitle cues (`audio/<id>.lrc`). Authored in token-efficient Markdown (`scenario.md` with YAML frontmatter) inside `scenarios/<id>/`.
  _Avoid_: Lesson, course, track, playlist item.
- **Scenario Deep Route**: Direct URL query link (`?scenario=<id>`) allowing instantaneous scenario loading and bookmarking with two-way browser history synchronization (`pushState`/`replaceState`/`popstate`).
- **Convention-over-Configuration Media Routing**: Standardizes audio and subtitle paths to `audio/${id}.mp3` and `audio/${id}.lrc` without requiring explicit redundant URLs in the manifest.
- **Precision Acoustic Stitching**: Neural voice audio generation engine injecting exact synthetic MP3 silence frame bytes (500ms between turns, 300ms intra-speaker) matching LRC pause offsets, eliminating cumulative audio/subtitle drift across 1–5 minute tracks.
- **Enhanced LRC Single Source of Truth**: Standardized subtitle format containing millisecond line timecodes, bilingual translations, and intra-line word timestamp tags (`<mm:ss.xx>`), rendering active word-by-word visual highlight effects in sync with audio timecode. (Legacy `.srt` format completely retired).
- **Karaoke Word State**:
  - **Active Word**: Currently articulated word token rendered with a glowing accent pill and micro-scale animation.
  - **Passed Word**: Articulated words in the current sentence rendered with high-contrast sharp white text.
  - **Upcoming Word**: Unspoken words in the current sentence rendered with dimmed slate contrast (`text-slate-400`).
- **Playback & Shadowing Modes**:
  - **Continuous Audio Flow Mode (`continuous`)**: The default playback mode streaming audio naturally without auto-pausing or forced boundary seeks, maintaining millisecond-accurate auto-scrolling and visual focus on the active sentence without audio hitching.
    _Avoid_: Auto-stop mode, podcast mode, loop all.
  - **Interactive Sentence Loop Mode (`loop`)**: Plays a single sentence cue with acoustic lead-out padding (+150ms clamped to next cue start) and micro lead-in (-50ms), cleanly auto-pausing at the sentence boundary with a repeat prompt for shadowing repetition.
  - **Hands-Free Echoic Shadowing Mode (`echoic`)**: An automated SLA turn-taking mode that plays Cue $N$, calculates a dynamic silence pause ($T_{\text{pause}} = \max(2.0\text{s}, \text{duration}\times 1.25)$) with visual countdown while auto-recording the learner's voice, saves the take to IndexedDB, and auto-advances to Cue $N+1$.
- **Subtitle Masking Modes**:
  - **Dual (`both`)**: Primary English subtitle on top with secondary Vietnamese translation below.
  - **English Only (`primary`)**: Hides the translation to focus on target language reading.
  - **Translation Only (`secondary`)**: Displays only the Vietnamese translation to test English recall.
  - **Blind Listening / Blur (`blur`)**: Subtitles remain blurred until hovered or tapped, training pure phonetic recognition before visual confirmation.
    _Avoid_: Subtitle hide button, cc switcher.
- **How to Shadow FTUX Guide**: 3-step beginner-friendly visual on-ramp (1. 🎧 Listen $\to$ 2. 🗣️ Shadow $\to$ 3. 🔍 Inspect) anchored in the catalog header.

---

### 2. Audio Engine & Precision Transport

- **HTML5 Audio Engine (Zero-Seek Streaming)**: Resilient audio playback engine powered by HTML5 `<audio>`, streaming continuous audio tracks without forced seeks at contiguous sentence boundaries to prevent audio buffer hitching.
- **Audio Pitch Preservation (`preservesPitch`)**: Explicit enforcement of `preservesPitch = true` on `<audio id="playerAudio">` across all playback speeds (`0.5x`–`1.5x`), preventing pitch shift artifacts on Safari and iOS WebKit.
- **Acoustic Boundary Padding**: Intelligent +150ms lead-out padding (clamped to next cue start) in Loop Mode ensuring complete phonetic resolution of final plosives and consonants without audio bleeding into adjacent sentences.
- **Speed Selector Popover**: Interactive speed menu offering direct presets (`0.5x`, `0.75x`, `0.85x`, `1.0x`, `1.15x`, `1.25x`, `1.5x`) alongside keyboard stepping hotkeys (`[` and `]`).
- **Pinned Bottom Transport Dock**: Ergonomic transport deck fixed at the bottom of the viewport containing Scrubber with Sentence Milestone markers, Play/Pause/Replay triggers, 1-tap Mic recording button (`#btnDockRecord`), Speed selector popover, Mode toggle (`continuous`/`loop`/`echoic`), and Vocab launcher.
- **IndexedDB Audio Recording Vault (`shadowing_recordings_vault`)**: Zero-backend persistent local database storing learner audio takes as Blobs mapped by compound key `[scenarioId, cueIndex]`.
- **Real-Time Web Audio Waveform Envelope**: Dual visual amplitude canvas powered by `AudioContext` and `AnalyserNode` comparing native speaker cadence against the learner's recorded take.
- **A/B Dynamic Comparative Playback**: Automated playback sequence playing native speaker reference audio followed by a 400ms pause and the learner's recorded take.

---

### 3. Application-First Workspace Architecture

- **App Shell Architecture**: Full-viewport responsive application (`h-screen overflow-hidden flex flex-col`) maximizing practice focus.
- **Minimalist Player Top Bar**: Uncluttered header containing a sleek ghost breadcrumb (`← Back to Catalog`) adjacent to title/CEFR badges, and the Subtitle Mask toggle on the right. (Export LRC/SRT buttons removed).
- **Centerpiece Subtitle Stage**: The hero visual component featuring large, high-contrast active English sentences with word-by-word karaoke glow, Vietnamese translation line, and live timing nudge controls.
- **Read-Only Transcript Navigation Feed (`transcriptCard`)**: Scrollable bilingual script panel positioned in the central workspace for reading and 1-tap sentence jumping. Static typography replaces input fields for pure focus.

---

### 4. Interactive Vocabulary & 5-Box Leitner Spaced Repetition (SRS)

- **Interactive Word Chip**: Clickable word token within subtitle sentences that opens the contextual Word Inspector.
- **Word Inspector**: Contextual inspector card displaying the word, phonetic IPA transcription, Vietnamese meaning, part of speech, dictionary audio pronunciation, and SRS mastery tier.
- **5-Box Leitner Spaced Repetition Engine**:
  - **Box 1 (New / Hard)**: Review interval = **1 day**
  - **Box 2 (Learning - Early)**: Review interval = **3 days**
  - **Box 3 (Learning - Mid)**: Review interval = **7 days**
  - **Box 4 (Learning - Late)**: Review interval = **14 days**
  - **Box 5 (Mastered)**: Review interval = **30 days**
- **SRS Flashcard Review Mode**: 3D card-flip study deck with 3-tier recall grading (`[❌ Hard / Reset to Box 1]`, `[⚡ Good / Advance Box]`, `[🌟 Mastered / Promote to Box 5]`).
- **Header Due Badge**: Real-time counter badge alerting the learner when saved vocabulary items are due for daily spaced repetition.
- **Data Portability**: Full JSON vault backup/restore and CSV Anki-compatible export.

---

### 5. Practice Insights & Progress Reports

- **Insights & Reports Modal**: Dedicated analytical modal triggered from the top navigation bar, tracking:
  - 🔥 **Daily Streak Counter**: Consecutive calendar days with active practice.
  - ⏱️ **Daily Practice Goal Progress**: Ring/progress meter tracking practice minutes against daily target (e.g. 15 min/day).
  - 🗣️ **Sentences Shadowed Count**: Total count of unique sentences repeated.
  - 📦 **SRS Vocabulary Mastery Distribution**: Box 1 through Box 5 inventory.
- **Header Motivation Indicators**: Compact glanceable badges in the header bar (`🔥 Streak`, `📚 Due Count`) maintaining daily motivation without viewport clutter.

### 6. PWA Zero-Stale Lifecycle & Storage Management

- **Network-Only Navigation Strategy**: HTML navigation requests always fetch live application code from the network when online (updating the offline cache copy in the background), eliminating stale cached app code on page refresh while preserving full offline PWA fallback when disconnected.
- **On-Demand Runtime Media Caching**: Audio (`.mp3`) and subtitle (`.lrc`) files are dynamically stored in dedicated Cache Storage (`shadowing-media-v3`) upon playback, drastically shrinking initial PWA installation payload (< 100KB) while ensuring played scenarios are available offline.
- **Silent Controllerchange Reload**: Upgrades to `sw.js` trigger `skipWaiting()` and auto-reload active tabs on `controllerchange` to deliver instant updates without manual cache clearing.
- **Storage Isolation & Safe Maintenance**: User learning progress (SRS Leitner boxes, vocabulary notes, practice streaks, custom voice recordings in IndexedDB) is strictly isolated from HTTP caches. An in-app "Clear Media Cache" action in Insights allows learners to reclaim device audio storage safely.

### 7. Manifest-Driven Scenario Architecture & Curated Lifecycle

- **Embedded Scenario Manifest (`SCENARIOS_MANIFEST`)**: Compact array of lightweight scenario metadata objects (ID, Title, Category, Level, Accent, Duration, Description, Tags, Collection, Sentence Count) embedded in `index.html` (~250 bytes per scenario), guaranteeing sub-millisecond initial UI boot without full LRC text inlining.
- **On-Demand Dynamic Subtitle Streaming**: The application fetches `audio/<id>.lrc` via `fetch()` upon scenario selection, caching parsed cues in-memory and dynamically via Service Worker Cache Storage (`shadowing-media-v3`) for offline practice.
- **Scenario Progress Store (`shadowing_scenario_progress_v1`)**: Persistent localStorage registry tracking user bookmarks (`bookmarkedIds`) and per-scenario completion metrics (`new`, `in_progress`, `completed`, `mastered`, completed sentences set, practice counts, timestamps).
- **Curated Collections & Thematic Tags**: Systematic curriculum grouping scenarios into structured series (`daily-social`, `workplace`, `travel`, `academic`) and searchable topic tags (`#coffee`, `#standup`, `#interview`, `#ai`).
- **Retired Legacy Mechanisms**: Ephemeral custom user imports (`#importModal`, `handleCustomScenarioSubmit`) and legacy SRT fallback parsing (`parseSrt`) are permanently retired to maintain a lean, high-fidelity codebase.

---

## 🔒 Architectural Invariants

1. **Zero-Backend Standalone Execution**: The application runs 100% in the user's browser with zero external server dependencies.
2. **Authentic Audio Delivery**: All curated scenarios utilize real audio files (MP3/OGG/AAC) with zero synthetic Web Speech API SpeechSynthesis fallbacks for scenario playback.
3. **100% Bilingual Parity (VI & EN)**: Every label, button, modal, tooltip, and status message exists in both English and Vietnamese with zero missing translation keys.
4. **Sub-millisecond Audio Reactivity**: Sentence jumping, audio looping, and time-syncing occur instantaneously with zero audible stutter or layout shift.
5. **PWA Offline-First Integrity**: Works completely offline after initial asset caching via standard Service Worker and local storage engines.
6. **Accessibility Floor**: WCAG 2.1 AA compliant color contrast, full keyboard navigability across all features, and accessible aria labels.
