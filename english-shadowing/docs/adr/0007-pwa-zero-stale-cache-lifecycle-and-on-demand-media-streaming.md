# ADR-0007: PWA Zero-Stale Cache Lifecycle, Network-Only Navigation, and On-Demand Media Streaming

- **Status:** Accepted
- **Date:** 2026-09-20
- **Scope:** `english-shadowing`

---

## 1. Context & Problem Statement

In the existing implementation of the English Shadowing Player:

1. **Stale Cache on Reload**: `sw.js` utilized a global Cache-First fetch strategy (`caches.match(request)` before network) for all requests, including HTML navigation (`index.html`). When developers or users refreshed the page, the browser served stale cached HTML indefinitely, preventing immediate adoption of code updates, scenario additions, or bug fixes until caches were manually cleared.
2. **Heavy & Outdated Precache Manifest**: The install event precached hardcoded audio files and deprecated `.srt` files (`./audio/specialty-coffee.srt`), while omitting new scenarios in `scenarios/`. Pre-downloading multi-megabyte audio tracks during SW installation degraded initial page load performance on constrained networks.
3. **No Automated Controller Lifecycle**: The service worker lacked clean automatic reload handling (`controllerchange`), requiring manual tab termination or devtools intervention to activate updated workers.
4. **Unmanaged Media Storage**: As learners explored scenarios, media cache grew unbounded with no in-app mechanism to inspect or safely clear cached audio files without wiping critical learning data (SRS Leitner boxes, streaks, custom voice recordings) in IndexedDB.

---

## 2. Decision Drivers

- **Zero-Stale Web & App Updates**: Ensure any browser reload or PWA launch while online immediately serves the freshest `index.html` from the network and updates the offline cache copy.
- **PWA Offline-First Integrity**: Preserve 100% offline functionality when disconnected (`navigator.onLine === false` or network failure) by serving cached app shell and previously streamed scenarios.
- **Lightweight App Shell Precache**: Precache only essential static shell assets (`./`, `./index.html`, `./manifest.json`, `./manifest.webmanifest`, `./icon.svg`) during installation (< 100KB total payload).
- **On-Demand Runtime Media Caching**: Automatically cache audio (`.mp3`) and subtitle (`.lrc`) files in a dedicated cache bucket when played or viewed, eliminating heavy upfront installation downloads.
- **Silent Seamless Upgrades**: When a new service worker version is deployed, trigger `skipWaiting()` and auto-reload active clients on `controllerchange` so users seamlessly transition to new features.
- **Storage Isolation & Safe Maintenance**: Keep user learning progress (SRS vocabulary, Leitner mastery, daily streaks, microphone recordings) safe in IndexedDB/localStorage while providing an in-app "Clear Media Cache" action in Insights/Settings to reclaim audio storage.

---

## 3. Considered Options & Decision Outcome

### A. Navigation Request Strategy for HTML (`index.html`)

- **Option 1 (Cache-First)**: Status quo. Ultra-fast, but permanently serves stale code until cache name is manually bumped.
- **Option 2 (Network-First with Timeout)**: Tries network for 2.5s, falls back to cache.
- **Option 3 (Chosen - Network-Only with Offline Fallback)**:
  - For navigation requests (`request.mode === 'navigate'`), always fetch live code from the network when connected.
  - On successful 200 response, clone and update the offline app shell cache (`shadowing-player-v3`).
  - If network fails (offline, connection error), immediately fall back to the cached `index.html`.
  - _Outcome_: Guarantees fresh updates on every reload when online while maintaining robust offline PWA launch capability.

### B. Scenario & Audio Asset Caching Strategy

- **Option 1 (Precache All Scenarios)**: Precache all 6+ scenario audio files on SW install. High initial bandwidth (> 10MB).
- **Option 2 (Manual Download Buttons)**: Add explicit download buttons per scenario card. High UI complexity.
- **Option 3 (Chosen - On-Demand Runtime Caching)**:
  - Media requests (`.mp3`, `.lrc`, `.md`) are fetched over the network and automatically stored in Cache Storage (`shadowing-media-v3`) upon first access.
  - Subsequent plays or offline sessions retrieve the media directly from cache.
  - _Outcome_: Instant initial PWA installation with zero wasted bandwidth for unplayed scenarios.

### C. Service Worker Update & Reload Lifecycle

- **Option 1 (Prompt Toast)**: Display a bottom toast prompting "Update Available [Reload]".
- **Option 2 (Chosen - Silent Automatic Reload on Controller Change)**:
  - In `sw.js`, call `self.skipWaiting()` on install and `self.clients.claim()` on activate.
  - In `index.html`, register a listener on `navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload())`.
  - Prune legacy cache versions (e.g. `shadowing-player-v1`, `shadowing-player-v2`) in `activate` event.
  - _Outcome_: Painless automatic rollout of application updates without manual cache clearing.

### D. User Data Preservation vs Media Cache Clearing

- **Option 1**: No user controls; browser manages storage quotas automatically.
- **Option 2 (Chosen - Isolated Storage & In-App Clear Media Cache Action)**:
  - Isolate application data: SRS vocabulary, Leitner box states, practice streaks, and recording blobs live safely in IndexedDB and localStorage.
  - Provide a clear, non-destructive "Clear Media Cache" action in the Insights modal that purges only the runtime `shadowing-media-v3` Cache Storage without touching user study history.
  - _Outcome_: Complete user control over device storage with zero risk to study progress.

### E. Offline Scenario Playback UX

- **Option 1**: Allow player view to open and fail with generic HTML5 media error.
- **Option 2 (Chosen - Proactive Bilingual Toast & Graceful Fallback)**:
  - If the user selects a scenario while offline (`navigator.onLine === false` or media fetch fails), display a clear bilingual toast (`"Offline mode: Connect to the internet to stream this scenario."` / `"Đang ngoại tuyến: Hãy kết nối internet để tải kịch bản này."`).
  - Keep the user gracefully in the catalog view without broken media player states.
  - _Outcome_: Frictionless offline experience with clear messaging about network requirements.

---

## 4. Consequences

### Positive

- **Immediate Code Refresh**: Code updates in `index.html` and styles load instantaneously on page refresh without clearing browser data.
- **Fast PWA Installation**: Initial installation payload reduced from > 10MB to < 100KB.
- **Autonomous Scenarios**: Any played scenario is immediately cached for offline drills.
- **Preserved Study Vault**: Learning streaks and SRS vocabulary remain completely protected across cache updates and cache purging.

### Negative / Trade-offs

- First-time playback of a new scenario requires active internet connectivity before it becomes available offline.
