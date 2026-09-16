# 12. Starter Kit Carousel Ergonomics, Identity Wizard Unchecking, 100% i18n Bilingual Parity, and Routine Selection Mutual Exclusivity

- **Status**: Accepted
- **Date**: 2026-09-16
- **Context**: `habit-tracker`

---

## Context & Problem Statement

Following user review and feedback for the `habit-tracker` application, five specific functional, accessibility, and UX defects were identified:

1. **Starter Kits Carousel Desktop Scrolling Block**:
   - In `src/ui/identity-view.js`, the Curated Starter Kits horizontal carousel uses `overflow-x-auto snap-x no-scrollbar`. On desktop environments without horizontal trackpads or shift-wheel gestures, the hidden scrollbar prevents users from scrolling right to explore additional starter packs.
2. **Identity Setup Wizard Step 3 Unchecking Invariant Defect**:
   - In `src/domain/engine.js`, `STARTER_KITS[0].id` is defined as `morning_mastery` (underscore), whereas `src/app.js` initialized state with `morning-mastery` (hyphen). Due to this naming mismatch, `wizardSelectedKitIds.indexOf(kitId)` returned `-1`, duplicating kit IDs and preventing removal.
   - Additionally, `src/app.js` contained an overly restrictive guard (`if (wizardSelectedKitIds.length > 1)`) that blocked unchecking when only one kit was selected, preventing users from opting for a blank slate or deselecting a pack before choosing another.
3. **i18n Localization Gaps & Hardcoded Vietnamese Strings**:
   - Several UI sections contained untranslated strings:
     - `src/ui/identity-view.js`: Hardcoded `"4 Trụ Cột Bản Sắc"`, `"Cân bằng phát triển bản thân theo phương pháp Atomic Habits"`, and `"${domainHabits.length} thói quen"`.
     - `index.html`: Hardcoded Vietnamese strings in the Service Worker update prompt (`"Phiên bản mới đã sẵn sàng"`, `"Nhấn cập nhật để áp dụng phiên bản mới nhất."`, `"Cập nhật"`).
     - `src/app.js`: Hardcoded toast error strings (`"Vui lòng nhập tên thói quen"`).
4. **Core Life Pillars Strategic Role & Copywriting Clarity**:
   - The user questioned the necessity and customer benefit of Core Life Pillars (Health, Craft, Mind, Discipline). As the foundational Atomic Identity framework (James Clear methodology), they provide cognitive domain balance, ambient visual glow categorization, and weekly retrospective domain breakdown, but require clearer bilingual onboarding descriptions.
5. **Time-of-Day Routine Selection Interaction ("Anytime" vs Circadian Slots)**:
   - In `src/ui/manager-view.js`, Routine Assignment checkboxes (`Morning`, `Afternoon`, `Evening`, `Anytime`) functioned independently without exclusivity rules. Semantically, "Anytime" (Flexible) is mutually exclusive with specific circadian time blocks (`Morning`, `Afternoon`, `Evening`), leading to contradictory routine assignments (e.g. both "Morning" and "Anytime" active concurrently).

---

## Decision Drivers

- **Inclusive Multi-Device Ergonomics**: Provide effortless carousel navigation across desktop mouse, trackpad, and mobile touch.
- **Predictable Wizard Selection State**: Guarantee normalized kit IDs and unrestricted multi-select / uncheck capability in onboarding.
- **100% Bilingual Parity (Repository Invariant 5)**: Eliminate all hardcoded language leaks across templates, toasts, modals, and PWA prompts.
- **Atomic Identity Value Clarity**: Maintain the 4 Core Life Pillars as the foundational identity structure with crisp bilingual guidance.
- **Sensible Routine Modeling**: Enforce mutual exclusivity between flexible daily habits (`Anytime`) and circadian habit blocks (`Morning`, `Afternoon`, `Evening`).

---

## Considered Options & Decision Outcome

### Decision 1: Starter Kits Carousel Navigation Ergonomics (Slice 1)

- **Outcome**:
  - Add accessible Left/Right navigation chevron buttons on the Curated Starter Kits carousel container, visible on desktop/hover.
  - Implement mouse drag-to-scroll gesture support with smooth momentum and `scroll-snap-type: x mandatory`.
  - Preserve native smooth touch swipe on mobile devices with safe overflow containment.

### Decision 2: Kit ID Normalization & Wizard Uncheck Fix (Slice 2)

- **Outcome**:
  - Standardize all starter kit identifiers to kebab-case (`morning-mastery`, `deep-focus`, `health-vitality`, `zen-mindfulness`) across `engine.js`, `translations.js`, and `app.js`.
  - Allow unchecking any kit down to 0 selected kits in Step 3.
  - Step 4 cleanly handles 0 selected kits by prompting the user or allowing an empty catalog launch into custom habit creation.

### Decision 3: Systematic i18n Audit & Elimination of Hardcoded Strings (Slice 3)

- **Outcome**:
  - Extract all hardcoded strings from `identity-view.js`, `index.html`, and `app.js` into `src/i18n/translations.js` for both `en` and `vi`.
  - Make the PWA Service Worker update prompt dynamically localized based on the active user language.
  - Add automated test assertions in `tests/habit-tracker-i18n.test.js` asserting complete absence of hardcoded text in UI templates and dictionary parity.

### Decision 4: Routine Assignment Mutual Exclusivity (Slice 4)

- **Outcome**:
  - In `src/app.js` and `src/ui/manager-view.js`, when a user selects **Anytime**, automatically deselect **Morning**, **Afternoon**, and **Evening**.
  - When a user selects any circadian slot (**Morning**, **Afternoon**, or **Evening**), automatically deselect **Anytime**.
  - Retain multi-selection among specific circadian slots (e.g. a habit scheduled for both Morning and Evening).

---

## Consequences

### Positive

- Desktop mouse users can effortlessly navigate starter kits via arrow buttons or mouse drag.
- Users have full freedom to select or deselect any combination of starter kits during initial onboarding.
- 100% bilingual parity is achieved and mechanically enforced with zero Vietnamese leaks in English mode.
- Habit routine assignment becomes intuitive and logically consistent without contradictory scheduling flags.

### Negative

- Additional DOM event listeners for carousel buttons and drag physics require lifecycle hygiene on re-renders.
