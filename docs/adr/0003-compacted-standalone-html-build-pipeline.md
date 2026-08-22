# 3. Compacted Standalone HTML Build Pipeline

> **Status:** Accepted (supersedes [ADR-0002](./0002-zero-build-standalone-single-file-html-constraint.md))

Standalone tools in this repository are compiled into compacted single-file HTML applications (`<tool>/dist/index.html` and `dist/<tool>/index.html`) via an automated compaction pipeline (`npm run build`). Source code is authored with readable formatting, comprehensive documentation, and optional modular structure, while the build process inlines local assets, collapses whitespace, strips comments, and minifies HTML, inline CSS, and JavaScript. This preserves standalone single-file distribution and zero-backend runtime portability while significantly reducing transfer payload size and improving web delivery performance.
