# Implementation Backlog: English Shadowing Player

> **Tool Directory:** `english-shadowing/`
> **Lifecycle Phase:** `Active Feature Development`

---

## 🎯 Phase 1: Core Foundation & Subtitle/Audio Engine

- [x] Create standalone application shell (`index.html`) with inline Tailwind CSS and Lucide SVG icons.
- [x] Implement robust `.srt` subtitle parser supporting timestamps (`HH:MM:SS,mmm`), line indexing, and bilingual format detection.
- [x] Implement HTML5 Audio playback controller with sub-millisecond seek times and zero playback latency.
- [x] Implement Dual Playback Modes: Interactive Sentence Loop Mode (auto-pauses at cue end) and Continuous Flow Mode.
- [x] Implement live sentence synchronizer with auto-scroll and glow highlights on active sentence.

---

## 🎯 Phase 2: Tactile Ergonomics & Interactive Vocabulary System

- [x] Implement hotkey controller: `Space` (Play/Pause/Replay), `R`/`Up` (Replay Sentence), `Left`/`Right`/`A`/`D` (Skip), `[`/`]` (Speed), `1-4` (Subtitle Mode), `V` (Vocab Drawer), `?` (Cheat Sheet).
- [x] Implement 4 Subtitle Masking Modes: Dual, English Only, Vietnamese Only, Blur/Blind Listening.
- [x] Implement Interactive Word Chip tokenization across subtitle sentences.
- [x] Implement Word Popover with IPA phonetic transcription, Vietnamese translation, pronunciation speaker, and 3-tier status selector.
- [x] Implement persistent 3-tier color-coding in subtitle text (🟡 New, 🔵 Learning, 🟢 Mastered).

---

## 🎯 Phase 3: Catalog, Curated Scenarios & Custom Import

- [x] Build multi-facet Scenario Catalog with Category, CEFR Level, Accent, and Search filters.
- [x] Bundle high-quality preloaded scenarios across Daily Conversations, Workplace & Tech, Travel, and Academic/IELTS topics.
- [x] Implement Custom Scenario Importer allowing users to load custom audio files (`.mp3`, `.wav`, etc.) and `.srt` subtitle files.
- [x] Implement sliding Vocabulary Drawer with search, status filters, pronunciation review, and flashcard practice mode.
- [x] Implement Vocab JSON/CSV export and import for spaced repetition backups.

---

## 🎯 Phase 4: PWA Offline Capabilities, Storage & Internationalization

- [x] Create PWA Web App Manifest (`manifest.json`, `manifest.webmanifest`) and Service Worker (`sw.js`).
- [x] Create high-craft SVG vector icon (`icon.svg`).
- [x] Implement IndexedDB / `localStorage` persistence for scenarios, user vocabulary, and settings.
- [x] Ensure 100% bilingual parity between English and Vietnamese.
- [x] Verify WCAG 2.1 AA contrast compliance in Dark and Light themes.

---

## 🎯 Phase 5: Smart SRT Sanitization, Timing Nudges & 1-Click Export

- [ ] Implement Smart SRT Sanitizer removing speaker labels (`Speaker 1:`) and noise tags (`[Music]`, `(Laughter)`).
- [ ] Implement $\pm 100\text{ms}$ live timestamp nudge controls for start/end boundaries of active cue.
- [ ] Implement inline text editing for English and Vietnamese subtitle lines.
- [ ] Implement 1-click `[Export Updated SRT]` downloading modified `.srt` subtitle files.

---

## 🎯 Phase 6: 1-Tap Voice Recording & Dual Comparison Flow

- [ ] Implement `MediaRecorder` audio capture with cross-browser MIME format detection (`webm`/`mp4`/`aac`/`wav`).
- [ ] Implement Canvas dual waveform visualizers (Native Speaker vs. Learner Voice).
- [ ] Implement automated sequential playback (`[Play Native]` $\to$ `0.5s pause` $\to$ `[Play My Voice]`) with hotkey `M`.
- [ ] Implement non-intrusive notification fallback if mic permissions are denied or unavailable.

---

## 🎯 Phase 7: 5-Box Leitner Spaced Repetition (SRS) Engine

- [ ] Implement 5-box Leitner scheduling engine with intervals (1d, 3d, 7d, 14d, 30d).
- [ ] Add header review reminder badge indicating vocabulary items due today.
- [ ] Implement 3-grade flashcard review actions (`[❌ Hard]`, `[⚡ Good]`, `[🌟 Mastered]`).
- [ ] Add Anki CSV export package with phonetic IPA and Vietnamese meanings.

---

## 🎯 Phase 8: Daily Shadowing Practice Hub & Motivation Tracking

- [ ] Implement Daily Practice Dashboard banner with Streak Counter (🔥).
- [ ] Implement daily shadowing practice minutes tracker against target goal (e.g. 15 min).
- [ ] Implement total sentence repetition counter with celebratory completion animation.
