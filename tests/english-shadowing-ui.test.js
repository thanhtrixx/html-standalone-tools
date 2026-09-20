const fs = require("fs");
const path = require("path");

async function runTests() {
  console.log("🎨 Running English Shadowing UI & DOM Verification Tests...\n");
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  const htmlPath = path.join(
    __dirname,
    "..",
    "english-shadowing",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  // 1. Core structural containers
  assert(
    htmlContent.includes('id="catalog-view"'),
    "Catalog view container exists"
  );
  assert(
    htmlContent.includes('id="player-view"'),
    "Player view container exists"
  );
  assert(
    htmlContent.includes('id="subtitleStage"'),
    "Subtitle stage container exists"
  );
  assert(
    htmlContent.includes('id="transport-dock"'),
    "Transport dock container exists"
  );
  assert(
    htmlContent.includes('id="wordPopover"'),
    "Word popover element exists"
  );
  assert(
    htmlContent.includes('id="vocabDrawer"'),
    "Vocabulary drawer element exists"
  );
  assert(
    htmlContent.includes('id="hotkeyModal"'),
    "Hotkey cheat sheet modal exists"
  );
  assert(
    !htmlContent.includes('id="importModal"'),
    "Legacy #importModal is completely excised from index.html"
  );
  assert(
    htmlContent.includes('id="flashcardModal"'),
    "Flashcard review modal exists"
  );

  // 2. Transport and Ergonomic buttons
  assert(
    htmlContent.includes('id="mainPlayPauseBtn"'),
    "Play/Pause transport button exists"
  );
  assert(
    htmlContent.includes('onclick="replayCurrentSentence()"'),
    "Replay sentence button exists"
  );
  assert(
    htmlContent.includes('onclick="navigateSentence(-1)"'),
    "Previous sentence button exists"
  );
  assert(
    htmlContent.includes('onclick="navigateSentence(1)"'),
    "Next sentence button exists"
  );
  assert(htmlContent.includes('id="speedBtn"'), "Speed selector button exists");
  assert(
    htmlContent.includes('id="speedPopover"'),
    "Speed selection popover element exists in transport dock"
  );
  assert(
    htmlContent.includes('onclick="toggleSpeedPopover(event)"'),
    "Toggle speed popover click handler exists"
  );
  assert(
    htmlContent.includes("function setPlaybackSpeed"),
    "setPlaybackSpeed function exists"
  );
  assert(
    htmlContent.includes("function stepPlaybackSpeed"),
    "stepPlaybackSpeed function exists"
  );
  assert(
    htmlContent.includes('id="modeLoopBtn"'),
    "Sentence Loop mode button exists"
  );
  assert(
    htmlContent.includes('id="modeContinuousBtn"'),
    "Continuous flow mode button exists"
  );
  assert(
    htmlContent.includes('id="modeEchoicBtn"'),
    "Hands-Free Echoic mode button exists"
  );

  // 3. Subtitle Masking Modes
  assert(
    htmlContent.includes('id="subMaskDual"'),
    "Dual subtitle mask button exists"
  );
  assert(
    htmlContent.includes('id="subMaskPrimary"'),
    "English only mask button exists"
  );
  assert(
    htmlContent.includes('id="subMaskSecondary"'),
    "Vietnamese only mask button exists"
  );
  assert(
    htmlContent.includes('id="subMaskBlur"'),
    "Blind listening (blur) mask button exists"
  );

  // 4. Word Popover & Status Tiers
  assert(
    htmlContent.includes("onclick=\"setWordStatus('new')\""),
    "Status button 'new' exists"
  );
  assert(
    htmlContent.includes("onclick=\"setWordStatus('learning')\""),
    "Status button 'learning' exists"
  );
  assert(
    htmlContent.includes("onclick=\"setWordStatus('mastered')\""),
    "Status button 'mastered' exists"
  );
  assert(
    htmlContent.includes('id="popoverPronounceBtn"'),
    "Word pronunciation button exists"
  );

  // 5. PWA Meta Tags & Manifest
  assert(htmlContent.includes('rel="manifest"'), "Link to manifest exists");
  assert(
    htmlContent.includes('meta name="theme-color"'),
    "Theme color meta tag exists"
  );
  assert(
    htmlContent.includes('meta name="viewport"'),
    "Viewport meta tag exists"
  );

  // 7. Practice Insights & Header Indicators (Slice 3)
  assert(
    !htmlContent.includes('id="dailyHubSection"'),
    "dailyHubSection is removed from main container"
  );
  assert(
    htmlContent.includes('id="navBtnInsights"'),
    "navBtnInsights button exists in header"
  );
  assert(
    htmlContent.includes('id="headerStreakBadge"'),
    "Header streak indicator badge exists"
  );
  assert(
    htmlContent.includes('id="headerStreakCount"'),
    "Header streak count element exists"
  );
  assert(
    htmlContent.includes('id="insightsModal"'),
    "Practice Insights & Analytics modal container exists"
  );
  assert(
    htmlContent.includes('id="modalStreakDays"'),
    "Modal streak days element exists"
  );
  assert(
    htmlContent.includes('id="modalPracticeTime"'),
    "Modal practice time progress tracker exists"
  );
  assert(
    htmlContent.includes('id="modalGoalProgressBar"'),
    "Modal 15m goal progress bar exists"
  );
  assert(
    htmlContent.includes('id="modalSentencesToday"'),
    "Modal sentences shadowed today counter exists"
  );
  assert(
    htmlContent.includes('id="modalSentencesTotal"'),
    "Modal total sentences shadowed counter exists"
  );
  assert(
    htmlContent.includes('id="modalDueWordsCount"'),
    "Modal due words count exists"
  );
  assert(
    htmlContent.includes('id="modalTotalVocabCount"'),
    "Modal total vocabulary counter exists"
  );
  assert(
    htmlContent.includes('id="boxCount1"') &&
      htmlContent.includes('id="boxCount5"'),
    "5-Box SRS vocabulary mastery distribution exists"
  );
  assert(
    htmlContent.includes('onclick="exportPracticeStatsJson()"'),
    "Export practice stats JSON action button exists"
  );
  assert(
    htmlContent.includes('onclick="resetPracticeStats()"'),
    "Reset practice stats action button exists"
  );

  // 8. Recording Dock & Waveform Comparison UI
  assert(
    htmlContent.includes('id="waveformComparisonBox"'),
    "waveformComparisonBox is rendered in player stage"
  );
  assert(
    htmlContent.includes('id="dualWaveformCanvas"'),
    "dualWaveformCanvas is rendered in player stage"
  );
  assert(
    htmlContent.includes('id="btnDockRecord"'),
    "btnDockRecord is rendered in transport dock"
  );
  assert(
    htmlContent.includes('id="btnPlayUserVoice"'),
    "btnPlayUserVoice button exists"
  );
  assert(
    htmlContent.includes('id="btnAutoAbCompare"'),
    "btnAutoAbCompare button exists"
  );
  assert(
    htmlContent.includes('id="btnDeleteRecording"'),
    "btnDeleteRecording button exists"
  );
  assert(
    htmlContent.includes('id="repeatPromptContainer"'),
    "Clean repeat prompt container exists"
  );

  // 9. Leitner SRS Due Badges & Flashcards UI
  assert(
    htmlContent.includes('id="headerDueBadge"'),
    "Header due badge exists"
  );
  assert(
    htmlContent.includes('id="flashcardCounter"'),
    "Flashcard counter element exists"
  );
  assert(
    htmlContent.includes('id="flashcardBoxLabel"'),
    "Flashcard box label exists"
  );
  assert(
    htmlContent.includes("onclick=\"gradeFlashcard('hard')\""),
    "Flashcard grade 'hard' button exists"
  );
  assert(
    htmlContent.includes("onclick=\"gradeFlashcard('good')\""),
    "Flashcard grade 'good' button exists"
  );
  assert(
    htmlContent.includes("onclick=\"gradeFlashcard('mastered')\""),
    "Flashcard grade 'mastered' button exists"
  );
  assert(
    htmlContent.includes('onclick="exportAnkiCsv()"'),
    "Anki CSV export button exists"
  );

  // 10. FTUX Onboarding & Clean Subtitle Stage (Issue #688)
  assert(
    htmlContent.includes('data-i18n="howToShadowTitle"'),
    "3-Step How to Shadow FTUX onboarding guide exists"
  );
  assert(
    !htmlContent.includes("onclick=\"nudgeActiveCueTiming('start', -0.1)\""),
    "Timing nudge backward (-100ms) button is removed from subtitle stage"
  );
  assert(
    !htmlContent.includes("onclick=\"nudgeActiveCueTiming('start', 0.1)\""),
    "Timing nudge forward (+100ms) button is removed from subtitle stage"
  );
  assert(
    !htmlContent.includes('onclick="exportCurrentScenarioSrt()"'),
    "Export SRT button is removed from player top bar"
  );
  assert(
    !htmlContent.includes('onclick="exportCurrentScenarioLrc()"'),
    "Export Enhanced LRC button is removed from player top bar"
  );
  assert(
    htmlContent.includes('data-i18n="btnBackToCatalog"'),
    "Back to Catalog button exists in player top bar"
  );

  // 11. App Shell Layout & DOM Hierarchy (Slice 4)
  assert(
    htmlContent.includes('id="player-container"'),
    "Integrated Player Card container exists"
  );
  assert(
    htmlContent.includes('class="h-screen overflow-hidden'),
    "App shell fixed viewport container exists on body"
  );
  const subtitleStageIdx = htmlContent.indexOf('id="subtitleStage"');
  const transcriptCardIdx = htmlContent.indexOf('id="transcriptCard"');
  const playerContainerIdx = htmlContent.indexOf('id="player-container"');
  const transportDockIdx = htmlContent.indexOf('id="transport-dock"');
  assert(
    subtitleStageIdx < transcriptCardIdx &&
      transcriptCardIdx < playerContainerIdx &&
      playerContainerIdx < transportDockIdx,
    "Layout hierarchy: subtitleStage -> transcriptCard -> player-container -> transport-dock"
  );

  // 12. Audio Element & Scrubber Milestones
  assert(
    htmlContent.includes('id="playerAudio"'),
    "HTML5 playerAudio element exists in DOM"
  );
  assert(
    htmlContent.includes('id="scrubberMilestones"'),
    "Audio scrubber milestone marks container exists"
  );

  // 13. Collapsible Read-Only Transcript Drawer
  assert(
    htmlContent.includes('id="transcriptCard"'),
    "Collapsible transcript card exists"
  );
  assert(
    htmlContent.includes('onclick="toggleTranscriptDrawer()"'),
    "Transcript drawer toggle trigger exists"
  );
  assert(
    htmlContent.includes('id="btnToggleTranscript"'),
    "Transcript drawer toggle button exists"
  );
  assert(
    !htmlContent.includes('onchange="updateCueTextInline'),
    "Inline text edit inputs are removed from transcript feed"
  );
  assert(
    htmlContent.includes('onclick="jumpToSentence(${idx})"'),
    "Clickable full-row sentence jump handler is present in transcript renderer"
  );

  // 14. Karaoke Visual Tokens & Repeat Prompt
  assert(
    htmlContent.includes("karaoke-word"),
    "Karaoke word class is referenced in subtitle renderer"
  );
  assert(
    htmlContent.includes('id="repeatPromptContainer"'),
    "Repeat prompt container exists in DOM"
  );
  assert(
    htmlContent.includes("function showRepeatPrompt"),
    "showRepeatPrompt function definition exists"
  );
  assert(
    htmlContent.includes("function hideRepeatPrompt"),
    "hideRepeatPrompt function definition exists"
  );

  // 15. URL Scenario Deep-Linking & Toast Notifications
  assert(
    htmlContent.includes('id="toastContainer"'),
    "Toast container element exists in DOM"
  );
  assert(
    htmlContent.includes("function parseScenarioUrl"),
    "parseScenarioUrl function definition exists"
  );
  assert(
    htmlContent.includes("function buildScenarioUrl"),
    "buildScenarioUrl function definition exists"
  );
  assert(
    htmlContent.includes("function updateScenarioUrl"),
    "updateScenarioUrl function definition exists"
  );
  assert(
    htmlContent.includes("function showToast"),
    "showToast function definition exists"
  );
  assert(
    htmlContent.includes('window.addEventListener("popstate"'),
    "popstate history event listener registered"
  );

  // 16. In-App Storage Maintenance & Offline Error Handling UI (ADR-0007 / Slice 2)
  assert(
    htmlContent.includes('id="btnClearMediaCache"'),
    "Clear Media Cache button exists in Insights Modal"
  );
  assert(
    htmlContent.includes('onclick="clearMediaCacheStorage()"'),
    "Clear Media Cache button triggers clearMediaCacheStorage()"
  );
  assert(
    htmlContent.includes('id="navBtnRefresh"'),
    "Force check updates & reload button exists in Header"
  );
  assert(
    htmlContent.includes('id="btnCheckUpdatesModal"'),
    "Check updates button exists in Insights Modal"
  );
  assert(
    htmlContent.includes('onclick="forceCheckUpdatesAndReload()"'),
    "Check updates buttons trigger forceCheckUpdatesAndReload()"
  );
  // 17. Multi-Dimensional Catalog Taxonomy & Progress UI (Issue #674)
  assert(
    htmlContent.includes('id="statusTabAll"'),
    "Catalog status tab 'All' exists"
  );
  assert(
    htmlContent.includes('id="statusTabBookmarked"'),
    "Catalog status tab 'Bookmarked' exists"
  );
  assert(
    htmlContent.includes('id="statusTabInProgress"'),
    "Catalog status tab 'In Progress' exists"
  );
  assert(
    htmlContent.includes('id="statusTabMastered"'),
    "Catalog status tab 'Mastered' exists"
  );
  assert(
    htmlContent.includes("function setFilterStatus"),
    "setFilterStatus function definition exists"
  );
  assert(
    htmlContent.includes("function setFilterCollection"),
    "setFilterCollection function definition exists"
  );
  assert(
    htmlContent.includes("function toggleBookmark"),
    "toggleBookmark function definition exists"
  );
  assert(
    htmlContent.includes("function isScenarioBookmarked"),
    "isScenarioBookmarked function definition exists"
  );
  assert(
    htmlContent.includes("function getScenarioProgress"),
    "getScenarioProgress function definition exists"
  );
  assert(
    htmlContent.includes("function markSentenceCompleted"),
    "markSentenceCompleted function definition exists"
  );
  assert(
    htmlContent.includes("bookmark-btn"),
    "Scenario cards include bookmark button styling/class"
  );
  assert(
    htmlContent.includes('data-i18n="noScenariosFound"'),
    "Catalog empty state has data-i18n='noScenariosFound'"
  );

  // 17. Dynamic Cue Lookup & Scrubber Pointer Event Protection
  assert(
    htmlContent.includes("function findCueIndexByTime"),
    "findCueIndexByTime function definition exists in index.html"
  );
  assert(
    htmlContent.includes("function onScrubberChange"),
    "onScrubberChange function definition exists in index.html"
  );
  assert(
    htmlContent.includes("function onScrubberPointerDown"),
    "onScrubberPointerDown function definition exists in index.html"
  );
  assert(
    htmlContent.includes("function onScrubberPointerUp"),
    "onScrubberPointerUp function definition exists in index.html"
  );
  assert(
    htmlContent.includes('onpointerdown="onScrubberPointerDown()"'),
    "audioScrubber element binds onpointerdown to prevent drag stutter"
  );
  assert(
    htmlContent.includes("jumpToSentence(${idx})"),
    "Scrubber milestones bind jumpToSentence to jump when clicked"
  );
  assert(
    htmlContent.includes("isAudioSeeking = true") &&
      htmlContent.includes("isAudioSeeking = false"),
    "Audio seek lock state is tracked during sentence jumps to prevent audio-karaoke desync"
  );
  assert(
    htmlContent.includes("function openWordPopover") &&
      htmlContent.includes("if (state.isPlaying) {\n          pauseAudio();"),
    "Opening word popover automatically pauses audio for calm study"
  );

  // 18. Scenario Card Clickability & Navigation Audio Lifecycle
  assert(
    htmlContent.includes(
      'if (viewName === "catalog") {\n          pauseAudio();'
    ),
    "switchView('catalog') immediately pauses audio when leaving player view"
  );
  assert(
    htmlContent.includes('class="scenario-card') &&
      htmlContent.includes("cursor-pointer") &&
      htmlContent.includes("onclick=\"selectScenarioById('${sc.id}')\""),
    "Full scenario card is clickable with cursor-pointer and onclick handler"
  );
  assert(
    htmlContent.includes('tabindex="0"') &&
      htmlContent.includes('role="button"') &&
      htmlContent.includes(
        "onkeydown=\"if(event.key==='Enter'||event.key===' ')"
      ),
    "Scenario cards support keyboard accessibility (Enter/Space)"
  );
  assert(
    !htmlContent.includes(
      '<button\n                    onclick="selectScenarioById'
    ),
    "Standalone practice button is removed from scenario card footer"
  );

  console.log(`\n==================================================`);
  console.log(
    `📊 UI Tests Completed: ${passCount} Passed, ${failCount} Failed`
  );
  console.log(`==================================================\n`);

  if (failCount > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
