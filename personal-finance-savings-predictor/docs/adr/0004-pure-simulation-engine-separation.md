# ADR-0004: Pure Simulation Engine Separation

## Status

Accepted

## Context

Coupling calculation logic directly with DOM manipulation (updating Chart.js instances, manipulating element texts, reading inputs) and browser storage (`localStorage`) leads to severe testing difficulties, layout flicker during recalculations, and accidental state pollution when executing comparative multi-scenario simulations.

## Decision

1. **Pure Function Separation**: The core timeline simulation engine is isolated into a side-effect-free pure function `simulate(params, portfolioData)`.
2. **Deterministic Inputs & Outputs**: Accepts raw parameter objects and portfolio records; returns snapshots, event logs, totals, and milestone metrics without touching DOM or globals.
3. **Decoupled Orchestration**: UI rendering, chart redrawing, toast emissions, and `localStorage` persistence are handled exclusively by caller functions (`runSimulation()`, `runComparison()`).

## Consequences

- 100% deterministic unit testing without requiring browser DOM mocks.
- Zero DOM flicker during multi-scenario evaluation.
- Prevents storage corruption during speculative Scenario B simulations.
