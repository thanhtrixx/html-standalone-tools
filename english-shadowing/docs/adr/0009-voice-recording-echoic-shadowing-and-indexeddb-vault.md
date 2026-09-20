# ADR-0009: Voice Recording Feedback Loop, Hands-Free Echoic Shadowing Mode, and IndexedDB Audio Vault

- **Status:** Accepted
- **Date:** 2026-09-20
- **Scope:** `english-shadowing`

---

## 1. Context & Problem Statement

Following the Milestone 7 manifest-driven scenario refactor and dual-persona audit (First-Time Learner & SLA Product Owner):

1. **Broken Voice Recording Loop**: While the underlying JavaScript codebase retained `startMicRecording()` and `drawDualWaveforms()`, the active HTML markup omitted the microphone recording button (`#btnDockRecord`), hotkey `M`, and the visual comparison canvas (`#dualWaveformCanvas`). Learners were prompted to "Shadow out loud!" without any visual feedback, microphone capture, or ability to replay and compare their attempts.
2. **Ephemeral & Vulnerable Audio Storage**: User voice takes were stored strictly in RAM as temporary `Blob` URLs (`URL.createObjectURL(blob)`), permanently disappearing whenever the tab reloaded or the user navigated away.
3. **Absence of Dedicated Echoic Shadowing**: The player only offered Continuous Play (passive listening) and Sentence Loop (manual looping). Deliberate language acquisition research indicates adult learners require a structured **Echoic Shadowing Protocol** (Listen to cue $\to$ Automatic recording pause for $1.25\times\text{duration}$ $\to$ Auto-advance) for hands-free auditory-motor muscle memory drilling.
4. **Mock Waveform Visualization**: The previous waveform canvas was driven by cosmetic sinusoidal math (`Math.sin + Math.random`) with zero real Web Audio API frequency analysis.
5. **Vocabulary Dictionary Coverage**: The built-in dictionary contained only 15 hardcoded words in `BUILTIN_VOCAB_DB`, returning dummy fallback strings for all other scenario words.
6. **First-Time User Intimidation**: The scenario catalog defaulted to an advanced C1 Academic AI discussion rather than an intuitive A2 beginner on-ramp, and lacked a concise 3-step guide explaining the shadowing technique.

---

## 2. Decision Drivers

- **Complete the Pedagogical Muscle Memory Loop**: Provide seamless 1-tap and automatic voice capture so learners can self-monitor rhythm, prosody, and pronunciation deltas.
- **Hands-Free Auditory-Motor Training**: Support an automated Echoic / Delayed repeat mode that handles turn-taking, countdown, recording, and progression without manual screen interaction.
- **Private, Zero-Backend Audio Persistence**: Store audio takes securely inside the user's browser using IndexedDB (`shadowing_recordings_vault`), preventing memory bloat and preserving practice history across sessions.
- **Real Acoustic Waveform Envelopes**: Leverage the Web Audio API (`AudioContext` and `AnalyserNode`) to compute true audio amplitude envelopes for both native speaker audio and learner takes.
- **Comprehensive Offline Phonetics**: Expand the offline bilingual dictionary from 15 words to ~3,000 essential CEFR A1–C1 vocabulary items with accurate IPA and Vietnamese definitions.
- **Friction-Free Beginner On-Ramp**: Reorder catalog scenarios by difficulty (A2 $\to$ C1), introduce a 3-step "How to Shadow" visual guide, remove developer timing buttons from the primary stage, and ensure robust mobile viewport layout.

---

## 3. Considered Options & Decision Outcome

### A. Voice Recording Persistence & Architecture

- **Option 1 (RAM-Only Blobs)**: Retain in-memory Blob URLs. _(Rejected: Recordings are lost on reload, preventing longitudinal progress tracking)._
- **Option 2 (Base64 in LocalStorage)**: Convert audio Blobs to Base64 strings in `localStorage`. _(Rejected: Audio Blobs rapidly exceed the 5MB localStorage limit and degrade performance)._
- **Option 3 (Chosen - IndexedDB Audio Vault `shadowing_recordings_vault`)**:
  - Implement a dedicated IndexedDB database `shadowing_recordings_vault` with object store `recordings` keyed by compound key `[scenarioId, cueIndex]`.
  - Store raw audio `Blob`, recording timestamp, cue text, and duration.
  - Automatically load existing takes when opening a scenario cue.
  - _Outcome_: Chosen. Fast, scalable, zero memory bloat, and 100% private offline persistence.

### B. Shadowing Modalities & Turn-Taking

- **Option 1 (Manual Loop Only)**: Require learners to manually press Play, press Record, press Stop, and press Next. _(Rejected: High cognitive friction disrupts shadowing flow)._
- **Option 2 (Chosen - Tri-Modal Engine: Continuous, Sentence Loop, and Hands-Free Echoic)**:
  - **1. Continuous Mode (`continuous`)**: Continuous listening stream with karaoke sync.
  - **2. Sentence Loop Mode (`loop`)**: Repeats single cue with +150ms acoustic padding.
  - **3. Hands-Free Echoic Mode (`echoic`)**:
    - Plays Cue $N$.
    - Auto-pauses at cue end and computes silence duration:
      $$T_{\text{pause}} = \max\left(2.0\text{s}, \, \text{Cue Duration} \times 1.25\right)$$
    - Automatically arms microphone and displays a visual countdown ring.
    - At countdown completion, saves the voice take to IndexedDB and auto-advances to Cue $N+1$.
  - _Outcome_: Chosen. Empowers hands-free practice while commuting, walking, or focusing entirely on speech.

### C. Waveform Comparison & Audio Engine

- **Option 1 (Cosmetic Mock Math)**: Retain sinusoidal canvas animation. _(Rejected: Misleading to learners)._
- **Option 2 (Chosen - Real Web Audio API Amplitude Envelope)**:
  - Use `AudioContext` and `AnalyserNode` during microphone recording and audio decoding to extract normalized RMS amplitude envelopes (30 bins).
  - Render stacked or superimposed dual canvas: Emerald Green (Native Reference) vs Cyan (Learner Take).
  - Ensure `<audio id="playerAudio">` has `preservesPitch = true` (and `webkitPreservesPitch`, `mozPreservesPitch`) enabled across all speed rates (`0.5x`–`1.5x`).
  - _Outcome_: Chosen. Accurate visual feedback without external libraries.

### D. Offline Dictionary Expansion

- **Option 1 (Online Dynamic API Fallback)**: Query an external dictionary API when clicking words. _(Rejected: Breaks zero-backend and offline-first PWA invariants)._
- **Option 2 (Chosen - Embedded Essential 3,000-Word IPA/VI Database)**:
  - Embed a compressed dictionary database (`ESSENTIAL_VOCAB_DB`) covering ~3,000 essential CEFR A1–C1 vocabulary items.
  - Provide accurate IPA, part of speech, and Vietnamese definitions.
  - Add simple lemmatization (handling `-s`, `-ed`, `-ing`, `-ly`) for robust matching.
  - _Outcome_: Chosen. Instantaneous lookup, complete offline readiness, and high educational value.

---

## 4. Consequences

### Positive

- **Closed Pedagogical Loop**: Learners can listen, shadow, record, visually compare waveforms, and inspect pronunciation in one cohesive flow.
- **Hands-Free Deliberate Practice**: Echoic mode automates the entire drill cycle with intelligent pause timing.
- **Longitudinal Progress**: Recordings are saved locally in IndexedDB, allowing learners to hear their own accent and cadence improvements over time.
- **Beginner Friendly**: Catalog reordering (A2 $\to$ C1) and the 3-step onboarding guide make the app immediately approachable to all proficiency levels.
- **Audio Fidelity Guarantee**: `preservesPitch` eliminates voice distortion on Safari/iOS across variable speeds.

### Negative / Trade-offs

- First-time microphone permission request must be granted by the user to use recording features (gracefully handled via non-blocking toast notifications if denied).
