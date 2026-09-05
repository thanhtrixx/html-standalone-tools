# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root, or
- **`CONTEXT-MAP.md`** at the repo root if it exists: it points at one `CONTEXT.md` per context. Read each one relevant to the topic.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in. In multi-context repos, also check `<tool-name>/docs/adr/` (or `src/<context>/docs/adr/`) for context-scoped decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo (most repos):

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context repo (presence of `CONTEXT-MAP.md` at the root):

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← system-wide decisions
├── personal-finance-savings-predictor/ ← standalone tool context
│   ├── CONTEXT.md
│   └── docs/adr/                      ← context-specific decisions
└── <other-tool-name>/
    ├── CONTEXT.md
    └── docs/adr/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_

## Reconciling /grilling with /domain-modeling

When the relentless interview (`/grilling`, via `/grill-me`) runs alongside the docs discipline (`/domain-modeling`, via `/grill-with-docs`), their two write postures — _"defer until confirmed"_ vs _"write inline"_ — are reconciled by the **two-speed rule**: write reversible `CONTEXT.md` glossary terms inline, but defer hard-to-reverse `docs/adr/` entries to the user's "shared understanding" confirmation. The composition of `grill-me` / `grill-with-docs` / `grilling` / `domain-modeling` is documented in [`grill-docs-reconciliation.md`](./grill-docs-reconciliation.md) (decision record: [`ADR-0007`](../adr/0007-grilling-domain-modeling-two-speed-reconciliation.md)).
