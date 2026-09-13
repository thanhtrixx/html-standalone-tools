# 8. Focus Timer Engine, Identity Wizard Empty-State Gateway, and Modal Layering Hierarchy

Date: 2026-09-13
Status: Accepted

## Context & Problem Statement

Field usage and adversarial review identified critical functional defects and ergonomics gaps in the `habit-tracker` tool:
1. **Timer Engine Inoperability (CSP Violation & Worker Crash)**: The inline Web Worker initialized via `URL.createObjectURL(blob)` was blocked by Content Security Policy (`default-src 'self'` without `worker-src blob:`), leaving the worker unresponsive without falling back to `setInterval`, causing the in-app timer to freeze completely.
2. **Timer UX Modality Limitation**: Timer habits only presented a small inline drawer, lacking an immersive full-screen Focus Mode (Pomodoro/Focus dial with circular SVG progress, remaining/elapsed toggle, and quick `+1m`/`+5m` buttons).
3. **Empty State & Factory Wipe Friction**: When the habit catalog is empty (0 habits upon initial installation or following a Factory Wipe in Settings), the UI presented an unhelpful single `+ Add Habit` button rather than guiding users into the structured 3-Step Identity Setup Wizard and curated Life Pillar Starter Kits.
4. **Information Architecture Clutter**: A floating `+` button (`#floating-quick-add-btn`) overlapped the bottom dock navigation, and redundant taglines (`Obsidian Glow • Offline-First`) cluttered the top header bar.
5. **Modal Stacking Bug**: Opening "Edit Habit" from within the "Habit Detail Sheet" caused the edit modal to render underneath the details sheet due to equal `z-50` stacking contexts.

## Decision Drivers

- **Zero-Drop Timer Accuracy**: Background timer must tick reliably across phone lock, tab switching, and browser suspension with exact sub-second timestamp deltas.
- **Immersive Focus Experience**: Time-based habits are a core value proposition; users need both 1-tap quick execution and dedicated deep-work focus sessions.
- **Frictionless Onboarding & Recovery**: Zero-habit states must proactively offer curated atomic identity formation paths.
- **Uncompromising Mobile Ergonomics**: Clean mobile viewport without floating button collisions and with clean modal stacking order.

## Considered Options & Decision Outcome

### Decision 1: Resilient Worker Engine & Hybrid Overtime Timer
- **Outcome**: Update `index.html` CSP to `worker-src 'self' blob:;` and harden `startTimerTicker()` with automatic fallback to `setInterval`.
- Calculate elapsed duration using `Math.floor((Date.now() - startedAt) / 1000)` on every tick.
- Default display counts down target duration (e.g., 20:00 ➔ 00:00), sounds harmonic sine chime via Web Audio API upon completion, and continues counting up overtime (+00:01, +00:02...).
- Screen Wake Lock API holds screen awake while ticking; persistence flushes to IndexedDB every 10s and on `visibilitychange`.

### Decision 2: Immersive Focus Timer Modal (`#focus-timer-modal-overlay`)
- **Outcome**: Add a full-screen focus modal with large SVG circular progress ring, remaining/elapsed toggle, `+1m`/`+5m` adjusters, sound chime toggle, and ambient obsidian glow. Tapping the ambient top timer pill, dock pill, or card timer ticker opens this Focus modal.

### Decision 3: Dual Empty State Gateway & Post-Wipe Auto-Launch
- **Outcome**: On both `Today` and `Habits` tabs when empty: render dual CTA cards: Primary `✨ Identity Setup Wizard` and Secondary `+ Add Habit`.
- On Factory Wipe confirmation: wipe data, switch to `Today` tab, and immediately auto-launch the Identity Setup Wizard modal.

### Decision 4: IA Decluttering & Modal Stacking Order Fix
- **Outcome**: Remove `#floating-quick-add-btn` and header subtitle `Obsidian Glow • Offline-First`.
- Elevate `#habit-edit-modal-overlay` and `#focus-timer-modal-overlay` to `z-[60]` (above `#detail-sheet-overlay` at `z-50`), ensuring nested modal dialogs render properly.

## Consequences

### Positive
- Timer works 100% reliably in all browsers and PWA standalone contexts with background worker and fallback.
- Rich Pomodoro / Deep Work focus session mode elevates habit execution.
- Empty states and Factory Wipe provide immediate guidance into atomic identity kits.
- Clean header and dock navigation without floating button obstruction.
- Nested modal transitions (`Detail Sheet` ➔ `Edit Habit`) work flawlessly.

### Negative
- Adds additional modal overlay container and event bindings in `src/app.js` and `src/ui/today-view.js`.
