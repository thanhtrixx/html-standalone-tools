# ADR-0001: Multi-Tool Standalone Repository Structure

## Status

Accepted

## Context

The repository hosts multiple browser-based utilities with distinct domains, visual interfaces, and business requirements. Sharing global runtime dependencies or bundling them into a monolithic web application creates brittle coupling, deployment collisions, and complex release choreography.

## Decision

1. **Dedicated Tool Directories**: Each standalone tool resides in its own isolated top-level directory (e.g. `personal-finance-savings-predictor/`).
2. **Self-Contained Artifacts**: Each tool contains its source application, compacted production deliverable (`dist/`), domain glossary (`CONTEXT.md`), tool-specific architecture decisions (`docs/adr/`), implementation specs, and test plans.
3. **Strict Boundary Isolation**: Tools maintain 100% boundary isolation with zero shared runtime state, globals, or coupled `localStorage` keys.
4. **Global Indexing**: System-wide standards and contexts are cataloged at the root via `CONTEXT-MAP.md` and root `docs/adr/`.

## Consequences

- Completely independent tool lifecycles and zero runtime cross-contamination.
- Frictionless onboarding and maintenance for new standalone tools.
