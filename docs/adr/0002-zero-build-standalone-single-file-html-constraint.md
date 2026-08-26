# ADR-0002: Zero-Build Standalone Single-File HTML Constraint

> **Status:** Superseded by [ADR-0003](./0003-compacted-standalone-html-build-pipeline.md)

Every tool in this repository was originally implemented as a 100% self-contained, single-file HTML application (`index.html`) without build steps, bundlers, or local compilation pipelines. CSS frameworks (Tailwind CSS) and client libraries (Chart.js, PapaParse, FontAwesome) load via reliable public CDNs. Applications run directly by opening `index.html` via `file://` or any static file host. This traded modular compilation and build optimizations for zero-friction portability, instant offline/local execution, and single-file distribution. Superseded by ADR-0003 to introduce a compaction build pipeline for improved web delivery payload performance while maintaining single-file distribution.
