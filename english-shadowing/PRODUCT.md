# Product Definition: English Shadowing Player

> **Tool Directory:** `english-shadowing/`
> **Primary URL Path:** `/english-shadowing/`
> **Lifecycle Phase:** `Active Feature Development` ([ADR-0003](../docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md))

---

## 1. Positioning & Mission

The **English Shadowing Player** is a focused, distraction-free Progressive Web Application (PWA) designed for ESL and Vietnamese learners to master natural English rhythm, linking, and conversational fluency.

Unlike passive video players or complex subscription apps, the English Shadowing Player transforms audio and dual `.srt` subtitles into a high-ergonomics deliberate practice workstation. Learners can loop sentences with zero latency, toggle subtitle visibility to train blind listening, click words to inspect IPA phonetics and Vietnamese meanings, and manage vocabulary acquisition across 3 distinct mastery tiers—all running 100% offline with zero server dependencies.

---

## 2. Target Users & Jobs-to-be-Done

### Primary Persona

- **The Spoken Fluency Builder:** Intermediate to advanced English learners (e.g. Vietnamese professionals, IELTS candidates, software engineers) who can read English well but struggle with spoken cadence, connected speech, and listening comprehension in real-time conversations.

### Key Jobs-to-be-Done (JTBD)

1. **Deliberate Shadowing:** "When I listen to natural English dialogue, I want to repeat sentence-by-sentence with instant replay hotkeys, so that I can calibrate my intonation without fiddling with awkward video scrubbers."
2. **Blind Listening Training:** "When I practice listening, I want to quickly blur or hide subtitles and reveal them only after attempting to understand, so that my ears do not rely on visual crutches."
3. **In-Context Vocabulary Acquisition:** "When I encounter an unfamiliar word in a dialogue, I want to tap it to see its phonetic spelling, Vietnamese definition, and add it to my color-coded vocab deck with one tap."
4. **Offline Everywhere:** "When I'm commuting or offline, I want to open my practice scenarios and drill sentences with zero network delay."

---

## 3. Core Features & Capabilities

| Module                              | Capabilities                                                                                                                                                                        |
| :---------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario Catalog & Filter Hub**   | Multi-facet filtering by category (Daily, Business, Travel, Academic), CEFR level (A2–C1), and accent (US, UK). Full-text keyword search across titles, summaries, and transcripts. |
| **Dual Playback Modes**             | **Interactive Sentence Loop Mode** (auto-pauses at sentence boundary for repetition) & **Continuous Flow Mode** (uninterrupted streaming with synchronized auto-scrolling).         |
| **Voice Recorder & Intonation A/B** | 1-tap/hotkey (`M`) mic recording capturing spoken attempt, dual waveform display, and automated sequential comparison (`[Play Native]` $\to$ `0.5s pause` $\to$ `[Play My Voice]`). |
| **Smart SRT & Live Timing Nudge**   | Auto-strips speaker labels and noise tags; provides $\pm 100\text{ms}$ timestamp nudge buttons and inline text editing with 1-click SRT download.                                   |
| **Tactile Keyboard Controls**       | `Space` (Play/Pause/Loop), `R` / `Up` (Replay Sentence), `Left`/`Right`/`A`/`D` (Skip), `[` / `]` (Speed), `1-4` (Subtitle Mode), `V` (Vocab), `M` (Record), `?` (Cheat Sheet).     |
| **Subtitle Masking System**         | One-tap switching between Dual Subtitles, English Only, Vietnamese Only, and Blur/Blind Listening mode.                                                                             |
| **Leitner SRS Vocabulary Deck**     | 5-box spaced repetition intervals (1d, 3d, 7d, 14d, 30d), 3-tier color coding, header Due badge, flashcard review with 3-grade feedback, and Anki CSV/JSON export.                  |
| **Daily Practice & Streak Hub**     | Tracks consecutive day streaks (🔥), daily practice minutes goal ring, and total sentences shadowed.                                                                                |
| **Custom Scenario Import**          | Direct file drop for custom audio files (`.mp3`, `.wav`, `.m4a`, `.ogg`) and `.srt` subtitle files or structured JSON scenario bundles.                                             |
| **Zero-Backend PWA**                | Service Worker asset caching, IndexedDB scenario and audio cache, `localStorage` preferences, 100% offline capability.                                                              |

---

## 4. Product Constraints & Repository Invariants

- **Single-File Zero-Backend Architecture:** Self-contained client-side web application requiring no Node server or cloud database at runtime.
- **Bilingual Parity:** 100% UI translation coverage across English and Vietnamese (`I18N.md`).
- **Tactile Ergonomics:** Zero auditory stutter or UI delay during hotkey sentence replay.
- **Accessibility Floor:** WCAG 2.1 AA compliant color contrast, full keyboard navigation, accessible ARIA attributes on audio transport controls.
- **Data Privacy:** All vocabulary data, custom audio files, and practice records reside entirely on the user's local device.
