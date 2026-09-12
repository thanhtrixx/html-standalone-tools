# ADR-0013: Dual-Phase Tool Lifecycle and Scoped Quality Governance

> **Status:** Accepted

## Context

This repository hosts a growing catalog of 100% client-side, zero-dependency standalone web applications. Over the project lifecycle, tools naturally exhibit different engineering requirements depending on their maturity:

1. **Incubating & Active Tools**: When a new tool is introduced, the primary engineering objective is **velocity and feature expansion**—rapidly implementing vertical slices from `ITEMS_TO_IMPLEMENT.md`, refining domain calculation models in `CONTEXT.md`, and building out initial UI views.
2. **Mature & Deployed Tools**: Once a tool has completed its primary backlog, the engineering objective decisively pivots to **quality, stability, and zero regression**—ensuring existing features function exactly as expected, defending backwards-compatible storage schemas (Silent Data Migration), tuning performance, and maintaining WCAG AA accessibility.
3. **Verification Overhead & Scoping**: Running full repository-wide test sweeps across all applications for a single-tool modification causes unnecessary latency and token overhead. Verification should be scoped to the tools directly affected by a change, while preserving repository-wide invariants for shared infrastructure.

Without explicit lifecycle phases and scoped quality governance, contributors and autonomous agents risk treating mature tools with experimental churn or subjecting incubating tools to unnecessary process friction.

## Decision

We establish the **Dual-Phase Tool Lifecycle and Scoped Quality Governance Model** across repository documentation, Ways of Working (WoW), and the Central Portal Hub:

### 1. Dual-Phase Tool Taxonomy

Every standalone tool in the repository is classified into one of two operational phases:

| Lifecycle Phase                  | Primary Objective                          | Permitted Activities & Gating                                                                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Active Feature Development`** | **Feature Expansion & Velocity**           | Implementing new capabilities from `ITEMS_TO_IMPLEMENT.md`, authoring initial domain logic, and establishing baseline test suites. Verified via scoped inner-loop test runners (`npm run test:<tool>`).                                                 |
| **`Hardened Stable`**            | **Quality Preservation & Zero Regression** | Maintaining rock-solid reliability. Focus on bug fixes (`fix:`), refactoring (`refactor:`), accessibility audits (WCAG AA), performance tuning (`perf:`), and backwards-compatible storage migrations. Existing feature behavior is strictly preserved. |

### 2. Tool-Scoped Quality Verification Protocol

Quality verification is scoped proportionally to the radius of the change:

- **Tool-Scoped Changes**: When an issue or PR modifies `<tool>`, development and subagent verification are scoped strictly to the affected tool's test suite (`npm run test:<tool>`), verifying math, storage, DOM UI, and bilingual dictionaries without running unrelated test suites.
- **Shared Infrastructure Changes**: Changes touching shared build scripts (`scripts/`), repository configurations, the Central Portal Hub (`portal/`), or CI workflows (`.github/workflows/`) require full repository verification (`npm run verify` / `bun run verify`).

### 3. Multi-Tier Phase Synchronization & Transparency

A tool's active lifecycle phase is declared and synchronized across three tiers:

1. **Central Context Map ([`CONTEXT-MAP.md`](../../CONTEXT-MAP.md))**: Maintains the canonical registry table tracking the phase, domain scope, and graduation status of all tools.
2. **Tool Domain Docs (`<tool>/CONTEXT.md` & `<tool>/PRODUCT.md`)**: Documents the active phase, current engineering priorities, and phase constraints for contributors and agents.
3. **Portal Hub Status Badges ([`portal/index.html`](../../portal/index.html))**: Displays a visible, bilingual semantic status badge on each tool's launcher card:
   - `Hardened Stable`: Emerald badge (`Stable` / `Ổn định`).
   - `Active Feature Development`: Sky/Indigo badge (`Active Dev` / `Đang phát triển`).

### 4. Formal Graduation Definition of Done (DoD)

A tool graduates from `Active Feature Development` to `Hardened Stable` when it satisfies the following 5-point graduation checklist:

1. **Backlog Completion**: All P0 and P1 items in `<tool>/ITEMS_TO_IMPLEMENT.md` are completed (`[x]`).
2. **Comprehensive Test Suite**: 100% test coverage across pure math, silent data migration (`tests/*storage*.test.js`), DOM UI interactions, and bilingual i18n dictionaries (`npm run test:<tool>`).
3. **Multi-Device E2E Verification**: Passing Playwright multi-viewport checks on desktop and mobile viewports.
4. **Zero Open Defects**: Zero unresolved functional defects or regressions.
5. **Graduation Sign-Off**: A formal PR updating the tool's classification to `Hardened Stable` in `CONTEXT-MAP.md`, `portal/index.html`, and `<tool>/CONTEXT.md`.

### 5. Initial Tool Baseline Classification

All existing standalone applications and the portal hub are established at the **`Hardened Stable`** baseline:

- `personal-finance-savings-predictor`: **Hardened Stable**
- `buy-vs-rent-home-comparison`: **Hardened Stable**
- `smart-buy-list-price-tracker`: **Hardened Stable**
- `habit-tracker`: **Hardened Stable**
- `portal`: **Hardened Stable**

Any new standalone tool added to the repository begins in **`Active Feature Development`** by default.

## Consequences

### Positive

- **Clear Engineering Intent**: Agents and human developers immediately understand whether the goal is expanding features or hardening quality.
- **Regression Protection**: Mature tools are guarded against unintentional behavioral drift and breaking changes.
- **Token & Execution Efficiency**: Scoped test verification saves significant time and token usage during tool-specific development loops.
- **User Transparency**: End-users can clearly see which tools are production-hardened vs. actively evolving.

### Negative / Trade-offs

- **Metadata Maintenance**: Tool phase transitions require updating `CONTEXT-MAP.md`, tool `CONTEXT.md`, and `portal/index.html`.
