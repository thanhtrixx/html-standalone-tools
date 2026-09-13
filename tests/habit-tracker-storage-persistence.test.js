#!/usr/bin/env node

/**
 * Atomic Habit Tracker Storage, Persistence & Silent Migration Test Suite
 *
 * Domain: Data Integrity & Storage
 * Covers:
 * - [AC-1] IndexedDB Schema, Object Stores & Asynchronous CRUD
 * - [AC-2] Silent Auto-Migration from Legacy Schemas without Data Loss
 * - [AC-3] LocalStorage Fallback Adapter for Private/Restricted Browsing
 * - [AC-4] Full JSON Data Portability (Export & Validated Import with Merge/Replace)
 * - [AC-6] Reactive State Store Actions & Persistence Integration
 * - [Issue #426 AC-1] Method Export/Import Binding for JSON Export & Function Name Parity
 * - [Issue #426 AC-2] Browser Download of Formatted .json Backup File (Habits, Logs, Settings)
 * - [Issue #426 AC-3] Success Toast Notification Display upon JSON Backup Export
 * - [Issue #426 AC-4] Clean JSON Export Execution without TypeErrors & Public Seam Integrity
 */

const {
  createMockStorage,
  createHabitTrackerSandbox,
  createAssertions,
} = require("./helpers/habit-tracker-harness.js");

const { assert, assertEqual, printSummary } = createAssertions(
  "Atomic Habit Tracker Storage & Persistence Test Suite"
);

console.log(
  "\n🧪 Running Atomic Habit Tracker Storage & Persistence Test Suite...\n"
);

async function runStorageTests() {
  const storageModule = require("../habit-tracker/src/storage/indexeddb.js");
  const { HabitStore } = require("../habit-tracker/src/state/store.js");
  const exportImport = require("../habit-tracker/src/sync/export-import.js");
  const { exportToJson, validateImportJson, importFromJson } = exportImport;

  // ==========================================
  // [AC-3] LocalStorage Fallback Adapter & CRUD
  // ==========================================
  console.log("--- [AC-3] Storage Adapter & CRUD Operations ---");

  const mockLocalStorage = createMockStorage();
  const db = storageModule.createStorageAdapter({
    fallbackStorage: mockLocalStorage,
    forceFallback: true,
  });

  // Habits CRUD
  const habit1 = {
    id: "habit-1",
    name: "Morning Meditation",
    type: "binary",
    targetValue: 1,
    routine: "morning",
    scheduleType: "daily",
    createdAt: "2026-09-01",
  };

  await db.putHabit(habit1);
  const fetchedHabit = await db.getHabit("habit-1");
  assertEqual(
    fetchedHabit.name,
    "Morning Meditation",
    "[AC-1] Successfully stored and fetched habit"
  );

  const allHabits = await db.getAllHabits();
  assertEqual(
    allHabits.length,
    1,
    "[AC-1] getAllHabits returns 1 stored habit"
  );

  // Update habit
  await db.putHabit({ ...habit1, name: "Mindful Meditation 15m" });
  const updatedHabit = await db.getHabit("habit-1");
  assertEqual(
    updatedHabit.name,
    "Mindful Meditation 15m",
    "[AC-1] Successfully updated habit in storage"
  );

  // Logs CRUD
  const log1 = {
    id: "habit-1_2026-09-12",
    habitId: "habit-1",
    date: "2026-09-12",
    value: 1,
    completed: true,
    notes: "Calm and focused start.",
    timestamp: Date.now(),
  };

  await db.putLog(log1);
  const fetchedLog = await db.getLog("habit-1", "2026-09-12");
  assertEqual(
    fetchedLog.value,
    1,
    "[AC-1] Log saved and retrieved by habitId and date"
  );
  assertEqual(
    fetchedLog.notes,
    "Calm and focused start.",
    "[AC-1] Micro-journal reflection note stored accurately"
  );

  const allLogs = await db.getAllLogs();
  assertEqual(allLogs.length, 1, "[AC-1] getAllLogs returns all saved logs");

  // Settings CRUD
  await db.putSetting("theme", "dark");
  await db.putSetting("freezeTokens", 3);
  const themeSetting = await db.getSetting("theme");
  const freezeSetting = await db.getSetting("freezeTokens");
  assertEqual(themeSetting, "dark", "[AC-1] Setting 'theme' saved and fetched");
  assertEqual(
    freezeSetting,
    3,
    "[AC-1] Setting 'freezeTokens' saved and fetched"
  );

  // ==========================================
  // [AC-2] Silent Auto-Migration System
  // ==========================================
  console.log("\n--- [AC-2] Silent Auto-Migration System ---");

  // Simulate legacy v0 schema data in localStorage
  const legacyStorage = createMockStorage({
    atomic_habits_v0: JSON.stringify([
      {
        id: "legacy-1",
        title: "Read Book",
        count: 1,
        done: true,
        routine: "evening",
      },
    ]),
    atomic_logs_v0: JSON.stringify({
      "legacy-1_2026-09-10": { check: 1, text: "Read chapter 1" },
    }),
  });

  const migratedDb = storageModule.createStorageAdapter({
    fallbackStorage: legacyStorage,
    forceFallback: true,
  });
  await migratedDb.runSilentMigration();

  const migratedHabits = await migratedDb.getAllHabits();
  assert(
    migratedHabits.some((h) => h.id === "legacy-1" && h.name === "Read Book"),
    "[AC-2] Legacy v0 habit migrated with mapped name"
  );

  const migratedLogs = await migratedDb.getAllLogs();
  assert(
    migratedLogs.some(
      (l) => l.habitId === "legacy-1" && l.date === "2026-09-10"
    ),
    "[AC-2] Legacy v0 log migrated with mapped date and habitId"
  );

  // ==========================================
  // [AC-4] Full JSON Data Portability
  // ==========================================
  console.log("\n--- [AC-4] JSON Export & Import ---");

  const exportPayload = await exportToJson(migratedDb);
  assert(
    exportPayload.app === "atomic-habit-tracker",
    "[AC-4] Export JSON contains app identifier"
  );
  assert(
    exportPayload.data.habits.length >= 1,
    "[AC-4] Export JSON includes habits"
  );
  assert(
    exportPayload.data.logs.length >= 1,
    "[AC-4] Export JSON includes logs"
  );

  // Test validation on invalid payload
  const invalidPayload = { app: "wrong-app", data: {} };
  const valResult = validateImportJson(invalidPayload);
  assertEqual(valResult.valid, false, "[AC-4] Invalid app payload is rejected");

  const validResult = validateImportJson(exportPayload);
  assertEqual(
    validResult.valid,
    true,
    "[AC-4] Valid export payload passes schema verification"
  );

  // Test Import Merge Mode
  const newImportData = {
    app: "atomic-habit-tracker",
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    data: {
      habits: [
        {
          id: "import-1",
          name: "Gym Workout",
          type: "numeric",
          targetValue: 3,
          unit: "sets",
          routine: "afternoon",
        },
      ],
      logs: [
        {
          id: "import-1_2026-09-12",
          habitId: "import-1",
          date: "2026-09-12",
          value: 3,
          completed: true,
          notes: "Chest day",
        },
      ],
      settings: { theme: "light" },
      routines: [],
      vacations: [],
    },
  };

  const freshStorage = createMockStorage();
  const testDb = storageModule.createStorageAdapter({
    fallbackStorage: freshStorage,
    forceFallback: true,
  });
  await testDb.putHabit(habit1);

  // Merge mode
  await importFromJson(testDb, newImportData, "merge");
  const mergedHabits = await testDb.getAllHabits();
  assertEqual(
    mergedHabits.length,
    2,
    "[AC-4] Merge mode preserved existing habit and added imported habit"
  );

  // Replace mode
  await importFromJson(testDb, newImportData, "replace");
  const replacedHabits = await testDb.getAllHabits();
  assertEqual(
    replacedHabits.length,
    1,
    "[AC-4] Replace mode replaced existing data with imported habit"
  );
  assertEqual(
    replacedHabits[0].id,
    "import-1",
    "[AC-4] Replaced data contains imported item"
  );

  // ==========================================
  // [AC-6] Reactive State Store Integration
  // ==========================================
  console.log("\n--- [AC-6] Reactive State Store Actions ---");

  const storeStorage = createMockStorage();
  const storeDb = storageModule.createStorageAdapter({
    fallbackStorage: storeStorage,
    forceFallback: true,
  });
  const store = new HabitStore({ storage: storeDb });
  await store.init();

  let notifyCount = 0;
  store.subscribe(() => {
    notifyCount++;
  });

  // Add Habit
  await store.addHabit({
    id: "store-h1",
    name: "Hydration",
    type: "numeric",
    targetValue: 2000,
    unit: "ml",
    step: 250,
    routine: "anytime",
    scheduleType: "daily",
  });

  assert(
    store.getHabits().some((h) => h.id === "store-h1"),
    "[AC-6] State store contains added habit"
  );
  assert(
    notifyCount >= 1,
    "[AC-6] State store notified subscribers on habit creation"
  );

  // Log Progress & Toggle
  await store.logHabit("store-h1", "2026-09-12", 1000, "Morning hydration");
  const dayState = store.getDailyState("2026-09-12");
  assertEqual(
    dayState.logs["store-h1"].value,
    1000,
    "[AC-6] Log progress updated in reactive state"
  );
  assertEqual(
    dayState.logs["store-h1"].notes,
    "Morning hydration",
    "[AC-6] Notes attached to log in state"
  );

  // Toggle completion
  await store.toggleHabit("store-h1", "2026-09-12");
  const toggledState = store.getDailyState("2026-09-12");
  assertEqual(
    toggledState.logs["store-h1"].completed,
    true,
    "[AC-6] Toggle completes numeric habit to target value"
  );

  // Delete Habit
  await store.deleteHabit("store-h1");
  assertEqual(
    store.getHabits().length,
    0,
    "[AC-6] Delete habit removes it from store and storage"
  );

  // Vacation Pause
  await store.addVacationRange({
    startDate: "2026-09-20",
    endDate: "2026-09-25",
    reason: "Trip",
  });
  assertEqual(
    store.getSettings().vacationRanges.length,
    1,
    "[AC-6] Vacation range added to settings state"
  );

  // ==========================================
  // [Issue #426 AC-1] Method Export/Import Binding & Function Name Parity
  // ==========================================
  console.log(
    "\n--- [Issue #426 AC-1] Method Export/Import Binding Parity ---"
  );

  // Verify exportImport module exports downloadExportJSON and required portability seams
  assertEqual(
    typeof exportImport.downloadExportJSON,
    "function",
    "[Issue #426 AC-1] exportImport module exports downloadExportJSON as a callable function"
  );
  assertEqual(
    typeof exportImport.exportToJson,
    "function",
    "[Issue #426 AC-1] exportImport module exports exportToJson for JSON generation"
  );
  assert(
    typeof exportImport.validateImportJson === "function" ||
      typeof exportImport.parseAndValidateImport === "function",
    "[Issue #426 AC-1] exportImport exports JSON validation public seam"
  );
  assert(
    typeof exportImport.importFromJson === "function" ||
      typeof exportImport.mergeHabitStates === "function",
    "[Issue #426 AC-1] exportImport exports import/merge state public seam"
  );

  // Verify HabitApp binds exportDataJSON in browser sandbox and global exportImport namespace
  const { sandbox: appSandbox } = createHabitTrackerSandbox();
  appSandbox.requestAnimationFrame = (fn) => fn();
  appSandbox.cancelAnimationFrame = () => {};
  await appSandbox.HabitApp.init();

  assertEqual(
    typeof appSandbox.HabitApp.exportDataJSON,
    "function",
    "[Issue #426 AC-1] HabitApp exposes exportDataJSON method on application instance"
  );
  assert(
    typeof appSandbox.exportImport === "object" &&
      appSandbox.exportImport !== null,
    "[Issue #426 AC-1] Global exportImport namespace is registered on window context"
  );
  assertEqual(
    typeof (
      appSandbox.exportImport && appSandbox.exportImport.downloadExportJSON
    ),
    "function",
    "[Issue #426 AC-1] Window exportImport namespace contains downloadExportJSON function"
  );

  // ==========================================
  // [Issue #426 AC-2] Browser Download of Formatted .json Backup File
  // ==========================================
  console.log(
    "\n--- [Issue #426 AC-2] Browser Download of Formatted JSON Backup ---"
  );

  // Seed rich domain data with habits, logs, and settings
  const exportStorage = createMockStorage();
  const exportDb = storageModule.createStorageAdapter({
    fallbackStorage: exportStorage,
    forceFallback: true,
  });

  const sampleHabit1 = {
    id: "h-meditate",
    name: "Morning Meditation 🧘",
    type: "binary",
    targetValue: 1,
    routine: "morning",
    scheduleType: "daily",
    color: "indigo",
    icon: "🧘",
    createdAt: "2026-09-01",
  };
  const sampleHabit2 = {
    id: "h-water",
    name: "Drink 2.5L Water 💧",
    type: "numeric",
    targetValue: 2500,
    unit: "ml",
    step: 250,
    routine: "afternoon",
    scheduleType: "daily",
    color: "cyan",
    icon: "💧",
    createdAt: "2026-09-02",
  };
  const sampleHabit3 = {
    id: "h-reading",
    name: "Deep Work 30m ⏱️",
    type: "timer",
    targetValue: 1800,
    unit: "mins",
    routine: "evening",
    scheduleType: "daily",
    color: "amber",
    icon: "⏱️",
    createdAt: "2026-09-03",
  };

  await exportDb.putHabit(sampleHabit1);
  await exportDb.putHabit(sampleHabit2);
  await exportDb.putHabit(sampleHabit3);

  const sampleLog1 = {
    id: "h-meditate_2026-09-12",
    habitId: "h-meditate",
    date: "2026-09-12",
    value: 1,
    completed: true,
    notes: "Tâm trí bình an, tập trung cao độ.",
    timestamp: 1789214400000,
  };
  const sampleLog2 = {
    id: "h-water_2026-09-12",
    habitId: "h-water",
    date: "2026-09-12",
    value: 2500,
    completed: true,
    notes: "Uống đủ 10 cốc nước.",
    timestamp: 1789218000000,
  };

  await exportDb.putLog(sampleLog1);
  await exportDb.putLog(sampleLog2);

  await exportDb.putSetting("theme", "dark");
  await exportDb.putSetting("freezeTokens", 2);
  await exportDb.putSetting("language", "vi");

  // Track download execution in sandbox via DOM anchor click & URL object
  const { sandbox: downloadSandbox } = createHabitTrackerSandbox();
  let capturedBlob = null;
  let capturedBlobText = "";
  let anchorClicked = false;
  let downloadFilename = "";

  downloadSandbox.URL.createObjectURL = (blob) => {
    capturedBlob = blob;
    return "blob:http://localhost/mock-export-url";
  };
  downloadSandbox.URL.revokeObjectURL = () => {};

  const origCreateEl = downloadSandbox.document.createElement;
  downloadSandbox.document.createElement = (tag) => {
    const el = origCreateEl.call(downloadSandbox.document, tag);
    if (tag.toLowerCase() === "a") {
      el.click = async () => {
        anchorClicked = true;
        downloadFilename = el.download || el.getAttribute("download") || "";
        if (capturedBlob && typeof capturedBlob.text === "function") {
          capturedBlobText = await capturedBlob.text();
        }
        el.dispatchEvent({ type: "click", bubbles: true });
      };
    }
    return el;
  };

  await downloadSandbox.HabitApp.init();
  if (downloadSandbox.HabitApp.store) {
    await downloadSandbox.HabitApp.store.addHabit(sampleHabit1);
    await downloadSandbox.HabitApp.store.addHabit(sampleHabit2);
    await downloadSandbox.HabitApp.store.addHabit(sampleHabit3);
    await downloadSandbox.HabitApp.store.logHabit(
      "h-meditate",
      "2026-09-12",
      1,
      "Tâm trí bình an, tập trung cao độ."
    );
    await downloadSandbox.HabitApp.store.logHabit(
      "h-water",
      "2026-09-12",
      2500,
      "Uống đủ 10 cốc nước."
    );
  }

  try {
    await downloadSandbox.HabitApp.exportDataJSON();
  } catch (err) {
    // Red phase: captures failure if method binding is broken
  }

  assert(
    anchorClicked,
    "[Issue #426 AC-2] Exporting JSON triggers programmatic click on download anchor element"
  );
  assert(
    downloadFilename.endsWith(".json"),
    "[Issue #426 AC-2] Downloaded file has .json extension"
  );
  assert(
    downloadFilename.includes("atomic-habit") ||
      downloadFilename.includes("backup") ||
      downloadFilename.includes("habits"),
    "[Issue #426 AC-2] Downloaded filename contains domain backup identifier"
  );

  // Pure function payload verification from storage
  const directExportPayload = await exportToJson(exportDb);

  assertEqual(
    directExportPayload.app,
    "atomic-habit-tracker",
    "[Issue #426 AC-2] Export JSON contains app identifier 'atomic-habit-tracker'"
  );
  assert(
    typeof directExportPayload.version === "string" &&
      directExportPayload.version.length > 0,
    "[Issue #426 AC-2] Export JSON includes schema version string"
  );
  assert(
    !isNaN(Date.parse(directExportPayload.exportedAt)),
    "[Issue #426 AC-2] Export JSON contains valid ISO 8601 timestamp"
  );
  assert(
    Array.isArray(directExportPayload.data.habits),
    "[Issue #426 AC-2] Export JSON data.habits is an array"
  );
  assertEqual(
    directExportPayload.data.habits.length,
    3,
    "[Issue #426 AC-2] Export JSON includes all 3 stored habits"
  );
  assert(
    directExportPayload.data.habits.some(
      (h) => h.id === "h-water" && h.targetValue === 2500 && h.unit === "ml"
    ),
    "[Issue #426 AC-2] Numeric habit target value and unit are faithfully preserved"
  );

  const exportedLogs = Array.isArray(directExportPayload.data.logs)
    ? directExportPayload.data.logs
    : Object.values(directExportPayload.data.logs);
  assert(
    exportedLogs.length >= 2,
    "[Issue #426 AC-2] Export JSON includes all check-in logs"
  );

  const meditationLog = exportedLogs.find(
    (l) => l.habitId === "h-meditate" || (l.id && l.id.includes("h-meditate"))
  );
  assert(
    meditationLog &&
      meditationLog.notes === "Tâm trí bình an, tập trung cao độ.",
    "[Issue #426 AC-2] Micro-journal reflection notes with Vietnamese unicode preserved in export"
  );

  // Edge case: Empty database export
  const emptyStorage = createMockStorage();
  const emptyDb = storageModule.createStorageAdapter({
    fallbackStorage: emptyStorage,
    forceFallback: true,
  });
  const emptyPayload = await exportToJson(emptyDb);
  assertEqual(
    emptyPayload.app,
    "atomic-habit-tracker",
    "[Issue #426 AC-2] Empty database exports valid app identifier"
  );
  assertEqual(
    emptyPayload.data.habits.length,
    0,
    "[Issue #426 AC-2] Empty database exports empty habits array without throwing"
  );

  // ==========================================
  // [Issue #426 AC-3] Success Toast Notification Display
  // ==========================================
  console.log("\n--- [Issue #426 AC-3] Success Toast Notification Display ---");

  const { sandbox: toastSandbox } = createHabitTrackerSandbox();
  let capturedToast = { message: "", type: "" };

  toastSandbox.URL.createObjectURL = () => "blob:http://localhost/toast-test";
  toastSandbox.URL.revokeObjectURL = () => {};

  await toastSandbox.HabitApp.init();

  const origShowToast = toastSandbox.HabitApp.showToast;
  toastSandbox.HabitApp.showToast = (msg, type) => {
    capturedToast = { message: msg, type: type };
    if (typeof origShowToast === "function") {
      origShowToast.call(toastSandbox.HabitApp, msg, type);
    }
  };

  try {
    await toastSandbox.HabitApp.exportDataJSON();
  } catch (err) {
    // Red phase: captures failure if method binding is broken
  }

  assert(
    capturedToast.message.length > 0,
    "[Issue #426 AC-3] Toast notification is triggered when Export JSON finishes"
  );
  assert(
    capturedToast.message.toLowerCase().includes("tải về") ||
      capturedToast.message.toLowerCase().includes("download") ||
      capturedToast.message.toLowerCase().includes("thành công") ||
      capturedToast.message.toLowerCase().includes("xuất") ||
      capturedToast.message.toLowerCase().includes("backup") ||
      capturedToast.message.toLowerCase().includes("json") ||
      capturedToast.message.toLowerCase().includes("exported"),
    "[Issue #426 AC-3] Toast message informs user that backup has been exported / downloaded"
  );

  if (capturedToast.type) {
    assert(
      capturedToast.type === "success" || capturedToast.type === "info",
      "[Issue #426 AC-3] Toast notification type is success or info"
    );
  }

  // ==========================================
  // [Issue #426 AC-4] Clean JSON Export Execution & Error-Free Flow
  // ==========================================
  console.log("\n--- [Issue #426 AC-4] Error-Free JSON Export Initiation ---");

  // 1. Direct HabitApp.exportDataJSON execution does not throw TypeError
  let exportThrewError = false;
  let exportErrorMessage = "";
  try {
    const { sandbox: cleanSandbox } = createHabitTrackerSandbox();
    cleanSandbox.URL.createObjectURL = () => "blob:http://localhost/clean-test";
    cleanSandbox.URL.revokeObjectURL = () => {};
    await cleanSandbox.HabitApp.init();
    await cleanSandbox.HabitApp.exportDataJSON();
  } catch (err) {
    exportThrewError = true;
    exportErrorMessage = err.message || String(err);
  }

  assertEqual(
    exportThrewError,
    false,
    `[Issue #426 AC-4] HabitApp.exportDataJSON() executes cleanly without throwing (Error: ${exportErrorMessage})`
  );

  // 2. Simulate UI Button Click for Export JSON
  const { sandbox: buttonSandbox, getOrCreateElement: getBtnEl } =
    createHabitTrackerSandbox();
  buttonSandbox.URL.createObjectURL = () => "blob:http://localhost/btn-test";
  buttonSandbox.URL.revokeObjectURL = () => {};
  await buttonSandbox.HabitApp.init();

  let uiExportTriggered = false;
  const origExportDataJSON = buttonSandbox.HabitApp.exportDataJSON;
  buttonSandbox.HabitApp.exportDataJSON = async function () {
    uiExportTriggered = true;
    return origExportDataJSON
      ? origExportDataJSON.apply(this, arguments)
      : true;
  };

  buttonSandbox.HabitApp.switchTab("settings");
  const exportBtn =
    buttonSandbox.document.querySelector("#btn-export-json") ||
    getBtnEl("btn-export-json");
  if (!exportBtn.getAttribute("data-action")) {
    exportBtn.setAttribute("data-action", "export-json");
  }
  exportBtn.click();

  assert(
    uiExportTriggered,
    "[Issue #426 AC-4] Clicking #btn-export-json element triggers HabitApp.exportDataJSON without errors"
  );

  // 3. Seam validation: parseAndValidateImport / validateImportJson
  const validatorFn =
    exportImport.parseAndValidateImport || exportImport.validateImportJson;
  assert(
    typeof validatorFn === "function",
    "[Issue #426 AC-4] Validation public seam parseAndValidateImport / validateImportJson is callable"
  );

  const validCheck = validatorFn(directExportPayload);
  assertEqual(
    validCheck.valid,
    true,
    "[Issue #426 AC-4] Exported JSON payload passes schema validation"
  );

  // Adversarial corrupted payload validation checks
  const corruptPayloads = [
    null,
    undefined,
    "",
    "not-json",
    {},
    { app: "other-app", data: {} },
    { app: "atomic-habit-tracker", data: "invalid-data-type" },
    { app: "atomic-habit-tracker" },
  ];

  for (const corrupt of corruptPayloads) {
    const res = validatorFn(corrupt);
    assertEqual(
      res.valid,
      false,
      `[Issue #426 AC-4] Corrupted/invalid payload (${JSON.stringify(corrupt)}) safely rejected without throwing`
    );
  }

  // 4. Seam round-trip: mergeHabitStates / importFromJson
  const importFn = exportImport.mergeHabitStates || exportImport.importFromJson;
  assert(
    typeof importFn === "function",
    "[Issue #426 AC-4] Import/merge public seam mergeHabitStates / importFromJson is callable"
  );

  const roundTripStorage = createMockStorage();
  const roundTripDb = storageModule.createStorageAdapter({
    fallbackStorage: roundTripStorage,
    forceFallback: true,
  });

  await importFn(roundTripDb, directExportPayload, "replace");
  const restoredHabits = await roundTripDb.getAllHabits();
  const restoredLogs = await roundTripDb.getAllLogs();

  assertEqual(
    restoredHabits.length,
    directExportPayload.data.habits.length,
    "[Issue #426 AC-4] Round-trip import restores exact habit count"
  );
  assert(
    restoredHabits.some(
      (h) => h.id === "h-meditate" && h.name.includes("Morning Meditation")
    ),
    "[Issue #426 AC-4] Restored habit attributes match original exported data"
  );
  assertEqual(
    restoredLogs.length,
    exportedLogs.length,
    "[Issue #426 AC-4] Round-trip import restores exact check-in log count"
  );

  // Issue #459: Multi-Routine Persistence and Silent Store Migration
  const multiStorage = createMockStorage();
  const multiDb = storageModule.createStorageAdapter({
    fallbackStorage: multiStorage,
    forceFallback: true,
  });

  // 1. Store a habit with routines array
  const multiHabit = {
    id: "h-dual-walk",
    name: "Morning & Evening Walk",
    type: "numeric",
    targetValue: 6000,
    unit: "steps",
    step: 1000,
    routines: ["morning", "evening"],
    scheduleType: "daily",
  };
  await multiDb.putHabit(multiHabit);

  // 2. Store a legacy habit without routines array
  const legacyStoreHabit = {
    id: "h-legacy-afternoon",
    name: "Legacy Afternoon Habit",
    type: "binary",
    targetValue: 1,
    routine: "afternoon",
    scheduleType: "daily",
  };
  await multiDb.putHabit(legacyStoreHabit);

  const testStore = new HabitStore({ storage: multiDb });
  await testStore.init();

  const retrievedMulti = testStore.getHabit("h-dual-walk");
  assert(
    Array.isArray(retrievedMulti.routines),
    "[Issue #459 AC-4] Multi-routine habit preserves routines as array"
  );
  assertEqual(
    JSON.stringify(retrievedMulti.routines),
    JSON.stringify(["morning", "evening"]),
    "[Issue #459 AC-4] Multi-routine habit retains both morning and evening routines"
  );
  assertEqual(
    retrievedMulti.routine,
    "morning",
    "[Issue #459 AC-4] Primary routine field synced to routines[0] for backward compatibility"
  );

  const retrievedLegacy = testStore.getHabit("h-legacy-afternoon");
  assert(
    Array.isArray(retrievedLegacy.routines),
    "[Issue #459 AC-4] Legacy habit silently migrated to have routines array"
  );
  assertEqual(
    JSON.stringify(retrievedLegacy.routines),
    JSON.stringify(["afternoon"]),
    "[Issue #459 AC-4] Migrated legacy habit has routines = ['afternoon']"
  );

  // 3. Update habit routines via store
  await testStore.updateHabit("h-legacy-afternoon", {
    routines: ["morning", "afternoon", "evening"],
  });
  const updatedHabit459 = testStore.getHabit("h-legacy-afternoon");
  assertEqual(
    JSON.stringify(updatedHabit459.routines),
    JSON.stringify(["morning", "afternoon", "evening"]),
    "[Issue #459 AC-4] Updating routines via store.updateHabit persists new routines"
  );
  assertEqual(
    updatedHabit459.routine,
    "morning",
    "[Issue #459 AC-4] Primary routine field updated to first entry of new routines"
  );

  // ==========================================
  // [Issue #475] Starter Kits & Domain Seeding
  // ==========================================
  console.log("--- [Issue #475] Starter Kits & Domain Seeding ---");

  const starterStorage = createMockStorage();
  const starterStore = new HabitStore({
    storage: storageModule.createStorageAdapter({
      fallbackStorage: starterStorage,
      forceFallback: true,
    }),
  });
  await starterStore.init();

  const createdMorning = await starterStore.applyStarterKit(
    "morning_mastery",
    "vi"
  );
  assert(
    Array.isArray(createdMorning) && createdMorning.length === 4,
    "[Issue #475 AC-3] Morning Mastery starter kit created 4 habits"
  );
  assertEqual(
    createdMorning[0].domain,
    "health",
    "[Issue #475 AC-3] First habit has health domain"
  );
  assert(
    starterStore.getHabits().length >= 4,
    "[Issue #475 AC-3] Store contains created starter habits"
  );
}

runStorageTests()
  .then(() => {
    printSummary();
  })
  .catch((err) => {
    console.error("❌ Exception during Storage & Persistence test:", err);
    process.exit(1);
  });
