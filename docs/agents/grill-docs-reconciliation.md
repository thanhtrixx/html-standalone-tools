# Reconciling /grilling with /domain-modeling

How to run the relentless interview (`/grilling`, reached via `/grill-me`) **together** with the docs discipline (`/domain-modeling`, reached via `/grill-with-docs`) so the two write postures stop fighting. Decision record: see [ADR-0007](../adr/0007-grilling-domain-modeling-two-speed-reconciliation.md).

## TL;DR

When `/grilling` and `/domain-modeling` run in the same session, **write what is cheap and reversible inline**, and **defer hard-to-reverse ADRs to the user's "shared understanding" confirmation**.

## Composition map

| Skill             | Type    | Invokes                                        |
| ----------------- | ------- | ---------------------------------------------- |
| `grilling`        | core    | — (the relentless design-tree interview)       |
| `domain-modeling` | core    | — (writes `CONTEXT.md` glossary + `docs/adr/`) |
| `grill-me`        | wrapper | `grilling`                                     |
| `grill-with-docs` | wrapper | `grilling` + `domain-modeling`                 |

`grill-with-docs` already **subsumes** `grill-me`; the _only_ delta between them is **docs-on vs docs-off**. The two-speed rule below is the compatibility glue that makes "docs-on" safe.

## The tension

- `grilling`: _"Do not act on it until the user confirms you have reached a shared understanding."_
- `domain-modeling`: _"Update `CONTEXT.md` inline… capture them as they happen. Don't batch these up."_

One says _defer all action_; the other says _write as you go_. Combined naively, they contradict.

## The two-speed rule

Split on **reversibility**, not on "act vs. not act":

- **Speed 1 — inline, during the grill:** cheap, reversible `CONTEXT.md` glossary terms. Safe to write the moment a term crystallises.
- **Speed 2 — deferred, at confirmation:** `docs/adr/` entries. These are expensive and hard to reverse, so they wait for the user's explicit "shared understanding" confirmation.

**Dissolution principle:** _writing ≠ committing._ Inline glossary capture is a low-cost scratch the user can correct in the same breath; an ADR is a durable decision that should only land once the frontier is empty and the user has signed off.

## Non-goals / guardrails

- **Do not edit the upstream `SKILL.md` wrappers** (`grill-me`, `grill-with-docs`, `grilling`, `domain-modeling`). They are hash-locked in `skills-lock.json` to `mattpocock/skills`; an edit silently forks the source with no guardrail to stop drift.
- **Do not re-model the project domain** to hold skill-system decisions (e.g. no new `CONTEXT.md` context for "the skill system"). The skill system is the _subject_ of a review, not a product domain.
- **Discovery is via this doc**, surfaced through [`domain.md`](./domain.md) and `AGENTS.md`. No wrapper self-pointer is added.

## Runbook

1. **Pick the mode:** `/grill-me` (docs-off) or `/grill-with-docs` (docs-on).
2. **Run the grill:** work the design-tree frontier in rounds; only the user's _decisions_ block, never facts you can look up yourself.
3. **Capture inline (Speed 1):** write resolved glossary terms to `CONTEXT.md` as they crystallise.
4. **On confirmation (Speed 2):** when the frontier is empty and the user confirms shared understanding, write the ADR(s) under `docs/adr/`.
