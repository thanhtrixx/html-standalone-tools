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
    },
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
  `;
  vm.runInContext(combinedScripts + "\n" + exportBridge, sandbox);

  const {
    parseSrtTimecode,
    formatSecondsToTime,
    formatSecondsToSrtTime,
    sanitizeSrtLine,
    generateSrtString,
    parseSrt,
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
