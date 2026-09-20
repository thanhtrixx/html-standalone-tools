# English Shadowing Player — Product Specification

## 🌟 Executive Summary & Vision

The **English Shadowing Player** is an offline-capable, standalone Progressive Web Application (PWA) engineered for intermediate and advanced language learners to master natural spoken English cadence, connected speech, and intonation through deliberate shadowing practice.

By combining authentic high-fidelity audio recordings, millisecond-accurate word-level karaoke synchronization via Enhanced LRC format, instant keyboard sentence looping, 1-tap microphone intonation comparison, and a 5-box Leitner spaced repetition system, the tool delivers a distraction-free, zero-backend immersion workstation.

---

## 🎯 Target Personas & Jobs-to-be-Done (JTBD)

### 1. The Global Knowledge Worker / Developer (B1 $\to$ C1)

- **Pain Point**: Understands written English and technical documentation well, but speaks haltingly with monotonous cadence, struggling in real-time meetings and sprint standups.
- **JTBD**: "When I have 15 minutes before work, I want to drill realistic workplace standups and dialogues sentence-by-sentence with visual karaoke feedback so I can speak with confidence and natural rhythm."

### 2. The IELTS / Academic Test Taker (Band 6.0 $\to$ 8.0)

- **Pain Point**: Loses points on pronunciation, intonation curves, and natural liaisons during speaking examinations.
- **JTBD**: "When preparing for academic interviews, I want to record my voice and visually compare my pitch and speech envelope against native British and American speakers to fix cadence errors."

---

## 🚀 Key Feature Pillars

### 1. Curated Scenario Catalog & Authentic Audio Pipeline

- 6 curated scenarios spanning CEFR levels A2 through C1 across US, UK, and AU accents (`specialty-coffee`, `hotel-checkin`, `tech-standup`, `airport-security`, `job-interview`, `academic-ai`).
- 100% authentic high-fidelity audio files (MP3) generated via neural voices with precision acoustic silence stitching, with zero synthetic speech fallbacks.
- Manifest-driven catalog with multi-facet filters (Collection, Level, Accent, Status, Search) and persistent progress tracking (`shadowing_scenario_progress_v1`).
- 3-step beginner-friendly "How to Shadow" onboarding guide.

### 2. Enhanced LRC Karaoke Subtitle Stage

- Dynamic word-by-word active glow pill and ghosted upcoming text flow.
- Dual-language bilingual subtitles (English & Vietnamese) with 4 masking modes: `Dual`, `English Only`, `Vietnamese Only`, and `Blind Listening Blur`.
- Interactive word chips with instant 3,000-word offline phonetic IPA dictionary lookup and 1-click SRS save triggers.

### 3. Precision Audio Engine & Pinned Transport Dock

- Zero-seek continuous audio streaming with `preservesPitch` protection across all playback rates (`0.5x`, `0.75x`, `0.85x`, `1.0x`, `1.15x`, `1.25x`, `1.5x`).
- Pinned bottom transport dock with milestone tick scrubber, replay (`R`), sentence step (`A` / `D`), and 3 shadowing modes (`Continuous`, `Sentence Loop`, and `Hands-Free Echoic`).
- Acoustic boundary lead-out padding (+150ms) preventing plosive audio clipping in sentence-based drills.

### 4. Microphone Voice Recording & Waveform Envelope Comparison

- 1-tap in-dock voice recording (`M`) capturing learner attempts via `MediaRecorder`.
- Real Web Audio API amplitude envelope comparison canvas (Native Reference vs Learner Take).
- Automated A/B comparative playback sequence (`Native` $\to$ `0.4s pause` $\to$ `Learner Take`).
- Persistent IndexedDB audio vault (`shadowing_recordings_vault`) storing learner practice takes across sessions.

### 5. Hands-Free Echoic (Delayed) Shadowing Protocol

- Automated SLA turn-taking mode for hands-free practice while commuting or walking.
- Dynamic pause window calculation: $T_{\text{pause}} = \max(2.0\text{s}, \text{Cue Duration} \times 1.25)$.
- Visual countdown timer, automated microphone recording, and seamless auto-progression to the next sentence.

### 6. 5-Box Leitner Spaced Repetition (SRS) & Vocabulary Deck

- 5 review intervals (1d, 3d, 7d, 14d, 30d) with 3D card-flip flashcards.
- Real-time due badge in header, daily streak tracking, and Anki CSV / JSON backup export.

### 7. Read-Only Bilingual Transcript Navigation Feed

- High-contrast bilingual script panel in the central workspace for effortless reading and 1-tap sentence jumping.
- Clean distraction-free immersion without inline editing clutter.
