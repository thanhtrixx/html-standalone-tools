# ADR-0007: Two-Speed Reconciliation of /grilling (defer) and /domain-modeling (write-inline)

## Status

Accepted

## Context

Two third-party skills, both hash-locked in `skills-lock.json` to `mattpocock/skills`, have opposite write postures:

- `grilling` (the relentless design-tree interview, reached via `grill-me`) ends with: _"Do not act on it until the user confirms you have reached a shared understanding."_
- `domain-modeling` (reached via `grill-with-docs`, which composes `grilling` + `domain-modeling`) instructs: _"Update `CONTEXT.md` inline… capture them as they happen. Don't batch these up."_

Run together (the `grill-with-docs` case) they contradict: one defers **all** action to a confirmation gate, the other demands **inline** writes. A naive combination either writes hard-to-reverse docs before confirmation (unsafe) or batches everything at the end (defeating `domain-modeling`'s "don't batch" intent). A reconciliation was needed that composes the two **without forking the upstream wrappers**.

## Decision

We reconcile the two postures with a **two-speed write policy** driven by **reversibility**, and we persist the reconciliation as **local** artifacts, leaving the upstream `SKILL.md` files pristine.

1. **Two-speed write policy**
   - **Speed 1 (inline):** cheap, reversible `CONTEXT.md` glossary terms are written the moment a term crystallises.
   - **Speed 2 (deferred):** `docs/adr/` entries — expensive and hard to reverse — are written only at the user's "shared understanding" confirmation.
   - **Dissolution principle:** _writing ≠ committing._ The policy dissolves the tension by splitting on reversibility rather than on "act vs. not act."
2. **Persist locally, keep upstream pristine**
   - A companion doc, `docs/agents/grill-docs-reconciliation.md` (the _how_), and this ADR (the _why_).
   - The upstream wrappers (`grill-me`, `grill-with-docs`, `grilling`, `domain-modeling`) are **not** edited; doing so would silently fork the hash-locked `mattpocock/skills` source with no guardrail against drift.
3. **Discovery via local docs**
   - A pointer is added to `docs/agents/domain.md` (which already names `/grill-with-docs`) and to `AGENTS.md` ("Domain docs"). No wrapper self-pointer is added, so `skills-lock.json` hashes stay valid.
4. **Composition map recorded**
   - `grill-with-docs` subsumes `grill-me`; the only delta is docs-on/off; the two-speed rule is the compatibility glue.

## Consequences

- **Pros:** the two skills compose safely in one session — inline glossary stays fast and reversible, while durable ADRs respect `grilling`'s confirmation gate. Upstream stays pristine and `skills-lock.json` hashes remain valid (zero hash drift).
- **Cons:** the **strongest** discovery mechanism — a self-pointer inside `grill-with-docs/SKILL.md` — is deliberately **rejected** in favour of a local pointer, so an agent that reads only the upstream wrapper (not `docs/agents/`) will not discover the rule. This is an accepted trade-off.
- **Reversibility:** this decision is easy to reverse — it adds local docs and pointers only; removing them fully restores the prior behaviour with no upstream impact.
