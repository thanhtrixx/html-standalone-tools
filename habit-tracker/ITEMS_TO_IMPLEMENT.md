# 📋 Habit Tracker — Living Requirements & Specifications

> **Target File:** `habit-tracker/index.html` (Compacted deliverable: `dist/habit-tracker.html` or `habit-tracker/dist/index.html`)  
> **Source Documents:** [`CONTEXT.md`](./CONTEXT.md), [`DESIGN.md`](./DESIGN.md), [`I18N.md`](./I18N.md), [`docs/adr/`](./docs/adr/)  
> **Historical Roadmap & Implemented Slices Archive:** [`docs/deprecated/ITEMS_TO_IMPLEMENT_HISTORY.md`](./docs/deprecated/ITEMS_TO_IMPLEMENT_HISTORY.md)  
> **Architecture:** Zero-Runtime Build, Standalone Single-File HTML / PWA Application

---

## 🏛️ Domain Concepts & Ubiquitous Language Summary

All system features strictly adhere to the domain model defined in [`CONTEXT.md`](./CONTEXT.md):

- **Habit Entity**: Atomic habit definition (`id`, `name`, `type` [binary/numeric/timer], `targetValue`, `unit`, `routines` [morning/afternoon/evening/anytime], `domain` [health/craft/mind/discipline], `frequency`, `startDate`, `createdAt`, `archived`).
- **Circadian Routines**: 4 standard time blocks (`morning`, `afternoon`, `evening`, `anytime`). `anytime` is mutually exclusive with circadian slots.
- **Life Pillars / Domains**: 4 core identity pillars (`🌿 Health`, `⚡ Craft`, `🔮 Mind`, `🔥 Discipline`) providing identity alignment rings and domain balance analytics.
- **Tactile Checkbox-First Completion**: 1-tap completion across all habit types ($0 \leftrightarrow 1$ toggle for binary, 100% target fill for numeric/timer). Inline expandable accordion drawers for steppers and live ticking.
- **Resilient Focus Timer Engine**: High-precision timestamp delta calculation (`Date.now() - startedAt`), Screen Wake Lock API, background tab sleep resilience, Web Worker ticker with `setInterval` fallback, screen-off session snapshotting in `localStorage`, and cold-boot reconciliation with 12-hour safety cap.
- **52-Week Contribution Heatmap**: GitHub-style activity grid, touch-swipe isolation, auto-scroll to present day, timeframe lenses (30d, 90d, 52w), and weekday adherence math bounded by habit inception date.
- **Dual-Speed Cloud Sync Kernel**: IndexedDB offline storage, 5-minute continuous timer batching, deterministic dirty-state hashing, adaptive idle cadence ($1\text{m} \to 3\text{m} \to 5\text{m} \to 15\text{m}$), and client-side encrypted vault portability (AES-GCM-256).

---

## 🚀 Active Roadmap: Release Packaging, Modern PWA Assets & Mobile Meta Tags (ADR-0018)

### Slice 1: PWA Asset Promotion & Web Manifest Alignment (P0)

- [ ] Move `pwa-assets/icons/` to `habit-tracker/icons/` and `pwa-assets/splash/` to `habit-tracker/splash/`.
- [ ] Promote `pwa-assets/favicon.png` to `habit-tracker/favicon.png` and clean up generator temporary files.
- [ ] Update `manifest.webmanifest` and `manifest.json` with multi-density icons (`icon-16x16.png` through `512x512.png`) and maskable icon descriptors (`icon-192x192-maskable.png`, `icon-512x512-maskable.png`).
- [ ] Ensure all icon URLs in manifests use strict relative paths (`./icons/...`).

### Slice 2: Modern Mobile Meta Tags & 14 iOS Splash Screens in HTML Shell (P0)

- [ ] Add `<meta name="mobile-web-app-capable" content="yes" />` in `habit-tracker/index.html` alongside `<meta name="apple-mobile-web-app-capable" content="yes" />` to resolve modern browser deprecation warnings.
- [ ] Add 14 iOS startup splash screen `<link rel="apple-touch-startup-image" ...>` elements covering all iPhone and iPad screen dimensions with relative paths (`./splash/...`).
- [ ] Update favicon `<link rel="icon">` and apple touch icon `<link rel="apple-touch-icon">` tags to point to `./favicon.png` and `./icons/icon-180x180.png`.

### Slice 3: Social Media Open Graph & Twitter Card Optimization (P0)

- [ ] Update `og:image` and `twitter:image` to `https://trile.dev/tools/habit-tracker/og-image.webp`.
- [ ] Add `og:image:type="image/webp"`, `og:image:width="2752"`, and `og:image:height="1536"`.
- [ ] Add `og:site_name="Atomic Habit & Routine Tracker"`, `og:locale="vi_VN"`, and `og:locale:alternate="en_US"`.
- [ ] Set `twitter:card="summary_large_image"` with aligned title, description, and canonical URL.

### Slice 4: Service Worker Cache Naming & Essential Pre-cache Scoping (P0)

- [ ] Fix `sw.js` cache name to `habit-tracker-v1.0.0` and update `scripts/build.js` cache-name replacement regex to dynamically use `${tool.name}-v${version}`.
- [ ] Update `ASSETS_TO_CACHE` in `habit-tracker/sw.js` to cache the app shell, `manifest.webmanifest`, `icon.svg`, `favicon.png`, and core standard/maskable 192px/512px icons while excluding heavy splash screens.

### Slice 5: Build Pipeline Companion Directory Mirroring & Verification Gate (P0)

- [ ] Update `scripts/build.js` to recursively copy companion directories (`icons/`, `splash/`) and companion files (`og-image.webp`, `favicon.png`) into `dist/` outputs and external sync destinations.
- [ ] Add automated smoke/PWA test assertions verifying all referenced icon and splash assets exist and return HTTP 200 / valid disk presence.
- [ ] Execute `npm run test:habit`, `npm run build`, and `npm run verify` to achieve 100% green gate.

---

## 📊 Active Roadmap: Contribution Heatmap GitHub Months, Insights Reordering & Action Consistency (ADR-0019)

### Slice 1: Today Tab Habit Subtitle Decluttering (P0)

- [ ] In `src/ui/today-view.js`, remove routine name text mapping from `renderHabitCard` subtitle.
- [ ] Cleanly display numeric/timer progress (`1,200 / 2,000 ml` or `⏱️ 08:30 / 15:00`) and note preview (if any) without preceding routine tags.
- [ ] Omit subtitle wrapper entirely for simple binary habits without notes.

### Slice 2: Insights Contribution Heatmap GitHub-Style Month Indicators, Centering & Nomenclature (P0)

- [ ] Update i18n translation keys: `yearly_heatmap_title` becomes "Contribution Heatmap" (`Contribution Heatmap` in EN / `Biểu đồ đóng góp` in VI).
- [ ] Center `#heatmap-timeframe-picker` across all viewports with `mx-auto`.
- [ ] Dynamically compute and render localized month headers (`Jan`, `Feb`, ... / `Thg 1`, `Thg 2`, ...) aligned with the week columns above the heatmap grid across `30d`, `90d`, and `52w` timeframes with $\ge 3$-week collision prevention.

### Slice 3: Insights Section Hierarchy Reordering (P0)

- [ ] In `src/ui/insights-view.js`, relocate `renderWeekdayChart` (`${weekdayHtml}`) directly above `renderYearlyHeatmapGrid` (`${heatmapHtml}`) in `renderInsightsView`.
- [ ] Ensure smooth visual flow: Metric Stat Cards ➔ Life Domain Pillars ➔ Day of Week Consistency ➔ Contribution Heatmap ➔ Routine Adherence ➔ Milestone Badges.

### Slice 4: Habits Tab Action Consistency & Footer Decluttering (P0)

- [ ] In `src/ui/identity-view.js`, remove the redundant `[ 📚 Browse All Starter Kits ]` footer button block.
- [ ] In the Habits tab header, update `[ 📚 ]` button to display responsive localized text: `📚 Starter Kits` (EN) / `📚 Gói mẫu` (VI) on mobile, and full `📚 Browse Starter Kits` (EN) / `📚 Gói thói quen mẫu` (VI) on tablet/desktop.
- [ ] Standardize the `+ Add Habit` button to include icon + text `➕ Add Habit` (EN) / `➕ Thêm thói quen` (VI) for uniform visual rhythm with the Starter Kits button.

### Slice 5: Automated Test Suite & Multi-Device Verification Gate (P0)

- [ ] Add unit tests in `tests/habit-tracker-ui-components.test.js` asserting Today habit card subtitles omit routine tags and preserve progress/notes.
- [ ] Add unit tests in `tests/habit-tracker-ui-components.test.js` verifying heatmap title, centered timeframe selector, GitHub-style month header generation, and section ordering.
- [ ] Add unit tests asserting Habits tab header button text/icon consistency and absence of bottom footer starter kits button.
- [ ] Verify 100% bilingual parity in `tests/habit-tracker-i18n.test.js`.
- [ ] Execute `npm run test:habit` and outer gate `npm run verify`.
