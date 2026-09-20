const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execSync } = require("child_process");

async function runTests() {
  console.log("🧪 Running English Shadowing Engine & SRT Parser Tests...\n");
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

  // Read index.html to extract logic
  const htmlPath = path.join(
    __dirname,
    "..",
    "english-shadowing",
    "index.html"
  );
  assert(fs.existsSync(htmlPath), "english-shadowing/index.html exists");

  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  const createMockElement = () => ({
    textContent: "",
    innerHTML: "",
    value: "",
    src: "",
    playbackRate: 1,
    play: () => Promise.resolve(),
    pause: () => {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() {
        return false;
      },
    },
    style: {},
    appendChild() {},
    removeChild() {},
    remove() {},
    setAttribute() {},
    getAttribute() {
      return null;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    contains: () => false,
    scrollIntoView: () => {},
    getContext: () => ({
      clearRect() {},
      fillRect() {},
      beginPath() {},
      arc() {},
      stroke() {},
      fill() {},
      moveTo() {},
      lineTo() {},
    }),
  });

  const elementsById = {};
  const getOrCreateElement = (id) => {
    if (!elementsById[id]) {
      const el = createMockElement();
      el.id = id;
      el.parentElement = {};
      elementsById[id] = el;
    }
    return elementsById[id];
  };

  const sandbox = {
    console,
    Map,
    Set,
    Promise,
    performance: globalThis.performance || { now: () => Date.now() },
    localStorage: {
      _data: {},
      getItem(k) {
        return this._data[k] || null;
      },
      setItem(k, v) {
        this._data[k] = String(v);
      },
      removeItem(k) {
        delete this._data[k];
      },
    },
    document: {
      querySelectorAll: () => [],
      querySelector: () => null,
      getElementById: (id) => getOrCreateElement(id),
      createElement: () => createMockElement(),
      documentElement: createMockElement(),
      addEventListener: () => {},
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    requestAnimationFrame: (cb) => {
      return setTimeout(cb, 16);
    },
    cancelAnimationFrame: (id) => {
      clearTimeout(id);
    },
    window: {
      addEventListener: () => {},
      scrollTo: () => {},
      location: { search: "", pathname: "/app/" },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      requestAnimationFrame: (cb) => {
        return setTimeout(cb, 16);
      },
      cancelAnimationFrame: (id) => {
        clearTimeout(id);
      },
    },
    Audio: class {
      constructor() {
        this.src = "";
        this.playbackRate = 1;
      }
      addEventListener() {}
      play() {
        return Promise.resolve();
      }
      pause() {}
    },
    URLSearchParams,
    URL,
  };

  vm.createContext(sandbox);

  // Extract inline scripts with fast index slicing
  const scriptBlocks = [];
  let scriptPos = 0;
  while (true) {
    const startTag = htmlContent.indexOf("<script", scriptPos);
    if (startTag === -1) break;
    const endTag = htmlContent.indexOf(">", startTag);
    if (endTag === -1) break;
    const tagHeader = htmlContent.slice(startTag, endTag);
    const closeTag = htmlContent.indexOf("</script>", endTag);
    if (closeTag === -1) break;
    if (!tagHeader.includes("src=")) {
      scriptBlocks.push(htmlContent.slice(endTag + 1, closeTag));
    }
    scriptPos = closeTag + 9;
  }
  const combinedScripts = scriptBlocks.join("\n");
  const exportBridge = `
    globalThis.SCENARIOS_MANIFEST = typeof SCENARIOS_MANIFEST !== 'undefined' ? SCENARIOS_MANIFEST : [];
    globalThis.CURATED_SCENARIOS = typeof CURATED_SCENARIOS !== 'undefined' ? CURATED_SCENARIOS : [];
    globalThis.resolveScenarioAudioUrl = typeof resolveScenarioAudioUrl !== 'undefined' ? resolveScenarioAudioUrl : function(){};
    globalThis.resolveScenarioLrcUrl = typeof resolveScenarioLrcUrl !== 'undefined' ? resolveScenarioLrcUrl : function(){};
    globalThis.BUILTIN_VOCAB_DB = typeof BUILTIN_VOCAB_DB !== 'undefined' ? BUILTIN_VOCAB_DB : {};
    globalThis.lookupDictionary = typeof lookupDictionary !== 'undefined' ? lookupDictionary : function(){};
    globalThis.sanitizeSrtLine = typeof sanitizeSrtLine !== 'undefined' ? sanitizeSrtLine : function(){};
    globalThis.formatSecondsToTime = typeof formatSecondsToTime !== 'undefined' ? formatSecondsToTime : function(){};
    globalThis.parseLrcTimecode = typeof parseLrcTimecode !== 'undefined' ? parseLrcTimecode : function(){};
    globalThis.formatSecondsToLrcTime = typeof formatSecondsToLrcTime !== 'undefined' ? formatSecondsToLrcTime : function(){};
    globalThis.parseEnhancedLrc = typeof parseEnhancedLrc !== 'undefined' ? parseEnhancedLrc : function(){};
    globalThis.generateEnhancedLrcString = typeof generateEnhancedLrcString !== 'undefined' ? generateEnhancedLrcString : function(){};
    globalThis.calculateKaraokeWordIndex = typeof calculateKaraokeWordIndex !== 'undefined' ? calculateKaraokeWordIndex : function(){};
    globalThis.findCueIndexByTime = typeof findCueIndexByTime !== 'undefined' ? findCueIndexByTime : function(){};
    globalThis.parseScenarioUrl = typeof parseScenarioUrl !== 'undefined' ? parseScenarioUrl : function(){};
    globalThis.buildScenarioUrl = typeof buildScenarioUrl !== 'undefined' ? buildScenarioUrl : function(){};
    globalThis.updateScenarioUrl = typeof updateScenarioUrl !== 'undefined' ? updateScenarioUrl : function(){};
    globalThis.jumpToSentence = typeof jumpToSentence !== 'undefined' ? jumpToSentence : function(){};
    globalThis.playAudio = typeof playAudio !== 'undefined' ? playAudio : function(){};
    globalThis.pauseAudio = typeof pauseAudio !== 'undefined' ? pauseAudio : function(){};
    globalThis.replayCurrentSentence = typeof replayCurrentSentence !== 'undefined' ? replayCurrentSentence : function(){};
    globalThis.navigateSentence = typeof navigateSentence !== 'undefined' ? navigateSentence : function(){};
    globalThis.onScrubberChange = typeof onScrubberChange !== 'undefined' ? onScrubberChange : function(){};
    globalThis.onScrubberInput = typeof onScrubberInput !== 'undefined' ? onScrubberInput : function(){};
    globalThis.calculateLoopEndBoundary = typeof calculateLoopEndBoundary !== 'undefined' ? calculateLoopEndBoundary : function(){};
    globalThis.calculateLoopStartBoundary = typeof calculateLoopStartBoundary !== 'undefined' ? calculateLoopStartBoundary : function(){};
    globalThis.calculateEchoicPauseDuration = typeof calculateEchoicPauseDuration !== 'undefined' ? calculateEchoicPauseDuration : function(){};
    globalThis.SPEED_PRESETS = typeof SPEED_PRESETS !== 'undefined' ? SPEED_PRESETS : [];
    globalThis.SCENARIO_CUES_CACHE = typeof SCENARIO_CUES_CACHE !== 'undefined' ? SCENARIO_CUES_CACHE : null;
    globalThis.selectScenario = typeof selectScenario !== 'undefined' ? selectScenario : null;
    globalThis.proceedSelectScenario = typeof proceedSelectScenario !== 'undefined' ? proceedSelectScenario : null;
    globalThis.state = typeof state !== 'undefined' ? state : {};
    Object.defineProperty(globalThis, 'simulatedTime', {
      get: () => typeof simulatedTime !== 'undefined' ? simulatedTime : 0,
      set: (v) => { if (typeof simulatedTime !== 'undefined') simulatedTime = v; },
      configurable: true,
      enumerable: true
    });
  `;
  vm.runInContext(combinedScripts + "\n" + exportBridge, sandbox);

  const {
    formatSecondsToTime,
    sanitizeSrtLine,
    parseLrcTimecode,
    formatSecondsToLrcTime,
    parseEnhancedLrc,
    generateEnhancedLrcString,
    calculateKaraokeWordIndex,
    findCueIndexByTime,
    parseScenarioUrl,
    buildScenarioUrl,
    updateScenarioUrl,
    jumpToSentence,
    playAudio,
    pauseAudio,
    replayCurrentSentence,
    navigateSentence,
    onScrubberChange,
    onScrubberInput,
    calculateLoopEndBoundary,
    calculateLoopStartBoundary,
    calculateEchoicPauseDuration,
    SPEED_PRESETS,
    SCENARIOS_MANIFEST,
    CURATED_SCENARIOS,
    resolveScenarioAudioUrl,
    resolveScenarioLrcUrl,
    BUILTIN_VOCAB_DB,
    lookupDictionary,
    SCENARIO_CUES_CACHE,
    selectScenario,
    proceedSelectScenario,
    state,
  } = sandbox;

  // 1. Legacy Retirement Verification (Issue #673)
  assert(
    typeof sandbox.parseSrt === "undefined",
    "Legacy parseSrt function is completely retired"
  );
  assert(
    typeof sandbox.parseSrtTimecode === "undefined",
    "Legacy parseSrtTimecode function is completely retired"
  );
  assert(
    typeof sandbox.generateSrtString === "undefined",
    "Legacy generateSrtString function is completely retired"
  );
  assert(
    typeof sandbox.formatSecondsToSrtTime === "undefined",
    "Legacy formatSecondsToSrtTime function is completely retired"
  );
  assert(
    !htmlContent.includes('id="importModal"'),
    "Legacy #importModal DOM element is completely removed"
  );
  assert(
    !htmlContent.includes("openImportModal"),
    "Legacy openImportModal function is completely removed"
  );
  assert(
    !htmlContent.includes("closeImportModal"),
    "Legacy closeImportModal function is completely removed"
  );
  assert(
    !htmlContent.includes("handleCustomScenarioSubmit"),
    "Legacy handleCustomScenarioSubmit function is completely removed"
  );

  // 2. Format Seconds to Time String
  assert(
    typeof formatSecondsToTime === "function",
    "formatSecondsToTime function exists"
  );
  assert(formatSecondsToTime(0) === "00:00", "Formats 0s to 00:00");
  assert(formatSecondsToTime(45) === "00:45", "Formats 45s to 00:45");
  assert(formatSecondsToTime(75) === "01:15", "Formats 75s to 01:15");
  assert(
    formatSecondsToTime(3665) === "61:05",
    "Formats >1hr to 61:05 (MM:SS format)"
  );

  // 3. In-Memory Cue Cache Structure
  assert(
    SCENARIO_CUES_CACHE instanceof Map,
    "SCENARIO_CUES_CACHE is instantiated as an in-memory Map"
  );

  // 5. Convention-over-Configuration Media Routing Helper Seams
  assert(
    typeof resolveScenarioAudioUrl === "function",
    "resolveScenarioAudioUrl function exists"
  );
  assert(
    typeof resolveScenarioLrcUrl === "function",
    "resolveScenarioLrcUrl function exists"
  );

  // 5.1 Audio URL Resolution by ID string
  assert(
    resolveScenarioAudioUrl("specialty-coffee") ===
      "audio/specialty-coffee.mp3",
    "resolveScenarioAudioUrl('specialty-coffee') resolves to 'audio/specialty-coffee.mp3'"
  );
  assert(
    resolveScenarioAudioUrl("tech-standup") === "audio/tech-standup.mp3",
    "resolveScenarioAudioUrl('tech-standup') resolves to 'audio/tech-standup.mp3'"
  );

  // 5.2 Audio URL Resolution by Object without explicit audioUrl
  assert(
    resolveScenarioAudioUrl({ id: "academic-ai-future" }) ===
      "audio/academic-ai-future.mp3",
    "resolveScenarioAudioUrl({ id }) resolves canonical audio path"
  );

  // 5.3 Audio URL Preservation of Explicit / Custom CDN Override
  assert(
    resolveScenarioAudioUrl({
      id: "custom-cdn",
      audioUrl: "https://cdn.example.com/tracks/custom-cdn.mp3",
    }) === "https://cdn.example.com/tracks/custom-cdn.mp3",
    "resolveScenarioAudioUrl preserves explicit external audioUrl"
  );
  assert(
    resolveScenarioAudioUrl({
      id: "custom-local",
      audioUrl: "custom/path/sound.ogg",
    }) === "custom/path/sound.ogg",
    "resolveScenarioAudioUrl preserves explicit relative audioUrl"
  );

  // 5.4 Audio URL Edge Cases & Resilience
  assert(
    resolveScenarioAudioUrl(null) === "",
    "resolveScenarioAudioUrl handles null safely without throwing"
  );
  assert(
    resolveScenarioAudioUrl({}) === "",
    "resolveScenarioAudioUrl handles empty object safely without throwing"
  );

  // 5.5 LRC URL Resolution by ID string
  assert(
    resolveScenarioLrcUrl("specialty-coffee") === "audio/specialty-coffee.lrc",
    "resolveScenarioLrcUrl('specialty-coffee') resolves to 'audio/specialty-coffee.lrc'"
  );
  assert(
    resolveScenarioLrcUrl("doctor-consultation") ===
      "audio/doctor-consultation.lrc",
    "resolveScenarioLrcUrl('doctor-consultation') resolves to 'audio/doctor-consultation.lrc'"
  );

  // 5.6 LRC URL Resolution by Object without explicit lrcUrl
  assert(
    resolveScenarioLrcUrl({ id: "job-interview" }) ===
      "audio/job-interview.lrc",
    "resolveScenarioLrcUrl({ id }) resolves canonical lrc path"
  );

  // 5.7 LRC URL Preservation of Explicit Override
  assert(
    resolveScenarioLrcUrl({
      id: "custom-lrc",
      lrcUrl: "https://cdn.example.com/subs/custom-lrc.lrc",
    }) === "https://cdn.example.com/subs/custom-lrc.lrc",
    "resolveScenarioLrcUrl preserves explicit external lrcUrl"
  );

  // 5.8 LRC URL Edge Cases & Resilience
  assert(
    resolveScenarioLrcUrl(null) === "",
    "resolveScenarioLrcUrl handles null safely without throwing"
  );
  assert(
    resolveScenarioLrcUrl({}) === "",
    "resolveScenarioLrcUrl handles empty object safely without throwing"
  );

  // 6. Scenario Manifest Schema & Anti-Bloat Invariant Verification
  const manifest =
    typeof SCENARIOS_MANIFEST !== "undefined" && SCENARIOS_MANIFEST.length > 0
      ? SCENARIOS_MANIFEST
      : CURATED_SCENARIOS;

  assert(
    Array.isArray(manifest) && manifest.length >= 6,
    `SCENARIOS_MANIFEST has at least 6 curated items (found ${manifest.length})`
  );

  const validCategories = new Set(["daily", "workplace", "travel", "academic"]);
  const validLevels = new Set(["A2", "B1", "B2", "C1"]);
  const validAccents = new Set(["US", "UK", "AU"]);
  const audioDir = path.join(__dirname, "..", "english-shadowing", "audio");

  manifest.forEach((sc, i) => {
    assert(
      typeof sc.id === "string" && sc.id.length > 0,
      `Manifest #${i + 1} (${sc.id}): 'id' is a non-empty string`
    );
    assert(
      typeof sc.title === "string" && sc.title.length > 0,
      `Manifest #${i + 1} (${sc.id}): 'title' is a non-empty string`
    );
    assert(
      validCategories.has(sc.category),
      `Manifest #${i + 1} (${sc.id}): 'category' is valid (${sc.category})`
    );
    assert(
      validLevels.has(sc.level),
      `Manifest #${i + 1} (${sc.id}): 'level' is valid CEFR (${sc.level})`
    );
    assert(
      validAccents.has(sc.accent),
      `Manifest #${i + 1} (${sc.id}): 'accent' is valid (${sc.accent})`
    );
    assert(
      typeof sc.duration === "number" && sc.duration > 0,
      `Manifest #${i + 1} (${sc.id}): 'duration' is a positive number (${sc.duration}s)`
    );
    assert(
      typeof sc.description === "string" && sc.description.length > 0,
      `Manifest #${i + 1} (${sc.id}): 'description' is a non-empty string`
    );
    assert(
      Array.isArray(sc.tags) && sc.tags.length > 0,
      `Manifest #${i + 1} (${sc.id}): 'tags' is a non-empty array (${JSON.stringify(sc.tags)})`
    );
    assert(
      typeof sc.collection === "string" && sc.collection.length > 0,
      `Manifest #${i + 1} (${sc.id}): 'collection' is a non-empty string (${sc.collection})`
    );
    assert(
      typeof sc.sentenceCount === "number" && sc.sentenceCount >= 10,
      `Manifest #${i + 1} (${sc.id}): 'sentenceCount' is >= 10 (${sc.sentenceCount})`
    );

    // Anti-Bloat Invariant: lrcContent should NOT be inlined in lightweight manifest
    assert(
      sc.lrcContent === undefined,
      `Manifest #${i + 1} (${sc.id}): lrcContent is NOT inlined in lightweight manifest (prevents bundle bloat)`
    );
    assert(
      sc.srtContent === undefined,
      `Manifest #${i + 1} (${sc.id}): srtContent is NOT inlined`
    );

    // Verify companion .lrc asset exists and has valid cues
    const lrcFilePath = path.join(audioDir, `${sc.id}.lrc`);
    assert(
      fs.existsSync(lrcFilePath),
      `Companion LRC asset exists at english-shadowing/audio/${sc.id}.lrc`
    );
    if (fs.existsSync(lrcFilePath)) {
      const lrcFileContent = fs.readFileSync(lrcFilePath, "utf8");
      const parsedCues = parseEnhancedLrc(lrcFileContent);
      assert(
        parsedCues.length >= 10,
        `Scenario #${i + 1} (${sc.id}) companion LRC contains valid cues (${parsedCues.length} >= 10)`
      );
    }
  });

  // 6.1 Build Script Companion Asset Packaging Verification (scripts/build.js)
  const buildScriptPath = path.join(__dirname, "..", "scripts", "build.js");
  assert(fs.existsSync(buildScriptPath), "scripts/build.js exists");
  const buildScriptContent = fs.readFileSync(buildScriptPath, "utf8");
  assert(
    buildScriptContent.includes('"scenarios.json"') ||
      buildScriptContent.includes("'scenarios.json'"),
    "scripts/build.js COMPANION_ASSETS includes 'scenarios.json' for dist sync"
  );

  // 7. SRT Sanitization Tests
  assert(
    typeof sanitizeSrtLine === "function",
    "sanitizeSrtLine function exists"
  );
  assert(
    sanitizeSrtLine("Speaker 1: Good morning everyone!") ===
      "Good morning everyone!",
    "Strips 'Speaker 1:' prefix"
  );
  assert(
    sanitizeSrtLine("John: How are you doing today?") ===
      "How are you doing today?",
    "Strips speaker name prefix"
  );
  assert(
    sanitizeSrtLine("[Music] Welcome to our podcast! [Applause]") ===
      "Welcome to our podcast!",
    "Strips [Music] and [Applause] brackets"
  );
  assert(
    sanitizeSrtLine("(Laughter) That was hilarious") === "That was hilarious",
    "Strips parenthesized audio cues"
  );
  assert(sanitizeSrtLine("") === "", "Handles empty input safely");

  // 8. On-Demand Dynamic LRC Streaming & Cache Verification (Issue #673)
  const sampleLrcText = `[00:00.00]Hello world, welcome to on-demand shadowing!
[00:00.00]>Xin chào thế giới, chào mừng bạn đến với luyện nói theo yêu cầu!
[00:04.50]This is fetched dynamically on demand.
[00:04.50]>Nội dung này được tải động theo yêu cầu.`;

  let fetchCallCount = 0;
  let lastFetchedUrl = "";
  sandbox.fetch = async (url) => {
    fetchCallCount++;
    lastFetchedUrl = url;
    if (url.includes("not-found")) {
      return { ok: false, status: 404, text: async () => "Not Found" };
    }
    return {
      ok: true,
      status: 200,
      text: async () => sampleLrcText,
    };
  };

  const testScenario1 = {
    id: "dynamic-stream-test",
    title: "Dynamic Stream Test",
    category: "workplace",
    level: "B2",
    accent: "US",
    duration: 10,
  };

  // Ensure cache is initially empty for this scenario
  sandbox.SCENARIO_CUES_CACHE.delete(testScenario1.id);
  assert(
    !sandbox.SCENARIO_CUES_CACHE.has(testScenario1.id),
    "SCENARIO_CUES_CACHE initially does not contain dynamic scenario"
  );

  // Call proceedSelectScenario on cache miss
  await sandbox.proceedSelectScenario(testScenario1, false, false);

  assert(
    fetchCallCount === 1,
    `On-demand loading triggers 1 network fetch on cache miss (got ${fetchCallCount})`
  );
  assert(
    lastFetchedUrl === "audio/dynamic-stream-test.lrc",
    `Fetch requested canonical LRC URL: ${lastFetchedUrl}`
  );
  assert(
    sandbox.SCENARIO_CUES_CACHE.has(testScenario1.id),
    "Parsed cues are cached in SCENARIO_CUES_CACHE"
  );
  const cachedCues = sandbox.SCENARIO_CUES_CACHE.get(testScenario1.id);
  assert(
    Array.isArray(cachedCues) && cachedCues.length === 2,
    `Cached cues contains 2 parsed subtitle cues (got ${cachedCues?.length})`
  );
  assert(
    sandbox.state.activeCues === cachedCues,
    "state.activeCues is populated with cached cues"
  );

  // Call proceedSelectScenario again (Cache Hit)
  await sandbox.proceedSelectScenario(testScenario1, false, false);
  assert(
    fetchCallCount === 1,
    "Second load uses memory cache without triggering network fetch"
  );

  // 9. Graceful Error Handling on 404 / Network Fetch Failure
  const failingScenario = {
    id: "not-found-scenario",
    title: "Failing Scenario",
    duration: 5,
  };
  let errorCaught = false;
  try {
    await sandbox.proceedSelectScenario(failingScenario, false, false);
  } catch (err) {
    errorCaught = true;
  }
  assert(
    errorCaught === false,
    "proceedSelectScenario handles 404/network error gracefully without throwing"
  );

  // 9.1 Audio Playback Synchronization & Element Source Assignment (Scenario Playback Fix)
  const audioEl = sandbox.document.getElementById("playerAudio");
  let playCalled = false;
  audioEl.play = async () => {
    playCalled = true;
    audioEl.paused = false;
    return Promise.resolve();
  };
  audioEl.pause = () => {
    audioEl.paused = true;
  };

  await sandbox.proceedSelectScenario(testScenario1, false, false);
  assert(
    audioEl.src === "audio/dynamic-stream-test.mp3",
    `proceedSelectScenario sets audio.src using resolveScenarioAudioUrl (got '${audioEl.src}')`
  );

  playCalled = false;
  sandbox.playAudio();
  assert(
    playCalled === true,
    "playAudio() invokes audio.play() for scenario without explicit audioUrl field"
  );
  assert(
    audioEl.src === "audio/dynamic-stream-test.mp3",
    "Audio source is preserved during playback initiation"
  );
  assert(
    sandbox.state.isPlaying === true,
    "state.isPlaying is set to true during playback"
  );
  sandbox.pauseAudio();

  // 10. LRC Timecode Parsing
  assert(
    typeof parseLrcTimecode === "function",
    "parseLrcTimecode function exists"
  );
  assert(parseLrcTimecode("00:00.00") === 0, "Parses 00:00.00 to 0s");
  assert(parseLrcTimecode("00:04.50") === 4.5, "Parses 00:04.50 to 4.5s");
  assert(parseLrcTimecode("01:30.25") === 90.25, "Parses 01:30.25 to 90.25s");
  assert(
    parseLrcTimecode("[02:15.80]") === 135.8,
    "Parses [02:15.80] tag to 135.8s"
  );
  assert(
    parseLrcTimecode("<00:12.34>") === 12.34,
    "Parses <00:12.34> tag to 12.34s"
  );
  assert(parseLrcTimecode("") === 0, "Handles empty LRC timecode safely");

  // 11. Format Seconds to LRC Timecode
  assert(
    typeof formatSecondsToLrcTime === "function",
    "formatSecondsToLrcTime function exists"
  );
  assert(formatSecondsToLrcTime(0) === "00:00.00", "Formats 0s to 00:00.00");
  assert(
    formatSecondsToLrcTime(4.5) === "00:04.50",
    "Formats 4.5s to 00:04.50"
  );
  assert(
    formatSecondsToLrcTime(90.25) === "01:30.25",
    "Formats 90.25s to 01:30.25"
  );
  assert(
    formatSecondsToLrcTime(3665.4) === "61:05.40",
    "Formats >1hr to MM:SS.xx"
  );

  // 12. Enhanced LRC Parsing with Intra-Line Word Timestamps
  assert(
    typeof parseEnhancedLrc === "function",
    "parseEnhancedLrc function exists"
  );
  const sampleLrc = `[ti:Ordering at a Specialty Coffee Shop]
[ar:English Shadowing]
[al:daily]
[length:00:32.61]

[00:00.00]<00:00.00>Good <00:00.28>morning! <00:00.93>What <00:01.20>can <00:01.41>I <00:01.48>get <00:01.68>started <00:02.16>for <00:02.37>you <00:02.58>today?
[00:00.00]Chào buổi sáng! Tôi có thể chuẩn bị gì cho bạn hôm nay?

[00:03.29]<00:03.29>Hi <00:03.47>there! <00:04.11>I <00:04.20>would <00:04.65>like <00:05.01>a <00:05.10>medium <00:05.64>oat <00:05.91>milk <00:06.27>latte <00:06.72>with <00:07.08>an <00:07.27>extra <00:07.72>shot <00:08.08>of <00:08.26>espresso, <00:09.17>please.
[00:03.29]Xin chào! Cho tôi một ly latte sữa yến mạch cỡ vừa thêm một shot espresso nhé.`;

  const lrcCues = parseEnhancedLrc(sampleLrc);
  assert(
    lrcCues.length === 2,
    `Parsed 2 Enhanced LRC cues (got ${lrcCues.length})`
  );
  assert(lrcCues[0].start === 0.0, "LRC Cue 1 starts at 0.0s");
  assert(
    lrcCues[0].en === "Good morning! What can I get started for you today?",
    "LRC Cue 1 English text matches"
  );
  assert(
    lrcCues[0].vi === "Chào buổi sáng! Tôi có thể chuẩn bị gì cho bạn hôm nay?",
    "LRC Cue 1 Vietnamese translation matches"
  );
  assert(
    Array.isArray(lrcCues[0].words) && lrcCues[0].words.length === 10,
    "LRC Cue 1 has 10 tokenized words with timing"
  );
  assert(
    lrcCues[0].words[0].w === "Good" && lrcCues[0].words[0].start === 0.0,
    "LRC Cue 1 Word 0 timing matches"
  );
  assert(
    lrcCues[0].words[1].w === "morning!" && lrcCues[0].words[1].start === 0.28,
    "LRC Cue 1 Word 1 timing matches"
  );
  assert(lrcCues[1].start === 3.29, "LRC Cue 2 starts at 3.29s");

  // 13. Generate Enhanced LRC String
  assert(
    typeof generateEnhancedLrcString === "function",
    "generateEnhancedLrcString function exists"
  );
  const serializedLrc = generateEnhancedLrcString(lrcCues);
  assert(
    serializedLrc.includes("[00:00.00]<00:00.00>Good <00:00.28>morning!"),
    "Serialized LRC contains word tags"
  );
  assert(
    serializedLrc.includes(
      "Chào buổi sáng! Tôi có thể chuẩn bị gì cho bạn hôm nay?"
    ),
    "Serialized LRC contains translation lines"
  );

  // 14. Calculate Karaoke Word Index
  assert(
    typeof calculateKaraokeWordIndex === "function",
    "calculateKaraokeWordIndex function exists"
  );
  const wordsForKaraoke = lrcCues[0].words;
  assert(
    calculateKaraokeWordIndex(wordsForKaraoke, -0.2) === -1,
    "Current time before speech start returns -1 (no active glow)"
  );
  assert(
    calculateKaraokeWordIndex(wordsForKaraoke, 0.0) === 0,
    "Current time 0.0s active word index is 0 ('Good')"
  );
  assert(
    calculateKaraokeWordIndex(wordsForKaraoke, 0.5) === 1,
    "Current time 0.5s active word index is 1 ('morning!')"
  );
  assert(
    calculateKaraokeWordIndex(wordsForKaraoke, 1.3) === 3,
    "Current time 1.3s active word index is 3 ('can')"
  );
  assert(
    calculateKaraokeWordIndex(wordsForKaraoke, 10.0) === wordsForKaraoke.length,
    "Current time past speech end returns words.length (all words passed)"
  );
  assert(
    calculateKaraokeWordIndex([], 1.0) === -1,
    "Handles empty words array safely with -1"
  );

  // 15. URL Scenario Deep-Linking Parser
  assert(
    typeof parseScenarioUrl === "function",
    "parseScenarioUrl function exists"
  );
  assert(
    parseScenarioUrl("?scenario=specialty-coffee").scenarioId ===
      "specialty-coffee",
    "parseScenarioUrl extracts ?scenario=specialty-coffee"
  );
  assert(
    parseScenarioUrl("?id=tech-standup").scenarioId === "tech-standup",
    "parseScenarioUrl extracts fallback ?id=tech-standup"
  );
  assert(
    parseScenarioUrl("https://example.com/app/?scenario=airport-security&cue=3")
      .scenarioId === "airport-security",
    "parseScenarioUrl extracts scenario from full URL string"
  );
  assert(
    parseScenarioUrl("https://example.com/app/?scenario=airport-security&cue=3")
      .cueIndex === 3,
    "parseScenarioUrl extracts cueIndex from full URL string"
  );
  assert(
    parseScenarioUrl("?scenario=academic-ai&sentence=5").cueIndex === 5,
    "parseScenarioUrl extracts sentence parameter alias"
  );
  assert(
    parseScenarioUrl("").scenarioId === null,
    "parseScenarioUrl handles empty query string gracefully"
  );
  assert(
    parseScenarioUrl("?other=value").scenarioId === null,
    "parseScenarioUrl handles unrelated query params"
  );

  // 16. URL Scenario Builder
  assert(
    typeof buildScenarioUrl === "function",
    "buildScenarioUrl function exists"
  );
  assert(
    buildScenarioUrl("specialty-coffee") === "?scenario=specialty-coffee",
    "buildScenarioUrl serializes scenarioId correctly"
  );
  assert(
    buildScenarioUrl("tech-standup", 2) === "?scenario=tech-standup&cue=2",
    "buildScenarioUrl serializes scenarioId with cueIndex"
  );
  // 17. Continuous Playback Cue Boundary Tracker Seams
  const multiCues = [
    { start: 0.0, end: 3.2, en: "Sentence 1", vi: "Câu 1" },
    { start: 3.5, end: 6.8, en: "Sentence 2", vi: "Câu 2" },
    { start: 7.0, end: 10.5, en: "Sentence 3", vi: "Câu 3" },
  ];

  function getActiveCueIndexAtTime(cues, currentTime) {
    if (!cues || cues.length === 0) return 0;
    for (let i = 0; i < cues.length; i++) {
      if (currentTime >= cues[i].start && currentTime <= cues[i].end) {
        return i;
      }
      if (
        i < cues.length - 1 &&
        currentTime > cues[i].end &&
        currentTime < cues[i + 1].start
      ) {
        return i; // Still on previous cue during brief pause
      }
    }
    if (currentTime > cues[cues.length - 1].end) {
      return cues.length - 1;
    }
    return 0;
  }

  assert(
    getActiveCueIndexAtTime(multiCues, 1.5) === 0,
    "Time 1.5s resolves to Cue 0"
  );
  assert(
    getActiveCueIndexAtTime(multiCues, 3.3) === 0,
    "Time 3.3s (inter-cue gap) keeps Cue 0 active"
  );
  assert(
    getActiveCueIndexAtTime(multiCues, 4.0) === 1,
    "Time 4.0s transitions smoothly to Cue 1 without seeking"
  );
  assert(
    getActiveCueIndexAtTime(multiCues, 8.5) === 2,
    "Time 8.5s resolves to Cue 2"
  );
  assert(
    getActiveCueIndexAtTime(multiCues, 12.0) === 2,
    "Time beyond last cue clamps to last cue index"
  );

  // 18. Loop Mode Acoustic Padding & Clamping Seams
  assert(
    typeof calculateLoopEndBoundary === "function",
    "calculateLoopEndBoundary function exists"
  );
  assert(
    typeof calculateLoopStartBoundary === "function",
    "calculateLoopStartBoundary function exists"
  );
  assert(
    Array.isArray(SPEED_PRESETS) && SPEED_PRESETS.length === 7,
    `SPEED_PRESETS contains 7 standard rate options (found ${SPEED_PRESETS.length})`
  );
  assert(
    SPEED_PRESETS.includes(0.5) &&
      SPEED_PRESETS.includes(1.0) &&
      SPEED_PRESETS.includes(1.5),
    "SPEED_PRESETS contains 0.5x, 1.0x, and 1.5x"
  );

  // Cue 0: start 0.0, end 3.2, next cue start 3.5
  assert(
    calculateLoopEndBoundary(multiCues, 0, 15.0) === 3.35,
    "Cue 0 end (3.2s) receives +150ms lead-out padding (3.35s < next cue start 3.5s)"
  );
  assert(
    calculateLoopStartBoundary(multiCues, 0) === 0.0,
    "Cue 0 start (0.0s) clamps to 0.0s (cannot be negative)"
  );

  // Tight adjacent cues: Cue 1 end 6.8, Cue 2 start 7.0 (gap = 200ms)
  assert(
    calculateLoopEndBoundary(multiCues, 1, 15.0) === 6.95,
    "Cue 1 end (6.8s) + 150ms = 6.95s (clamped before Cue 2 start 7.0s)"
  );
  assert(
    calculateLoopStartBoundary(multiCues, 1) === 3.45,
    "Cue 1 start (3.5s) - 50ms = 3.45s (micro lead-in after Cue 0 end 3.2s)"
  );

  // Very tight adjacent cues: Cue A end 5.0, Cue B start 5.08 (gap = 80ms)
  const tightCues = [
    { start: 0, end: 5.0, en: "Tight A", vi: "" },
    { start: 5.08, end: 8.0, en: "Tight B", vi: "" },
  ];
  assert(
    calculateLoopEndBoundary(tightCues, 0, 10.0) === 5.08,
    "Clamps lead-out padding to exact next cue start (5.08s) when gap < 150ms"
  );

  // 12. Dynamic Cue Index Resolution & Sentence Selection (findCueIndexByTime)
  const sampleCues = [
    { start: 1.0, end: 3.5, en: "First sentence", vi: "" },
    { start: 4.5, end: 7.0, en: "Second sentence", vi: "" },
    { start: 8.0, end: 11.2, en: "Third sentence", vi: "" },
  ];

  // Direct hits inside cue boundaries
  assert(
    findCueIndexByTime(sampleCues, 1.0) === 0,
    "findCueIndexByTime: returns 0 at exact cue 0 start (1.0s)"
  );
  assert(
    findCueIndexByTime(sampleCues, 2.5) === 0,
    "findCueIndexByTime: returns 0 inside cue 0 (2.5s)"
  );
  assert(
    findCueIndexByTime(sampleCues, 3.5) === 0,
    "findCueIndexByTime: returns 0 at exact cue 0 end (3.5s)"
  );
  assert(
    findCueIndexByTime(sampleCues, 5.0) === 1,
    "findCueIndexByTime: returns 1 inside cue 1 (5.0s)"
  );
  assert(
    findCueIndexByTime(sampleCues, 9.0) === 2,
    "findCueIndexByTime: returns 2 inside cue 2 (9.0s)"
  );

  // Before first cue
  assert(
    findCueIndexByTime(sampleCues, 0.0) === 0,
    "findCueIndexByTime: returns 0 when time is before first cue (0.0s)"
  );
  assert(
    findCueIndexByTime(sampleCues, 0.5) === 0,
    "findCueIndexByTime: returns 0 when time is 0.5s before cue 0 start"
  );

  // In silence gaps between cues
  assert(
    findCueIndexByTime(sampleCues, 3.8) === 1,
    "findCueIndexByTime: returns upcoming cue 1 in gap between cue 0 and 1 (3.8s)"
  );
  assert(
    findCueIndexByTime(sampleCues, 4.2) === 1,
    "findCueIndexByTime: returns upcoming cue 1 in gap right before cue 1 start (4.2s)"
  );
  assert(
    findCueIndexByTime(sampleCues, 7.5) === 2,
    "findCueIndexByTime: returns upcoming cue 2 in gap between cue 1 and 2 (7.5s)"
  );

  // After last cue
  assert(
    findCueIndexByTime(sampleCues, 12.0) === 2,
    "findCueIndexByTime: returns last cue 2 when time is past scenario duration (12.0s)"
  );

  // Edge cases (null/empty)
  assert(
    findCueIndexByTime([], 5.0) === -1,
    "findCueIndexByTime: returns -1 for empty cues array"
  );
  assert(
    findCueIndexByTime(null, 5.0) === -1,
    "findCueIndexByTime: returns -1 for null cues"
  );

  // 13. URL Deep-linking with Cue Index
  assert(
    buildScenarioUrl("coffee-shop", 2) === "?scenario=coffee-shop&cue=2",
    "buildScenarioUrl includes cue index parameter"
  );
  assert(
    buildScenarioUrl("coffee-shop", null) === "?scenario=coffee-shop",
    "buildScenarioUrl omits cue parameter when null"
  );
  const parsedCue = parseScenarioUrl("?scenario=coffee-shop&cue=3");
  assert(
    parsedCue.scenarioId === "coffee-shop" && parsedCue.cueIndex === 3,
    "parseScenarioUrl parses scenarioId and cueIndex correctly"
  );

  // 14. User-Initiated Playback & Play-State Preserving Seeking (Issue #684)
  // 14.1 Scenario Selection starts in clean paused state at sentence 0 (0:00)
  const mockScenarioA = {
    id: "test-playback-lifecycle",
    title: "Playback Lifecycle Test",
    duration: 30,
    lrcContent: `[00:00.00]First sentence starts here <00:00.00>First <00:01.00>sentence <00:02.00>starts <00:03.00>here
[00:05.00]Second sentence starts here <00:05.00>Second <00:06.00>sentence <00:07.00>starts <00:08.00>here
[00:15.00]Third sentence starts here <00:15.00>Third <00:16.00>sentence <00:17.00>starts <00:18.00>here`,
  };

  await proceedSelectScenario(mockScenarioA, false, false);
  assert(
    state.isPlaying === false,
    "proceedSelectScenario initializes in paused state (state.isPlaying === false)"
  );
  assert(
    state.currentCueIndex === 0,
    "proceedSelectScenario initializes at sentence index 0"
  );
  assert(
    sandbox.simulatedTime === 0,
    "proceedSelectScenario sets simulatedTime to 0:00"
  );

  // 14.2 jumpToSentence while PAUSED cues sentence and remains paused
  jumpToSentence(1);
  assert(
    state.currentCueIndex === 1,
    "jumpToSentence(1) updates state.currentCueIndex to 1"
  );
  assert(
    state.isPlaying === false,
    "jumpToSentence(1) while paused maintains paused state without auto-starting"
  );
  assert(
    sandbox.simulatedTime === 5.0,
    "jumpToSentence(1) sets target timestamp to cue 1 start (5.0s)"
  );

  // 14.3 jumpToSentence while PLAYING cues sentence and continues playing
  playAudio();
  assert(state.isPlaying === true, "playAudio() transitions state to playing");
  jumpToSentence(2);
  assert(
    state.currentCueIndex === 2,
    "jumpToSentence(2) updates state.currentCueIndex to 2"
  );
  assert(
    state.isPlaying === true,
    "jumpToSentence(2) while playing maintains playing state"
  );
  assert(
    sandbox.simulatedTime === 15.0,
    "jumpToSentence(2) sets target timestamp to cue 2 start (15.0s)"
  );

  // 14.4 Explicit override parameters on jumpToSentence
  jumpToSentence(0, false);
  assert(
    state.currentCueIndex === 0 && state.isPlaying === false,
    "jumpToSentence(0, false) forces paused state"
  );
  jumpToSentence(1, true);
  assert(
    state.currentCueIndex === 1 && state.isPlaying === true,
    "jumpToSentence(1, true) forces playing state"
  );
  pauseAudio();

  // 14.5 Scrubber Change while PAUSED preserves target timestamp and stays paused
  onScrubberChange(50); // 50% of 30s = 15s (Sentence 2)
  assert(
    sandbox.simulatedTime === 15.0,
    "onScrubberChange(50) updates simulatedTime to exactly 15.0s"
  );
  assert(
    state.currentCueIndex === 2,
    "onScrubberChange(50) resolves cue index 2"
  );
  assert(
    state.isPlaying === false,
    "onScrubberChange while paused remains paused without auto-starting"
  );

  // 14.6 Scrubber Change while PLAYING preserves target timestamp and continues playing
  playAudio();
  onScrubberChange(20); // 20% of 30s = 6.0s (Inside Sentence 1)
  assert(
    sandbox.simulatedTime === 6.0,
    "onScrubberChange(20) sets exact target timestamp to 6.0s (not snapped to cue start)"
  );
  assert(
    state.currentCueIndex === 1,
    "onScrubberChange(20) resolves cue index 1"
  );
  assert(
    state.isPlaying === true,
    "onScrubberChange while playing continues playback"
  );
  pauseAudio();

  // 14.7 Replay Current Sentence explicitly triggers playback from sentence start
  replayCurrentSentence();
  assert(
    state.isPlaying === true,
    "replayCurrentSentence() initiates playback"
  );
  assert(
    sandbox.simulatedTime === 5.0,
    "replayCurrentSentence() seeks to start of current sentence (5.0s)"
  );
  pauseAudio();

  // 14.8 navigateSentence preserves play/pause state
  jumpToSentence(0);
  assert(state.isPlaying === false, "Reset to sentence 0 in paused state");
  navigateSentence(1);
  assert(
    state.currentCueIndex === 1 && state.isPlaying === false,
    "navigateSentence(1) while paused advances to sentence 1 and stays paused"
  );
  playAudio();
  navigateSentence(1);
  assert(
    state.currentCueIndex === 2 && state.isPlaying === true,
    "navigateSentence(1) while playing advances to sentence 2 and keeps playing"
  );
  // ==========================================
  // 15. HANDS-FREE ECHOIC SHADOWING PAUSE DURATION (ADR-0009 / Slice 3)
  // ==========================================
  console.log("\n--- Section 15: Echoic Mode Pause & Record Window ---");

  assert(
    typeof calculateEchoicPauseDuration === "function",
    "calculateEchoicPauseDuration function exists"
  );

  // 15.1 Minimum 2.0s floor for short cues
  const shortCue = { start: 0, end: 1.0, en: "Short cue." };
  const shortPause = calculateEchoicPauseDuration(shortCue);
  assert(
    shortPause === 2.0,
    `Short cue (1.0s) clamps to 2.0s floor (got ${shortPause}s)`
  );

  // 15.2 1.25x scaling for medium cues
  const mediumCue = {
    start: 10.0,
    end: 14.0,
    en: "This is a medium length sentence.",
  };
  const mediumPause = calculateEchoicPauseDuration(mediumCue);
  assert(
    mediumPause === 5.0,
    `Medium cue (4.0s) scales to 5.0s (4.0 * 1.25) (got ${mediumPause}s)`
  );

  // 15.3 1.25x scaling for long complex cues
  const longCue = {
    start: 0,
    end: 8.0,
    en: "A long complex academic discourse sentence.",
  };
  const longPause = calculateEchoicPauseDuration(longCue);
  assert(
    longPause === 10.0,
    `Long cue (8.0s) scales to 10.0s (8.0 * 1.25) (got ${longPause}s)`
  );

  // 15.4 Null / empty cue fallback
  const nullPause = calculateEchoicPauseDuration(null);
  assert(
    nullPause === 2.0,
    `Null cue fallback returns safe 2.0s floor (got ${nullPause}s)`
  );

  // 16. Offline IPA/Vietnamese Dictionary & Lemmatizer (Issue #691)
  console.log(
    "\n--- Testing Offline IPA/Vietnamese Dictionary & Lemmatizer ---"
  );
  const vocabCount = Object.keys(BUILTIN_VOCAB_DB).length;
  assert(
    vocabCount >= 2900,
    `BUILTIN_VOCAB_DB contains >= 2,900 curated entries (got ${vocabCount})`
  );

  // 16.1 Exact scenario domain vocabulary lookup
  const sampleDomainWords = [
    { word: "latte", expectedIpa: "/ˈlɑː.teɪ/", expectedPos: "noun" },
    { word: "espresso", expectedIpa: "/eˈspres.oʊ/", expectedPos: "noun" },
    { word: "croissants", expectedIpa: "/kwɑːˈsɑ̃ːz/", expectedPos: "noun" },
    {
      word: "authentication",
      expectedIpa: "/ɔːˌθen.tɪˈkeɪ.ʃən/",
      expectedPos: "noun",
    },
    {
      word: "asynchronous",
      expectedIpa: "/eɪˈsɪŋ.krə.nəs/",
      expectedPos: "adj",
    },
    { word: "mitigates", expectedIpa: "/ˈmɪt.ɪ.ɡeɪts/", expectedPos: "verb" },
    {
      word: "serendipitous",
      expectedIpa: "/ˌser.ənˈdɪp.ə.təs/",
      expectedPos: "adj",
    },
    { word: "synergy", expectedIpa: "/ˈsɪn.ɚ.dʒi/", expectedPos: "noun" },
    {
      word: "stethoscope",
      expectedIpa: "/ˈsteθ.ə.skoʊp/",
      expectedPos: "noun",
    },
    { word: "rhinitis", expectedIpa: "/raɪˈnaɪ.t̬ɪs/", expectedPos: "noun" },
  ];

  for (const { word, expectedIpa, expectedPos } of sampleDomainWords) {
    const res = lookupDictionary(word);
    assert(
      res && res.ipa === expectedIpa && res.pos === expectedPos,
      `Exact lookup for '${word}' returned ${res?.ipa} (${res?.pos})`
    );
  }

  // 16.2 Lemmatizer tests for contractions, plurals, past tense, gerunds, and adverbs
  const lemmaCases = [
    { word: "it's", base: "it" },
    { word: "don't", base: "do" },
    { word: "we're", base: "we" },
    { word: "let's", base: "let" },
    { word: "running", base: "run" },
    { word: "making", base: "make" },
    { word: "features", base: "feature" },
    { word: "companies", base: "company" },
    { word: "easily", base: "easy" },
  ];

  for (const { word, base } of lemmaCases) {
    const res = lookupDictionary(word);
    assert(
      res && res.ipa && res.vi && !res.vi.startsWith("Từ vựng tiếng Anh:"),
      `Lemmatized '${word}' correctly resolved via dictionary root for '${base}'`
    );
  }

  // 16.3 Fallback for completely novel / unknown words
  const unknownRes = lookupDictionary("supercalifragilistic123");
  assert(
    unknownRes &&
      unknownRes.ipa === "/supercalifragilistic123/" &&
      unknownRes.vi === "Từ vựng tiếng Anh: supercalifragilistic123" &&
      unknownRes.pos === "word",
    "Novel word returns safe structured fallback without throwing"
  );

  // 16.4 Null / empty input handling
  assert(
    lookupDictionary(null) === null,
    "lookupDictionary(null) safely returns null"
  );
  assert(
    lookupDictionary("") === null,
    "lookupDictionary('') safely returns null"
  );

  console.log(`\n==================================================`);
  console.log(
    `📊 Engine Tests Completed: ${passCount} Passed, ${failCount} Failed`
  );
  console.log(`==================================================\n`);

  if (failCount > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
