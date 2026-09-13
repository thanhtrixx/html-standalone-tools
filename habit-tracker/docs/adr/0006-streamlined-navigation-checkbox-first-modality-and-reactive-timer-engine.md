# ADR 0006: Streamlined 4-Tab Navigation, Checkbox-First Modality, Progressive Identity Onboarding, and Reactive Timer Engine

- **Status**: Accepted
- **Date**: 2026-09-13
- **Context**: `habit-tracker`
- **Lifecycle Phase**: `Active Feature Development` ([ADR-0003](../../docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md))

---

## Context & Problem Statement

Following user discovery and architectural review in Phase 1 ([Grill WoW](../../.agents/skills/grill-wow/SKILL.md)), several user experience friction points and structural redundancies were identified in the habit tracker:

1. **Header & Dock Redundancy**: Having both a top sub-header lens bar (`Today`, `Timeline`, `Matrix`, `Identity`) and a bottom navigation dock (`Today`, `Insights`, `+`, `Manager`, `Settings`) cluttered the vertical viewport and created duplicate navigation models.
2. **Bottom Dock `+` Clutter**: The central `+` button in the navigation dock occupied prime thumb estate and conflicted with contextual creation flows.
3. **Card Visual Overload vs Speed**: Numeric steppers and timer controls on daily habit cards consumed excessive card area and created visual noise. Daily tracking demands an ultra-clean, uniform list with simple, satisfying checkboxes.
4. **Active/Background Timer Freeze**: The timer ticker wrote to IndexedDB on every 1,000ms tick without updating the active card DOM duration ticker in real-time, appearing frozen when active and getting throttled in background tabs.
5. **Identity Friction**: The _Identity & Life Domains_ system is powerful for personal alignment but takes time upfront when users first set up the app. Housing it permanently on a top sub-header bar added daily friction instead of guiding users progressively.

---

## Decision Drivers

1. **Maximized Vertical Screen Space**: Eliminate redundant sub-headers and unnecessary dock icons to focus 100% on habit execution.
2. **Checkbox-First Uniformity**: Every habit card on the main board displays a clean, tactile checkbox. Habits requiring Numeric Steppers or Live Timers expand smoothly on demand or via a focused interface.
3. **Rock-Solid Timer Precision & Reactivity**: Accurate, battery-friendly timer execution using Web Worker ticks, timestamp delta calculations (`Date.now() - startedAt`), immediate in-memory DOM reactivity, and throttled IndexedDB persistence (inspired by [PWA-Timer](https://github.com/Pjaerr/PWA-Timer)).
4. **Progressive Identity Onboarding**: A 3-step First-Run Identity Setup Wizard and 1-Click Starter Kits for instant onboarding, while embedding life domain analytics gracefully into the Habits and Insights hubs.
5. **Impeccable Obsidian Glow 2.0 UX**: Crisp typography, high-contrast tabular numerals, tactile spring animations, and luminous domain glow accents.

---

## Considered Options & Decision Outcomes

### 1. Unified 4-Tab Bottom Navigation Dock

- **Decision**: Streamline the navigation to a clean 4-tab bottom dock:
  - **`Today` (🔥)**: Fast daily action board with progress ring, 7-day date strip, domain filter pills, and checkbox-first habit cards.
  - **`Insights` (📊)**: Deep analytics hub featuring 52-week calendar heatmap, 0-baseline weekday adherence, time-of-day breakdown, and streak milestone records.
  - **`Habits` (🎯 / 🧬)**: Comprehensive habit catalog management (Add, Edit, Reorder, Archive) with the **Identity System & Life Pillars** (Health, Mind, Craft, Discipline) integrated as a sub-feature.
  - **`Settings` (⚙️)**: Data Vault (JSON backup/restore, CSV export), language toggle, theme selector, streak freeze token management, and vacation pause mode.
- **Top Header**: Stripped of the sub-header lens bar; retains only title, ambient running timer pill (when active), freeze tokens badge, and language toggle.
- **Habit Creation**: Dedicated floating action button (FAB) or top action on the Habits/Today screens, removing the redundant `+` from the bottom dock.

### 2. Checkbox-First Habit Card Ergonomics & In-Place Expansion

- **Decision**:
  - **Main Display**: Every habit card features a uniform, satisfying 1-tap checkbox on the right with domain-colored glow bloom.
  - **Binary Habits**: 1 tap on the checkbox toggles completion ($0 \leftrightarrow 1$).
  - **Numeric & Timer Habits**:
    - Tapping the checkbox marks full quota completion (1-tap quick complete).
    - Tapping the card body expands an inline drawer/panel with direct `+/-` number steppers, unit label, or live Timer controls (Play/Pause/Reset).
  - Keeps the primary list compact, scannable, and rapid to complete.

### 3. Reactive Web Worker + Delta Timer Engine

- **Decision**: Upgrade timer engine per PWA-Timer architecture:
  - **Inline Web Worker**: Dispatches 1s ticks without UI thread blocking or background tab suspension.
  - **Exact Timestamp Delta**: Always calculates elapsed seconds via `Math.floor((Date.now() - startedAt) / 1000)` to ensure zero drift even when switching apps or locking the screen.
  - **Reactive In-Memory DOM Ticker**: Updates duration and progress ring in the active card and header pill directly via DOM references on each tick.
  - **Throttled Storage Persistence**: Writes to IndexedDB periodically (every 10s, upon pause, upon target completion, and on `visibilitychange`/`pagehide`), eliminating lag from 1s disk writes.
  - **Audio & Haptics**: Plays Web Audio harmonic completion chime and sends Web Notifications upon target duration reach.
  - **Screen Wake Lock**: Requests Wake Lock API while a timer habit is actively ticking.

### 4. Progressive Identity Setup Wizard & Starter Kits

- **Decision**:
  - **First-Run Onboarding Wizard**: A 3-step setup modal for new users introducing Life Domains (Health & Vitality, Mind & Wisdom, Deep Work & Craft, Daily Discipline) with 1-Click Starter Kits (_Morning Mastery_, _Deep Focus & Flow_, _Health & Vitality_, _Zen & Mindfulness_).
  - **Identity Sub-Feature**: Embedded within the `Habits` catalog and `Insights` tab, showing domain balance rings and allowing kit adoption without taking over the daily board.

---

## Consequences

### Positive

- **Distraction-Free UI**: 40% more visible vertical screen real estate without the sub-header bar.
- **High-Velocity Check-Ins**: Uniform checkboxes allow daily check-ins in seconds.
- **Rock-Solid Timer**: Eliminates active screen freeze and timer drift across background/foreground transitions.
- **Clear Information Architecture**: Predictable 4-tab mental model matching native mobile conventions.

### Negative / Mitigations

- Existing UI component tests asserting `#top-lens-switcher` or dock `+` must be updated to assert the unified 4-tab dock and expandable habit card semantics.
