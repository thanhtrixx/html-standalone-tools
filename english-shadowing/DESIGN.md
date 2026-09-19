# Visual Design System & UI Specification: English Shadowing Player

> **Tool Directory:** `english-shadowing/`
> **Visitor Mode:** `Operate` (high-ergonomics audio learning workstation)

---

## 1. Aesthetic Thesis & Visual Language

The **English Shadowing Player** embodies the **Obsidian & Electric Emerald** design world: a distraction-free, audio-centric interface featuring deep midnight backgrounds (`slate-950`), glowing emerald accents (`#10b981`), high-contrast typography, and tactile transport controls.

### Design Principles

1. **Audio-First Ergonomics:** Controls are large, predictable, and physically reachable on both desktop keyboards and mobile thumb-zones.
2. **Sensory Clarity:** Subtitles maintain generous line-heights and crystal-clear contrast. Active sentences illuminate with a subtle luminescence without jarring layout jumps.
3. **Tactile Micro-Interactions:** Word clicks, hotkey presses, and mode switches provide immediate visual feedback (subtle springs, glow pulses, pill morphing).

---

## 2. Color Palette & Design Tokens

### Dark Mode (Default)

| Token                 | Hex / Class                    | Semantic Usage                                           |
| :-------------------- | :----------------------------- | :------------------------------------------------------- |
| **Canvas Background** | `#070c18` / `bg-slate-950`     | Primary page & viewport background                       |
| **Card Surface**      | `#0f172a` / `bg-slate-900`     | Subtitle stage, scenario cards, drawer surfaces          |
| **Elevated Surface**  | `#1e293b` / `bg-slate-800`     | Word popovers, modal dialogues, transport dock           |
| **Border / Divider**  | `#334155` / `border-slate-700` | Subtle hairline borders and separation rules             |
| **Primary Accent**    | `#10b981` / `text-emerald-400` | Active play state, active sentence glow, primary actions |
| **Secondary Accent**  | `#06b6d4` / `text-cyan-400`    | Scenario tags, speed indicators, CEFR level badges       |
| **Text Primary**      | `#f8fafc` / `text-slate-100`   | English subtitle text, modal headers, active words       |
| **Text Secondary**    | `#94a3b8` / `text-slate-400`   | Vietnamese subtitle translations, metadata, shortcuts    |
| **Text Muted**        | `#64748b` / `text-slate-500`   | Inactive controls, timestamps, helper descriptions       |

### Light Mode

| Token                 | Hex / Class                    | Semantic Usage                                  |
| :-------------------- | :----------------------------- | :---------------------------------------------- |
| **Canvas Background** | `#f8fafc` / `bg-slate-50`      | Main application background                     |
| **Card Surface**      | `#ffffff` / `bg-white`         | Subtitle stage, scenario cards, drawer surfaces |
| **Elevated Surface**  | `#f1f5f9` / `bg-slate-100`     | Popovers, modal dialogues, transport dock       |
| **Border / Divider**  | `#e2e8f0` / `border-slate-200` | Hairline borders and dividers                   |
| **Primary Accent**    | `#059669` / `text-emerald-600` | Active play state, active sentence indicators   |
| **Text Primary**      | `#0f172a` / `text-slate-900`   | Primary subtitle text and headers               |
| **Text Secondary**    | `#475569` / `text-slate-600`   | Vietnamese translations and secondary metadata  |

### Vocabulary Tier Tokens

| Vocabulary Tier              | Color Token         | Dark Mode Styling                                          | Light Mode Styling                                   |
| :--------------------------- | :------------------ | :--------------------------------------------------------- | :--------------------------------------------------- |
| 🟡 **New Word (`new`)**      | Amber (`#f59e0b`)   | `text-amber-300 bg-amber-500/15 border-amber-500/30`       | `text-amber-800 bg-amber-100 border-amber-300`       |
| 🔵 **Learning (`learning`)** | Cyan (`#06b6d4`)    | `text-cyan-300 bg-cyan-500/15 border-cyan-500/30`          | `text-cyan-800 bg-cyan-100 border-cyan-300`          |
| 🟢 **Mastered (`mastered`)** | Emerald (`#10b981`) | `text-emerald-300 bg-emerald-500/10 border-emerald-500/20` | `text-emerald-800 bg-emerald-100 border-emerald-300` |

---

## 3. Typography & Subtitle Scale

- **Primary Font Family:** System font stack (`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`).
- **Phonetic IPA Font Family:** `ui-monospace, "SF Mono", Menlo, Consolas, "Courier New", monospace` for accurate IPA symbol rendering.
- **English Subtitle Heading:** `text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-relaxed`.
- **Vietnamese Subtitle Text:** `text-sm sm:text-base text-slate-400 font-normal leading-normal`.

---

## 4. UI Topology & Components

### 1. Header Bar (`header`)

- App title with glowing audio wave icon, scenario search bar, active scenario title, bilingual switcher (`EN` / `VI`), theme toggle (Dark / Light), and Vocab Drawer toggle button with saved word count badge.

### 2. Scenario Filter & Catalog Hub (`#catalog-view`)

- Category pill selector (`All`, `Daily Conversations`, `Workplace & Business`, `Travel & Real-World`, `Academic & IELTS`).
- Multi-facet filters (CEFR Level: `A2`, `B1`, `B2`, `C1`; Accent: `US`, `UK`; Search keyword).
- Scenario cards with difficulty badge, accent tag, duration, sentence count, and "Practice Now" action.
- "Import Custom Scenario" card allowing drag-and-drop of MP3 and SRT files.

### 3. Active Shadowing Stage (`#player-view`)

- **Stage Container:** Centered focus card with backdrop blur and subtle border glow.
- **Subtitle Stack:**
  - Active sentence index and timer indicator (`Sentence 4 / 18 • 00:24 / 01:45`).
  - English sentence text with interactive clickable word chips (`.word-chip`).
  - Vietnamese translation directly below.
  - Subtitle Masking Toggle Bar: `Dual`, `EN Only`, `VI Only`, `Blur`.
- **Shadowing Repeat Prompt (Interactive Loop Mode):** Appears when sentence finishes, with visual pulsating repeat indicator and quick hotkey reminder (`Press [R] or [Space] to Replay`).

### 4. Floating Transport & Ergonomics Deck (`#transport-deck`)

- Anchored sticky to bottom viewport (`sticky bottom-0 z-30`).
- **Controls:**
  - Previous Sentence (`[A] / [←]`)
  - Big Play / Pause / Replay toggle (`[Space]`)
  - Next Sentence (`[D] / [→]`)
  - Playback Speed Stepper (`0.75x`, `0.85x`, `1.0x`, `1.15x`, `1.25x`)
  - Loop vs. Continuous mode switch pill.
  - Hotkey cheat sheet trigger button (`[?]`).

### 5. Interactive Word Popover (`#word-popover`)

- Triggered by clicking any word chip in the subtitles.
- Displays: Target word, phonetic IPA transcription (`/ˈʃædoʊɪŋ/`), audio pronounce button, contextual Vietnamese meaning, and 3-button status selector (🟡 New / 🔵 Learning / 🟢 Mastered).

### 6. Vocabulary Drawer (`#vocab-drawer`)

- Slide-over drawer from right (`z-50`).
- Filter tabs (`All`, `New`, `Learning`, `Mastered`), search input, word list cards with pronunciation button, status switcher, flashcard review mode, and JSON/CSV import/export actions.
