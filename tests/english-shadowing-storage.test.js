const fs = require("fs");
const path = require("path");
const vm = require("vm");

async function runTests() {
  console.log("🧪 Running English Shadowing Storage & Persistence Tests...\n");
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

  const storageMock = {
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
  };

  const sandbox = {
    console,
    localStorage: storageMock,
    document: {
      querySelectorAll: () => [],
      getElementById: (id) => ({
        textContent: "",
        value: "",
        classList: { add() {}, remove() {}, contains: () => false },
        innerHTML: "",
      }),
      documentElement: { classList: { add() {}, remove() {} } },
      addEventListener: () => {},
    },
    window: {
      addEventListener: () => {},
      scrollTo: () => {},
    },
  };

  vm.createContext(sandbox);
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");
  const exportBridge = `
    globalThis.VOCAB_STORAGE_KEY = typeof VOCAB_STORAGE_KEY !== 'undefined' ? VOCAB_STORAGE_KEY : '';
    globalThis.PRACTICE_STATS_KEY = typeof PRACTICE_STATS_KEY !== 'undefined' ? PRACTICE_STATS_KEY : '';
    globalThis.LEITNER_INTERVALS = typeof LEITNER_INTERVALS !== 'undefined' ? LEITNER_INTERVALS : {};
    globalThis.getSavedVocabVault = () => typeof savedVocabVault !== 'undefined' ? savedVocabVault : {};
    globalThis.setSavedVocabVault = (v) => { savedVocabVault = v; };
    globalThis.getPracticeStats = () => typeof practiceStats !== 'undefined' ? practiceStats : {};
    globalThis.setPracticeStats = (s) => { practiceStats = s; };
    globalThis.state = typeof state !== 'undefined' ? state : {};
    globalThis.loadVocabVault = typeof loadVocabVault !== 'undefined' ? loadVocabVault : function(){};
    globalThis.saveVocabVault = typeof saveVocabVault !== 'undefined' ? saveVocabVault : function(){};
    globalThis.setWordStatus = typeof setWordStatus !== 'undefined' ? setWordStatus : function(){};
    globalThis.deleteWordFromVault = typeof deleteWordFromVault !== 'undefined' ? deleteWordFromVault : function(){};
    globalThis.isWordDue = typeof isWordDue !== 'undefined' ? isWordDue : function(){};
    globalThis.getDueVocabList = typeof getDueVocabList !== 'undefined' ? getDueVocabList : function(){};
    globalThis.gradeFlashcard = typeof gradeFlashcard !== 'undefined' ? gradeFlashcard : function(){};
    globalThis.loadPracticeStats = typeof loadPracticeStats !== 'undefined' ? loadPracticeStats : function(){};
    globalThis.savePracticeStats = typeof savePracticeStats !== 'undefined' ? savePracticeStats : function(){};
    globalThis.logPracticeShadowSentence = typeof logPracticeShadowSentence !== 'undefined' ? logPracticeShadowSentence : function(){};
    globalThis.logPracticeSeconds = typeof logPracticeSeconds !== 'undefined' ? logPracticeSeconds : function(){};
  `;
  vm.runInContext(combinedScripts + "\n" + exportBridge, sandbox);

  const {
    VOCAB_STORAGE_KEY,
    PRACTICE_STATS_KEY,
    LEITNER_INTERVALS,
    getSavedVocabVault,
    setSavedVocabVault,
    getPracticeStats,
    setPracticeStats,
    loadVocabVault,
    saveVocabVault,
    setWordStatus,
    deleteWordFromVault,
    isWordDue,
    getDueVocabList,
    gradeFlashcard,
    loadPracticeStats,
    savePracticeStats,
    logPracticeShadowSentence,
    logPracticeSeconds,
    state,
  } = sandbox;

  // 1. Storage Key Integrity
  assert(
    typeof VOCAB_STORAGE_KEY === "string" && VOCAB_STORAGE_KEY.length > 5,
    "VOCAB_STORAGE_KEY is properly defined"
  );

  // 2. Initial empty load
  loadVocabVault();
  assert(
    typeof getSavedVocabVault() === "object",
    "savedVocabVault is initialized as an object"
  );

  // 3. Adding word with status 'new'
  state.activePopoverWord = "espresso";
  setWordStatus("new");

  let vault = getSavedVocabVault();
  assert(
    vault["espresso"] !== undefined,
    "Word 'espresso' added to savedVocabVault"
  );
  assert(vault["espresso"].status === "new", "Word status is 'new'");
  assert(vault["espresso"].ipa.includes("/"), "Word IPA is recorded");

  // Verify stored into localStorage
  const rawStorage = storageMock.getItem(VOCAB_STORAGE_KEY);
  assert(
    rawStorage !== null && rawStorage.includes("espresso"),
    "Data is serialized into localStorage"
  );

  // 4. Updating word status to 'learning'
  state.activePopoverWord = "espresso";
  setWordStatus("learning");
  vault = getSavedVocabVault();
  assert(
    vault["espresso"].status === "learning",
    "Word status updated to 'learning'"
  );

  // 5. Updating word status to 'mastered'
  state.activePopoverWord = "espresso";
  setWordStatus("mastered");
  vault = getSavedVocabVault();
  assert(
    vault["espresso"].status === "mastered",
    "Word status updated to 'mastered'"
  );

  // 6. Multiple words handling
  state.activePopoverWord = "croissants";
  setWordStatus("new");
  state.activePopoverWord = "authentication";
  setWordStatus("learning");

  vault = getSavedVocabVault();
  assert(Object.keys(vault).length === 3, "Vault holds 3 words");

  // 7. Deleting a word
  deleteWordFromVault("croissants");
  vault = getSavedVocabVault();
  assert(
    vault["croissants"] === undefined,
    "Word 'croissants' successfully removed"
  );
  assert(Object.keys(vault).length === 2, "Vault now holds 2 words");

  // 9. Leitner Spaced Repetition Intervals
  assert(
    typeof LEITNER_INTERVALS === "object",
    "LEITNER_INTERVALS object exists"
  );
  assert(LEITNER_INTERVALS[1] === 1, "Box 1 has 1 day interval");
  assert(LEITNER_INTERVALS[2] === 3, "Box 2 has 3 days interval");
  assert(LEITNER_INTERVALS[3] === 7, "Box 3 has 7 days interval");
  assert(LEITNER_INTERVALS[4] === 14, "Box 4 has 14 days interval");
  assert(LEITNER_INTERVALS[5] === 30, "Box 5 has 30 days interval");

  // 10. Due Date Calculations
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);

  assert(
    isWordDue({ dueAt: pastDate.toISOString() }) === true,
    "Word due in past is evaluated as due"
  );
  assert(
    isWordDue({ dueAt: futureDate.toISOString() }) === false,
    "Word due in future is not due"
  );
  assert(isWordDue({}) === true, "Word with undefined dueAt defaults to due");

  // 11. Flashcard Grading Logic
  state.flashcardList = [
    {
      word: "espresso",
      ipa: "/eˈspres.oʊ/",
      vi: "Cà phê",
      status: "learning",
      box: 2,
    },
    {
      word: "authentication",
      ipa: "/ɔːˌθen.tɪˈkeɪ.ʃən/",
      vi: "Xác thực",
      status: "new",
      box: 1,
    },
  ];
  state.flashcardIndex = 0;

  // Grade "good" -> advances box from 2 to 3
  gradeFlashcard("good");
  vault = getSavedVocabVault();
  assert(vault["espresso"].box === 3, "Grading 'good' advances word to Box 3");
  assert(vault["espresso"].status === "learning", "Status remains 'learning'");
  assert(
    Boolean(vault["espresso"].dueAt),
    "New due date is computed and saved"
  );

  // Grade "hard" -> resets to Box 1
  state.flashcardIndex = 0;
  gradeFlashcard("hard");
  vault = getSavedVocabVault();
  assert(vault["espresso"].box === 1, "Grading 'hard' resets word to Box 1");
  assert(
    vault["espresso"].status === "new",
    "Grading 'hard' resets status to 'new'"
  );

  // Grade "mastered" -> sets Box 5 and status 'mastered'
  state.flashcardIndex = 0;
  gradeFlashcard("mastered");
  vault = getSavedVocabVault();
  assert(vault["espresso"].box === 5, "Grading 'mastered' sets word to Box 5");
  assert(vault["espresso"].status === "mastered", "Status becomes 'mastered'");

  // 12. Daily Practice Statistics & Streak Hub
  assert(
    typeof PRACTICE_STATS_KEY === "string" && PRACTICE_STATS_KEY.length > 5,
    "PRACTICE_STATS_KEY is defined"
  );

  // Reset practice stats
  const initialStats = {
    streakDays: 3,
    lastPracticedDate: new Date().toISOString().split("T")[0],
    totalSecondsPracticedToday: 120,
    sentencesShadowedToday: 4,
  };
  setPracticeStats(initialStats);
  savePracticeStats();

  const storedStatsRaw = storageMock.getItem(PRACTICE_STATS_KEY);
  assert(
    storedStatsRaw !== null && storedStatsRaw.includes("streakDays"),
    "Practice stats persisted to localStorage"
  );

  // Log shadowed sentences and seconds
  logPracticeShadowSentence();
  assert(
    getPracticeStats().sentencesShadowedToday === 5,
    "logPracticeShadowSentence increments sentences count to 5"
  );

  logPracticeSeconds(30);
  assert(
    getPracticeStats().totalSecondsPracticedToday === 150,
    "logPracticeSeconds increments seconds to 150s"
  );

  console.log(`\n==================================================`);
  console.log(
    `📊 Storage Tests Completed: ${passCount} Passed, ${failCount} Failed`
  );
  console.log(`==================================================\n`);

  if (failCount > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
