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

### Integrated Player Card Container Flow

```text
┌──────────────────────────────────────────────────────────┐
│  Navigation & Top Meta (Title, CEFR Badge, Mask Modes)   │
├──────────────────────────────────────────────────────────┤
│  Integrated Player Card (#player-container)              │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Subtitle Stage (#subtitleStage)                    │  │
│  │  • Sentence Tracker & Timing Nudge Overlay         │  │
│  │  • Active English Sentence with Karaoke Glow Pill  │  │
│  │  • Active Vietnamese Translation Subtitle          │  │
│  │  • Dual Waveform Comparison Visualizer             │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Integrated Transport Dock (#transport-dock)        │  │
│  │  • Audio Scrubber with Sentence Milestone Marks    │  │
│  │  • Time Labels (Current / Duration)                │  │
│  │  • Mode Switch (Loop / Continuous)                 │  │
│  │  • Speed Selector (0.75x, 0.9x, 1.0x, 1.25x, 1.5x) │  │
│  │  • Replay [R], Nav [A/D], Play/Pause [Space]       │  │
│  │  • 1-Tap Mic Record [M] & Vocab Quick Trigger      │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  Collapsible Transcript & Inline Editor (#transcriptCard)│
│  • Scrollable Script List                             │
│  • Sentence Jump Pips & Inline Text Corrections       │
│  • Export Enhanced LRC & SRT                          │
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
