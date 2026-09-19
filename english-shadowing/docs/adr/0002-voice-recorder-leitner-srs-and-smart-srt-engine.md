# ADR 0002: Voice Recording Comparison, Leitner SRS Engine, and Smart SRT Pipeline

## Status

Accepted

## Context

Following initial prototyping and user discovery, learners identified four critical enhancement vectors to maximize deliberate practice effectiveness:

1. **Auditory Self-Comparison**: Learners need to hear their own voice side-by-side with native speakers to calibrate pitch, linking, and intonation without switching between recording apps.
2. **Long-Term Vocabulary Retention**: Static word status tags (New/Learning/Mastered) lack automated review scheduling; a mathematical spaced repetition system is required.
3. **Imperfect Subtitle Timing Resilience**: Custom imported `.srt` files often contain slight timing offsets or messy annotations (`[Music]`, `Speaker 1:`).
4. **Daily Habit Motivation**: Learners need a daily streak and practice goal dashboard to maintain momentum.

## Decision

1. **1-Tap Microphone Recorder & Dual Comparison**:
   - Utilize `MediaRecorder` API with dynamic MIME detection (`audio/webm`, `audio/mp4`, `audio/aac`, `audio/wav`).
   - Implement an automated comparative playback flow: `[Play Native Speaker]` $\to$ `0.5s pause` $\to$ `[Play Learner Voice]`.
   - Render synchronized waveform envelopes on HTML5 Canvas.
2. **5-Box Leitner Spaced Repetition (SRS)**:
   - Implement Leitner algorithm with intervals: Box 1 (1d), Box 2 (3d), Box 3 (7d), Box 4 (14d), Box 5 (30d / Mastered).
   - Grade reviews with 3 actionable choices: `[Hard / Reset]`, `[Good / Advance]`, `[Mastered / Promote]`.
   - Maintain `dueAt` timestamps and display a header badge for items due today.
3. **Smart SRT Sanitization & Live Timing Nudge**:
   - Strip noise tags (`[Applause]`, `(Laughter)`) and speaker prefixes (`Speaker 1:`, `Name: `).
   - Add $\pm 100\text{ms}$ timestamp nudge buttons for live calibration during listening.
   - Provide direct 1-click SRT file export reflecting all timestamp and text modifications.
4. **Daily Practice Dashboard**:
   - Track daily streak, active practice minutes, and total shadowed sentence repetitions in `localStorage`.

## Consequences

- **Positive**: High-precision deliberate practice loop, rapid intonation calibration, automated vocabulary retention scheduling, and enhanced resilience for third-party subtitle imports.
- **Trade-offs**: Requires browser microphone hardware permissions (gracefully degradable if denied).
