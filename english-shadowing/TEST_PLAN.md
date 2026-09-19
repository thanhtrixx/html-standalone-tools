# Test Plan: English Shadowing Player

> **Tool Directory:** `english-shadowing/`
> **Lifecycle Phase:** `Active Feature Development`

---

## 1. Test Architecture & Scope

This test plan defines the automated verification suites for the English Shadowing Player. Tests ensure mathematical precision for timecode parsing, zero-delay audio playback logic, reliable state transitions, full bilingual parity, responsive UX across devices, Leitner SRS algorithm correctness, and audio recording fallbacks.

---

## 2. Test Suites Matrix

| Test File                                     | Focus Area                                                                                                                                                                            | Assertions Count Goal |
| :-------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------- |
| `tests/english-shadowing-engine.test.js`      | SRT parsing, timestamp conversion (`HH:MM:SS,mmm` $\leftrightarrow$ seconds), active cue detection, sentence filtering, text tokenization, smart SRT sanitization, live timing nudges | $\ge 40$              |
| `tests/english-shadowing-storage.test.js`     | Vocabulary status persistence, Leitner 5-box intervals and due dates calculation, scenario caching, export/import serialization                                                       | $\ge 20$              |
| `tests/english-shadowing-i18n.test.js`        | Bilingual parity check, 100% dictionary key matching between EN and VI, missing interpolation parameter checks                                                                        | $\ge 80$              |
| `tests/english-shadowing-ui.test.js`          | DOM structure, hotkey keydown routing, subtitle masking toggles, speed stepper logic, loop/continuous mode switching, mic recorder controls, streak hub                               | $\ge 35$              |
| `tests/e2e/english-shadowing-devices.spec.js` | Playwright multi-device verification (Desktop, iPhone, Android), scenario selection, audio playback simulation, vocab drawer interactions, flashcard reviews                          | Full pass             |

---

## 3. Key Invariants Checked

1. **SRT Parsing & Sanitization Resilience:** Validates parsing of standard SRT files, stripping of speaker labels (`Speaker 1:`) and noise tags (`[Music]`), comma vs dot milliseconds, and dual English/Vietnamese line breaks.
2. **Leitner SRS Date Mathematical Accuracy:** Validates that Box 1 $\to$ 1d, Box 2 $\to$ 3d, Box 3 $\to$ 7d, Box 4 $\to$ 14d, Box 5 $\to$ 30d, and Hard reset returns to Box 1 (1d).
3. **Timing Nudge Invertibility:** Validates that nudging $+100\text{ms}$ then $-100\text{ms}$ maintains sub-millisecond precision.
4. **Microphone & Audio Fallback Safety:** Validates graceful handling when `MediaRecorder` is mocked as unsupported or denied.
5. **Bilingual Parity:** Ensures every UI element rendered has corresponding non-empty entries in both `en` and `vi` objects.
