# ADR-0003: URL Payload Compression & PWA Offline Architecture

## Status

Accepted

## Context

The repository mandate ([`ADR-0002`](file:///Users/trile/dev/trile/html-standalone-tools/docs/adr/0002-zero-build-standalone-single-file-html-constraint.md)) requires standalone single-file HTML deliverables with zero server infrastructure.

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
3. **Dual Delivery PWA Architecture**:
   - The source application `index.html` functions completely as a self-contained portable HTML tool.
   - For web hosting / GitHub Pages deployment, provide a companion `manifest.webmanifest` and Service Worker `sw.js` implementing a **Cache-First** strategy for all core assets.
   - Embed web app manifest metadata and icons directly via data URIs to maintain standalone integrity even when saved as a single local file.

## Consequences

- Completely serverless, zero-cost, privacy-preserving sharing between users.
- Robust offline operation in grocery stores, subway markets, and basements without internet connectivity.
- Adherence to repository standalone distribution standards.
