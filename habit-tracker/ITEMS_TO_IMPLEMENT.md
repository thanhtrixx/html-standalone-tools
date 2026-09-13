# Items to Implement (`ITEMS_TO_IMPLEMENT.md`)

This document specifies the technical requirements and vertical slice backlog for the **Atomic Habit & Routine Tracker** (`habit-tracker`).

---

## 🌌 Obsidian Glow & 4-Lens Architecture Roadmap (ADR-0005)

### Slice 1: Core Domain Models, Starter Kits & Fresh Store Architecture

- [ ] Implement 4 Curated Starter Kits (_Morning Mastery_, _Deep Focus & Flow_, _Health & Vitality_, _Zen & Mindfulness_).
- [ ] Life domain metadata & neon glow associations (Health, Mind, Craft, Discipline).
- [ ] Robust IndexedDB initial seed and fresh database hydration without legacy bloat.
- [ ] 100% Core math & storage unit test coverage.

### Slice 2: Top Lens Switcher & Obsidian Glow Shell Architecture

- [ ] Sticky top header with 4-Lens Perspective Switcher (`today`, `timeline`, `matrix`, `identity`).
- [ ] Frosted glassmorphic card containers with micro-borders and ambient glow styling.
- [ ] Bottom ergonomic action dock (Floating Quick Add `+`, Floating Undo Toast, Settings/Data Vault trigger).
- [ ] Bilingual dictionary parity (VI/EN) for all lenses, domains, and actions.

### Slice 3: Today Action Board Lens & Multi-Modal Habit Cards

- [ ] Hero daily progress ring with momentum score and remaining count.
- [ ] 7-day interactive horizontal date ribbon.
- [ ] Domain filter pills (All, Health, Mind, Craft, Discipline).
- [ ] Multi-modal card interactions:
  - 1-tap Binary toggle with spring animation and bloom feedback.
  - Stepper `+/-` counter with direct number adjustment and custom units.
  - Live ticking countdown timer card with Start/Pause/Reset controls and completion chime.
- [ ] 100% daily completion celebratory confetti/particle burst.

### Slice 4: Timeline & Routines Lens

- [ ] Chronological circadian time-block streams (Morning 🌅, Afternoon ☀️, Evening 🌙, Bedtime 🌌).
- [ ] Visual routine cluster headers with completion counters ($K / N$ done).
- [ ] Cue-routine visual anchor badges and routine reordering.

### Slice 5: Matrix & Analytics Lens

- [ ] 52-week GitHub-style contribution heatmap with interactive date drill-down.
- [ ] 0-baseline Day-of-Week consistency bar/radar chart.
- [ ] Time-of-day completion breakdown and all-time streak milestone records.

### Slice 6: Identity & Life Domains Lens + Curated Starter Kits

- [ ] Life domain overview cards with cumulative progress and active habit counts.
- [ ] 1-Click Starter Kit activation cards for instant habit adoption.
- [ ] Personal habit catalog management (Add, Edit, Color-code, Archive, Delete).

### Slice 7: Interactive Habit Detail Drawer & Data Vault

- [ ] Slide-over habit detail drawer with mini calendar heatmap, 30-day consistency score, and reflection journal log.
- [ ] Quick-action habit editing, cadence adjustments, and streak freeze token inspection.
- [ ] Data Vault modal: 1-click JSON backup, JSON restore with state replacement, and CSV export.

### Slice 8: Adversarial Test Suite Overhaul & E2E Validation

- [ ] Overhaul `tests/habit-tracker-ui-components.test.js` to assert all 4 lenses, multi-modal card interactions, and Obsidian Glow DOM semantics.
- [ ] Verify 100% test pass on `npm run test:habit`.
- [ ] Run end-to-end smoke verification.
