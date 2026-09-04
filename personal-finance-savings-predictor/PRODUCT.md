# Personal Finance Savings Predictor — Product

> Tool-specific product truth. Inherits the collection's shared truth from
> [`../../PRODUCT.md`](../../PRODUCT.md). Domain glossary: [`CONTEXT.md`](./CONTEXT.md).
> Bilingual guide: [`I18N.md`](./I18N.md). Decisions: [`docs/adr/`](./docs/adr/).

## What it is

A standalone, client-side **savings & wealth simulator** ("Savings & Wealth Simulator"). The user
configures a multi-tier savings plan and the tool runs a month-by-month projection of how that
money compounds, then makes the result interrogable and exportable. No account, no server, no
network required at use-time.

## User & job-in-context

**User:** a Vietnamese-speaking, financially-mindful individual planning their savings and wealth
over years (VND, `vi`-first; English available).

**Job-in-context:** "Given my salary, salary growth, annual bonuses, and a savings strategy
(Flexible Pool + Fixed/Auto Term Deposits + Emergency Buffer), **when will I hit my goal, and how
much will I have — in real, inflation-adjusted terms?**" The user runs a baseline, tweaks a second
scenario, compares the two, and — if they want a second opinion from an external AI advisor —
exports a **private, anonymized Financial Health Dossier** instead of raw numbers.

## What it makes possible / mechanism

- **Pure client-side simulation engine** (kept separate from UI) computing monthly balances,
  demand interest (daily-compounded on the Flexible Pool), Auto Term Deposit sweeps at a unified
  threshold, maturity payouts, and continuous inflation discounting into Purchasing Power.
- **Dual-pass scenario comparison** — Scenario A (baseline) vs. Scenario B (projected) side by
  side, contrasting wealth-growth curves and **Milestone Dates**.
- **Strategy Persona Presets** with one-click load and a 5-second undo safeguard.
- **Portability:** CSV import, PDF export, and **LZ-String URL state sharing** (resilient
  dual-mode decompression) so a scenario can be emailed or bookmarked.
- **Financial Health Dossier** — a portable Markdown analytical summary (liquidity runway, savings
  retention, capital efficiency, inflation drag) with an **AI Advisory Blueprint** and a
  **Privacy Anonymization Mask** that sanitizes absolute values, dates, and institution names
  before export/clipboard.
- **Ergonomics:** semantic-token light/dark theme with **dynamic Chart.js re-theming**, a
  mobile action sheet + touch preset carousel + adaptive card-view, and a zero-dependency
  interactive floating tooltip engine with full keyboard accessibility.

## Durable constraints specific to this tool

- **Pure engine / UI separation** (ADR-0004): the simulation must stay a pure, testable engine.
- **Locale-aware number/date/currency formatting** and verbal helpers; currency input masking
  with cursor preservation (ADR-0003, 0011).
- **Unified threshold Auto-Term allocation with a liquid Emergency Buffer** (ADR-0005, 0006);
  anniversary-based salary escalation; annual-bonus + recurring cashflow generator (ADR-0002, 0008).
- **Semantic token light theme + responsive mobile ergonomics** with WCAG 2.1 AA/AAA contrast
  (ADR-0016); dynamic chart re-theming stays in sync on theme switch.
- **Resilient URL state sharing** must survive dual-mode decompression (ADR-0015).
- **Privacy Anonymization Mask** is a product feature, not an afterthought — keep it
  anonymize-by-default on export.
- Inherit collection constraints: single-file/zero-backend, bilingual vi+en parity, tool isolation,
  dual-path build, GitHub Flow + TDD.

## Durable assets & sources of truth

- [`CONTEXT.md`](./CONTEXT.md) — ubiquitous language (Flexible Pool, Fixed/Auto Term Deposit,
  Emergency Buffer, Withdrawal, Annual Bonus, Milestone Date, Scenario Comparison, …).
- [`I18N.md`](./I18N.md), `icon.svg`, [`docs/adr/`](./docs/adr/) (0001–0018),
  [`ITEMS_TO_IMPLEMENT.md`](./ITEMS_TO_IMPLEMENT.md), [`TEST_PLAN.md`](./TEST_PLAN.md).
- Tests: `tests/simulation.test.js`, `tests/ui-ux.test.js`, `tests/i18n.test.js`.
