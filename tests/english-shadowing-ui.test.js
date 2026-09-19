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
    htmlContent.includes('id="importModal"'),
    "Scenario import modal exists"
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
  assert(htmlContent.includes('id="speedBtn"'), "Speed stepper button exists");
  assert(
    htmlContent.includes('id="modeLoopBtn"'),
    "Sentence Loop mode button exists"
  );
  assert(
    htmlContent.includes('id="modeContinuousBtn"'),
    "Continuous flow mode button exists"
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

  // 7. Daily Practice Hub & Streak Tracking UI
  assert(
    htmlContent.includes('id="streakDaysCount"'),
    "Streak days counter element exists"
  );
  assert(
    htmlContent.includes('id="practiceMinutesTracker"'),
    "Practice minutes tracker element exists"
  );
  assert(
    htmlContent.includes('id="sentencesShadowedTracker"'),
    "Sentences shadowed tracker element exists"
  );

  // 8. Microphone Recorder & Dual Waveform UI
  assert(
    htmlContent.includes('id="btnDockRecord"'),
    "Microphone record dock button exists"
  );
  assert(
    htmlContent.includes('id="recPromptLabel"'),
    "Record prompt label exists"
  );
  assert(
    htmlContent.includes('id="dualWaveformCanvas"'),
    "Dual waveform canvas element exists"
  );
  assert(
    htmlContent.includes('id="btnPlayUserVoice"'),
    "User voice playback button exists"
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

  // 10. SRT Timing Nudge & Export UI
  assert(
    htmlContent.includes("onclick=\"nudgeActiveCueTiming('start', -0.1)\""),
    "Start timing nudge backward (-100ms) button exists"
  );
  assert(
    htmlContent.includes("onclick=\"nudgeActiveCueTiming('start', 0.1)\""),
    "Start timing nudge forward (+100ms) button exists"
  );
  assert(
    htmlContent.includes('onclick="exportCurrentScenarioSrt()"'),
    "Export SRT button exists"
  );

  // 11. Integrated Player Card & Layout Flow
  assert(
    htmlContent.includes('id="player-container"'),
    "Integrated Player Card container exists"
  );
  const playerContainerIdx = htmlContent.indexOf('id="player-container"');
  const subtitleStageIdx = htmlContent.indexOf('id="subtitleStage"');
  const transportDockIdx = htmlContent.indexOf('id="transport-dock"');
  const transcriptCardIdx = htmlContent.indexOf('id="transcriptCard"');
  assert(
    playerContainerIdx < subtitleStageIdx &&
      subtitleStageIdx < transportDockIdx &&
      transportDockIdx < transcriptCardIdx,
    "Layout hierarchy: player-container -> subtitleStage -> transport-dock -> transcriptCard"
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

  // 13. Collapsible Transcript Drawer
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

  // 14. Export Enhanced LRC & Karaoke Visual Tokens
  assert(
    htmlContent.includes('onclick="exportCurrentScenarioLrc()"'),
    "Export Enhanced LRC button exists"
  );
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
