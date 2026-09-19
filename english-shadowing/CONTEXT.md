# English Shadowing Player

> **Lifecycle Phase:** `Active Feature Development` ([ADR-0003](../docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md))

A standalone, mobile-first Progressive Web Application (PWA) designed for deliberate English shadowing, auditory muscle memory, dual-language subtitle synchronization (.srt), instant keyboard-driven sentence looping, 1-tap microphone self-comparison, 5-box Leitner spaced repetition (SRS), smart SRT sanitization with live timing nudges, and private zero-backend offline persistence.

For Vietnamese domain vocabulary, copywriting standards, and bilingual translation dictionary, refer to [`I18N.md`](./I18N.md).
For visual design tokens, typography scales, dark/light themes, and audio transport ergonomics, refer to [`DESIGN.md`](./DESIGN.md).
For product positioning, user personas, and core jobs-to-be-done, refer to [`PRODUCT.md`](./PRODUCT.md).
For test matrix and quality verification strategy, refer to [`TEST_PLAN.md`](./TEST_PLAN.md).
For implementation roadmap and tracked milestones, refer to [`ITEMS_TO_IMPLEMENT.md`](./ITEMS_TO_IMPLEMENT.md).
For architectural decision records, refer to:

- [`docs/adr/0001-english-shadowing-pwa-architecture-and-data-model.md`](./docs/adr/0001-english-shadowing-pwa-architecture-and-data-model.md)
- [`docs/adr/0002-voice-recorder-leitner-srs-and-smart-srt-engine.md`](./docs/adr/0002-voice-recorder-leitner-srs-and-smart-srt-engine.md)

---

## 🏛️ Domain Concepts & Ubiquitous Language

### 1. The Core Shadowing Workflow & Modalities

- **Shadowing**: A deliberate language learning technique where the learner listens to natural spoken audio and repeats (shadows) the speaker in real-time or sentence-by-sentence with minimal delay, mirroring pronunciation, cadence, connected speech, and intonation.
  _Avoid_: Karaoke, dictation, transcription, lecturing.
- **Scenario**: A curated or user-imported dialogue/monologue consisting of an audio track, metadata (title, category, CEFR level, accent, word count), and synchronized dual-language subtitle cues (`.srt`).
  _Avoid_: Lesson, course, track, playlist item.
- **Playback Modes**:
  - **Interactive Sentence Loop Mode (`loop`)**: The player plays a single sentence cue, reaches the timestamp boundary, and automatically pauses or enters a shadow repetition window. Provides instantaneous 1-tap/1-key replay (`R` / `Space`) to drill difficult sentences.
  - **Continuous Audio Flow Mode (`continuous`)**: The player streams audio naturally without auto-pausing, while maintaining millisecond-accurate auto-scrolling and visual focus on the active sentence.
    _Avoid_: Auto-stop mode, podcast mode, loop all.
- **Subtitle Masking Modes**:
  - **Dual (`both`)**: Primary English subtitle on top with secondary Vietnamese translation below.
  - **English Only (`primary`)**: Hides the translation to focus on target language reading.
  - **Translation Only (`secondary`)**: Displays only the Vietnamese translation to test English recall.
  - **Blind Listening / Blur (`blur`)**: Subtitles remain blurred until hovered or tapped, training pure phonetic recognition before visual confirmation.
    _Avoid_: Subtitle hide button, cc switcher.

---

### 2. Microphone Voice Recording & Intonation Self-Comparison

- **Shadowing Recording Attempt**: An in-memory audio capture of the learner's spoken shadowing attempt recorded via `MediaRecorder` API with auto-detected browser MIME format (`audio/webm`, `audio/mp4`, `audio/aac`, `audio/wav`).
- **Dual Waveform Visualizer**: Synchronized visual audio amplitude bars rendered on canvas comparing the Native Speaker's acoustic envelope against the Learner's recorded voice take.
- **Auto-Comparative Sequence**: 1-tap automated playback flow (`[Play Native Speaker]` $\to$ `0.5s pause` $\to$ `[Play My Voice]`) engineered for instant auditory delta perception and pitch/cadence calibration.
- **Mic Permission Fallback**: Non-intrusive notification handling if microphone hardware is unavailable or permissions are dismissed, preserving core playback features without app interruption.

---

### 3. Smart SRT Engine, Timing Nudges & Live Editor

- **Subtitle Cue**: A single timed unit parsed from an `.srt` stream, containing `index`, `startSeconds`, `endSeconds`, `rawEnglish`, `rawVietnamese`, and tokenized `words`.
- **Smart SRT Sanitizer**: Automatic detection and stripping of speaker labels (`Speaker 1:`, `John: `) and sound effect annotations (`[Applause]`, `(Laughter)`), supporting single-line English and dual-line bilingual formats.
- **Live Timing Nudge**: Micro-adjuster controls allowing users to nudge sentence start/end timestamps by $\pm 100\text{ms}$ while listening.
- **Inline Subtitle Editor**: Direct in-app text editing for English lines and Vietnamese translations.
- **1-Click SRT Export**: Instant generation and download of formatted `.srt` subtitle files reflecting all timing nudges and text corrections.

---

### 4. Interactive Vocabulary & 5-Box Leitner Spaced Repetition (SRS)

- **Interactive Word Chip**: Clickable word token within subtitle sentences that opens the contextual Word Inspector.
- **Word Inspector**: Contextual inspector card displaying the word, phonetic IPA transcription, Vietnamese meaning, part of speech, audio pronunciation, and SRS mastery tier.
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

### 5. Unified Daily Practice Hub & Motivation Tracking

- **Daily Practice Hub**: Sticky header dashboard tracking:
  - 🔥 **Daily Streak Counter**: Consecutive calendar days with active practice.
  - ⏱️ **Daily Shadowing Minutes Goal**: Progress ring tracking practice minutes against target (e.g. 15 min/day).
  - 🗣️ **Sentences Shadowed Count**: Total count of unique sentences repeated.
  - 📚 **Due Vocabulary Review Count**: Real-time SRS review backlog.

---

## 🔒 Architectural Invariants

1. **Zero-Backend Standalone Execution**: The application runs 100% in the user's browser with zero external server dependencies.
2. **100% Bilingual Parity (VI & EN)**: Every label, button, modal, tooltip, and status message exists in both English and Vietnamese with zero missing translation keys.
3. **Sub-millisecond Audio Reactivity**: Sentence jumping, audio looping, and time-syncing occur instantaneously with zero audible stutter or layout shift.
4. **PWA Offline-First Integrity**: Works completely offline after initial asset caching via standard Service Worker and local storage engines.
5. **Accessibility Floor**: WCAG 2.1 AA compliant color contrast, full keyboard navigability across all features, and accessible aria labels.
