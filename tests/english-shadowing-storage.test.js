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

  class FakeIDBStore {
    constructor() {
      this.data = new Map();
      this.indexes = new Map();
    }
    createIndex(name, keyPath) {
      this.indexes.set(name, keyPath);
    }
    index(name) {
      const keyPath = this.indexes.get(name);
      return {
        getAll: (range) => {
          const req = { onsuccess: null, onerror: null, result: null };
          setTimeout(() => {
            const matches = [];
            for (const val of this.data.values()) {
              if (range && range.targetValue !== undefined) {
                if (val[keyPath] === range.targetValue) matches.push(val);
              } else {
                matches.push(val);
              }
            }
            req.result = matches;
            if (req.onsuccess) req.onsuccess({ target: req });
          }, 0);
          return req;
        },
      };
    }
  }

  class FakeIDBDatabase {
    constructor(name, version) {
      this.name = name;
      this.version = version;
      this.objectStoreNames = {
        _stores: new Set(),
        contains(s) {
          return this._stores.has(s);
        },
        add(s) {
          this._stores.add(s);
        },
      };
      this.stores = new Map();
    }
    createObjectStore(name, options) {
      this.objectStoreNames.add(name);
      const store = new FakeIDBStore();
      this.stores.set(name, store);
      return store;
    }
    transaction(storeNames, mode) {
      const storeName = Array.isArray(storeNames) ? storeNames[0] : storeNames;
      let store = this.stores.get(storeName);
      if (!store) {
        store = new FakeIDBStore();
        this.stores.set(storeName, store);
      }
      return {
        objectStore: () => ({
          put: (value) => {
            const req = { onsuccess: null, onerror: null, result: null };
            setTimeout(() => {
              const key = value.id;
              store.data.set(key, value);
              req.result = key;
              if (req.onsuccess) req.onsuccess({ target: req });
            }, 0);
            return req;
          },
          get: (key) => {
            const req = { onsuccess: null, onerror: null, result: null };
            setTimeout(() => {
              req.result = store.data.get(key) || null;
              if (req.onsuccess) req.onsuccess({ target: req });
            }, 0);
            return req;
          },
          delete: (key) => {
            const req = { onsuccess: null, onerror: null, result: null };
            setTimeout(() => {
              store.data.delete(key);
              req.result = undefined;
              if (req.onsuccess) req.onsuccess({ target: req });
            }, 0);
            return req;
          },
          index: (name) => store.index(name),
        }),
      };
    }
  }

  const fakeIdbInstances = new Map();
  const fakeIdbFactory = {
    open(name, version) {
      const req = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: null,
      };
      setTimeout(() => {
        let db = fakeIdbInstances.get(name);
        const isNew = !db;
        if (isNew) {
          db = new FakeIDBDatabase(name, version);
          fakeIdbInstances.set(name, db);
        }
        req.result = db;
        if (isNew && req.onupgradeneeded) {
          req.onupgradeneeded({
            target: req,
            oldVersion: 0,
            newVersion: version,
          });
        }
        if (req.onsuccess) req.onsuccess({ target: req });
      }, 0);
      return req;
    },
  };

  const fakeIDBKeyRange = {
    only: (val) => ({ targetValue: val }),
  };

  const sandbox = {
    console,
    localStorage: storageMock,
    indexedDB: fakeIdbFactory,
    IDBKeyRange: fakeIDBKeyRange,
    document: {
      querySelectorAll: () => [],
      getElementById: (id) => ({
        textContent: "",
        value: "",
        classList: { add() {}, remove() {}, contains: () => false },
        innerHTML: "",
        style: {},
        appendChild: () => {},
      }),
      createElement: (tag) => ({
        textContent: "",
        innerHTML: "",
        className: "",
        style: {},
        classList: { add() {}, remove() {}, contains: () => false },
        setAttribute: () => {},
        appendChild: () => {},
        click: () => {},
        remove: () => {},
      }),
      documentElement: { classList: { add() {}, remove() {} } },
      addEventListener: () => {},
    },
    window: {
      addEventListener: () => {},
      scrollTo: () => {},
      requestAnimationFrame: (cb) => setTimeout(cb, 0),
      cancelAnimationFrame: (id) => clearTimeout(id),
    },
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
    setTimeout: (fn, ms) => {
      const timer = setTimeout(fn, Math.min(ms || 0, 10));
      if (timer && typeof timer.unref === "function") timer.unref();
      return timer;
    },
    clearTimeout,
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
    globalThis.VOCAB_STORAGE_KEY = typeof VOCAB_STORAGE_KEY !== 'undefined' ? VOCAB_STORAGE_KEY : '';
    globalThis.PRACTICE_STATS_KEY = typeof PRACTICE_STATS_KEY !== 'undefined' ? PRACTICE_STATS_KEY : '';
    globalThis.RECORDINGS_DB_NAME = typeof RECORDINGS_DB_NAME !== 'undefined' ? RECORDINGS_DB_NAME : '';
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
    globalThis.setPlaybackMode = typeof setPlaybackMode !== 'undefined' ? setPlaybackMode : function(){};
    globalThis.updateHeaderBadges = typeof updateHeaderBadges !== 'undefined' ? updateHeaderBadges : function(){};
    globalThis.renderInsightsModal = typeof renderInsightsModal !== 'undefined' ? renderInsightsModal : function(){};
    globalThis.openInsightsModal = typeof openInsightsModal !== 'undefined' ? openInsightsModal : function(){};
    globalThis.closeInsightsModal = typeof closeInsightsModal !== 'undefined' ? closeInsightsModal : function(){};
    globalThis.clearMediaCacheStorage = typeof clearMediaCacheStorage !== 'undefined' ? clearMediaCacheStorage : function(){};
    globalThis.isScenarioAvailableOffline = typeof isScenarioAvailableOffline !== 'undefined' ? isScenarioAvailableOffline : function(){};
    globalThis.SCENARIO_PROGRESS_KEY = typeof SCENARIO_PROGRESS_KEY !== 'undefined' ? SCENARIO_PROGRESS_KEY : '';
    globalThis.loadScenarioProgress = typeof loadScenarioProgress !== 'undefined' ? loadScenarioProgress : function(){};
    globalThis.saveScenarioProgress = typeof saveScenarioProgress !== 'undefined' ? saveScenarioProgress : function(){};
    globalThis.isScenarioBookmarked = typeof isScenarioBookmarked !== 'undefined' ? isScenarioBookmarked : function(){};
    globalThis.toggleBookmark = typeof toggleBookmark !== 'undefined' ? toggleBookmark : function(){};
    globalThis.getScenarioProgress = typeof getScenarioProgress !== 'undefined' ? getScenarioProgress : function(){};
    globalThis.markSentenceCompleted = typeof markSentenceCompleted !== 'undefined' ? markSentenceCompleted : function(){};
    globalThis.getScenarioProgressStore = () => typeof scenarioProgress !== 'undefined' ? scenarioProgress : { bookmarkedIds: [], scenarios: {} };
    globalThis.setScenarioProgressStore = (p) => { scenarioProgress = p; };
    globalThis.openRecordingsDb = typeof openRecordingsDb !== 'undefined' ? openRecordingsDb : function(){};
    globalThis.saveRecordingToVault = typeof saveRecordingToVault !== 'undefined' ? saveRecordingToVault : function(){};
    globalThis.getRecordingFromVault = typeof getRecordingFromVault !== 'undefined' ? getRecordingFromVault : function(){};
    globalThis.deleteRecordingFromVault = typeof deleteRecordingFromVault !== 'undefined' ? deleteRecordingFromVault : function(){};
    globalThis.getAllRecordingsForScenario = typeof getAllRecordingsForScenario !== 'undefined' ? getAllRecordingsForScenario : function(){};
  `;
  vm.runInContext(combinedScripts + "\n" + exportBridge, sandbox);

  const {
    VOCAB_STORAGE_KEY,
    PRACTICE_STATS_KEY,
    RECORDINGS_DB_NAME,
    SCENARIO_PROGRESS_KEY,
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
    setPlaybackMode,
    updateHeaderBadges,
    renderInsightsModal,
    openInsightsModal,
    closeInsightsModal,
    clearMediaCacheStorage,
    isScenarioAvailableOffline,
    loadScenarioProgress,
    saveScenarioProgress,
    isScenarioBookmarked,
    toggleBookmark,
    getScenarioProgress,
    markSentenceCompleted,
    getScenarioProgressStore,
    setScenarioProgressStore,
    openRecordingsDb,
    saveRecordingToVault,
    getRecordingFromVault,
    deleteRecordingFromVault,
    getAllRecordingsForScenario,
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

  // Test streak logic when launching with yesterday's practice vs old practice (Issue #688)
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayDateStr = yesterdayDate.toISOString().split("T")[0];

  storageMock.setItem(
    PRACTICE_STATS_KEY,
    JSON.stringify({
      streakDays: 4,
      lastPracticedDate: yesterdayDateStr,
      totalSecondsPracticedToday: 200,
      sentencesShadowedToday: 8,
      totalSentencesShadowed: 8,
    })
  );

  loadPracticeStats();
  // Opening app today does NOT pre-award streak before practice
  assert(
    getPracticeStats().streakDays === 4,
    "Opening app next day retains previous streak without pre-awarding"
  );
  assert(
    getPracticeStats().sentencesShadowedToday === 0,
    "Opening app resets today's sentence counter"
  );

  // Now practice a sentence today -> streak increments to 5
  logPracticeShadowSentence();
  assert(
    getPracticeStats().streakDays === 5,
    "Practicing a sentence increments streak from yesterday to 5"
  );

  // Test expired streak (> 1 day inactivity)
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  storageMock.setItem(
    PRACTICE_STATS_KEY,
    JSON.stringify({
      streakDays: 10,
      lastPracticedDate: fiveDaysAgo.toISOString().split("T")[0],
      totalSecondsPracticedToday: 100,
      sentencesShadowedToday: 5,
      totalSentencesShadowed: 50,
    })
  );
  loadPracticeStats();
  assert(
    getPracticeStats().streakDays === 0,
    "Inactive for multiple days resets streak to 0 upon load"
  );

  logPracticeShadowSentence();
  assert(
    getPracticeStats().streakDays === 1,
    "Practicing after inactive reset starts new streak at 1"
  );

  // 13. Service Worker Asset Cache Verification & PWA Zero-Stale Lifecycle (ADR-0007 / Slice 1)
  const swPath = path.join(__dirname, "..", "english-shadowing", "sw.js");
  assert(fs.existsSync(swPath), "Service Worker file sw.js exists");
  const swContent = fs.readFileSync(swPath, "utf8");

  // Shell & media cache bucket naming
  assert(
    swContent.includes('const CACHE_NAME = "shadowing-shell-v5"') ||
      swContent.includes("shadowing-shell-v5"),
    "sw.js defines shell cache bucket shadowing-shell-v5"
  );
  assert(
    swContent.includes('const MEDIA_CACHE_NAME = "shadowing-media-v5"') ||
      swContent.includes("shadowing-media-v5"),
    "sw.js defines media cache bucket shadowing-media-v5"
  );

  // Shell precache is lightweight and does not precache .srt or audio tracks
  assert(
    !swContent.includes(".srt"),
    "sw.js precache does not include deprecated .srt subtitle files"
  );
  assert(
    !swContent.includes("./audio/specialty-coffee.mp3"),
    "sw.js install precache avoids bulky hardcoded audio tracks (on-demand streaming)"
  );
  assert(
    swContent.includes("./index.html") &&
      swContent.includes("./icon.svg") &&
      swContent.includes("./manifest.json"),
    "sw.js precaches essential app shell assets (< 100KB payload)"
  );

  // Navigation requests: Network-Only with offline fallback
  assert(
    swContent.includes("isNavigation") ||
      swContent.includes('request.mode === "navigate"'),
    "sw.js intercepts navigation requests specifically"
  );
  assert(
    swContent.includes("fetch(request)") && swContent.includes("caches.match"),
    "sw.js uses Network-Only strategy with cache fallback for navigation"
  );

  // Scenario subtitles & metadata requests: Network-First with cache fallback
  assert(
    swContent.includes("isSubtitleOrManifest") ||
      (swContent.includes(".lrc") && swContent.includes("fetch(request)")),
    "sw.js routes subtitle (.lrc) and manifest files with Network-First strategy"
  );

  // On-demand heavy audio media runtime caching
  assert(
    swContent.includes("isMedia") || swContent.includes(".mp3"),
    "sw.js identifies audio requests (.mp3) for on-demand caching"
  );
  // HTTP 206 Range request support for audio seeking (prevents currentTime reset to 0)
  assert(
    swContent.includes("status: 206") &&
      swContent.includes("Partial Content") &&
      swContent.includes("Content-Range"),
    "sw.js returns HTTP 206 Partial Content with Content-Range for audio Range requests"
  );

  // Safe fallback Response instances (never resolves undefined to prevent net::ERR_FAILED)
  assert(
    swContent.includes("status: 503") && swContent.includes("status: 404"),
    "sw.js returns safe HTTP error Response objects instead of undefined on network/cache misses"
  );

  // SW message listener for client update signals
  assert(
    swContent.includes("SKIP_WAITING") &&
      swContent.includes("CLEAR_ALL_CACHES"),
    "sw.js message listener supports SKIP_WAITING and CLEAR_ALL_CACHES signals"
  );

  // Activation cache pruning
  assert(
    /caches\s*\.\s*keys\(\)/.test(swContent) &&
      /caches\s*\.\s*delete/.test(swContent),
    "sw.js activate event prunes legacy cache versions"
  );

  // Client controllerchange listener & registration options
  assert(
    htmlContent.includes("controllerchange") &&
      htmlContent.includes("window.location.reload()"),
    "index.html attaches controllerchange listener for seamless automatic reload on SW upgrade"
  );
  assert(
    htmlContent.includes('updateViaCache: "none"'),
    "index.html registers Service Worker with updateViaCache: 'none'"
  );
  assert(
    htmlContent.includes("function forceCheckUpdatesAndReload"),
    "index.html provides forceCheckUpdatesAndReload function"
  );

  // 14. Audio Assets On Disk
  const scenariosDir = path.join(
    __dirname,
    "..",
    "english-shadowing",
    "scenarios"
  );
  assert(
    fs.existsSync(scenariosDir),
    "english-shadowing/scenarios directory exists"
  );
  const scenarioIds = [
    "specialty-coffee",
    "tech-standup",
    "airport-security",
    "academic-ai-future",
  ];
  scenarioIds.forEach((scId) => {
    const filePath = path.join(scenariosDir, scId, "audio.mp3");
    assert(
      fs.existsSync(filePath) && fs.statSync(filePath).size > 10000,
      `Scenario audio ${scId}/audio.mp3 exists on disk with non-zero audio bytes (${fs.existsSync(filePath) ? fs.statSync(filePath).size : 0} bytes)`
    );
  });

  // 15. Playback Mode Default & localStorage Persistence
  assert(
    state.playbackMode === "continuous",
    "Default state.playbackMode is initialized to 'continuous'"
  );
  setPlaybackMode("loop", true);
  assert(
    storageMock.getItem("shadowing_playback_mode") === "loop",
    "setPlaybackMode('loop') persists 'loop' into localStorage"
  );
  assert(state.playbackMode === "loop", "state.playbackMode updated to 'loop'");
  setPlaybackMode("continuous", true);
  assert(
    storageMock.getItem("shadowing_playback_mode") === "continuous",
    "setPlaybackMode('continuous') persists 'continuous' into localStorage"
  );
  assert(
    state.playbackMode === "continuous",
    "state.playbackMode reverted to 'continuous'"
  );

  // 16. Practice Stats & Insights Modal State Lifecycle (Slice 3)
  assert(
    typeof updateHeaderBadges === "function",
    "updateHeaderBadges function exists"
  );
  assert(
    typeof renderInsightsModal === "function",
    "renderInsightsModal function exists"
  );
  assert(
    typeof openInsightsModal === "function",
    "openInsightsModal function exists"
  );
  assert(
    typeof closeInsightsModal === "function",
    "closeInsightsModal function exists"
  );

  // Test sentence shadowing tracking today & total
  const initialToday = getPracticeStats().sentencesShadowedToday || 0;
  const initialTotal = getPracticeStats().totalSentencesShadowed || 0;
  logPracticeShadowSentence();
  assert(
    getPracticeStats().sentencesShadowedToday === initialToday + 1,
    "logPracticeShadowSentence increments sentencesShadowedToday"
  );
  assert(
    getPracticeStats().totalSentencesShadowed === initialTotal + 1,
    "logPracticeShadowSentence increments totalSentencesShadowed"
  );

  // Test practice seconds accumulation
  logPracticeSeconds(120);
  assert(
    getPracticeStats().totalSecondsPracticedToday >= 120,
    "logPracticeSeconds accumulates seconds practiced today"
  );

  // 18. Media Cache Storage Clearing & User Data Isolation (ADR-0007 / Slice 2)
  assert(
    typeof clearMediaCacheStorage === "function",
    "clearMediaCacheStorage function exists in index.html"
  );
  assert(
    typeof isScenarioAvailableOffline === "function",
    "isScenarioAvailableOffline function exists in index.html"
  );

  // Setup sample vocab and practice stats
  setSavedVocabVault({
    testword: {
      word: "testword",
      box: 2,
      savedAt: new Date().toISOString(),
      lastReviewed: null,
      nextReviewDate: new Date().toISOString(),
    },
  });
  saveVocabVault();

  // Mock confirm and caches
  let deletedCaches = [];
  sandbox.confirm = () => true;
  sandbox.caches = {
    delete: async (cacheName) => {
      deletedCaches.push(cacheName);
      return true;
    },
    open: async (name) => ({
      match: async () => null,
      put: async () => {},
    }),
  };

  await clearMediaCacheStorage();
  assert(
    deletedCaches.includes("shadowing-media-v3"),
    "clearMediaCacheStorage deletes shadowing-media-v3 cache bucket"
  );
  assert(
    Object.keys(getSavedVocabVault()).includes("testword"),
    "User SRS vocabulary vault is 100% preserved after clearMediaCacheStorage"
  );
  // 19. Scenario Progress Store & Bookmark State Tests (Issue #674)
  assert(
    SCENARIO_PROGRESS_KEY === "shadowing_scenario_progress_v1",
    "SCENARIO_PROGRESS_KEY equals 'shadowing_scenario_progress_v1'"
  );
  assert(
    typeof loadScenarioProgress === "function",
    "loadScenarioProgress function exists"
  );
  assert(
    typeof saveScenarioProgress === "function",
    "saveScenarioProgress function exists"
  );
  assert(
    typeof toggleBookmark === "function",
    "toggleBookmark function exists"
  );
  assert(
    typeof isScenarioBookmarked === "function",
    "isScenarioBookmarked function exists"
  );
  assert(
    typeof getScenarioProgress === "function",
    "getScenarioProgress function exists"
  );
  assert(
    typeof markSentenceCompleted === "function",
    "markSentenceCompleted function exists"
  );

  // 19.1 Empty Storage Initialization
  storageMock.removeItem(SCENARIO_PROGRESS_KEY);
  loadScenarioProgress();
  let progressStore = getScenarioProgressStore();
  assert(
    Array.isArray(progressStore.bookmarkedIds) &&
      progressStore.bookmarkedIds.length === 0,
    "Initializes bookmarkedIds as empty array on fresh launch"
  );
  assert(
    typeof progressStore.scenarios === "object" &&
      Object.keys(progressStore.scenarios).length === 0,
    "Initializes scenarios as empty object on fresh launch"
  );

  // 19.2 Bookmark Toggle & Persistence
  assert(
    isScenarioBookmarked("workplace-interview") === false,
    "Scenario initially not bookmarked"
  );
  toggleBookmark("workplace-interview");
  assert(
    isScenarioBookmarked("workplace-interview") === true,
    "toggleBookmark adds scenario ID to bookmarkedIds"
  );
  assert(
    storageMock.getItem(SCENARIO_PROGRESS_KEY).includes("workplace-interview"),
    "Bookmark state is persisted to localStorage"
  );

  // Toggle off
  toggleBookmark("workplace-interview");
  assert(
    isScenarioBookmarked("workplace-interview") === false,
    "Second toggleBookmark call removes scenario from bookmarkedIds"
  );

  // 19.3 Sentence Completion Tracking & Status Transitions
  const testScId = "travel-hotel-checkin";
  let scProg = getScenarioProgress(testScId);
  assert(scProg.status === "new", "Untracked scenario returns status 'new'");
  assert(
    Array.isArray(scProg.completedSentences) &&
      scProg.completedSentences.length === 0,
    "Untracked scenario has 0 completed sentences"
  );

  // Mark sentence 0 completed (total = 3)
  markSentenceCompleted(testScId, 0, 3);
  scProg = getScenarioProgress(testScId);
  assert(
    scProg.status === "in_progress",
    "Marking first sentence transitions status to 'in_progress'"
  );
  assert(
    scProg.completedSentences.includes(0),
    "completedSentences contains index 0"
  );
  assert(scProg.practiceCount === 1, "practiceCount incremented to 1");
  assert(scProg.lastPracticedAt > 0, "lastPracticedAt timestamp is recorded");

  // Mark sentence 1 completed
  markSentenceCompleted(testScId, 1, 3);
  // Mark sentence 2 completed (3 out of 3 completed -> status 'completed')
  markSentenceCompleted(testScId, 2, 3);
  scProg = getScenarioProgress(testScId);
  assert(
    scProg.status === "completed",
    "Completing all sentences transitions status to 'completed'"
  );
  assert(
    scProg.completedSentences.length === 3,
    "All 3 sentence indices recorded"
  );

  // Practice more until practiceCount >= total * 3 (9 takes) -> transition to 'mastered'
  for (let i = 0; i < 6; i++) {
    markSentenceCompleted(testScId, i % 3, 3);
  }
  scProg = getScenarioProgress(testScId);
  assert(
    scProg.status === "mastered",
    "Practicing all sentences >= 3 rounds transitions status to 'mastered'"
  );

  // 19.4 Corrupted Storage Fallback Resilience
  storageMock.setItem(SCENARIO_PROGRESS_KEY, "{ bad json");
  loadScenarioProgress();
  progressStore = getScenarioProgressStore();
  assert(
    Array.isArray(progressStore.bookmarkedIds) &&
      typeof progressStore.scenarios === "object",
    "Handles malformed JSON gracefully with default store fallback"
  );

  // ==========================================
  // 20. INDEXEDDB AUDIO VAULT (ADR-0009 / Slice 2)
  // ==========================================
  console.log(
    "\n--- Section 20: IndexedDB Audio Vault (shadowing_recordings_vault) ---"
  );

  assert(
    RECORDINGS_DB_NAME === "shadowing_recordings_vault",
    "RECORDINGS_DB_NAME constant equals 'shadowing_recordings_vault'"
  );

  // 20.1 DB Initialization
  const dbInstance = await openRecordingsDb();
  assert(
    dbInstance && dbInstance.objectStoreNames.contains("recordings"),
    "openRecordingsDb initializes 'recordings' object store"
  );

  // 20.2 Save Recording
  const dummyBlob = { size: 1024, type: "audio/webm;codecs=opus" };
  const savedRecord = await saveRecordingToVault(
    "specialty-coffee",
    0,
    dummyBlob,
    3.2,
    "Welcome to the specialty coffee shop."
  );
  assert(
    savedRecord &&
      savedRecord.id === "specialty-coffee_cue_0" &&
      savedRecord.scenarioId === "specialty-coffee" &&
      savedRecord.cueIndex === 0 &&
      savedRecord.duration === 3.2,
    "saveRecordingToVault stores take with compound ID and metadata"
  );

  // 20.3 Fetch Recording
  const fetchedRecord = await getRecordingFromVault("specialty-coffee", 0);
  assert(
    fetchedRecord &&
      fetchedRecord.id === "specialty-coffee_cue_0" &&
      fetchedRecord.blob === dummyBlob &&
      fetchedRecord.cueText === "Welcome to the specialty coffee shop.",
    "getRecordingFromVault retrieves stored audio Blob and transcript"
  );

  // 20.4 Save Multiple Cues & Fetch All for Scenario
  await saveRecordingToVault(
    "specialty-coffee",
    1,
    dummyBlob,
    2.8,
    "Would you like an espresso or a pour over?"
  );
  const scenarioTakes = await getAllRecordingsForScenario("specialty-coffee");
  assert(
    Array.isArray(scenarioTakes) && scenarioTakes.length === 2,
    "getAllRecordingsForScenario retrieves all takes for active scenario"
  );

  // 20.5 Delete Recording
  const deleteResult = await deleteRecordingFromVault("specialty-coffee", 0);
  assert(
    deleteResult === true,
    "deleteRecordingFromVault returns true on successful deletion"
  );
  const remainingRecord = await getRecordingFromVault("specialty-coffee", 0);
  assert(remainingRecord === null, "Deleted take returns null from vault");

  // 20.6 Edge Cases & Input Validation
  const nullScenarioResult = await saveRecordingToVault(null, 0, dummyBlob);
  assert(
    nullScenarioResult === null,
    "saveRecordingToVault safely returns null on null scenarioId"
  );
  const nanCueResult = await saveRecordingToVault(
    "specialty-coffee",
    NaN,
    dummyBlob
  );
  assert(
    nanCueResult === null,
    "saveRecordingToVault safely returns null on NaN cueIndex"
  );
  const nonExistentResult = await getRecordingFromVault(
    "non-existent-scenario",
    99
  );
  assert(
    nonExistentResult === null,
    "getRecordingFromVault returns null for non-existent record"
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
