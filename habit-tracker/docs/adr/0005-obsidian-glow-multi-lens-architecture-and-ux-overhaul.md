# ADR 0005: Obsidian Glow Visual World, 4-Lens Perspective Architecture, and Multi-Modal Habit Ergonomics

- **Status**: Accepted
- **Date**: 2026-09-13
- **Context**: `habit-tracker`
- **Lifecycle Phase**: `Active Feature Development` ([ADR-0003](../../docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md))

---

## Context & Problem Statement

Following user discovery and design shaping from zero (`/impeccable shape`), the habit tracking application required a fundamental architectural and visual redesign:

1. **Rigid Interface Fatigue**: Traditional checklist-only views created cognitive monotony and checklist burnout.
2. **Missing Perspective Lenses**: Users needed distinct mental models depending on their situation: ultra-fast 1-tap daily execution (`Today`), chronological daily flow (`Timeline`), long-term momentum (`Matrix & Analytics`), and life-pillar alignment (`Identity & Domains`).
3. **Multi-Modal Tracking Need**: Habit tracking spans binary checkboxes, numeric counters (hydration, pages, push-ups), and live background-accurate interval timers with audio cues.
4. **Onboarding Friction**: Starting with an empty database created activation paralysis. Curated Starter Kits allow instant 1-click adoption.
5. **Aesthetic Identity**: The interface required a distinctive, tactile, immersive visual identity (**Obsidian Glow**) with deep obsidian canvas, frosted glassmorphism, luminous neon domain accents, and spring physics.

---

## Decision Drivers

1. **Frictionless Daily Velocity**: Check-ins must take < 1 second per habit with clear visual progress feedback.
2. **Ergonomic Thumb Reach**: Dual navigation split placing the Top Lens Switcher at the top header and thumb actions (Quick Add `+`, Floating Undo Toast, Settings/Data Vault) in a sleek bottom bar.
3. **Multi-Modal Precision**: Seamless support for binary, numeric stepper, and timer habits.
4. **Zero-Backend Privacy & Portability**: 100% offline-first IndexedDB persistence with clean JSON backup/restore and CSV export.
5. **Bilingual Parity & Accessibility**: Strict WCAG 2.1 AA/AAA contrast and 100% VI/EN dictionary parity.

---

## Considered Options & Decision Outcomes

### 1. The 4-Lens Perspective Switcher

- **Decision**: Implement a prominent top navigation switcher allowing seamless switching between 4 distinct lenses:
  - `today`: High-velocity action board with radial progress hero ring, domain filter pills, and 1-tap/stepper cards.
  - `timeline`: Circadian schedule grouping habits into Morning 🌅, Afternoon ☀️, Evening 🌙, and Bedtime 🌌.
  - `matrix`: 52-week GitHub-style activity heatmaps, 0-baseline day-of-week radar/bar adherence charts, and streak velocity.
  - `identity`: Life domains (Health, Mind, Craft, Routine) with 1-click Curated Starter Kits.

### 2. Obsidian Glow Visual World

- **Decision**: Adopt the Obsidian Glow design token system:
  - Canvas: Deep obsidian `#0b0f19` (dark) / `#f8fafc` (light).
  - Cards: Frosted glassmorphic panels (`rgba(15, 23, 42, 0.75)` with `backdrop-blur-md` and `rgba(255, 255, 255, 0.08)` micro-border).
  - Luminous Accents: Emerald (`#10b981`), Cyan (`#06b6d4`), Violet (`#8b5cf6`), Amber (`#f59e0b`).
  - Tactile Feedback: Micro-compressions on tap (`active:scale-95`), progress ring glows, and particle celebration bursts on 100% daily completion.

### 3. Dual Ergonomic Navigation Split

- **Decision**:
  - Sticky Top Header: Carries app title, 4-Lens Switcher, and 7-day interactive date ribbon.
  - Bottom Action Dock: Houses the primary Floating Quick Add (`+`) button, Floating Undo Pill Toast, and Settings/Data Vault trigger.

### 4. Curated Starter Kits for Zero-Friction Activation

- **Decision**: Ship 4 built-in starter packs in the Identity Lens and Empty State:
  - _Morning Mastery_ (Hydration, 10-min meditation, stretching).
  - _Deep Focus & Flow_ (45-min pomodoro session, read 20 pages).
  - _Health & Vitality_ (2500ml water, 30-min exercise, 8h sleep).
  - _Zen & Mindfulness_ (Evening reflection journal, gratitude log, digital sunset).

### 5. Multi-Modal Habit Cards & Detail Drawer

- **Decision**:
  - Binary Cards: 1-tap checkbox with spring bloom.
  - Stepper Cards: `+` / `-` incremental buttons with custom units and target progress bar.
  - Timer Cards: Live ticking countdown (`MM:SS`), Start/Pause and Reset controls, background delta sync, and completion audio chime.
  - Detail Drawer: Slide-over drawer with habit-level mini heatmap, rolling 30-day consistency score, and personal reflection journal.

---

## Consequences

### Positive

- Unified, intuitive mental model with 4 specialized lenses.
- Rich multi-modal support covering binary, numeric, and timer habits.
- Immediate onboarding via 1-click starter kits.
- Immersive, high-polish visual experience with Obsidian Glow styling.

### Negative / Trade-offs

- UI test suite requires complete overhaul to validate the new 4-Lens DOM hierarchy and interactive components.
