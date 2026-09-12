/**
 * Atomic Habit Tracker Encrypted Cloud Backup
 *
 * Implements:
 * - Client-side AES-GCM-256 encryption with PBKDF2 key derivation (100,000 iterations, SHA-256)
 * - GitHub Gist & Google Drive AppData payload formatting
 * - Zero-knowledge cloud persistence: Cloud provider receives only encrypted ciphertext
 */

(function (global) {
  "use strict";

  const BACKUP_IDENTIFIER = "atomic-habit-tracker-encrypted-backup";
  const BACKUP_VERSION = "1.0.0";
  const DEFAULT_FILENAME = "atomic_habit_tracker_backup.json";

  /**
   * Helper to convert ArrayBuffer to Base64
   */
  function bufferToBase64(buf) {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(buf).toString("base64");
    }
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper to convert Base64 to Uint8Array
   */
  function base64ToBuffer(b64) {
    if (typeof Buffer !== "undefined") {
      return new Uint8Array(Buffer.from(b64, "base64"));
    }
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Get WebCrypto instance
   */
  function getSubtleCrypto() {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      return crypto.subtle;
    }
    if (typeof require !== "undefined") {
      try {
        const nodeCrypto = require("crypto");
        if (nodeCrypto.webcrypto && nodeCrypto.webcrypto.subtle) {
          return nodeCrypto.webcrypto.subtle;
        }
      } catch (e) {}
    }
    throw new Error("WebCrypto API is not available in this environment");
  }

  function getRandomBytes(length) {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint8Array(length));
    }
    if (typeof require !== "undefined") {
      const nodeCrypto = require("crypto");
      return nodeCrypto.randomBytes(length);
    }
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  }

  /**
   * Derives an AES-GCM Key from a user passphrase and salt via PBKDF2
   */
  async function deriveKey(passphrase, salt) {
    const subtle = getSubtleCrypto();
    const enc = new TextEncoder();
    const passphraseKey = await subtle.importKey(
      "raw",
      enc.encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      passphraseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Encrypts plain JS state object with user passphrase
   */
  async function encryptPayload(dataObject, passphrase) {
    const subtle = getSubtleCrypto();
    const salt = getRandomBytes(16);
    const iv = getRandomBytes(12);

    const key = await deriveKey(passphrase, salt);
    const enc = new TextEncoder();
    const plainBytes = enc.encode(JSON.stringify(dataObject));

    const cipherBuffer = await subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      plainBytes
    );

    return {
      app: BACKUP_IDENTIFIER,
      version: BACKUP_VERSION,
      algorithm: "AES-GCM-256",
      kdf: "PBKDF2-SHA256",
      iterations: 100000,
      salt: bufferToBase64(salt),
      iv: bufferToBase64(iv),
      ciphertext: bufferToBase64(cipherBuffer),
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Decrypts encrypted payload envelope with user passphrase
   */
  async function decryptPayload(encryptedEnvelope, passphrase) {
    if (!encryptedEnvelope || typeof encryptedEnvelope !== "object") {
      throw new Error("Invalid encrypted payload envelope");
    }

    const subtle = getSubtleCrypto();
    const salt = base64ToBuffer(encryptedEnvelope.salt);
    const iv = base64ToBuffer(encryptedEnvelope.iv);
    const cipherBytes = base64ToBuffer(encryptedEnvelope.ciphertext);

    const key = await deriveKey(passphrase, salt);

    const decryptedBuffer = await subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      cipherBytes
    );

    const dec = new TextDecoder();
    const plainText = dec.decode(decryptedBuffer);
    return JSON.parse(plainText);
  }

  /**
   * Formats backup for GitHub Gist API
   */
  function createGistBackupPayload(
    encryptedEnvelope,
    description = "Atomic Habit Tracker Encrypted Vault"
  ) {
    const jsonStr = JSON.stringify(encryptedEnvelope, null, 2);
    return {
      description,
      public: false,
      files: {
        [DEFAULT_FILENAME]: {
          content: jsonStr,
        },
      },
    };
  }

  /**
   * Formats backup for Google Drive AppData multipart upload
   */
  function createDriveBackupPayload(
    encryptedEnvelope,
    filename = "atomic_habit_tracker_backup.enc.json"
  ) {
    return {
      name: filename,
      mimeType: "application/json",
      content: JSON.stringify(encryptedEnvelope),
    };
  }

  /**
   * Validates serialized cloud backup payload
   */
  function validateCloudBackupPayload(rawText) {
    try {
      const parsed =
        typeof rawText === "string" ? JSON.parse(rawText) : rawText;
      if (
        parsed &&
        parsed.app === BACKUP_IDENTIFIER &&
        parsed.ciphertext &&
        parsed.salt &&
        parsed.iv
      ) {
        return { valid: true, payload: parsed };
      }
      return { valid: false, error: "Missing required encryption fields" };
    } catch (e) {
      return { valid: false, error: "Failed to parse JSON" };
    }
  }

  const cloudExports = {
    BACKUP_IDENTIFIER,
    BACKUP_VERSION,
    encryptPayload,
    decryptPayload,
    createGistBackupPayload,
    createDriveBackupPayload,
    validateCloudBackupPayload,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = cloudExports;
  } else {
    global.HabitCloud = cloudExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
