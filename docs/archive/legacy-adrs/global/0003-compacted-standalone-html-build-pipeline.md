# ADR-0003: Compacted Standalone HTML Build Pipeline

## Status

Accepted (Supersedes [ADR-0002](./0002-zero-build-standalone-single-file-html-constraint.md))

## Context

Originally, the repository enforced a zero-build single-file HTML constraint (ADR-0002). While this maximized developer immediacy, delivering un-minified source code containing extensive comments, whitespace, and non-optimized structures resulted in suboptimal web transfer payloads for production deployment.

## Decision

1. **Compaction Build Pipeline (`npm run build`)**: Implemented an automated build engine (`scripts/build.js`) using `html-minifier-terser`.
2. **Asset Inlining & Minification**: Automatically inlines local assets and minifies HTML, inline CSS, and JavaScript into a single, compact `dist/index.html` deliverable per tool.
3. **Dual-Path Distribution**: Preserves readable source code in `<tool>/index.html` while publishing production deliverables in `<tool>/dist/index.html` and `dist/<tool>/index.html`.

## Consequences

- Reduces web delivery transfer payload size by > 30%.
- Maintains single-file portability and zero-backend runtime execution.
- Enables clean separation between human-readable source authoring and machine-compacted deliverables.
