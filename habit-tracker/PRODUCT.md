# Atomic Habit & Routine Tracker — Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Vietnamese- and English-speaking individuals aiming to establish durable daily habits, atomic routines, and balanced life pillars (Health, Deep Work, Mind, Discipline). They access the application primarily on mobile smartphones (PWA) during active daily routines and retrospectives.

## Product Purpose

The product provides frictionless, high-velocity daily habit tracking and atomic identity formation. It exists to turn aspirations into consistent daily execution without demoralizing users when routines are disrupted, defining success as long-term habit retention, balanced life domains, and sustainable momentum.

## Positioning

Unlike conventional habit trackers that enforce punitive all-or-nothing streak resets, this tool implements an **anti-guilt dual-metric consistency model** combining consecutive active streaks, 30-day/90-day rolling adherence percentages, and streak freeze tokens. It unites this psychological model with **checkbox-first multi-modal logging** (1-tap boolean completion, expandable quantitative steppers, and background-accurate focus timers with a floating dynamic island) in a 100% offline-first, private IndexedDB architecture with zero backend or account dependencies.

## Operating Context

- **High-velocity daily check-ins:** Morning, afternoon, evening, and anytime routine check-offs on the Today Action Board via thumb-friendly 1-tap card checkboxes.
- **Deep work & focus sessions:** Timed habit sessions executed via the inline drawer, distraction-free Focus Timer modal, and the persistent Floating Dynamic Island while navigating tabs or switching apps.
- **Weekly & monthly retrospectives:** Reviewing long-term consistency via the 52-week GitHub-style contribution heatmap, rolling consistency scores, and day-of-week adherence charts on the Insights tab.
- **Routine configuration & onboarding:** Adopting curated starter kits or customizing habits across 4 Life Pillars via the 4-step Identity Setup Wizard.

## Capabilities and Constraints

- **Platform & Runtime:** Mobile-first Progressive Web Application (PWA) running client-side with service worker offline caching and zero backend dependency.
- **4-Tab Navigation Dock:** Dedicated `Today` (action board), `Insights` (analytics & heatmaps), `Habits` (catalog & identity), and `Settings` (preferences & vault) views.
- **Multi-Modal Logging:** Checkbox-first cards supporting Binary check-off, Quantitative Numeric Counters with inline +/- steppers, and Duration Timers with sub-second reactivity.
- **Resilient Timer Engine:** Background-accurate elapsed timestamp deltas (`Math.floor((Date.now() - startedAt) / 1000)`), inline Web Worker with `setInterval` fallback, screen wake lock, Web Audio completion chime, and overtime tracking.
- **Anti-Guilt Mathematical Models:** Active consecutive streaks with freeze token protection (2 tokens per 30-day rolling window), rolling consistency percentages, and 0-baseline day-of-week metrics.
- **Local-First Data Vault:** IndexedDB persistence (`habit_tracker_db`) with silent migration and localStorage fallback, 1-click JSON backup/restore, and CSV export.
- **Bilingual Parity:** 100% Vietnamese (`vi`) and English (`en`) dictionary translation coverage across all UI labels, empty states, and onboarding flows.

## Brand Commitments

- **Name:** Atomic Habit & Routine Tracker.
- **4 Life Pillars:** 🌿 Health & Vitality (Emerald Glow), ⚡ Deep Work & Craft (Cyan Glow), 🔮 Mind & Mindfulness (Violet Glow), and 🔥 Discipline & Routine (Amber Glow).
- **Curated Starter Kits:** Morning Mastery, Deep Focus & Flow, Health & Vitality, Zen & Mindfulness.
- **Voice & Tone:** Encouraging, disciplined, clear, and anti-guilt; avoiding demoralizing failure states or gamification clutter.

## Evidence on Hand

- **Brand & PWA Assets:** `icon.svg`, `icon-180.png`, `icon-192.png`, `icon-512.png`, `og-image.png`, `manifest.webmanifest`.
- **Domain & Decision History:** [`CONTEXT.md`](./CONTEXT.md), [`I18N.md`](./I18N.md), [`DESIGN.md`](./DESIGN.md), [`docs/adr/0001-habit-tracker-architecture-and-data-model.md`](./docs/adr/0001-habit-tracker-architecture-and-data-model.md) through `0009`.
- **Test Suites:** `tests/habit-tracker-*.test.js` covering engine math, store state, timers, gestures, modals, and i18n parity.

## Product Principles

1. **Anti-Guilt Consistency Over Fragile Streaks:** Never punish accidental slips with complete demoralization; rolling consistency scores and freeze buffers preserve genuine momentum.
2. **Frictionless High-Velocity Execution:** The primary board is 1-tap checkbox first; granular counters, timer controls, and detail drawers stay non-blocking and inline.
3. **Resilient Time & State Truth:** Timers calculate true elapsed delta across tab suspensions and device locks; storage flushes safely to local IndexedDB without data loss.
4. **Local-First Privacy & Sovereignty:** Personal habits, focus intervals, and reflections live solely on the user's device with zero third-party telemetry, tracking, or mandatory accounts.
5. **Locale-First Bilingual Integrity:** Full Vietnamese and English parity across all features, empty states, and identity onboarding flows.

## Accessibility & Inclusion

- WCAG 2.1 AA contrast floor across both dark and light themes.
- Touch targets conform to minimum 44×44px standards for all bottom dock items, checkboxes, and modal controls.
- Keyboard-navigable dialogs with escape-key dismiss and strict modal stacking hierarchy (`z-50` / `z-60`).
- Screen reader-friendly labels and live status indicators for timers and completion progress.
