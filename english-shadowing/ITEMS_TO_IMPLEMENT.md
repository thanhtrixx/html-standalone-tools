# English Shadowing Player — Backlog & Roadmap

## 🎯 Milestone 3: App-Shell Layout, URL Scenario Deep-Linking, Default Continuous Mode & Insights Modal

### Epic: Application-First Shadowing Workspace & Deep-Linking Navigation

- **Status:** Phase 1 Ready for Implementation ([ADR-0004](./docs/adr/0004-app-shell-url-routing-and-insights-reports.md))

---

### Vertical Slices Breakdown

#### Slice 1: URL Scenario Deep-Linking & History State Engine

- [ ] Support `?scenario=<id>` query parameter on initial page load to automatically load scenario and enter Player view.
- [ ] Implement two-way URL synchronization via `history.pushState` / `replaceState` on scenario selection and catalog return.
- [ ] Add `popstate` event listener for seamless browser Back/Forward navigation.
- [ ] Add fallback handling with friendly toast notification when an invalid scenario ID is supplied.
- [ ] Automated unit & DOM seam tests covering URL parsing, routing transitions, and history events.

#### Slice 2: Continuous Flow Default & Recording UI Cleanup

- [ ] Set default `state.playbackMode` to `"continuous"`.
- [ ] Persist user playback mode selection in `localStorage` (`shadowing_playback_mode`).
- [ ] Temporarily remove/hide `waveformComparisonBox`, `btnDockRecord`, `btnRecordPrompt`, and `[M]` hotkey from active player stage.
- [ ] Ensure seamless auto-advancing audio playback between sentence cues without pause in continuous mode.
- [ ] Automated unit & storage seam tests for playback mode defaults and persistence.

#### Slice 3: Dedicated Insights & Reports Modal & Header Motivation Indicators

- [ ] Remove wide `#dailyHubSection` banner from the main container.
- [ ] Add `📊 Insights` button to top navigation bar with bilingual labels.
- [ ] Create dedicated Insights modal displaying Streak counter 🔥, 15m Daily Practice Goal progress, Sentences Shadowed counters, and 5-Box SRS vocabulary mastery distribution.
- [ ] Add compact header indicator badges (`🔥 Streak`, `📚 Due Count`) for glanceable daily motivation.
- [ ] 100% bilingual parity across English and Vietnamese translation dictionaries (`I18N.md`).

#### Slice 4: App-Shell Layout, Central Transcript Feed & Pinned Bottom Player Dock

- [ ] Restructure DOM to fixed App Shell layout (`h-screen overflow-hidden flex flex-col`).
- [ ] Position `#subtitleStage` as prominent centerpiece hero card in upper central stage.
- [ ] Embed `#transcriptCard` in central workspace with default expanded state, bilingual cues, and smooth auto-scroll to active sentence.
- [ ] Pin `#player-container` transport dock fixed at the bottom edge with scrubber, milestone markers, primary controls, speed pill, and mode switch.
- [ ] Multi-device E2E and visual tests verifying desktop, tablet, and mobile responsiveness.

---

## 🏁 Completed Milestones

- ✅ **Milestone 1**: Standalone PWA Architecture, Leitner SRS & Smart SRT Engine ([ADR-0001](./docs/adr/0001-english-shadowing-pwa-architecture-and-data-model.md), [ADR-0002](./docs/adr/0002-voice-recorder-leitner-srs-and-smart-srt-engine.md))
- ✅ **Milestone 2**: Enhanced LRC Karaoke Engine, Neural Audio Pipeline & Integrated Transport Dock ([ADR-0003](./docs/adr/0003-enhanced-lrc-karaoke-engine-audio-cdn-and-integrated-player.md))
