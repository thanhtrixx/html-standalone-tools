# English Shadowing Player — Design System & Interaction Specifications

## 🎨 Visual Identity & Theme Tokens

The English Shadowing Player employs a focused, high-contrast deliberate practice theme optimized for prolonged reading, precise visual focus, and dark room study sessions.

### 1. Color Tokens

```css
:root {
  /* Surface & Canvas */
  --bg-primary: #090d16;
  --bg-surface: #0f172a;
  --bg-elevated: #1e293b;
  --border-subtle: #334155;

  /* Karaoke Cadence States */
  --karaoke-active-bg: rgba(6, 182, 212, 0.2);
  --karaoke-active-text: #38bdf8;
  --karaoke-active-glow: 0 0 16px rgba(56, 189, 248, 0.4);
  --karaoke-passed-text: #f8fafc;
  --karaoke-upcoming-text: #64748b;

  /* Accents */
  --accent-cyan: #06b6d4;
  --accent-indigo: #6366f1;
  --accent-amber: #f59e0b;
  --accent-emerald: #10b981;
  --accent-rose: #f43f5e;
}
```

---

## 📐 Layout Architecture & Ergonomics

### App Shell & Pinned Transport Dock Flow

```text
┌──────────────────────────────────────────────────────────┐
│  Top Navigation (Logo, Scenarios, Player, Insights, Vocab)│
├──────────────────────────────────────────────────────────┤
│  Player Top Meta Bar (Title, CEFR Badge, Masking Modes)  │
├──────────────────────────────────────────────────────────┤
│  Central Scrollable Workspace (flex-1 overflow-y-auto)   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Hero Subtitle Stage (#subtitleStage)               │  │
│  │  • Sentence Tracker & Timing Nudge Overlay         │  │
│  │  • Active English Sentence with Karaoke Glow Pill  │  │
│  │  • Active Vietnamese Translation Subtitle          │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Middle Transcript Card (#transcriptCard)          │  │
│  │  • Auto-scrolling active sentence centering        │  │
│  │  • Sentence Jump Pips & Inline Text Corrections    │  │
│  │  • Export Enhanced LRC & SRT                       │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  Pinned Bottom Transport Dock (#player-container)        │
│  • Audio Scrubber with Sentence Milestone Marks          │
│  • Time Labels (Current / Duration)                      │
│  • Continuous Flow Mode (Default) / Loop Mode Switch     │
│  • Speed Selector (0.75x, 0.9x, 1.0x, 1.25x, 1.5x)       │
│  • Primary Controls: Replay [R], Nav [A/D], Play [Space] │
│  • Vocabulary Quick Drawer Trigger [V]                   │
└──────────────────────────────────────────────────────────┘
```

---

## ⚡ Micro-Interactions & Animation Standards

1. **Active Karaoke Word Pill**:
   - `transition: all 120ms cubic-bezier(0.16, 1, 0.3, 1);`
   - Word chip scales slightly (`scale(1.04)`) with an electric cyan border and subtle glow.
2. **Interactive Sentence Milestone Ticks**:
   - Subtle vertical ticks positioned at percentage offsets along the scrubber track.
   - Hovering displays a micro-tooltip showing sentence number and start time.
3. **Waveform Canvas Smoothing**:
   - Rendered using Web Audio API `AnalyserNode` with smooth time-domain decibel decay.
4. **Accessible Touch Targets**:
   - All interactive buttons maintain a minimum $\ge 44 \times 44\text{px}$ touch target on mobile viewports.

---

## ⌨️ Keyboard-First Ergonomics & Shortcuts Cheat Sheet

The application is structured for complete keyboard navigation without requiring mouse interaction:

| Domain         | Hotkey                        | Action                                                |
| :------------- | :---------------------------- | :---------------------------------------------------- |
| **Transport**  | `Space` / `K`                 | Play / Pause playback                                 |
| **Transport**  | `R` / `↑`                     | Replay current sentence                               |
| **Transport**  | `A` / `←` / `J`               | Jump to previous sentence                             |
| **Transport**  | `D` / `→` / `L`               | Jump to next sentence                                 |
| **Transport**  | `Home` / `0`                  | Jump to first sentence                                |
| **Transport**  | `End`                         | Jump to last sentence                                 |
| **Transport**  | `[` / `]`                     | Decrease / Increase playback speed                    |
| **Practice**   | `P`                           | Cycle Playback Mode (Continuous ➔ Loop ➔ Echoic)      |
| **Practice**   | `M`                           | Toggle Microphone Recording Take                      |
| **Practice**   | `C`                           | Play A/B Comparative audio (Native vs My Voice)       |
| **Practice**   | `B`                           | Toggle scenario bookmark                              |
| **Subtitles**  | `1`, `2`, `3`, `4`            | Masking modes: 1=Dual, 2=EN only, 3=VI only, 4=Blur   |
| **Vocabulary** | `V`                           | Open / Close Leitner Vocabulary Drawer                |
| **Flashcards** | `Space` / `Enter` / `F` / `↑` | Flip flashcard to reveal meaning                      |
| **Flashcards** | `1`, `2`, `3`                 | Grade: 1=Hard (1d), 2=Good (+1 box), 3=Mastered (30d) |
| **Flashcards** | `←` / `→`                     | Previous / Next flashcard                             |
| **Global**     | `/`                           | Focus search input in catalog                         |
| **Global**     | `I`                           | Open / Close Insights & Analytics Modal               |
| **Global**     | `?` (`Shift + /`)             | Open Keyboard Shortcuts Cheat Sheet Modal             |
| **Global**     | `Escape`                      | Dismiss modal/drawer or return to Catalog             |
