# ADR-0015: PWA Companion Asset Compaction & Single-Source Versioning

## Status

Accepted (v3.6.0)

## Context

Following a technical review of the CI/CD and build systems for Progressive Web Application (PWA) deliverables in this repository, three key architectural and optimization gaps were identified:

1. **Unminified Service Worker Deliverables**:
   `scripts/build.js` minified `index.html` via `html-minifier-terser` and inlined Tailwind CSS, but copied companion assets (`sw.js`, `manifest.webmanifest`, `icon.svg`) directly to `dist/` and `dist/<tool>/` using raw `fs.copyFileSync`. Production `sw.js` retained whitespace and comments (~2.7 KB), delaying mobile download and parsing.

2. **Scattered PWA Version Definitions**:
   Application versioning was duplicated across three disparate locations:
   - `manifest.webmanifest` (`"version": "3.5.0"`)
   - `sw.js` (`const CACHE_NAME = "smart-buy-list-v3.5.0";`)
   - `index.html` (`<span id="pwaVersionBadge">v3.5.0</span>`)
     Manual increments risked version drift where Service Worker cache invalidation fell out of sync with manifest metadata and UI version indicators.

3. **Stale Tailwind CDN in Service Worker Cache**:
   Source `sw.js` included `https://cdn.tailwindcss.com` in `ASSETS_TO_CACHE` for offline development. However, during compilation, `scripts/build.js` compiles Tailwind CSS at build time and inlines the purged `<style>` into `dist/index.html`. Retaining the CDN script in production `dist/sw.js` forced an unnecessary external 350KB+ network fetch upon Service Worker installation.

4. **Incomplete Standalone Release Packaging**:
   `scripts/pack-release.js` packaged only single `.html` files in `release-assets/`. Downloading or extracting release archives broke PWA offline caching and home screen installation because `sw.js`, `manifest.webmanifest`, and `icon.svg` were omitted.

## Decisions

1. **Single Source of Truth Versioning (`manifest.webmanifest`)**:
   - `manifest.webmanifest` is established as the canonical human-authored source of truth for the application SemVer version (`"version": "3.6.0"`).
   - In local development, `initServiceWorker()` asynchronously fetches `./manifest.webmanifest` on startup to dynamically hydrate `#pwaVersionBadge` with zero manual sync required.
   - During `npm run build`, `extractToolVersion()` extracts the manifest version and automatically stamps `dist/index.html` and injects `CACHE_NAME = "smart-buy-list-v" + version` into `dist/sw.js`.

2. **Type-Aware Companion Asset Compactor**:
   - Implemented `buildCompanionAssets()` in `scripts/build.js`:
     - **JavaScript (`sw.js`, `service-worker.js`)**: Injects versioned `CACHE_NAME`, purges `https://cdn.tailwindcss.com` from `ASSETS_TO_CACHE`, and minifies with `terser` (dead-code elimination, comment stripping).
     - **Manifests (`manifest.webmanifest`, `manifest.json`)**: Compacts JSON via `JSON.stringify(JSON.parse(...))` to remove whitespace.
     - **Vector Assets (`icon.svg`)**: Trims whitespace.
   - Outputs compacted companion deliverables to both tool-scoped `dist/` and root `dist/<tool>/`.

3. **Standalone Deployable PWA Release Packaging**:
   - Enhanced `scripts/pack-release.js`:
     - For single-file HTML tools, packages `<tool>.html`.
     - For PWA tools with companion assets, generates a dedicated standalone deployment archive (`release-assets/<tool>-<version>.zip`) containing `index.html`, minified `sw.js`, compacted `manifest.webmanifest`, and `icon.svg` at the root of the archive.
     - Updated master repository zip bundle (`html-standalone-tools-<version>.zip`) to retain complete directory structures.

4. **Automated CI Quality Gate Integration**:
   - Added automated test cases in `tests/build.test.js` validating:
     - Companion minification integrity and Node vm execution syntax of `dist/sw.js`.
     - Single-source version parity across `manifest.webmanifest`, `dist/sw.js`, and `dist/index.html`.
     - PWA cache whitelist integrity in `dist/sw.js` (Tailwind CDN purged, all local paths verified on disk).
     - Release packager PWA ZIP bundle creation.

## Consequences

- **Positive**:
  - Single-point version updates in `manifest.webmanifest` automatically propagate to all distribution assets and Service Worker caches.
  - Production `sw.js` payload reduced by ~40% (1.6 KB minified vs. 2.7 KB source) with zero unminified comments.
  - Zero external CDN dependencies in production PWA cache.
  - Users and self-hosters downloading standalone release archives get 100% operational offline PWAs.
- **Backwards Compatibility**:
  - Preserves zero-build local development via runtime manifest hydration and dev-mode fallback.
