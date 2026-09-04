# Buy vs. Rent Home Comparison — Product

> Tool-specific product truth. Inherits the collection's shared truth from
> [`../../PRODUCT.md`](../../PRODUCT.md). Domain glossary: [`CONTEXT.md`](./CONTEXT.md).
> Bilingual guide: [`I18N.md`](./I18N.md). Decisions: [`docs/adr/`](./docs/adr/).

## What it is

A standalone, client-side **housing decision engine** and **dual-path wealth simulator**. It models
the long-run economic outcome of **buying** a home versus **renting and investing the difference**,
and tells the user which path wins and when. No account, no server, no network required at use-time.

## User & job-in-context

**User:** a Vietnamese-speaking individual (VND, `vi`-first; English available) weighing a major
financial commitment — **should I buy a home or keep renting?** — before committing.

**Job-in-context:** "Over my chosen horizon, **which path leaves me richer, and on what date do
they cross over?**" The user enters a Buy scenario (price, mortgage, fees, appreciation) and a
Rent scenario (deposit, rent, escalations, alternative yield), reads the **Net Worth Crossover
Date**, the **Price-to-Rent Ratio**, and the **opportunity-cost delta**, sweeps a sensitivity
matrix over appreciation vs. rent-investment yield, and — for a second opinion — exports a
**private, anonymized AI Decision Dossier**.

## What it makes possible / mechanism

- **Dual-path deterministic simulation** of Buy and Rent net worth over a shared timeline, with a
  clearly reported **Net Worth Crossover Date** (ADR-0001).
- **Dual-phase mortgage amortization** — a **Teaser Rate** period then a **Floating Rate
  Benchmark** — supporting Annuity (fixed EMI) and Linear Principal Reduction schemes, with
  **Early Prepayment Penalty Tiers** (ADR-0002).
- **Opportunity-cost delta reinvestment** and **deficit handling** for the Rent path
  (ADR-0003); **Realizable Home Equity** net of **Selling Friction** (ADR-0004); **decoupled
  inflation with continuous purchasing power** (ADR-0005).
- **Continuous multi-variable sensitivity matrix** (appreciation × rent yield → crossover horizon)
  with live reactivity and navigation (ADR-0008, 0010).
- **Methodology & Formula Hub** with **Dynamic Formula Traces** (live variable substitution) and
  **contextual tooltips** — the math is auditable, not a black box (ADR-0006, 0007, 0009).
- **Strategy Persona Presets** (Urban Condo, Suburban Landed House, Aggressive FIRE Renter,
  High-Yield Expat), **currency input masking** + **dynamic verbal helpers**
  (`2.5 Tỷ VND`), and a **Privacy Anonymization Mask** for the dossier.

## Durable constraints specific to this tool

- **Deterministic dual-path engine**: same inputs always yield the same crossover; keep the
  simulation pure and testable (ADR-0001).
- **Dual-phase amortization + prepayment penalties**, **opportunity-cost delta**, and
  **realizable equity with selling friction** are core product semantics — do not collapse them
  into a simpler single-rate or gross-equity model (ADR-0002, 0003, 0004).
- **Decoupled inflation + continuous purchasing power** must stay separate from nominal curves
  (ADR-0005).
- **Transparency is the product**: methodology/formula hub and dynamic traces are features
  (ADR-0006, 0007, 0009). Sensitivity matrix reactivity and timeline navigation are preserved
  (ADR-0008, 0010).
- **Privacy Anonymization Mask** keeps the dossier anonymize-by-default on export.
- Inherit collection constraints: single-file/zero-backend, bilingual vi+en parity, tool isolation,
  WCAG 2.1 AA/AAA, dual-path build, GitHub Flow + TDD.

## Durable assets & sources of truth

- [`CONTEXT.md`](./CONTEXT.md) — ubiquitous language (Buy/Rent Path, Net Worth Crossover Date,
  PRR, Gross Rental Yield, Mortgage Amortization Scheme, Teaser/Floating Rate, Realizable Home
  Equity, Selling Friction, Sensitivity Matrix, …).
- [`I18N.md`](./I18N.md), [`buy-home-research.md`](./buy-home-research.md), `icon.svg`,
  [`docs/adr/`](./docs/adr/) (0001–0010), [`ITEMS_TO_IMPLEMENT.md`](./ITEMS_TO_IMPLEMENT.md),
  [`TEST_PLAN.md`](./TEST_PLAN.md).
- Tests: `tests/buy-vs-rent-simulation.test.js`, `-ui-i18n`, `-charts`, `-sharing-dossier`,
  `-tooltips-formulas`.
