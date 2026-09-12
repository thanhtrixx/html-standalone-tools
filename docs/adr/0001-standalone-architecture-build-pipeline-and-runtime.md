# ADR-0001: Standalone Architecture, Build Pipeline, and Runtime

> **Status:** Accepted  
> **Supersedes:** Legacy Global ADRs 0001, 0002, 0003, 0006, 0007, 0008

---

## Context

This repository hosts a multi-tool catalog of 100% client-side, zero-runtime-dependency web applications. Key requirements include:

1. **Zero-Friction Portability**: Each tool must function by opening a single HTML file directly (`file://`) or via any static host, without requiring runtime servers or backends.
2. **Compact Web Delivery**: Single-file HTML files containing inlined CSS, JS, and SVG assets must be compacted (`scripts/compact.js`) to minimize distribution payload while maintaining browser inspectability.
3. **Dual-Runtime Execution**: Contributor tooling and test scripts must execute identically in **Bun** (fast inner loop, sub-second installs) and standard **Node.js / npm**.
4. **Automated Release & Portal Hub**: Distribution artifacts are built to `dist/<tool>/index.html`, aggregated via a centralized portal (`dist/index.html` via `scripts/build-portal.js`), and published to GitHub Pages or synced to external distribution targets (`trile-dev/static/tools/`).

---

## Decisions

### 1. Multi-Tool Independent Directory Layout

Each tool lives in its own root subdirectory (`<tool-name>/`) with isolated domain definitions:

- `index.html` (primary standalone source)
- `CONTEXT.md` (domain glossaries, invariants, and calculations)
- `PRODUCT.md` (tool positioning and capabilities)
- `I18N.md` (localization coverage and language keys)
- `ITEMS_TO_IMPLEMENT.md` (active work backlog)
- `TEST_PLAN.md` (test cases and verification matrix)
- `docs/adr/` (tool-specific architecture decisions)

### 2. Standalone Single-File Delivery & Compaction Pipeline

- **Zero-Build Source**: Source files (`<tool>/index.html`) remain directly runnable in browsers. External libraries (Tailwind CSS, Chart.js, PapaParse) load via reliable public CDNs.
- **Compactor (`scripts/compact.js`)**: Inlines local companion assets (`icon.svg`, manifest files), strips comments, normalizes whitespace, and outputs self-contained deliverables to `dist/<tool>/index.html`.
- **Portal Aggregator (`scripts/build-portal.js`)**: Scans all tool metadata (`package.json`, `PRODUCT.md`) and compiles a unified portal hub at `dist/index.html`.

### 3. Dual Runtime & Package Management

- **Primary / Accelerated Engine**: Bun (`bun run`, `bun test`) for inner-loop execution, ~35% faster test runs, and instant script execution.
- **Universal Fallback**: Node.js v18+ and `npm` for standard CI pipelines and broad contributor compatibility. All `package.json` scripts maintain cross-runtime parity.

### 4. Release Distribution & Sync Seam

- **GitHub Pages**: Automated GitHub Actions deploy `dist/` to GitHub Pages upon pushing to `main`.
- **External Distribution Sync**: Optional environment-driven sync script (`scripts/sync-external.js`) deploys compacted standalone artifacts to designated target directories.

---

## Consequences

- **Positive**: Complete portability, zero operational hosting costs, instant offline usability, sub-second testing feedback.
- **Trade-off**: Requires inlined scripts or client-side modules; complex multi-bundle architectures are avoided in favor of standalone modular scripts.
