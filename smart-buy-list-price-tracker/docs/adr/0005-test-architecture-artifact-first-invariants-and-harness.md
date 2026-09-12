# ADR-0005: Test Architecture, Artifact-First Invariants, and Harness

> **Status:** Accepted  
> **Supersedes:** Legacy ADRs 0028, 0036

---

## Context

To ensure zero regression without relying on fragile mock stubs, tests must assert on the compiled deliverable, enforce semantic invariants, and validate accessibility standards.

---

## Decisions

### 1. Artifact-First Testing (`dist/smart-buy-list-price-tracker/index.html`)

- All DOM and integration test suites load the actual built distribution artifact via JSDOM / Playwright.
- Eliminates divergence between source files and production deliverables.

### 2. Domain-Consolidated Test Suites

- Tests are grouped into focused domain suites:
  - `storage-sync.test.js`: IndexedDB operations, migration, 3-way merge logic, and rate-limit backoff.
  - `parser-deals.test.js`: Omnibox parser regexes, unit conversions, and deal scoring thresholds.
  - `ui-navigation.test.js`: Tab switching, gesture handlers, and modal lifecycle.
  - `i18n-theming.test.js`: 100% Vietnamese/English key parity and CSS custom property validations.
  - `aria-accessibility.test.js`: Modal roles, labelledby bindings, close button labels, and tab controls.

### 3. Zero-Drift Semantic Invariants

- Enforces strict assertions on state immutability, tombstone preservation, and unhandled promise rejection trapping.

---

## Consequences

- **Positive**: 100% confidence in release artifacts, fast execution in Bun/Node, clear failure locality.
- **Trade-off**: Requires building `dist/` before running artifact-first integration tests.
