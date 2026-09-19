# ADR-0003: Enhanced LRC Karaoke Timing Engine, CDN/Local Audio Architecture, and Integrated Player Dock

- **Status:** Accepted
- **Date:** 2026-09-19
- **Scope:** `english-shadowing`

---

## 1. Context & Problem Statement

The initial release of the English Shadowing Player relied on the browser's built-in `window.speechSynthesis` (Web Speech API) as a synthetic fallback for preloaded practice scenarios and placed the `transport-dock` at the bottom of the viewport below the transcript list.

While functional as a prototype, user deliberate practice feedback revealed three key limitations:

1. **Robotic Cadence & Pronunciation Inaccuracies**: Synthesized speech lacks natural conversational cadence, intonation curves, connected speech liaisons, and emotional nuance essential for effective shadowing.
2. **Missing Karaoke Real-Time Word Tracking**: Standard sentence-level `.srt` subtitles lack word-level millisecond timing, preventing real-time karaoke-style word highlighting as the speaker talks.
3. **Ergonomic Disconnect**: Placing the transport dock below a long scrollable transcript list separated the user's visual focus (the subtitle screen) from the physical playback controls (replay, speed, loop, and record).

---

## 2. Decision Drivers

- **Natural Speech Quality**: All curated practice scenarios must use authentic high-fidelity natural audio recordings (generated via Microsoft Edge TTS with neural voices or studio recordings) with zero robotic artifacts.
- **Millisecond-Accurate Karaoke Synchronization**: The engine must support Enhanced LRC format (`.lrc`) with intra-line word timestamps (`<mm:ss.xx>`) for real-time word highlighting and pacing.
- **Ergonomic Layout & Cohesive UI**: The transport dock must sit directly underneath the player's subtitle screen inside a unified Player Card container, positioning primary controls within natural thumb and eye-tracking reach.
- **Zero-Backend & Offline Integrity**: All audio assets and subtitle files must support 100% offline PWA caching via Service Worker with zero runtime cloud dependencies.
- **Backward Compatibility**: Seamlessly import and export both Enhanced LRC and standard SRT formats.

---

## 3. Considered Options & Decision Outcome

### A. Subtitle & Karaoke Timing Format

- **Option 1**: Standard `.srt` with estimated character interpolation.
- **Option 2 (Chosen)**: **Enhanced LRC (`.lrc`) with Intra-Line Word Timestamps**:
  ```lrc
  [00:00.00]<00:00.00>Good <00:00.35>morning! <00:01.05>What <00:01.30>can <00:01.50>I <00:01.64>get <00:01.90>started <00:02.40>for <00:02.60>you <00:02.80>today?
  [00:00.00]Chào buổi sáng! Tôi có thể chuẩn bị gì cho bạn hôm nay?
  ```
  - _Outcome_: Chosen. Provides compact, standard karaoke timestamping with bilingual dual-language support and lightweight parsing.

### B. Audio Delivery Architecture

- **Option 1**: Web Speech API `SpeechSynthesis`.
- **Option 2 (Chosen)**: **Local Asset Bundling & CDN Mirroring with HTML5 Audio**: Pre-generate scenario audio files using neural voices (`en-US-AndrewMultilingualNeural`, `en-GB-RyanNeural`, `en-US-AvaMultilingualNeural`) and store in `english-shadowing/audio/`, pre-cached by Service Worker.
  - _Outcome_: Chosen. Guarantees authentic cadence, instant start, and offline readiness.

### C. Visual Layout & Transport Positioning

- **Option 1**: Fixed floating bottom transport bar.
- **Option 2 (Chosen)**: **Integrated Player Card Architecture**:
  - Unifies `#subtitleStage` and `#transport-dock` into a single hero container.
  - Places the Transcript & Inline Editor below the controls in a collapsible accordion layout.
  - _Outcome_: Chosen. Maximizes focus and eliminates scroll jumping.

---

## 4. Consequences

### Positive

- **Auditory Immersion**: Natural speech acoustics enable realistic pitch, stress, and reduction shadowing.
- **Visual Cadence Feedback**: Word-by-word karaoke glow guides the learner's eyes at native speech velocity.
- **Ergonomic Usability**: Immediate access to replay, record, and scrubber controls directly under the active subtitle.
- **Flexible Data Interchange**: 1-click export to Enhanced LRC and standard SRT formats.

### Negative / Trade-offs

- Adding audio files slightly increases the repository static asset size (~1.5 MB for all preloaded scenarios), mitigated by efficient 48kbps MP3 encoding and Service Worker caching.
