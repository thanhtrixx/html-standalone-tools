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

- 4 preloaded scenarios spanning CEFR levels A2 through C1 across US and UK accents (Coffee Shop, Tech Standup, Airport Security, AI Discourse).
- 100% authentic high-fidelity audio files (MP3) generated via neural voices or live studio tracks, with zero robotic speech synthesis fallbacks.
- 1-click import of custom audio (`.mp3`, `.wav`, `.m4a`, `.ogg`) paired with Enhanced LRC (`.lrc`) or `.srt` files.

### 2. Enhanced LRC Karaoke Subtitle Stage

- Dynamic word-by-word active glow pill and ghosted upcoming text flow.
- Dual-language bilingual subtitles (English & Vietnamese) with 4 masking modes: Dual, English Only, Vietnamese Only, and Blind Listening Blur.
- Word chips with 1-click phonetic IPA dictionary lookup and SRS save triggers.

### 3. Integrated Player Card & Ergonomic Transport

- Unified hero player card with transport controls placed directly under the subtitle screen.
- Scrubber with interactive sentence milestone tick marks for instant seek.
- Speed adjusters (`0.75x`, `0.9x`, `1.0x`, `1.25x`, `1.5x`), sentence loop toggle, 1-key replay (`R`), and previous/next navigation (`A` / `D`).

### 4. Microphone Voice Recording & Intonation Delta Canvas

- 1-tap voice recording (`M`) capturing learner attempts via `MediaRecorder`.
- Dual waveform comparison canvas displaying native speaker vs learner envelope.
- Automated A/B comparative playback sequence (`Native` $\to$ `0.5s pause` $\to$ `My Voice`).

### 5. 5-Box Leitner Spaced Repetition (SRS) & Vocabulary Deck

- 5 review intervals (1d, 3d, 7d, 14d, 30d) with 3D card-flip flashcards.
- Real-time due badge in header and JSON/Anki CSV export/import.

### 6. Collapsible Transcript & Inline Timing Nudge Editor

- Collapsible script drawer below the transport dock.
- Live $\pm 100\text{ms}$ timing nudges and inline subtitle text editing with 1-click LRC/SRT export.
