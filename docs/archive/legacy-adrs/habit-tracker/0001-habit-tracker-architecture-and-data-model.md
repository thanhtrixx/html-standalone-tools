# ADR 0001: Habit Tracker Architecture, Routine Clustering, Dual-Metric Consistency, and Local-First Storage

- **Status**: Accepted
- **Date**: 2026-09-12
- **Context**: `habit-tracker`

---

## Context & Problem Statement

Users building daily habits need a mobile-first, high-friction-free application that encourages consistent adherence without psychological burnout or demoralization when a day is accidentally missed. Existing tools often suffer from:

1. All-or-nothing streak resets that cause users to abandon apps after losing a long streak.
2. Lack of routine context (mixing morning meditation with night journaling in an unstructured list).
3. Heavy cloud lock-in or privacy-invasive tracking.
4. Slow, clunky mobile interactions lacking tactile feedback.

We need a standalone, zero-runtime-dependency, mobile-first PWA that runs 100% client-side with local-first IndexedDB persistence, routine clustering, dual-metric consistency scoring, and optional encrypted cloud backup.

---

## Decision Drivers

1. **Zero Runtime Dependencies**: Conforms to repository ADR-0002 (standalone single-file deliverable).
2. **Atomic Habit Psychology**: Supports Time-of-Day Routine Clustering (Morning, Afternoon, Evening, Anytime) and Habit Stacking.
3. **Dual-Metric Anti-Guilt Streaks**: Maintains consecutive streaks alongside a 30-day/90-day consistency score (%) with freeze tokens.
4. **Local-First Privacy & Data Portability**: Client-side IndexedDB with silent migration, JSON import/export, and optional Gist/Drive cloud backup.
5. **Impeccable Mobile UX**: Fluid swipe gestures, SVG completion rings, Web Haptic feedback, and dark/light mode parity.

---

## Considered Options

- **Option A**: Minimalist binary checkbox list with strict daily streaks and localStorage.
- **Option B**: Multi-type habits (Binary, Numeric Counter, Timer) with Time-of-Day Routines, Dual-Metric Consistency (Streak + 30d Score), Streak Freeze tokens, Local-First IndexedDB, and optional encrypted Cloud Backup.
- **Option C**: Centralized backend server with OAuth and WebSocket sync.

---

## Decision Outcome

**Chosen Option: Option B**.

### Core Architecture Components:

1. **Domain Engine (`src/domain/`)**: Pure mathematical engines for streak calculations, freeze token consumption, consistency rates, routine percentages, and schedule filtering.
2. **State & Storage (`src/storage/` & `src/state/`)**: Local-first IndexedDB (`habit_tracker_db`) with silent auto-migration, reactive state store, and localStorage fallback.
3. **UI & Gestures (`src/ui/`)**: Mobile-first component tree with 3 core views (Today, Insights, Manager), swipe gesture physics, micro-haptics, SVG ring progress, and bottom sheet modals.
4. **PWA & Lifecycle (`sw.js` & `src/pwa/`)**: Offline service worker cache, local Web Notifications scheduler, and bilingual locale switching (`vi` / `en`).
5. **Sync & Export (`src/sync/`)**: 1-tap JSON export/import and optional encrypted GitHub Gist / Google Drive cloud backup.

---

## Consequences

### Positive

- 100% offline capability and instant sub-10ms response times.
- Eliminates user abandonment with anti-guilt streak freeze tokens and consistency scoring.
- High visual polish and fluid touch responsiveness on mobile devices.
- 100% testable via pure math unit tests and DOM component suites without network mocks.

### Negative / Trade-offs

- Background notifications rely on Web Notifications API / Service Worker, which require user permission and have iOS PWA specific constraints (must be added to Home Screen on iOS 16.4+).
