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
 */

const {
  createMockStorage,
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
  const {
    exportToJson,
    validateImportJson,
    importFromJson,
  } = require("../habit-tracker/src/sync/export-import.js");

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
}

runStorageTests()
  .then(() => {
    printSummary();
  })
  .catch((err) => {
    console.error("❌ Exception during Storage & Persistence test:", err);
    process.exit(1);
  });
