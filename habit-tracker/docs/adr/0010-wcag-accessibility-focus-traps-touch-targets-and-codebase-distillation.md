# 10. WCAG AA Accessibility, Motion Sensitivity, Touch Target Ergonomics, and Codebase Distillation

- **Status**: Accepted
- **Date**: 2026-09-16
- **Context**: `habit-tracker`

---

## Context & Problem Statement

A comprehensive technical audit via `/impeccable audit habit-tracker` identified technical debt and accessibility gaps across three areas:

1. **Accessibility & Motion Sensitivity**:
   - Lack of `@media (prefers-reduced-motion: reduce)` support: full-screen victory confetti, active timer pings, and scale transforms ran without honoring vestibular preferences.
   - Missing ARIA semantics: bottom navigation lacked `role="tablist"`/`role="tab"`, habit completion buttons lacked `role="checkbox"`/`aria-checked`, and expandable card drawers lacked `aria-expanded`/`aria-controls`.
   - Missing modal keyboard focus management: opening modals/sheets did not trap focus inside the dialog or restore focus on dismiss.
2. **Touch Ergonomics & Typography Sizing**:
   - Secondary action targets (habit reorder arrows, context menu triggers, inline chevrons) measured < 44×44px, causing mis-taps on mobile.
   - Arbitrary `text-[10px]` sub-captions sat below the documented `DESIGN.md` typography ramp (`micro: 0.6875rem / 11px`), harming legibility.
3. **Architectural Redundancy**:
   - Legacy files `timeline-view.js` and `matrix-view.js` remained loaded from prior multi-lens experiments despite the canonical 4-tab architecture (`today`, `insights`, `manager`, `settings`).

---

## Decision Drivers

- **WCAG 2.1 AA Compliance**: Enforce contrast, motion reduction (SC 2.3.3), ARIA semantics (SC 4.1.2), and modal focus order (SC 2.4.3).
- **Mobile Touch Ergonomics**: Guarantee minimum 44×44px interactive hitboxes across all mobile controls.
- **Design System Ramp Integrity**: Eliminate off-ramp literal classes in favor of `DESIGN.md` type ramp tokens.
- **Zero-Cruft Codebase Distillation**: Eliminate dead view files and streamline routing logic.

---

## Considered Options & Decision Outcome

### Decision 1: WCAG AA Accessibility & Centralized Focus Trap (Slice 1)

- **Outcome**:
  - Add CSS `@media (prefers-reduced-motion: reduce)` in `index.html` to suppress confetti particle canvas bursts in favor of a subtle toast, pause `animate-ping` animations, and eliminate scale transforms.
  - Add `role="tablist"` and `role="tab"` with `aria-selected` to the bottom navigation dock.
  - Add `role="checkbox"` and dynamic `aria-checked` to 1-tap habit completion buttons.
  - Implement a centralized, zero-dependency focus trap utility in `src/ui/components.js` (`trapFocus(modalEl)` / `releaseFocus()`) that cycles Tab/Shift+Tab, handles `Escape` dismiss, and returns focus to the triggering element upon close.

### Decision 2: Mobile Touch Targets & Micro-Typography Normalization (Slice 2)

- **Outcome**:
  - Ensure all clickable icons (reorder arrows, card context triggers, accordion chevrons) enforce minimum 44×44px hitboxes via `min-w-[44px] min-h-[44px]` containers or invisible padding.
  - Normalize all `text-[10px]` occurrences across UI views to `text-[11px]` (micro ramp token) or `text-xs` (12px) with `tracking-wider` styling.

### Decision 3: Codebase Distillation & Theme Token Unification (Slice 3)

- **Outcome**:
  - Verify all 52-week contribution heatmap and consistency chart logic resides in `src/ui/insights-view.js`.
  - Delete legacy files `src/ui/timeline-view.js` and `src/ui/matrix-view.js`.
  - Remove legacy script tags from `index.html` and fallback routing branches in `src/app.js`.
  - Unify `index.html` body background to use `bg-[var(--bg-base)]` / obsidian dark theme token (`#0b0f19`).

---

## Consequences

### Positive

- Fully satisfies WCAG 2.1 AA standards for keyboard users, screen reader users, and motion-sensitive individuals.
- Prevents mis-taps on mobile touchscreens through consistent 44×44px hitboxes.
- Restores 100% adherence to `DESIGN.md` typography ramp.
- Reduces bundle size and eliminates architectural confusion by deleting legacy view files.

### Negative / Trade-offs

- Modal focus trap requires careful bookkeeping of the active triggering element across nested sheet/modal dismissals.
