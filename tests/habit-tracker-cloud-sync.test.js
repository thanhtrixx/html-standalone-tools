#!/usr/bin/env node

/**
 * Atomic Habit Tracker Cloud Sync & Encrypted Backup Test Suite
 *
 * Domain: AI & Cloud State Backup
 * Covers:
 * - [AC-5] Client-Side WebCrypto AES-GCM Encrypted Payloads (Gist / Google Drive)
 * - [AC-5] Key Derivation via PBKDF2 with Cryptographic Salt and IV
 * - [AC-5] Payload Integrity & Validation
 * - [ADR-0015 Slice 1] Deterministic 3-Way Merge Engine
 * - [ADR-0015 Slice 1] Deletion Tombstones & TTL Pruning
 * - [ADR-0015 Slice 1] Additive Daily Log Unions & Maximum Progress Preservation
 * - [ADR-0015 Slice 1] LWW Entity Timestamps & Setting Reconciliation
 */

const { createAssertions } = require("./helpers/habit-tracker-harness.js");

const { assert, assertEqual, printSummary } = createAssertions(
  "Atomic Habit Tracker Cloud Sync & Encrypted Backup Test Suite"
);

console.log("\n🧪 Running Atomic Habit Tracker Cloud Sync Test Suite...\n");

async function runCloudSyncTests() {
  const {
    encryptPayload,
    decryptPayload,
    createGistBackupPayload,
    createDriveBackupPayload,
    validateCloudBackupPayload,
  } = require("../habit-tracker/src/sync/cloud-backup.js");

  const tombstones = require("../habit-tracker/src/sync/tombstones.js");
  const merge3 = require("../habit-tracker/src/sync/merge3.js");

  const sampleState = {
    habits: [
      {
        id: "h1",
        name: "Cold Shower",
        type: "binary",
        targetValue: 1,
        routine: "morning",
      },
    ],
    logs: [
      {
        id: "h1_2026-09-12",
        habitId: "h1",
        date: "2026-09-12",
        value: 1,
        completed: true,
      },
    ],
    settings: { theme: "dark", freezeTokens: 2 },
  };

  const passphrase = "secure-habit-vault-key-2026";

  // 1. Encryption
  const encrypted = await encryptPayload(sampleState, passphrase);
  assert(encrypted.ciphertext, "[AC-5] Ciphertext generated");
  assert(encrypted.salt, "[AC-5] Cryptographic salt included in payload");
  assert(encrypted.iv, "[AC-5] Initialization vector (IV) included in payload");
  assertEqual(
    encrypted.algorithm,
    "AES-GCM-256",
    "[AC-5] Uses AES-GCM-256 encryption standard"
  );

  // 2. Decryption with correct password
  const decrypted = await decryptPayload(encrypted, passphrase);
  assertEqual(
    decrypted.habits[0].name,
    "Cold Shower",
    "[AC-5] Decrypted payload restores habit state faithfully"
  );
  assertEqual(
    decrypted.settings.theme,
    "dark",
    "[AC-5] Decrypted settings match original"
  );

  // 3. Decryption with wrong password fails safely
  let decryptFailed = false;
  try {
    await decryptPayload(encrypted, "wrong-password-123");
  } catch (e) {
    decryptFailed = true;
  }
  assert(
    decryptFailed,
    "[AC-5] Decryption with incorrect password throws error safely"
  );

  // 4. GitHub Gist payload formatting
  const gistPayload = createGistBackupPayload(
    encrypted,
    "Atomic Habit Tracker Encrypted Vault"
  );
  assert(
    gistPayload.files["atomic_habit_tracker_backup.json"],
    "[AC-5] Gist payload formats file entry correctly"
  );
  assert(
    gistPayload.description.includes("Atomic Habit"),
    "[AC-5] Gist description contains identifier"
  );

  // 5. Google Drive AppData payload formatting
  const drivePayload = createDriveBackupPayload(encrypted);
  assertEqual(
    drivePayload.name,
    "atomic_habit_tracker_backup.enc.json",
    "[AC-5] Drive payload sets standardized filename"
  );
  assertEqual(
    drivePayload.mimeType,
    "application/json",
    "[AC-5] Drive payload sets application/json mimeType"
  );

  // 6. Validation
  const validGist = validateCloudBackupPayload(
    gistPayload.files["atomic_habit_tracker_backup.json"].content
  );
  assertEqual(
    validGist.valid,
    true,
    "[AC-5] Gist serialized backup payload passes validation"
  );

  const invalidBackup = validateCloudBackupPayload(
    JSON.stringify({ bad: "data" })
  );
  assertEqual(
    invalidBackup.valid,
    false,
    "[AC-5] Tampered/invalid backup payload is rejected"
  );

  // ==========================================
  // [ADR-0015 Slice 1] Deletion Tombstones Tests
  // ==========================================
  console.log(
    "--- [ADR-0015 Slice 1] Deletion Tombstones & Entity Touching ---"
  );

  const deletedDict = { habits: {}, vacations: {} };
  tombstones.recordDeletedHabit("habit-deleted-1", deletedDict);
  assert(
    deletedDict.habits["habit-deleted-1"],
    "[ADR-0015] Tombstone recorded for deleted habit"
  );

  tombstones.recordDeletedVacation("vac-deleted-1", deletedDict);
  assert(
    deletedDict.vacations["vac-deleted-1"],
    "[ADR-0015] Tombstone recorded for deleted vacation"
  );

  // Reviving habit deletes tombstone
  const revivedHabit = { id: "habit-deleted-1", name: "Revived Habit" };
  tombstones.touchEntity(revivedHabit, deletedDict);
  assert(
    !deletedDict.habits["habit-deleted-1"],
    "[ADR-0015] Touching entity clears tombstone"
  );
  assert(
    revivedHabit.updatedAt,
    "[ADR-0015] Touching entity sets updatedAt timestamp"
  );

  // Tombstone TTL pruning
  const oldTs = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();
  deletedDict.habits["ancient-habit"] = oldTs;
  tombstones.pruneDeletedTombstones(deletedDict);
  assert(
    !deletedDict.habits["ancient-habit"],
    "[ADR-0015] Prunes tombstones older than 30 days"
  );

  // ==========================================
  // [ADR-0015 Slice 1] Deterministic 3-Way Merge Tests
  // ==========================================
  console.log("--- [ADR-0015 Slice 1] Deterministic 3-Way Merge Engine ---");

  // Scenario 1: LWW on Habit Metadata (Remote is newer)
  const localState1 = {
    habits: [
      {
        id: "h-meditate",
        name: "Meditate 10m",
        updatedAt: "2026-09-17T10:00:00.000Z",
      },
    ],
    logs: {},
    settings: { theme: "dark" },
  };

  const remoteState1 = {
    habits: [
      {
        id: "h-meditate",
        name: "Meditate 15m (Updated Remote)",
        updatedAt: "2026-09-17T12:00:00.000Z",
      },
    ],
    logs: {},
    settings: { theme: "light" },
  };

  const merged1 = merge3.mergeStates(localState1, remoteState1);
  assertEqual(
    merged1.habits[0].name,
    "Meditate 15m (Updated Remote)",
    "[ADR-0015] Remote habit wins when remote updatedAt is newer"
  );

  // Scenario 2: Deletion Tombstone prevents zombie resurrection
  const localState2 = {
    habits: [],
    logs: {},
    settings: {},
    _deleted: {
      habits: { "h-deleted": "2026-09-17T14:00:00.000Z" },
      vacations: {},
    },
  };

  const remoteState2 = {
    habits: [
      {
        id: "h-deleted",
        name: "Deleted Habit on Local",
        updatedAt: "2026-09-17T10:00:00.000Z",
      },
    ],
    logs: {},
    settings: {},
    _deleted: { habits: {}, vacations: {} },
  };

  const merged2 = merge3.mergeStates(localState2, remoteState2);
  assertEqual(
    merged2.habits.length,
    0,
    "[ADR-0015] Deleted habit with newer tombstone is not resurrected from remote"
  );
  assert(
    merged2._deleted.habits["h-deleted"],
    "[ADR-0015] Merged state preserves deletion tombstones"
  );

  // Scenario 3: Additive Daily Log Unions across distinct dates
  const localState3 = {
    habits: [{ id: "h-run", name: "Running" }],
    logs: {
      "h-run_2026-09-15": {
        habitId: "h-run",
        date: "2026-09-15",
        value: 5,
        completed: true,
      },
    },
    settings: {},
  };

  const remoteState3 = {
    habits: [{ id: "h-run", name: "Running" }],
    logs: {
      "h-run_2026-09-16": {
        habitId: "h-run",
        date: "2026-09-16",
        value: 8,
        completed: true,
      },
    },
    settings: {},
  };

  const merged3 = merge3.mergeStates(localState3, remoteState3);
  assert(
    merged3.logs["h-run_2026-09-15"],
    "[ADR-0015] Merged logs retain local date 2026-09-15"
  );
  assert(
    merged3.logs["h-run_2026-09-16"],
    "[ADR-0015] Merged logs retain remote date 2026-09-16"
  );
  assertEqual(
    merged3.logs["h-run_2026-09-15"].value,
    5,
    "[ADR-0015] Local log value preserved"
  );
  assertEqual(
    merged3.logs["h-run_2026-09-16"].value,
    8,
    "[ADR-0015] Remote log value preserved"
  );

  // Scenario 4: Same-day log collision takes maximum progress and latest notes
  const localState4 = {
    habits: [{ id: "h-timer", name: "Coding Timer" }],
    logs: {
      "h-timer_2026-09-17": {
        habitId: "h-timer",
        date: "2026-09-17",
        value: 1200, // 20m
        completed: true,
        notes: "Morning focus session",
        timestamp: 1726567200000,
      },
    },
    settings: {},
  };

  const remoteState4 = {
    habits: [{ id: "h-timer", name: "Coding Timer" }],
    logs: {
      "h-timer_2026-09-17": {
        habitId: "h-timer",
        date: "2026-09-17",
        value: 1800, // 30m
        completed: true,
        notes: "Afternoon overtime session",
        timestamp: 1726588800000,
      },
    },
    settings: {},
  };

  const merged4 = merge3.mergeStates(localState4, remoteState4);
  assertEqual(
    merged4.logs["h-timer_2026-09-17"].value,
    1800,
    "[ADR-0015] Same-day log collision preserves maximum logged progress"
  );
  assertEqual(
    merged4.logs["h-timer_2026-09-17"].notes,
    "Afternoon overtime session",
    "[ADR-0015] Same-day log collision selects notes from more recent timestamp"
  );

  // Scenario 5: Cloud Payload Formatting
  const cloudPayload = merge3.createCloudPayload(merged4);
  assertEqual(
    cloudPayload.app,
    "atomic-habit-tracker",
    "[ADR-0015] Cloud payload sets app identifier"
  );
  assertEqual(
    cloudPayload.schemaVersion,
    "1.1.0",
    "[ADR-0015] Cloud payload sets schemaVersion 1.1.0"
  );
  assert(
    cloudPayload.data.habits.length > 0,
    "[ADR-0015] Cloud payload contains normalized habits array"
  );
  assert(
    cloudPayload.data.logs.length > 0,
    "[ADR-0015] Cloud payload contains normalized logs array"
  );
  assert(
    cloudPayload.data._deleted,
    "[ADR-0015] Cloud payload includes _deleted tombstones"
  );
}

runCloudSyncTests()
  .then(() => {
    printSummary();
  })
  .catch((err) => {
    console.error("❌ Exception during Cloud Sync test:", err);
    process.exit(1);
  });
