# Context Map

This repository is a collection of standalone, client-side HTML tools. Each tool is isolated in its own folder with a dedicated source application, compacted production deliverable (`dist/`), domain glossary, and decision records.

## Contexts & Tool Lifecycle Registry ([ADR-0003](./docs/adr/0003-ways-of-working-token-economics-and-lifecycle-governance.md))

Each standalone application is assigned an official lifecycle phase governing engineering focus and quality verification:

| Tool / Bounded Context                  | Lifecycle Phase   | Focus & Scope                                                                                                                | Context Doc                                                     |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Personal Finance Savings Predictor**  | `Hardened Stable` | Compound salary escalation, multi-tier deposit, inflation forecasting, capital accumulation.                                 | [`CONTEXT.md`](./personal-finance-savings-predictor/CONTEXT.md) |
| **Buy vs. Rent Home Comparison**        | `Hardened Stable` | Dual-path wealth projection, mortgage amortization modeling, opportunity cost sweep, sensitivity analysis.                   | [`CONTEXT.md`](./buy-vs-rent-home-comparison/CONTEXT.md)        |
| **Smart Buy-List & Unit Price Tracker** | `Hardened Stable` | Mobile-first grocery PWA, purchase ledger, package unit price normalization ($/kg, $/L, $/ea), in-aisle deal intelligence.   | [`CONTEXT.md`](./smart-buy-list-price-tracker/CONTEXT.md)       |
| **Atomic Habit & Routine Tracker**      | `Active Feature Development` | Mobile-first routine PWA, mathematical streaks/consistency models, 52-week heatmaps, offline IndexedDB persistence.          | [`CONTEXT.md`](./habit-tracker/CONTEXT.md)                      |
| **Central Portal Hub**                  | `Hardened Stable` | Responsive multi-tool launcher and catalog for GitHub Pages, with bilingual navigation, status badges, and standalone links. | [`CONTEXT.md`](./portal/CONTEXT.md)                             |

## Relationships & Isolation

- **Standalone Tool Boundary**: Each tool is 100% self-contained. Tools do not share runtime state, dependencies, or storage keys across directories.
- **Tool-Scoped Verification**: Tests are scoped to the affected tool (`npm run test:<tool>`) during tool development.
- **Shared Architecture Standards**: All tools adhere to repository-wide architecture decisions documented under [`docs/adr/`](./docs/adr/).
