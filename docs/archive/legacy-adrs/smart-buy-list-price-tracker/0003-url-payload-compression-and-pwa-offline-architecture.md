# ADR-0003: URL Payload Compression & PWA Offline Architecture

## Status

Partially Superseded by [ADR-0014](./0014-calm-cloud-sync-adaptive-ledger-and-vietnamese-flag-polish.md), [ADR-0015](./0015-pwa-companion-asset-compaction-and-single-source-versioning.md), and [ADR-0018](./0018-share-enhancement-qr-removal-and-buy-mode-polish.md)

> [!NOTE]
> **Active vs Superseded Decisions**: URL hash state compression, Base64 encoding, Smart Merge protocol, and offline PWA architecture remain active. Dynamic third-party QR generation (`api.qrserver.com`) was purged in [ADR-0018](./0018-share-enhancement-qr-removal-and-buy-mode-polish.md), while PWA asset compaction and single-source versioning were established in [ADR-0015](./0015-pwa-companion-asset-compaction-and-single-source-versioning.md).

## Context

The repository mandate ([`ADR-0002`](../../../docs/adr/0002-zero-build-standalone-single-file-html-constraint.md)) requires standalone single-file HTML deliverables with zero server infrastructure.

Users need to:

1. Share shopping lists frictionlessly between family members and roommates across different devices.
2. Install the app on mobile home screens (iOS Safari and Android Chrome) with offline functionality in supermarket basements with spotty cellular reception.

## Decision

1. **URL State Payload Encoding & Sharing**:
   - Serialize active shopping list items into a compact JSON schema (`{ v: 1, title: '...', items: [...] }`).
   - Compress the serialized string using URI-safe `LZ-String` compression (with Base64 fallback).
   - Render the compressed payload as a deep link URL (`#share=<payload>`), generate dynamic in-memory QR Codes (via lightweight embedded QR generator), and invoke native `navigator.share()`.
2. **Smart Recipient Import & Merge Protocol**:
   - When a user opens a `#share=` link, present a non-destructive modal with three choices:
     - _Import as New List_ (creates an isolated list without overwriting current data).
     - _Merge into Active List_ (appends new items, deduplicates matching names).
     - _Sync Catalog Prices_ (optionally adopts shared store prices).
3. **Dual Delivery PWA Architecture & Dedicated Vector Icon**:
   - The source application `index.html` functions completely as a self-contained portable HTML tool.
   - A dedicated 512x512 scalable vector icon (`icon.svg`) provides high-fidelity branding across favicons, desktop shortcuts, and mobile home screens.
   - For web hosting / GitHub Pages deployment, provide a companion `manifest.webmanifest` defining dual `any` and `maskable` icon entries and Service Worker `sw.js` (see [`ADR-0007`](./0007-pwa-service-worker-lifecycle-and-update-strategy.md) for Network-First HTML navigation and update lifecycle).
   - `<head>` includes `<link rel="icon" type="image/svg+xml" href="./icon.svg" />`, `<link rel="apple-touch-icon" href="./icon.svg" />`, and iOS standalone web app meta tags.

## Consequences

- Completely serverless, zero-cost, privacy-preserving sharing between users.
- Robust offline operation in grocery stores, subway markets, and basements without internet connectivity.
- Adherence to repository standalone distribution standards.
