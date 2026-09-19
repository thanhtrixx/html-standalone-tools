const fs = require("fs");
const path = require("path");
const vm = require("vm");

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

  // Create isolated VM sandbox with mock DOM and window
  const sandbox = {
    console,
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
      getElementById: () => null,
      documentElement: { classList: { add() {}, remove() {} } },
      addEventListener: () => {},
    },
    window: {
      addEventListener: () => {},
      scrollTo: () => {},
      location: { search: "", pathname: "/app/" },
    },
    URLSearchParams,
    URL,
  };

  vm.createContext(sandbox);

  // Extract inline scripts
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");
  const exportBridge = `
    globalThis.CURATED_SCENARIOS = typeof CURATED_SCENARIOS !== 'undefined' ? CURATED_SCENARIOS : [];
    globalThis.BUILTIN_VOCAB_DB = typeof BUILTIN_VOCAB_DB !== 'undefined' ? BUILTIN_VOCAB_DB : {};
    globalThis.sanitizeSrtLine = typeof sanitizeSrtLine !== 'undefined' ? sanitizeSrtLine : function(){};
    globalThis.formatSecondsToSrtTime = typeof formatSecondsToSrtTime !== 'undefined' ? formatSecondsToSrtTime : function(){};
    globalThis.generateSrtString = typeof generateSrtString !== 'undefined' ? generateSrtString : function(){};
    globalThis.parseSrtTimecode = typeof parseSrtTimecode !== 'undefined' ? parseSrtTimecode : function(){};
    globalThis.formatSecondsToTime = typeof formatSecondsToTime !== 'undefined' ? formatSecondsToTime : function(){};
    globalThis.parseSrt = typeof parseSrt !== 'undefined' ? parseSrt : function(){};
    globalThis.parseLrcTimecode = typeof parseLrcTimecode !== 'undefined' ? parseLrcTimecode : function(){};
    globalThis.formatSecondsToLrcTime = typeof formatSecondsToLrcTime !== 'undefined' ? formatSecondsToLrcTime : function(){};
    globalThis.parseEnhancedLrc = typeof parseEnhancedLrc !== 'undefined' ? parseEnhancedLrc : function(){};
    globalThis.generateEnhancedLrcString = typeof generateEnhancedLrcString !== 'undefined' ? generateEnhancedLrcString : function(){};
    globalThis.calculateKaraokeWordIndex = typeof calculateKaraokeWordIndex !== 'undefined' ? calculateKaraokeWordIndex : function(){};
    globalThis.parseScenarioUrl = typeof parseScenarioUrl !== 'undefined' ? parseScenarioUrl : function(){};
    globalThis.buildScenarioUrl = typeof buildScenarioUrl !== 'undefined' ? buildScenarioUrl : function(){};
  `;
  vm.runInContext(combinedScripts + "\n" + exportBridge, sandbox);

  const {
    parseSrtTimecode,
    formatSecondsToTime,
    formatSecondsToSrtTime,
    sanitizeSrtLine,
    generateSrtString,
    parseSrt,
    parseLrcTimecode,
    formatSecondsToLrcTime,
    parseEnhancedLrc,
    generateEnhancedLrcString,
    calculateKaraokeWordIndex,
    parseScenarioUrl,
    buildScenarioUrl,
    CURATED_SCENARIOS,
    BUILTIN_VOCAB_DB,
  } = sandbox;

  // 1. Timecode Parsing Tests
  assert(
    typeof parseSrtTimecode === "function",
    "parseSrtTimecode function exists"
  );
  assert(parseSrtTimecode("00:00:00,000") === 0, "Parses 00:00:00,000 to 0s");
  assert(
    parseSrtTimecode("00:00:04,500") === 4.5,
    "Parses 00:00:04,500 to 4.5s"
  );
  assert(
    parseSrtTimecode("00:01:30.250") === 90.25,
    "Parses dot timecode 00:01:30.250 to 90.25s"
  );
  assert(parseSrtTimecode("01:00:00,000") === 3600, "Parses 1 hour to 3600s");
  assert(parseSrtTimecode("") === 0, "Handles empty timecode string safely");

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

  // 3. SRT Parsing
  assert(typeof parseSrt === "function", "parseSrt function exists");

  const sampleSrt = `1
00:00:01,000 --> 00:00:04,000
Hello world, welcome to shadowing!
Xin chào thế giới, chào mừng bạn đến với luyện nói!

2
00:00:04,500 --> 00:00:08,200
This is sentence number two.
Đây là câu số hai.`;

  const cues = parseSrt(sampleSrt);
  assert(
    cues.length === 2,
    `Parsed exactly 2 subtitle cues (got ${cues.length})`
  );
  assert(
    cues[0].start === 1.0 && cues[0].end === 4.0,
    "Cue 1 start/end timestamps are accurate"
  );
  assert(
    cues[0].en === "Hello world, welcome to shadowing!",
    "Cue 1 English text matches"
  );
  assert(
    cues[0].vi === "Xin chào thế giới, chào mừng bạn đến với luyện nói!",
    "Cue 1 Vietnamese text matches"
  );
  assert(
    Array.isArray(cues[0].words) && cues[0].words.length >= 4,
    "Cue 1 tokenizes words into array"
  );
  assert(
    cues[0].words.includes("shadowing"),
    "Tokenized words include 'shadowing'"
  );

  assert(
    cues[1].start === 4.5 && cues[1].end === 8.2,
    "Cue 2 timestamps are accurate"
  );

  // 4. Resilience to single line & variable line breaks
  const singleLineSrt = `1\n00:00:00.500 --> 00:00:02.500\nOnly English line here`;
  const singleCues = parseSrt(singleLineSrt);
  assert(singleCues.length === 1, "Parsed single-language subtitle cue");
  assert(
    singleCues[0].en === "Only English line here" && singleCues[0].vi === "",
    "Single line correctly sets English and empty translation"
  );

  // 5. Curated Scenarios Validation
  assert(
    Array.isArray(CURATED_SCENARIOS) && CURATED_SCENARIOS.length >= 4,
    `Curated scenarios library has at least 4 items (found ${CURATED_SCENARIOS.length})`
  );

  CURATED_SCENARIOS.forEach((sc, i) => {
    assert(
      Boolean(
        sc.id &&
        sc.title &&
        sc.category &&
        sc.level &&
        sc.accent &&
        sc.srtContent
      ),
      `Scenario #${i + 1} (${sc.title}) has all required metadata fields`
    );
    const parsedCues = parseSrt(sc.srtContent);
    assert(
      parsedCues.length >= 3,
      `Scenario #${i + 1} (${sc.title}) contains valid cues (found ${parsedCues.length})`
    );
  });

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

  // 8. Format Seconds to SRT Timecode
  assert(
    typeof formatSecondsToSrtTime === "function",
    "formatSecondsToSrtTime function exists"
  );
  assert(
    formatSecondsToSrtTime(0) === "00:00:00,000",
    "Formats 0s to 00:00:00,000"
  );
  assert(
    formatSecondsToSrtTime(4.5) === "00:00:04,500",
    "Formats 4.5s to 00:00:04,500"
  );
  assert(
    formatSecondsToSrtTime(65.123) === "00:01:05,123",
    "Formats 65.123s to 00:01:05,123"
  );
  assert(
    formatSecondsToSrtTime(3665.045) === "01:01:05,045",
    "Formats 3665.045s to 01:01:05,045"
  );
  assert(
    formatSecondsToSrtTime(-10) === "00:00:00,000",
    "Handles negative input gracefully"
  );

  // 9. Generate SRT String from Cues
  assert(
    typeof generateSrtString === "function",
    "generateSrtString function exists"
  );
  const testCues = [
    { start: 0, end: 3.5, en: "First sentence", vi: "Câu đầu tiên" },
    { start: 4.0, end: 7.2, en: "Second sentence", vi: "Câu thứ hai" },
  ];
  const generatedSrt = generateSrtString(testCues);
  assert(
    generatedSrt.includes(
      "1\n00:00:00,000 --> 00:00:03,500\nFirst sentence\nCâu đầu tiên"
    ),
    "Generates valid Cue 1 block"
  );
  assert(
    generatedSrt.includes(
      "2\n00:00:04,000 --> 00:00:07,200\nSecond sentence\nCâu thứ hai"
    ),
    "Generates valid Cue 2 block"
  );

  // Roundtrip parse and generate verification
  const roundtripParsed = parseSrt(generatedSrt);
  assert(roundtripParsed.length === 2, "Roundtrip parsing parses both cues");
  assert(
    roundtripParsed[0].en === "First sentence",
    "Roundtrip preserves English text"
  );
  assert(
    roundtripParsed[0].vi === "Câu đầu tiên",
    "Roundtrip preserves Vietnamese text"
  );
  assert(
    roundtripParsed[1].start === 4.0,
    "Roundtrip preserves start timestamp"
  );

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
    calculateKaraokeWordIndex(wordsForKaraoke, 10.0) ===
      wordsForKaraoke.length - 1,
    "Current time past end returns last word index"
  );
  assert(
    calculateKaraokeWordIndex([], 1.0) === 0,
    "Handles empty words array safely"
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
  assert(
    buildScenarioUrl(null) === "",
    "buildScenarioUrl returns empty string for null scenarioId"
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
