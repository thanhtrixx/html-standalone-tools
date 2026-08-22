# ADR-0013: Full-Width Savings Accounts Hub & Category Filtering

## Status

Accepted

## Context

Previously, the Savings Accounts table and the Simulation Milestones feed shared a 2-column layout on desktop viewports (`grid grid-cols-1 lg:grid-cols-2`). With 6 columns of financial metadata (Account Name, Principal, Rate, End Date, Estimated Interest, Status), the accounts table suffered horizontal crowding and text truncation, especially when handling long account names or multi-digit Vietnamese Dong values. Furthermore, users could not easily filter between active fixed deposits, auto-term sweeps, matured records, and scheduled withdrawals, nor could they see portfolio-level KPI summaries at a glance.

## Decision

1. **Dedicated Full-Width Savings Accounts Hub**:
   - Expanded the Savings Accounts table into a dedicated full-width card container spanning the entire content width.
   - Stacked the Simulation Milestones activity stream into a clean separate container below the Savings Accounts Hub.

2. **Portfolio Summary KPI Pills**:
   - Attached 4 real-time KPI summary pills to the hub header:
     - **Total Locked Principal**: Sum of principal in all non-matured fixed savings and auto-term accounts.
     - **Active Accounts**: Count of active accounts.
     - **Auto Sweeps**: Count of automatically generated sweep accounts.
     - **Weighted Average Rate**: Principal-weighted average interest rate across active fixed term positions ($\sum (P_i \times r_i) / \sum P_i$).

3. **Client-Side Category Filter Tabs**:
   - Introduced instant client-side category filters without re-running the simulation engine:
     - `All`: All portfolio accounts and withdrawals.
     - `Active Fixed`: Active CSV and manual fixed-term accounts.
     - `Auto Term`: Active auto-term sweep deposits.
     - `Matured`: Completed and matured accounts.
     - `Withdrawals`: Scheduled cash outflows.

4. **Visual Role & Status Badges**:
   - Styled account types and statuses with distinct badge color palettes:
     - Fixed CSV: Indigo theme.
     - Auto Term: Amber theme.
     - Withdrawals: Rose theme.
     - Active Status: Emerald theme.
     - Matured Status: Slate/Muted theme.

## Consequences

- Vastly improved readability for complex portfolios with multiple accounts and sweeps.
- Zero-latency category filtering without triggering heavy timeline recalculation.
- Clean separation between portfolio state and chronological simulation milestones.
