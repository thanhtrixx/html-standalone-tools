# ADR-0002: Anniversary-Based Salary Escalation

## Status

Accepted

## Context

In multi-year financial modeling, career salary growth can be applied either on fixed calendar year boundaries (e.g. January 1st) or on the employee's personal start-date anniversary. Snapping to January 1st introduces artificial step artifacts for simulations initiated mid-year (such as awarding an unearned annual raise after only 2 months of tenure).

## Decision

1. **Relative Anniversary Increments**: Monthly salary escalation is applied strictly on each 12-month anniversary relative to the simulation start date ($t_0$).
2. **Compound Compounding**: The annual percentage growth rate compounds on base monthly salary after every 365/366 day interval.

## Consequences

- Consistent, realistic salary growth trajectories regardless of which calendar month the simulation begins.
- Eliminates anomalous partial-year salary bumps for mid-year start dates.
