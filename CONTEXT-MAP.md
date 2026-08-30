# Context Map

This repository is a collection of standalone, client-side HTML tools. Each tool is isolated in its own folder with a dedicated source application, compacted production deliverable (`dist/`), domain glossary, and decision records.

## Contexts

- [Personal Finance Savings Predictor](./personal-finance-savings-predictor/CONTEXT.md): Client-side savings simulation, compound salary escalation, multi-tier deposit, inflation forecasting, and portfolio management tool.
- [Buy vs. Rent Home Comparison](./buy-vs-rent-home-comparison/CONTEXT.md): Standalone client-side housing decision engine, dual-path wealth projection, mortgage amortization modeling, opportunity cost sweep, and sensitivity matrix analysis.
- [Smart Buy-List & Unit Price Tracker](./smart-buy-list-price-tracker/CONTEXT.md): Mobile-first standalone PWA buy-list, multi-store purchase ledger, package unit-price normalization ($/kg, $/L, $/ea), and in-aisle deal intelligence.

## Relationships & Isolation

- **Standalone Tool Boundary**: Each tool is 100% self-contained. Tools do not share runtime state, dependencies, or storage keys across directories.
- **Shared Architecture Standards**: All tools adhere to the system-wide architecture decisions documented under [`docs/adr/`](./docs/adr/).
