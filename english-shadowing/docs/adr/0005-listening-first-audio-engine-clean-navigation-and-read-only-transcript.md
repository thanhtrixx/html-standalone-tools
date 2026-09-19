# ADR-0005: Listening-First Audio Engine, Clean Player Navigation, and Read-Only Transcript

- **Status:** Accepted
- **Date:** 2026-09-20
- **Scope:** `english-shadowing`

---

## 1. Context & Problem Statement

Following user testing and deliberate practice sessions with the English Shadowing Player, critical friction points were identified in audio listening quality and UI ergonomics:

1. **Continuous Mode Audio Stutter**: In continuous flow mode, whenever playback crossed a sentence boundary, the engine called `playAudio()` which re-assigned `audio.currentTime = cue.start` and re-called `.play()`. This caused a noticeable audio buffer hitch/stutter, interrupting speech cadence and rhythm.
2. **Loop Mode Sentence Truncation & Bleed**: In single-sentence loop mode, strict boundary cuts at `cue.end` frequently clipped trailing consonants and plosives (e.g. "t", "d", "k", "s") before natural acoustic decay. Starting strictly at `cue.start` occasionally clipped the initial phoneme.
3. **Player Top Bar Clutter**: The player top bar contained bulky Export LRC & SRT buttons alongside nested button borders, competing with scenario metadata and making the navigation back to the catalog feel cramped on mobile.
4. **Editable Transcript Clutter**: The `transcriptCard` used `<input>` text boxes for both English and Vietnamese lines with inline editing hints ("Click text to edit • Click line number to jump"). This caused accidental soft keyboards to open on mobile, slowed down rendering, and distracted from the core listening/selection task.
5. **Speed Adjustment Inflexibility**: Speed adjustment was limited to a single sequential cycling button (`1.0x → 1.15x → 1.25x → 0.75x → 0.85x`), preventing direct selection of specific practice speeds.

---

## 2. Decision Drivers

- **Listening Experience Comes First**: Audio playback must be fluid, crystal clear, and completely free of hitches, pops, or artificial pauses across sentence transitions.
- **Natural Boundary Breathing Room**: Sentence boundaries in loop mode must preserve phonetic integrity through acoustic lead-out padding while strictly preventing overlap into the next sentence.
- **Streamlined Navigation Ergonomics**: Clean up the player top bar by removing export actions and providing a prominent, lightweight ghost/breadcrumb "Back to Catalog" button.
- **High-Focus Read-Only Transcript**: Replace all `<input>` elements in the transcript card with static, accessible typography where clicking anywhere on a sentence row immediately seeks to and highlights that sentence.
- **Direct Speed Presets**: Offer an interactive speed menu popover with direct speed presets (`0.5x`, `0.75x`, `0.85x`, `1.0x`, `1.15x`, `1.25x`, `1.5x`) alongside keyboard shortcuts (`[` and `]`).

---

## 3. Considered Options & Decision Outcome

### A. Continuous Mode Zero-Seek Audio Streaming

- **Option 1**: Retain seek-on-boundary with audio pre-buffering.
- **Option 2 (Chosen)**: **Zero-Seek Streaming with Time Tracking**:
  - In continuous mode, the native HTML5 `<audio>` element plays smoothly from start to finish without forced seeks.
  - The animation / `timeupdate` synchronizer inspects `audio.currentTime` against `activeCues` to advance `currentCueIndex`, update karaoke glowing tokens, and auto-scroll the transcript card.
  - Seeking `audio.currentTime` only occurs when the user explicitly triggers an action (clicking a transcript row, scrubbing, or using Next/Prev hotkeys).
  - _Outcome_: Chosen. Completely eliminates audio buffer stutter and delivers seamless spoken flow.

### B. Loop Mode Acoustic Padding & Clamping

- **Option 1**: Hard boundary cutoff at exact `cue.end`.
- **Option 2 (Chosen)**: **Acoustic Padding (+150ms Lead-Out & -50ms Lead-In)**:
  - Add a +150ms lead-out grace buffer (clamped so it does not exceed the next cue's `start` timestamp or audio duration) before auto-pausing.
  - When replaying or navigating to a sentence, seek to `Math.max(0, cue.start - 0.05)`.
  - Pause cleanly, trigger the "Now Shadow" prompt, and await learner replay (`[R]` / `Space`) or progression.
  - _Outcome_: Chosen. Ensures full word pronunciation is heard naturally with zero bleed into subsequent sentences.

### C. Player Top Bar Navigation & Export Removal

- **Option 1**: Move Export LRC & SRT buttons into a secondary settings menu.
- **Option 2 (Chosen)**: **Complete UI Removal of Export Buttons + Ghost Back Button**:
  - Remove Export LRC and Export SRT buttons from the player top bar.
  - Restyle `Back to Catalog` as a clean ghost/breadcrumb link on the top-left, placed beside the scenario title and CEFR badge.
  - Keep Subtitle Mask toggle (`Dual | EN | VI | Blur`) aligned on the right.
  - _Outcome_: Chosen. Maximizes vertical clarity and improves mobile responsiveness.

### D. View-Only Transcript Card & Click-to-Jump Ergonomics

- **Option 1**: Keep inline inputs with a toggleable "Edit Mode".
- **Option 2 (Chosen)**: **Pure Static View with Full-Row Sentence Selection**:
  - Remove all `<input>` elements and editing text ("Inline Editor", "Click text to edit").
  - Render crisp static typography: English sentence on top with primary contrast, Vietnamese translation below in subtle slate-400.
  - Make the entire sentence row an active clickable container (`cursor-pointer`, hover highlight, emerald focus ring for active line).
  - Clicking any sentence immediately seeks and highlights that sentence.
  - _Outcome_: Chosen. Delivers a distraction-free, touch-friendly reading and jumping experience.

### E. Speed Selection Popover & Presets

- **Option 1**: Retain single sequential cycling button.
- **Option 2 (Chosen)**: **Interactive Popover Menu with Standard Speed Presets**:
  - Clicking the speed pill in the transport dock opens a floating popover with presets: `0.5x`, `0.75x`, `0.85x`, `1.0x (Normal)`, `1.15x`, `1.25x`, `1.5x`.
  - Selecting any preset immediately updates `audio.playbackRate`, closes the popover, and persists the setting.
  - Retain `[` and `]` keyboard shortcuts for incremental speed stepping.
  - _Outcome_: Chosen. Instant access to desired playback speeds.

---

## 4. Consequences

### Positive

- **Superior Listening Quality**: Uninterrupted, natural continuous audio flow with zero stutter between sentences.
- **Acoustic Fidelity**: No clipped trailing consonants or missing sentence starts during loop practice.
- **Visual Elegance**: Clean player top bar and uncluttered view-only transcript maximize focus on shadowing.
- **Effortless Navigation**: Full-row sentence jumping and direct speed selection improve practice velocity.

### Negative / Trade-offs

- Subtitle text cannot be edited directly within the UI (users edit their source SRT/LRC files prior to practice).
- Export LRC/SRT buttons are removed from the player UI (utility functions remain tested and accessible if needed programmatically).
