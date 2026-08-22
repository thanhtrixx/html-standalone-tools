# 2. Zero-Build Standalone Single-File HTML Constraint

Every tool in this repository is implemented as a 100% self-contained, single-file HTML application (`index.html`) without build steps, bundlers, or local compilation pipelines. CSS frameworks (Tailwind CSS) and client libraries (Chart.js, PapaParse, FontAwesome) load via reliable public CDNs. Applications run directly by opening `index.html` via `file://` or any static file host. This trades modular compilation and TypeScript safety for zero-friction portability, instant offline/local execution, and single-file distribution.
