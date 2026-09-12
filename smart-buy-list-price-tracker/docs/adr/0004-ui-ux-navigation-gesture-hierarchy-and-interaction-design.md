# ADR-0004: UI/UX Navigation, Gesture Hierarchy, and Interaction Design

> **Status:** Accepted  
> **Supersedes:** Legacy ADRs 0004, 0005, 0006, 0008, 0017, 0022, 0026, 0029, 0033, 0034, 0035, 0037, 0038

---

## Context

Mobile grocery shopping requires one-handed touch ergonomics, fast item checking during active shopping trips, clear contrast in bright environments, and distinct planning vs. shopping operational modes.

---

## Decisions

### 1. Four-Tab Material You Navigation

- Structured into 4 primary views:
  1. **Planning Mode**: Comprehensive item list management, drag-and-drop reordering, store grouping, item editing, and omnibox entry.
  2. **Buy Mode**: Streamlined, distraction-free in-store view with large high-contrast touch checkboxes ($\ge 44\text{px}$ targets), store filtering chips, and live cart total.
  3. **Ledger Mode**: Historical purchase timeline, store comparison breakdown, and spending charts.
  4. **Compare Mode**: Real-time cross-store unit price comparator workbench.

### 2. Swipe Gestures & Modal Hierarchy

- Horizontal swipe actions on list items (Swipe Left $\rightarrow$ Delete / Swipe Right $\rightarrow$ Toggle Done / Edit).
- Centralized dialog lifecycle preventing nested backdrops, managing focus trapping, and enabling hardware/browser back-button modal dismissal.

### 3. Trip Completion & Victory Receipt Summary

- Completing a shopping trip archives checked items into the Price Ledger, clears completed items from the active list, and presents a celebratory "Victory Receipt" modal summarizing total savings and store breakdown.

### 4. Vietnam-First Defaults & Accessibility Standards

- Default locale set to Vietnamese (`vi`) and default currency to VND (`₫`).
- WCAG 2.1 AA compliant color contrast across both OLED Dark and Light themes.
- Clear ARIA labels, roles (`tab`, `dialog`), and `aria-hidden` attributes on decorative elements.

---

## Consequences

- **Positive**: Exceptional tactile feel, zero distraction during shopping, accessible for diverse user capabilities.
- **Trade-off**: Requires dedicated event delegation listeners and touch threshold tuning ($> 50\text{px}$ swipe threshold).
