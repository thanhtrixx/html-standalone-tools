# ADR 0002: Impeccable UI/UX Architecture, Design System Integration, and Defect Remediation

- **Status**: Accepted
- **Date**: 2026-09-12
- **Context**: `habit-tracker`
- **Related Issues**: #425, #426, #427, #428, #429, #430

---

## Context & Problem Statement

Following initial implementation and comprehensive dual-assessment Impeccable design review, several critical architectural defects and UX opportunities were identified:

1. **Form Submission Trap (#425)**: Modal and detail sheet `<form>` elements lacked explicit submit event interception, causing native browser `GET` query-string reloads that wiped state and failed habit/note persistence.
2. **Runtime API Mismatches (#426)**: Method name discrepancies in JSON backup export/import caused uncaught `TypeError` (`exportImport.downloadExportJSON is not a function`).
3. **Habit Manager Reordering (#427)**: Reordering controls (`▲` / `▼`) did not mutate habit sequences or persist index state to IndexedDB.
4. **Localization Gaps (#428)**: Missing dictionary keys rendered raw identifier strings (e.g. `settings_tab`, `export_json_btn`), and bottom dock navigation remained hardcoded in Vietnamese.
5. **Theme & Modal Overlay Inconsistencies (#429)**: Hardcoded dark utility classes broke Light mode contrast, and redundant nested full-screen backdrops created double-stacked opacity and scroll locking.
6. **Interaction & Delight Deficits (#430)**: Absence of quick emoji pickers, lack of immediate "Undo" on habit check-ins, static 52-week heatmap cells lacking date-jump interactions, and skipped HTML heading hierarchies (`h1` $\rightarrow$ `h4`).

We need a unified, phased architectural plan to remediate all functional defects and elevate `habit-tracker` to tier-1 Impeccable design standards.

---

## Decision Drivers

1. **Zero-Latency State Stability**: Form submissions and state mutations must never trigger full-page reloads.
2. **Impeccable Design Standards**: Adherence to the 8-section `DESIGN.md` specification, WCAG AA/AAA color contrast ($\ge 4.5:1$), and fluid typography scaling ($\ge 1.25\times$).
3. **100% Bilingual Parity**: Zero missing dictionary keys across Vietnamese (`vi`) and English (`en`) locales.
4. **Mobile-First Touch Ergonomics**: Single clean modal backdrops, floating Undo pill toasts in the thumb zone, live touch resistance gestures, and interactive heatmap navigation.
5. **Two-Speed TDD & Clean Vertical Slices**: Granular delivery through verifiable, independent PRs with strict AC-to-test matrices.

---

## Decision Outcome

### 1. Phased Architecture & Execution Slices

We decompose the initiative into 4 cohesive vertical stages:

- **Stage 1 (Harden & Core Bug Fixes - Issues #425, #426, #427)**:
  - Wire `e.preventDefault()` on `#habit-edit-form` and `#habit-note-form`.
  - Align export/import methods (`exportToJson`, `validateImportJson`, `importFromJson`) with `store.importState()`.
  - Implement habit position swapping logic within routine clusters and persist to IndexedDB.
- **Stage 2 (Localization & Single Backdrop Clean-up - Issues #428, #429)**:
  - Add all missing dictionary keys in `translations.js` and bind bottom navigation tab labels dynamically.
  - Consolidate modal dialogs into a single clean backdrop in `index.html` with `role="dialog"` and `aria-modal="true"`.
  - Refactor body and container utilities with dark/light variants (`dark:bg-slate-950 bg-slate-50`).
- **Stage 3 (Impeccable Visual Foundations - `audit`, `typeset`, `colorize`, `layout`)**:
  - Fix heading hierarchy continuity (`<h1>` top bar, `<h2>` view headers, `<h3>` routine sections, `<h4>` habit titles).
  - Apply `tabular-nums` / `font-mono` to all numeric counters and timer tickers.
  - Upgrade low-contrast text from `text-slate-500` (#64748b, 3.1:1) to `text-slate-400` (#94a3b8, 4.64:1).
  - Eliminate nested `<main>` tags in `today-view.js`.
- **Stage 4 (Motion, Delight & Onboarding - `animate`, `delight`, `onboard`, Issue #430, `polish`)**:
  - Implement preset emoji/icon grid selector in the habit modal.
  - Add a floating glassmorphic "Undo" pill toast (4s auto-dismiss) upon habit completion.
  - Enable interactive click/tap navigation on 52-week heatmap cells to jump directly to past dates on the Today tab.
  - Add live `touchmove` visual resistance to swipe-to-complete cards.
  - Add persistent running timer ticker pill in the header/dock.

---

## Consequences

### Positive

- Completely eliminates form reload traps, runtime crashes, and untranslated raw keys.
- Ensures full WCAG AA contrast compliance across both Dark OLED and Light themes.
- Delivers a tactile, responsive mobile experience with instant undo, quick emoji selection, and bidirectional heatmap navigation.
- Guarantees zero regression through two-speed automated unit and Playwright E2E suites.

### Negative / Trade-offs

- Adding the floating undo toast requires managing temporary timer timeouts in state to avoid race conditions during rapid consecutive check-ins.
