# English Shadowing Player — Backlog & Roadmap

## 🎯 Milestone 2: Enhanced LRC Karaoke Engine, Real Audio Pipeline & Integrated Transport Dock

### Epic: Enhanced LRC Karaoke Player, Audio Asset Engine & Integrated Transport Dock

- **Status:** In Progress (Phase 1 Ready for Breakdown)

---

### Vertical Slices Breakdown

#### Slice 1: Enhanced LRC Parser, Multi-Format Importer/Exporter & Timing Model

- Implement `parseEnhancedLrc(text)` supporting intra-line timestamp tokens (`<mm:ss.xx>word`) and dual-language lines.
- Implement backward-compatible `.srt` auto-converter and word-timing interpolator.
- Implement 1-click Export to Enhanced LRC (`.lrc`) and standard `.srt`.
- Unit test suite covering LRC timestamp parsing, word token boundaries, dual-language parsing, and format export.

#### Slice 2: HTML5 Audio Engine & Bundled Edge-TTS Scenario Audio Pipeline

- Remove legacy `SpeechSynthesis` mock playback for scenario audio.
- Generate high-fidelity neural MP3 audio assets (`specialty-coffee.mp3`, `tech-standup.mp3`, `airport-security.mp3`, `academic-ai.mp3`) via Edge TTS.
- Integrate HTML5 `<audio>` engine with sub-millisecond precision, playback rates (`0.75x` to `1.5x`), and Service Worker offline caching.
- Unit and audio playback seam tests.

#### Slice 3: Real-Time Karaoke Subtitle Renderer with Word-by-Word Glowing Pill

- Implement `requestAnimationFrame`-driven word-by-word karaoke tracking synchronized with `audio.currentTime`.
- Style active words with glowing cyan accent pills, passed words with crisp white contrast, and upcoming words with dimmed slate text.
- Maintain interactive word chip clicks for the Word Inspector without interrupting playback.
- Subtitle masking modes (Dual, English, Vietnamese, Blur) integration with karaoke highlights.

#### Slice 4: Integrated Player Card & Ergonomic Transport Dock Relocation

- Move `#transport-dock` directly below `#subtitleStage` inside a unified `#player-container` card.
- Add interactive sentence milestone ticks along the audio scrubber for 1-click seeking.
- Convert `#transcriptList` into a collapsible reference and inline editor drawer below the transport dock.
- Full responsive mobile, tablet, and desktop layout testing via Lightpanda and Playwright E2E.
