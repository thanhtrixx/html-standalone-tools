# ADR 0001: English Shadowing PWA Architecture and Data Model

## Status

Accepted

## Context

Language learners require deliberate, low-latency practice environments to develop auditory shadowing muscle memory, intonation, and vocabulary acquisition. Traditional video players or cloud-hosted platforms introduce friction (heavy bandwidth usage, playback buffering, no dedicated sentence-looping hotkeys, lack of dual subtitle masking, and subscription paywalls).

We need a 100% standalone, client-side, zero-backend Progressive Web Application that enables users to browse curated real-world scenarios or import their own audio and `.srt` files, repeat sentence-by-sentence with instant hotkeys, inspect words with IPA phonetics and translations, and track vocabulary mastery tiers offline.

## Decision

1. **Single-File Standalone Architecture**:
   - Deliver the entire application in a self-contained `index.html` file using inline Tailwind CSS design tokens and vanilla ES2022 JavaScript without heavy framework runtimes.
2. **Audio & Subtitle Sync Engine**:
   - Utilize standard HTML5 `Audio` element coupled with a high-precision SRT parser.
   - Support both **Interactive Sentence Loop Mode** (auto-pauses at cue boundary for immediate vocal repetition) and **Continuous Flow Mode** (streaming playback with auto-scrolling transcript).
3. **Interactive 3-Tier Vocabulary Model**:
   - Break English sentences into interactive word chips.
   - Persist vocabulary items in 3 tiers: 🟡 `new`, 🔵 `learning`, 🟢 `mastered`.
   - Store words in `localStorage` / IndexedDB with automatic color-coding applied dynamically to transcript text.
4. **Offline Caching & PWA Delivery**:
   - Provide a Service Worker (`sw.js`) and Web App Manifest (`manifest.json`) to allow full installation and offline practice.
5. **Bilingual Parity**:
   - Maintain 100% parity across English (`en`) and Vietnamese (`vi`) UI strings and subtitle translations.

## Consequences

- **Positive**: Instant load times, zero server infrastructure costs, complete user privacy, frictionless hotkey repetition, and dependable offline mobile/desktop usage.
- **Trade-offs**: Audio files for custom scenarios must fit in browser memory and local IndexedDB quota.
