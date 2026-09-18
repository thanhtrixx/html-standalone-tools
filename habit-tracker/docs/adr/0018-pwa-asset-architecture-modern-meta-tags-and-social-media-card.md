# 0018. PWA Asset Architecture, Modern Mobile Meta Tags, and Social Media Open Graph Card

Date: 2026-09-18
Status: Accepted

## Context & Problem Statement

As part of preparing the Atomic Habit & Routine Tracker for public release and social sharing, the application required comprehensive Progressive Web App (PWA) assets, standard mobile-web-app meta tags, and rich Open Graph / Twitter Card social previews.

Previously:

1. `habit-tracker` relied on legacy flat PNG icons (`icon-180.png`, `icon-192.png`, `icon-512.png`, `og-image.png`) that lacked full multi-density resolutions, maskable icons, and iOS splash screens.
2. Modern Chromium and WebKit browsers raised deprecation warnings regarding `<meta name="apple-mobile-web-app-capable" content="yes">` without the standard `<meta name="mobile-web-app-capable" content="yes">`.
3. The build compaction pipeline (`scripts/build.js`) only copied flat companion files from the tool root, lacking recursive companion directory mirroring (`icons/`, `splash/`) and WebP asset handling.
4. `scripts/build.js` had a hardcoded `smart-buy-list-v${version}` prefix when stamping `sw.js` cache names instead of tool-specific cache naming (`${tool.name}-v${version}`).
5. Social media cards were unoptimized and pointed to outdated PNG files instead of high-fidelity WebP assets with explicit MIME and dimension properties.

## Decision Drivers

- **PWA Polish & iOS Native Feel**: Full multi-device icon density (16px to 512px standard + maskable) and complete iOS startup splash screens for all modern iPhone/iPad viewports.
- **Standards & Deprecation Hygiene**: Compliance with modern mobile web standards (`mobile-web-app-capable` + `apple-mobile-web-app-capable`).
- **Social Sharing Virality**: Crisp 2752×1536 WebP Open Graph and Twitter Card tags with complete rich snippet metadata (`og:image:type`, `og:image:width`, `og:image:height`, `og:locale`).
- **Subdirectory Portability**: Strict relative paths (`./icons/...`, `./splash/...`) to ensure zero broken assets across standalone local execution, GitHub Pages (`/tools/habit-tracker/`), and bundled distribution.
- **Fast Offline First-Paint**: Pre-cache only essential shell and core PWA icons in `sw.js`, avoiding multi-megabyte splash screen pre-caching during service worker installation.

## Considered Options

- **Asset Organization**:
  - _Option A_: Retain nested `pwa-assets/` directory.
  - _Option B (Chosen)_: Promote `icons/`, `splash/`, and `favicon.png` directly to tool root (`habit-tracker/icons/`, `habit-tracker/splash/`, `habit-tracker/favicon.png`) with clean top-level segregation and remove redundant generator artifacts.
- **Social Card Media**:
  - _Option A (Chosen)_: Serve `og-image.webp` with explicit `image/webp` MIME type, exact 2752×1536 dimensions, and `summary_large_image` Twitter card.
  - _Option B_: Retain dual 1MB+ PNG and WebP assets.
- **Service Worker Pre-Cache**:
  - _Option A (Chosen)_: Cache core shell and primary icons (`icon-192x192.png`, `icon-512x512.png`, `icon-192x192-maskable.png`, `icon-512x512-maskable.png`, `icon.svg`, `favicon.png`), loading splash screens on-demand.
  - _Option B_: Precache all 28 icons and splash screens during install.

## Decision Outcome

1. **Asset Structure & Relative Paths**:
   - `habit-tracker/icons/`: Multi-density PNG icons (16px, 32px, 48px, 64px, 96px, 128px, 144px, 152px, 180px, 192px, 384px, 512px, plus 192px & 512px maskable).
   - `habit-tracker/splash/`: 14 iOS startup splash screens covering iPhone 16 Pro Max, iPhone 16 Pro/15, iPhone SE/8, iPad Pro 13", iPad Pro 11", iPad Air, iPad Mini.
   - `habit-tracker/favicon.png` and `habit-tracker/icon.svg` at tool root.
   - `habit-tracker/og-image.webp` (2752×1536) at tool root.
2. **Modern Metadata in `index.html`**:
   - Added `<meta name="mobile-web-app-capable" content="yes" />` alongside `<meta name="apple-mobile-web-app-capable" content="yes" />`.
   - Linked all 14 iOS startup splash screens using device media queries.
   - Linked multi-size favicons (16x16, 32x32, 180x180 apple-touch-icon, and SVG icon).
   - Configured Open Graph (`og:image`, `og:image:type="image/webp"`, `og:image:width="2752"`, `og:image:height="1536"`, `og:locale="vi_VN"`, `og:locale:alternate="en_US"`) and Twitter Card (`twitter:card="summary_large_image"`, `twitter:image`).
3. **Web Manifest Alignment**:
   - Updated `manifest.webmanifest` and `manifest.json` with standard and maskable icon arrays referencing `./icons/...`.
4. **Service Worker Dynamic Naming & Pre-cache**:
   - Fixed `sw.js` cache name to `habit-tracker-v1.0.0` (with dynamic `${tool.name}-v${version}` injection in `scripts/build.js`).
   - `ASSETS_TO_CACHE` includes essential application shell and core icons.
5. **Build Pipeline Companion Mirroring**:
   - Updated `scripts/build.js` `COMPANION_ASSETS` and directory copier to recursively copy `icons/` and `splash/` directories, `og-image.webp`, and `favicon.png` to `dist/` targets and external export sync destinations.

## Consequences

### Positive

- Zero browser console deprecation warnings on modern mobile Chrome/Safari.
- High-fidelity social previews on Facebook, Twitter/X, Discord, Telegram, LinkedIn, and iMessage.
- Native PWA installation support with maskable icons and zero white flashes on iOS app launch.
- Dynamic, tool-scoped service worker caching prevents cache collisions across tools.

### Negative / Trade-offs

- Build pipeline now handles recursive companion directory syncing.
