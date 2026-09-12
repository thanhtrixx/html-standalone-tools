#!/usr/bin/env node

/**
 * Atomic Habit Tracker Cloud Sync & Encrypted Backup Test Suite
 *
 * Domain: AI & Cloud State Backup
 * Covers:
 * - [AC-5] Client-Side WebCrypto AES-GCM Encrypted Payloads (Gist / Google Drive)
 * - [AC-5] Key Derivation via PBKDF2 with Cryptographic Salt and IV
 * - [AC-5] Payload Integrity & Validation
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
}

runCloudSyncTests()
  .then(() => {
    printSummary();
  })
  .catch((err) => {
    console.error("❌ Exception during Cloud Sync test:", err);
    process.exit(1);
  });
