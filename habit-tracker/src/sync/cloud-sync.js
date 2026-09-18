/**
 * Atomic Habit Tracker Dual-Provider Cloud Synchronization Hub
 *
 * Implements:
 * - GitHub Gist API connector (PAT validation, private gist creation/sync, rate-limiting backoff)
 * - Google Drive AppData connector (OAuth 2.0 Client ID, appDataFolder multipart upload/download)
 * - Calm debounced auto-synchronization on mutations
 * - Pre-sync local snapshots for 1-click rollback
 * - Deterministic merge integration via HabitMerge3
 */

(function (global) {
  "use strict";

  const GIST_API_BASE = "https://api.github.com";
  const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
  const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";

  const DEFAULT_GIST_FILENAME = "atomic_habit_tracker_backup.json";
  const DEFAULT_DRIVE_FILENAME = "atomic_habit_tracker_backup.json";
  const DEFAULT_GIST_DESCRIPTION =
    "Atomic Habit & Routine Tracker Encrypted Vault";

  /**
   * Deterministic 32-bit FNV-1a state checksum / hash engine
   */
  function computeStateHash(payloadOrState) {
    if (!payloadOrState) return "00000000";
    let target = payloadOrState;
    if (target.data) target = target.data;
    if (target.state) target = target.state;

    // Normalize habits
    const rawHabits = Array.isArray(target.habits)
      ? target.habits
      : target.habits && typeof target.habits === "object"
        ? Object.values(target.habits)
        : [];
    const normalizedHabits = [...rawHabits]
      .filter(Boolean)
      .sort((a, b) => String(a.id || "").localeCompare(String(b.id || "")))
      .map((h) => ({
        id: h.id,
        name: h.name,
        type: h.type,
        targetValue: h.targetValue,
        unit: h.unit,
        step: h.step,
        routines: h.routines || (h.routine ? [h.routine] : []),
        domain: h.domain,
        scheduleType: h.scheduleType,
        scheduleDays: h.scheduleDays,
        intervalDays: h.intervalDays,
        color: h.color,
        icon: h.icon,
        archived: Boolean(h.archived),
        order: h.order ?? 0,
        updatedAt: h.updatedAt || "",
      }));

    // Normalize logs
    const rawLogs = Array.isArray(target.logs)
      ? target.logs
      : target.logs && typeof target.logs === "object"
        ? Object.values(target.logs)
        : [];
    const normalizedLogs = [...rawLogs]
      .filter(Boolean)
      .sort((a, b) => {
        const keyA = a.id || `${a.habitId}_${a.date}`;
        const keyB = b.id || `${b.habitId}_${b.date}`;
        return keyA.localeCompare(keyB);
      })
      .map((l) => ({
        id: l.id || `${l.habitId}_${l.date}`,
        habitId: l.habitId,
        date: l.date,
        value: Number(l.value) || 0,
        completed: Boolean(l.completed),
        notes: l.notes || "",
        updatedAt: l.updatedAt || "",
      }));

    // Normalize settings
    const rawSettings = target.settings || {};
    const sortedSettings = {};
    Object.keys(rawSettings)
      .sort()
      .forEach((k) => {
        sortedSettings[k] = rawSettings[k];
      });

    // Normalize vacations
    const rawVacations = Array.isArray(target.vacations)
      ? target.vacations
      : Array.isArray(target.vacationRanges)
        ? target.vacationRanges
        : [];
    const normalizedVacations = [...rawVacations]
      .filter(Boolean)
      .sort((a, b) => String(a.id || "").localeCompare(String(b.id || "")));

    // Normalize tombstones
    const deleted = target._deleted || { habits: {}, vacations: {} };

    const canonicalString = JSON.stringify({
      habits: normalizedHabits,
      logs: normalizedLogs,
      settings: sortedSettings,
      vacations: normalizedVacations,
      deleted,
    });

    // FNV-1a 32-bit hash
    let hash = 0x811c9dc5;
    for (let i = 0; i < canonicalString.length; i++) {
      hash ^= canonicalString.charCodeAt(i);
      hash +=
        (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  /**
   * Extracts a 32-character hexadecimal Gist ID from a raw string or full GitHub Gist URL
   */
  function extractGistId(input) {
    if (!input || typeof input !== "string") return "";
    const trimmed = input.trim();
    const match = trimmed.match(/([a-f0-9]{32})/i);
    return match ? match[1].toLowerCase() : trimmed;
  }

  /**
   * GitHub Gist API Connector
   */
  const GitHubGistAPI = {
    async validateToken(token) {
      if (!token || typeof token !== "string")
        return { valid: false, error: "Empty token" };
      try {
        const res = await fetch(`${GIST_API_BASE}/user`, {
          headers: {
            Authorization: `token ${token.trim()}`,
            Accept: "application/vnd.github.v3+json",
          },
        });
        if (res.status === 200) {
          const user = await res.json();
          return {
            valid: true,
            user: user.login || user.name || "GitHub User",
          };
        }
        return {
          valid: false,
          status: res.status,
          error: `GitHub API error: ${res.statusText}`,
        };
      } catch (e) {
        return { valid: false, error: e.message || "Network request failed" };
      }
    },

    async getGist(token, gistId) {
      const cleanId = extractGistId(gistId);
      if (!cleanId) throw new Error("Invalid Gist ID");

      const res = await fetch(`${GIST_API_BASE}/gists/${cleanId}`, {
        headers: {
          Authorization: `token ${token.trim()}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!res.ok) {
        throw new Error(
          `Failed to fetch Gist (${res.status}): ${res.statusText}`
        );
      }

      const gist = await res.json();
      const file =
        gist.files &&
        (gist.files[DEFAULT_GIST_FILENAME] || Object.values(gist.files)[0]);
      if (!file || !file.content) {
        throw new Error("Gist contains no valid file content");
      }

      let parsedContent;
      try {
        parsedContent = JSON.parse(file.content);
      } catch (e) {
        parsedContent = file.content;
      }

      return {
        gistId: cleanId,
        updatedAt: gist.updated_at,
        content: parsedContent,
        raw: gist,
      };
    },

    async createGist(
      token,
      payload,
      description = DEFAULT_GIST_DESCRIPTION,
      filename = DEFAULT_GIST_FILENAME
    ) {
      const contentStr =
        typeof payload === "string"
          ? payload
          : JSON.stringify(payload, null, 2);
      const res = await fetch(`${GIST_API_BASE}/gists`, {
        method: "POST",
        headers: {
          Authorization: `token ${token.trim()}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          public: false,
          files: {
            [filename]: {
              content: contentStr,
            },
          },
        }),
      });

      if (!res.ok) {
        throw new Error(
          `Failed to create Gist (${res.status}): ${res.statusText}`
        );
      }

      const gist = await res.json();
      return {
        gistId: gist.id,
        url: gist.html_url,
        updatedAt: gist.updated_at,
      };
    },

    async updateGist(
      token,
      gistId,
      payload,
      description = DEFAULT_GIST_DESCRIPTION,
      filename = DEFAULT_GIST_FILENAME
    ) {
      const cleanId = extractGistId(gistId);
      if (!cleanId) throw new Error("Invalid Gist ID");

      const contentStr =
        typeof payload === "string"
          ? payload
          : JSON.stringify(payload, null, 2);
      const res = await fetch(`${GIST_API_BASE}/gists/${cleanId}`, {
        method: "PATCH",
        headers: {
          Authorization: `token ${token.trim()}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          files: {
            [filename]: {
              content: contentStr,
            },
          },
        }),
      });

      if (!res.ok) {
        throw new Error(
          `Failed to update Gist (${res.status}): ${res.statusText}`
        );
      }

      const gist = await res.json();
      return {
        gistId: gist.id,
        updatedAt: gist.updated_at,
      };
    },

    async findOrCreateGist(token, payload, customGistId = null) {
      if (customGistId) {
        const cleanId = extractGistId(customGistId);
        try {
          const existing = await this.getGist(token, cleanId);
          return { gistId: cleanId, exists: true, data: existing.content };
        } catch (e) {
          // If not found or invalid, we will create a new gist
        }
      }

      const created = await this.createGist(token, payload);
      return { gistId: created.gistId, exists: false, data: null };
    },
  };

  /**
   * Google Drive AppData API Connector
   */
  const GoogleDriveAPI = {
    async findAppDataFile(accessToken, filename = DEFAULT_DRIVE_FILENAME) {
      const query = encodeURIComponent(
        `name = '${filename}' and trashed = false`
      );
      const url = `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime)`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(
          `Drive search failed (${res.status}): ${res.statusText}`
        );
      }

      const data = await res.json();
      return (data.files && data.files[0]) || null;
    },

    async getAppDataFile(accessToken, fileId) {
      const url = `${DRIVE_API_BASE}/files/${fileId}?alt=media`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Drive read failed (${res.status}): ${res.statusText}`);
      }

      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return text;
      }
    },

    async createAppDataFile(
      accessToken,
      payload,
      filename = DEFAULT_DRIVE_FILENAME
    ) {
      const contentStr =
        typeof payload === "string" ? payload : JSON.stringify(payload);
      const boundary = "-------314159265358979323846";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const metadata = {
        name: filename,
        parents: ["appDataFolder"],
      };

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        contentStr +
        closeDelim;

      const res = await fetch(
        `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!res.ok) {
        throw new Error(
          `Drive create failed (${res.status}): ${res.statusText}`
        );
      }

      const file = await res.json();
      return { fileId: file.id };
    },

    async updateAppDataFile(accessToken, fileId, payload) {
      const contentStr =
        typeof payload === "string" ? payload : JSON.stringify(payload);
      const res = await fetch(
        `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: contentStr,
        }
      );

      if (!res.ok) {
        throw new Error(
          `Drive update failed (${res.status}): ${res.statusText}`
        );
      }

      const file = await res.json();
      return { fileId: file.id };
    },

    async findOrCreateAppDataFile(
      accessToken,
      payload,
      filename = DEFAULT_DRIVE_FILENAME
    ) {
      const existing = await this.findAppDataFile(accessToken, filename);
      if (existing && existing.id) {
        const content = await this.getAppDataFile(accessToken, existing.id);
        return { fileId: existing.id, exists: true, data: content };
      }
      const created = await this.createAppDataFile(
        accessToken,
        payload,
        filename
      );
      return { fileId: created.fileId, exists: false, data: null };
    },
  };

  /**
   * Main Cloud Synchronization Manager
   */
  class CloudSyncManager {
    constructor(options = {}) {
      this.store = options.store || null;
      this.storage = options.storage || (this.store && this.store.storage);
      this.merge3 =
        options.merge3 ||
        (typeof require !== "undefined"
          ? require("./merge3.js")
          : global.HabitMerge3);
      this.crypto =
        options.crypto ||
        (typeof require !== "undefined"
          ? require("./cloud-backup.js")
          : global.HabitCloud);

      this.activeProvider = "none"; // 'none' | 'github' | 'googledrive'
      this.githubToken = null;
      this.githubGistId = null;
      this.googleClientId = null;
      this.googleAccessToken = null;

      this.isSyncing = false;
      this.lastSyncTimestamp = null;
      this.lastSyncStatus = "idle"; // 'idle' | 'success' | 'error' | 'syncing'
      this.lastError = null;

      this.autoSyncEnabled = true;
      this.debounceTimer = null;
      this.debounceDelayMs = options.debounceDelayMs || 5000;
      this.timerBatchIntervalMs = options.timerBatchIntervalMs || 5 * 60 * 1000; // 5 minutes default
      this.lastTimerSyncTimestamp = 0;
      this.timerBatchTimer = null;

      // Change-Only Dirty State Tracking
      this.lastSyncedHash = null;
      this.isDirty = false;

      // Adaptive Idle Cadence ("Increase Mechanism": 1m -> 3m -> 5m -> 15m)
      this.idleCadenceSteps = options.idleCadenceSteps || [
        60 * 1000,
        180 * 1000,
        300 * 1000,
        900 * 1000,
      ];
      this.idleStepIndex = 0;
      this.idlePollTimer = null;

      // Exponential Error Backoff (5s -> 15s -> 30s -> 60s -> 5m)
      this.errorBackoffSteps = options.errorBackoffSteps || [
        5 * 1000,
        15 * 1000,
        30 * 1000,
        60 * 1000,
        300 * 1000,
      ];
      this.consecutiveErrorCount = 0;
      this.errorBackoffTimer = null;
      this.nextRetryTimestamp = null;

      // Zero-Knowledge Client-Side Vault Encryption (Ephemeral Session Cache)
      this.encryptionEnabled = options.encryptionEnabled || false;
      this.sessionPassphrase = null;
      this.isVaultLocked = false;

      this.listeners = new Set();
    }

    subscribe(listener) {
      if (typeof listener === "function") {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      }
      return () => {};
    }

    notify(eventType, payload) {
      const status = this.getStatus();
      for (const listener of this.listeners) {
        try {
          listener(status, eventType, payload);
        } catch (e) {
          console.error("[CloudSyncManager] Listener error:", e);
        }
      }
    }

    async init() {
      if (!this.storage) return;

      const settings = (await this.storage.getAllSettings()) || {};
      this.activeProvider = settings.sync_provider || "none";
      this.githubToken = settings.github_sync_token || null;
      this.githubGistId = settings.github_sync_gist_id || null;
      this.googleClientId = settings.google_client_id || null;
      this.autoSyncEnabled = settings.auto_sync_enabled !== false;
      this.lastSyncTimestamp = settings.last_sync_timestamp || null;
      this.encryptionEnabled = settings.encryption_enabled === true;

      if (this.encryptionEnabled && !this.sessionPassphrase) {
        this.isVaultLocked = true;
      }

      this.notify("init", this.getStatus());
      return this.getStatus();
    }

    getStatus() {
      const isOnline =
        typeof navigator !== "undefined" ? navigator.onLine !== false : true;
      let badge = "offline";

      if (!isOnline) {
        badge = "offline";
      } else if (this.isSyncing) {
        badge = "syncing";
      } else if (this.isVaultLocked) {
        badge = "locked";
      } else if (this.lastError) {
        badge = "error";
      } else if (
        this.activeProvider !== "none" &&
        (this.githubToken || this.googleAccessToken)
      ) {
        badge = "connected";
      } else {
        badge = "offline";
      }

      return {
        provider: this.activeProvider,
        connected:
          this.activeProvider !== "none" &&
          (Boolean(this.githubToken) || Boolean(this.googleAccessToken)),
        syncing: this.isSyncing,
        lastSync: this.lastSyncTimestamp,
        lastStatus: this.lastSyncStatus,
        error: this.lastError,
        statusBadge: badge,
        autoSync: this.autoSyncEnabled,
        githubGistId: this.githubGistId,
        encryptionEnabled: this.encryptionEnabled,
        isVaultUnlocked: Boolean(this.sessionPassphrase),
        isVaultLocked: this.isVaultLocked,
        isDirty: this.isDirty,
        idleStepIndex: this.idleStepIndex,
        consecutiveErrors: this.consecutiveErrorCount,
        nextRetryTimestamp: this.nextRetryTimestamp,
      };
    }

    setSessionPassphrase(passphrase) {
      this.sessionPassphrase = passphrase ? String(passphrase).trim() : null;
      this.isVaultLocked = false;
      this.notify("vault_unlocked", this.getStatus());
    }

    clearSessionPassphrase() {
      this.sessionPassphrase = null;
      this.isVaultLocked = this.encryptionEnabled;
      this.notify("vault_locked", this.getStatus());
    }

    async setEncryptionEnabled(enabled, passphrase = null) {
      this.encryptionEnabled = Boolean(enabled);
      if (passphrase) {
        this.setSessionPassphrase(passphrase);
      } else if (!this.encryptionEnabled) {
        this.clearSessionPassphrase();
      }
      if (this.storage) {
        await this.storage.putSetting(
          "encryption_enabled",
          this.encryptionEnabled
        );
      }
      this.notify("config_changed", this.getStatus());
    }

    async setGitHubConfig(token, gistId = null) {
      this.activeProvider = "github";
      this.githubToken = token ? token.trim() : null;
      this.githubGistId = gistId ? extractGistId(gistId) : null;

      if (this.storage) {
        await this.storage.putSetting("sync_provider", "github");
        await this.storage.putSetting("github_sync_token", this.githubToken);
        if (this.githubGistId) {
          await this.storage.putSetting(
            "github_sync_gist_id",
            this.githubGistId
          );
        }
      }
      this.notify("config_changed", this.getStatus());
    }

    async setGoogleDriveConfig(clientId, accessToken = null) {
      this.activeProvider = "googledrive";
      this.googleClientId = clientId ? clientId.trim() : null;
      this.googleAccessToken = accessToken;

      if (this.storage) {
        await this.storage.putSetting("sync_provider", "googledrive");
        if (this.googleClientId) {
          await this.storage.putSetting(
            "google_client_id",
            this.googleClientId
          );
        }
      }
      this.notify("config_changed", this.getStatus());
    }

    async disconnect() {
      this.activeProvider = "none";
      this.githubToken = null;
      this.githubGistId = null;
      this.googleAccessToken = null;
      this.lastError = null;

      if (this.storage) {
        await this.storage.putSetting("sync_provider", "none");
        await this.storage.putSetting("github_sync_token", null);
        await this.storage.putSetting("github_sync_gist_id", null);
      }
      this.notify("disconnected", this.getStatus());
    }

    markDirty() {
      this.isDirty = true;
    }

    getCurrentIdleDelay() {
      const idx = Math.min(
        this.idleStepIndex,
        this.idleCadenceSteps.length - 1
      );
      return this.idleCadenceSteps[idx] || 900000;
    }

    advanceIdleCadence() {
      if (this.idleStepIndex < this.idleCadenceSteps.length - 1) {
        this.idleStepIndex++;
      }
    }

    resetIdleCadence() {
      this.idleStepIndex = 0;
      if (this.idlePollTimer) {
        clearTimeout(this.idlePollTimer);
        this.idlePollTimer = null;
      }
      if (this.autoSyncEnabled && this.activeProvider !== "none") {
        this.scheduleNextIdlePoll();
      }
    }

    scheduleNextIdlePoll() {
      if (!this.autoSyncEnabled || this.activeProvider === "none") return;
      if (this.idlePollTimer) {
        clearTimeout(this.idlePollTimer);
      }
      const delay = this.getCurrentIdleDelay();
      this.idlePollTimer = setTimeout(() => {
        this.idlePollTimer = null;
        this.advanceIdleCadence();
        this.sync().finally(() => {
          this.scheduleNextIdlePoll();
        });
      }, delay);
    }

    stopIdlePolling() {
      if (this.idlePollTimer) {
        clearTimeout(this.idlePollTimer);
        this.idlePollTimer = null;
      }
    }

    getCurrentErrorBackoffDelay() {
      const idx = Math.min(
        this.consecutiveErrorCount,
        this.errorBackoffSteps.length - 1
      );
      return this.errorBackoffSteps[idx] || 300000;
    }

    recordSyncError(err) {
      this.consecutiveErrorCount++;
      this.lastError = (err && err.message) || String(err) || "Sync error";
      this.lastSyncStatus =
        this.lastError === "ENCRYPTED_VAULT_LOCKED"
          ? "locked"
          : this.lastError === "INVALID_VAULT_PASSPHRASE"
            ? "invalid_passphrase"
            : "error";
      const delay = this.getCurrentErrorBackoffDelay();
      this.nextRetryTimestamp = Date.now() + delay;
      this.notify("sync_error", {
        success: false,
        error: this.lastError,
        nextRetryInMs: delay,
        consecutiveErrors: this.consecutiveErrorCount,
      });
    }

    recordSyncSuccess() {
      this.consecutiveErrorCount = 0;
      this.lastError = null;
      this.lastSyncStatus = "success";
      this.nextRetryTimestamp = null;
    }

    scheduleDebouncedSync(options = {}) {
      if (!this.autoSyncEnabled || this.activeProvider === "none") return;

      this.markDirty();
      const isTimerTick = Boolean(options && options.isTimerTick);
      const isBoundary = Boolean(options && options.boundary);

      if (isTimerTick && !isBoundary) {
        const now = Date.now();
        if (this.lastTimerSyncTimestamp === 0) {
          this.lastTimerSyncTimestamp = now;
        }
        const elapsed = now - this.lastTimerSyncTimestamp;

        if (elapsed < this.timerBatchIntervalMs) {
          if (!this.timerBatchTimer) {
            const remaining = Math.max(0, this.timerBatchIntervalMs - elapsed);
            this.timerBatchTimer = setTimeout(() => {
              this.timerBatchTimer = null;
              this.lastTimerSyncTimestamp = Date.now();
              this.sync().catch((err) => {
                console.warn(
                  "[CloudSyncManager] Timer batch sync failed:",
                  err
                );
              });
            }, remaining);
          }
          return;
        }

        // Interval elapsed: reset batch timer and schedule immediate debounced sync
        if (this.timerBatchTimer) {
          clearTimeout(this.timerBatchTimer);
          this.timerBatchTimer = null;
        }
        this.lastTimerSyncTimestamp = now;
      } else {
        // Standard mutation or timer boundary transition
        if (this.timerBatchTimer) {
          clearTimeout(this.timerBatchTimer);
          this.timerBatchTimer = null;
        }
        this.lastTimerSyncTimestamp = Date.now();
      }

      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.sync().catch((err) => {
          console.warn("[CloudSyncManager] Debounced sync failed:", err);
        });
      }, this.debounceDelayMs);
    }

    cancelDebouncedSync() {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      if (this.timerBatchTimer) {
        clearTimeout(this.timerBatchTimer);
        this.timerBatchTimer = null;
      }
    }

    async sync(passphrase = null) {
      if (this.isSyncing)
        return { success: false, error: "Sync already in progress" };
      if (this.activeProvider === "none")
        return { success: false, error: "No active cloud sync provider" };

      const effectivePassphrase =
        passphrase !== null && passphrase !== undefined
          ? typeof passphrase === "string"
            ? passphrase.trim()
            : passphrase
          : this.sessionPassphrase;

      this.isSyncing = true;
      this.lastError = null;
      this.lastSyncStatus = "syncing";
      this.notify("sync_started", this.getStatus());

      try {
        // 1. Capture Pre-Sync Local Snapshot for Rollback Safety
        if (this.store && typeof this.store.createSnapshot === "function") {
          try {
            await this.store.createSnapshot("Auto-backup before cloud sync");
          } catch (snapErr) {
            console.warn("[CloudSyncManager] Snapshot failed:", snapErr);
          }
        }

        const currentState = this.store ? this.store.state : null;
        const localHash = computeStateHash(currentState);
        let remotePayload = null;

        // 2. Fetch Remote State
        if (this.activeProvider === "github") {
          if (!this.githubToken)
            throw new Error("GitHub Personal Access Token is required");

          if (this.githubGistId) {
            try {
              const res = await GitHubGistAPI.getGist(
                this.githubToken,
                this.githubGistId
              );
              remotePayload = res.content;
            } catch (fetchErr) {
              // If gist is not found, fallback to creating a new one
              let localCloudPayload =
                this.merge3.createCloudPayload(currentState);
              if (
                (this.encryptionEnabled || effectivePassphrase) &&
                this.crypto
              ) {
                if (!effectivePassphrase) {
                  this.isVaultLocked = true;
                  throw new Error("ENCRYPTED_VAULT_LOCKED");
                }
                localCloudPayload = await this.crypto.encryptPayload(
                  localCloudPayload,
                  effectivePassphrase
                );
              }
              const created = await GitHubGistAPI.createGist(
                this.githubToken,
                localCloudPayload
              );
              this.githubGistId = created.gistId;
              if (this.storage)
                await this.storage.putSetting(
                  "github_sync_gist_id",
                  this.githubGistId
                );
              remotePayload = null;
            }
          } else {
            let localCloudPayload =
              this.merge3.createCloudPayload(currentState);
            if (
              (this.encryptionEnabled || effectivePassphrase) &&
              this.crypto
            ) {
              if (!effectivePassphrase) {
                this.isVaultLocked = true;
                throw new Error("ENCRYPTED_VAULT_LOCKED");
              }
              localCloudPayload = await this.crypto.encryptPayload(
                localCloudPayload,
                effectivePassphrase
              );
            }
            const created = await GitHubGistAPI.createGist(
              this.githubToken,
              localCloudPayload
            );
            this.githubGistId = created.gistId;
            if (this.storage)
              await this.storage.putSetting(
                "github_sync_gist_id",
                this.githubGistId
              );
            remotePayload = null;
          }
        } else if (this.activeProvider === "googledrive") {
          if (!this.googleAccessToken)
            throw new Error("Google Drive Access Token is required");

          let localCloudPayload = this.merge3.createCloudPayload(currentState);
          if ((this.encryptionEnabled || effectivePassphrase) && this.crypto) {
            if (!effectivePassphrase) {
              this.isVaultLocked = true;
              throw new Error("ENCRYPTED_VAULT_LOCKED");
            }
            localCloudPayload = await this.crypto.encryptPayload(
              localCloudPayload,
              effectivePassphrase
            );
          }

          const fileRes = await GoogleDriveAPI.findOrCreateAppDataFile(
            this.googleAccessToken,
            localCloudPayload
          );
          if (fileRes.exists && fileRes.data) {
            remotePayload = fileRes.data;
          }
        }

        // 3. Handle Decryption if Remote Payload is Encrypted
        let remoteState = remotePayload;
        if (
          remotePayload &&
          typeof remotePayload === "object" &&
          remotePayload.ciphertext
        ) {
          this.encryptionEnabled = true;
          if (this.storage) {
            await this.storage.putSetting("encryption_enabled", true);
          }

          if (!effectivePassphrase) {
            this.isVaultLocked = true;
            this.lastSyncStatus = "locked";
            this.notify("vault_locked", this.getStatus());
            throw new Error("ENCRYPTED_VAULT_LOCKED");
          }

          try {
            remoteState = await this.crypto.decryptPayload(
              remotePayload,
              effectivePassphrase
            );
            this.sessionPassphrase = effectivePassphrase;
            this.isVaultLocked = false;
          } catch (decryptErr) {
            this.isVaultLocked = true;
            this.notify("vault_locked", this.getStatus());
            throw new Error("INVALID_VAULT_PASSPHRASE");
          }
        }

        // 4. Dirty State Hashing & No-Op Bypass
        if (remoteState) {
          const remoteHash = computeStateHash(remoteState);
          if (
            localHash === remoteHash &&
            !this.isDirty &&
            this.lastSyncedHash === localHash
          ) {
            this.lastSyncTimestamp = new Date().toISOString();
            this.recordSyncSuccess();
            if (this.storage) {
              await this.storage.putSetting(
                "last_sync_timestamp",
                this.lastSyncTimestamp
              );
            }
            this.notify("sync_completed", {
              success: true,
              noop: true,
              timestamp: this.lastSyncTimestamp,
            });
            return {
              success: true,
              noop: true,
              timestamp: this.lastSyncTimestamp,
              mergedState: currentState,
            };
          }
        }

        // 5. Merge Remote and Local States Deterministically
        let mergedState = currentState;
        if (remoteState && this.merge3) {
          mergedState = this.merge3.mergeCloudState(currentState, remoteState);
          if (this.store && typeof this.store.replaceState === "function") {
            await this.store.replaceState(mergedState);
          }
        }

        // 6. Upload Merged Payload
        const mergedHash = computeStateHash(mergedState);
        let uploadPayload = this.merge3.createCloudPayload(mergedState);
        if ((this.encryptionEnabled || effectivePassphrase) && this.crypto) {
          if (!effectivePassphrase) {
            this.isVaultLocked = true;
            throw new Error("ENCRYPTED_VAULT_LOCKED");
          }
          uploadPayload = await this.crypto.encryptPayload(
            uploadPayload,
            effectivePassphrase
          );
        }

        if (this.activeProvider === "github" && this.githubGistId) {
          await GitHubGistAPI.updateGist(
            this.githubToken,
            this.githubGistId,
            uploadPayload
          );
        } else if (
          this.activeProvider === "googledrive" &&
          this.googleAccessToken
        ) {
          const file = await GoogleDriveAPI.findAppDataFile(
            this.googleAccessToken
          );
          if (file && file.id) {
            await GoogleDriveAPI.updateAppDataFile(
              this.googleAccessToken,
              file.id,
              uploadPayload
            );
          }
        }

        this.lastSyncTimestamp = new Date().toISOString();
        this.lastSyncedHash = mergedHash;
        this.isDirty = false;
        this.recordSyncSuccess();

        if (this.storage) {
          await this.storage.putSetting(
            "last_sync_timestamp",
            this.lastSyncTimestamp
          );
        }

        this.notify("sync_completed", {
          success: true,
          timestamp: this.lastSyncTimestamp,
        });
        return {
          success: true,
          timestamp: this.lastSyncTimestamp,
          mergedState,
        };
      } catch (err) {
        this.recordSyncError(err);
        return { success: false, error: this.lastError };
      } finally {
        this.isSyncing = false;
      }
    }
  }

  const cloudSyncExports = {
    extractGistId,
    computeStateHash,
    GitHubGistAPI,
    GoogleDriveAPI,
    CloudSyncManager,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = cloudSyncExports;
  } else {
    global.HabitCloudSync = cloudSyncExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
