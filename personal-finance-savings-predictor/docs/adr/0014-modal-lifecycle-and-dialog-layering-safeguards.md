# ADR-0014: Modal Lifecycle & Dialog Layering Safeguards

## Status

Accepted

## Context

On initial visit or application state reset, users experienced potential modal layering conflicts where multiple dialogs or legacy overlay elements could contend for focus or z-index hierarchy. Additionally, backdrop dismissal and Escape key handling were implemented independently across different dialogs (Onboarding Tour, CSV Management Modal, Strategy Persona Presets Modal) without a single lifecycle controller preventing dialog stacking.

## Decision

1. **Purged Legacy Theme Overlay**:
   - Removed the obsolete `#themeOverlay` element which previously occupied `z-[85]` and presented redundant visual blocking during theme transitions.

2. **Strict Single-Active-Modal Lifecycle (`dismissAllModals()`)**:
   - Implemented a centralized `dismissAllModals()` controller.
   - Opening any modal (`showOnboarding()`, `toggleCSVModal(true)`, `togglePresetsModal(true)`) automatically dismisses any other open modal first, enforcing a strict single-active-modal invariant.

3. **Consistent Backdrop & Keyboard Dismissal**:
   - Standardized backdrop dismissal on all modal overlays (`#onboardingOverlay`, `#csvModal`, `#presetsModal`) via target check (`event.target === this`).
   - Unified Escape key handler dismisses the topmost active modal gracefully without affecting underlying views.
   - Application Reset (`resetAll()`) resets all stored state and explicitly dismisses all modal overlays.

## Consequences

- Completely prevents overlapping or trapped modal states for first-time and returning users.
- Clean and consistent backdrop/keyboard dismissal behavior across all platform dialogs.
- Zero leftover overlay artifacts during theme switches or application resets.
