# 1. Standalone Single-File HTML Architecture

We chose to implement the tool as a 100% self-contained, single-file HTML application without a build step or node/bundler toolchain. All UI layout (Tailwind CSS CDN), charts (Chart.js CDN), and parsing (PapaParse CDN) run directly in the browser upon opening `index.html` via `file://` or any static host. This sacrifices component modularity and TypeScript compile-time safety in exchange for zero-setup portability and instant deployment across desktop and mobile browsers.
