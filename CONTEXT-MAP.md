# Context Map

This repository is a collection of standalone, client-side HTML tools. Each tool is isolated in its own folder with a dedicated single-file zero-build application, domain glossary, and decision records.

## Contexts

- [Personal Finance Savings Predictor](./personal-finance-savings-predictor/CONTEXT.md): Client-side savings simulation, compound salary escalation, multi-tier deposit, inflation forecasting, and portfolio management tool.

## Relationships & Isolation

- **Standalone Tool Boundary**: Each tool is 100% self-contained. Tools do not share runtime state, dependencies, or storage keys across directories.
- **Shared Architecture Standards**: All tools adhere to the system-wide architecture decisions documented under [`docs/adr/`](./docs/adr/).
