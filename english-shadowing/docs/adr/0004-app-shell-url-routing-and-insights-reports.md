# ADR-0004: App-Shell Layout, URL Scenario Deep-Linking, Default Continuous Mode, and Dedicated Insights Modal

- **Status:** Accepted
- **Date:** 2026-09-19
- **Scope:** `english-shadowing`

---

## 1. Context & Problem Statement

Following the initial release and early deliberate practice feedback of the English Shadowing Player, users identified key ergonomic and workflow friction points:

1. **Top Banner Clutter**: The `dailyHubSection` banner sat at the top of the main container, consuming significant vertical screen real estate and distracting learners from core shadowing practice.
2. **Missing Deep-Linking**: Learners could not share or bookmark direct links to specific scenarios (`?scenario=<id>`), requiring manual filtering and catalog browsing on every visit.
3. **Loop Mode Default Friction**: The application defaulted to single-sentence loop mode (`loop`), requiring manual toggling on every session for learners who prefer natural spoken audio flow.
4. **Desktop & Mobile Ergonomics**: The layout placed the transport dock inside the upper card rather than pinned at the bottom edge, forcing learners to scroll when viewing longer transcripts.
5. **Recording Feature Polish**: The voice recording and Auto A/B comparison feature required further technical refinement and was creating visual noise on the active stage.

---

## 2. Decision Drivers

- **Application-First UI/UX**: Transform the layout into a high-focus desktop and mobile web application (`h-screen overflow-hidden flex flex-col`) with a prominent central subtitle stage, middle scrollable transcript, and a pinned bottom transport dock.
- **Fast Scenario Navigation**: Enable instant deep linking via URL query parameter (`?scenario=<id>`) with bidirectional history synchronization (`pushState`/`replaceState`/`popstate`).
- **Continuous Flow by Default**: Default to `"continuous"` playback mode for new sessions while persisting explicit user preference in `localStorage`.
- **Dedicated Insights & Reports**: Move streak, daily practice goals, and SRS mastery metrics into an on-demand Insights modal triggered via top navigation, with compact header indicator badges.
- **Cleaned Stage Focus**: Temporarily remove the voice recorder and waveform comparison UI to focus on core playback ergonomics, to be reintroduced in a future dedicated release.

---

## 3. Considered Options & Decision Outcome

### A. Layout Architecture & Transport Dock Placement

- **Option 1**: Keep transport dock embedded inside the top player card.
- **Option 2 (Chosen)**: **Pinned Bottom Player Dock with Central Stage & Transcript**:
  - Top Bar: Scenario info, CEFR badge, Subtitle Mask switcher (`Dual`, `EN`, `VI`, `Blur`), Export actions.
  - Middle Area (`flex-1 overflow-y-auto`):
    - `subtitleStage`: Hero card with large karaoke active text, translation, active sentence tracker, and timing nudges.
    - `transcriptCard`: Middle scrollable transcript list with smooth auto-scroll to active sentence, clickable jump, and inline editing.
  - Bottom Dock (`player-container` transport dock): Fixed/pinned at the bottom edge with scrubber milestones, time labels, primary transport (`[R]`, `[A]`, `[Space]`, `[D]`), speed pill, mode switch, and vocab launcher.
  - _Outcome_: Chosen. Delivers authentic app ergonomics on both desktop and mobile viewports.

### B. URL Deep-Linking & History State

- **Option 1**: Hash fragments (`#<id>`).
- **Option 2 (Chosen)**: **Query Parameter Routing (`?scenario=<id>`)**:
  - Reading `?scenario=<id>` on load auto-navigates directly to the Player view and loads the scenario.
  - Invalid scenario IDs show a friendly toast and fall back to the Catalog.
  - Navigating between Scenarios and Catalog updates the URL state seamlessly without full page reload.
  - _Outcome_: Chosen. Clean, bookmarkable, and shareable URLs.

### C. Default Playback Mode

- **Option 1**: Retain `loop` mode as default.
- **Option 2 (Chosen)**: **Continuous Flow (`continuous`) with Preference Persistence**:
  - Default `state.playbackMode` to `"continuous"`.
  - Persist user toggles to `localStorage` (`shadowing_playback_mode`).
  - _Outcome_: Chosen. Improves out-of-the-box immersion.

### D. Daily Hub & Practice Analytics

- **Option 1**: Retain wide banner at the top of the main container.
- **Option 2 (Chosen)**: **Dedicated Insights & Reports Modal + Header Indicator Badges**:
  - Remove `#dailyHubSection` banner from the main container.
  - Add `📊 Insights` navigation button opening a modal with Streak calendar, 15m daily goal progress, sentences shadowed counters, and 5-Box SRS mastery distribution.
  - Keep compact badges (`🔥` and `0 Due`) in the header for glanceable motivation.
  - _Outcome_: Chosen. Cleans the main viewport while preserving progress tracking.

### E. Voice Recorder & Comparative UI

- **Option 1**: Keep disabled buttons on the stage.
- **Option 2 (Chosen)**: **Clean UI Removal for Future Polish**:
  - Temporarily remove the waveform box, mic record button, and `[M]` hotkey from the player UI to focus on core playback ergonomics.
  - _Outcome_: Chosen. Provides maximum visual clarity.

---

## 4. Consequences

### Positive

- **Immersive Ergonomics**: Pinned bottom player dock ensures transport controls are always within thumb reach without competing with transcript scrolling.
- **Fast Access**: Learners can bookmark or share scenario URLs directly.
- **Uncluttered Viewport**: Removing the wide daily hub banner expands the usable study area.
- **Smooth Audio Flow**: Continuous playback provides uninterrupted shadowing rhythm.

### Negative / Trade-offs

- Requires careful CSS height management (`h-screen overflow-hidden`) to ensure smooth scrolling inside the transcript card across various mobile browser address bars.
