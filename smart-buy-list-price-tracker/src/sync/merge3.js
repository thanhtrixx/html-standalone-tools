function createCloudPayload(state) {
  if (state && state._deleted) {
    pruneDeletedTombstones(state._deleted);
  }
  return {
    schemaVersion: 2,
    app: "smart-buy-list-price-tracker",
    updatedAt: new Date().toISOString(),
    activeList: state.activeList || {
      id: "default",
      title: "Weekly Groceries",
      items: [],
    },
    catalog: state.catalog || [],
    purchaseLedger: state.purchaseLedger || [],
    stores: state.stores || [...DEFAULT_STORES],
    settings: state.settings || {},
    _deleted: state._deleted || {
      items: {},
      ledger: {},
      stores: {},
    },
  };
}

function mergeCloudState(local, remote) {
  if (!local && !remote) {
    return {
      activeList: {
        id: "default",
        title: "Danh Sách Mua Sắm",
        items: [],
      },
      catalog: [],
      purchaseLedger: [],
      stores: [...DEFAULT_STORES],
      settings: {},
      _deleted: { items: {}, ledger: {}, stores: {} },
    };
  }
  if (!local) return remote;
  if (!remote) return local;

  const result = {
    activeList: {
      id: local.activeList?.id || remote.activeList?.id || "default",
      title:
        local.activeList?.title ||
        remote.activeList?.title ||
        "Danh Sách Mua Sắm",
      items: [],
    },
    catalog: [],
    purchaseLedger: [],
    stores: [],
    settings: { ...(local.settings || {}) },
    _deleted: { items: {}, ledger: {}, stores: {} },
  };

  const getTs = (obj) => {
    if (!obj) return 0;
    if (typeof obj === "string" || typeof obj === "number") {
      return new Date(obj).getTime() || 0;
    }
    if (obj.updatedAt) return new Date(obj.updatedAt).getTime() || 0;
    if (obj.createdAt) return new Date(obj.createdAt).getTime() || 0;
    if (obj.date) return new Date(obj.date).getTime() || 0;
    return 0;
  };

  // 1. Merge _deleted Tombstones
  const localDel = local._deleted || {};
  const remoteDel = remote._deleted || {};
  ["items", "ledger", "stores"].forEach((cat) => {
    const lMap = localDel[cat] || {};
    const rMap = remoteDel[cat] || {};
    const combined = { ...lMap };
    Object.keys(rMap).forEach((id) => {
      const rTs = getTs(rMap[id]);
      const lTs = getTs(lMap[id]);
      if (rTs >= lTs) {
        combined[id] = rMap[id];
      }
    });
    result._deleted[cat] = combined;
  });
  pruneDeletedTombstones(result._deleted);

  const tombItems = result._deleted.items;
  const tombLedger = result._deleted.ledger;
  const tombStores = result._deleted.stores;

  // 2. Merge Active List Items
  const localItems = Array.isArray(local.activeList?.items)
    ? local.activeList.items
    : [];
  const remoteItems = Array.isArray(remote.activeList?.items)
    ? remote.activeList.items
    : [];
  const itemMap = new Map();

  localItems.forEach((item) => {
    const key = (item.id || item.name || "").trim().toLowerCase();
    if (!key) return;
    const delTs = getTs(tombItems[item.id] || tombItems[key]);
    const itemTs = getTs(item);
    if (delTs > 0 && delTs >= itemTs) return;
    itemMap.set(key, { ...item });
  });

  remoteItems.forEach((remItem) => {
    const key = (remItem.id || remItem.name || "").trim().toLowerCase();
    if (!key) return;
    const delTs = getTs(tombItems[remItem.id] || tombItems[key]);
    const remTs = getTs(remItem);
    if (delTs > 0 && delTs >= remTs) return;

    if (!itemMap.has(key)) {
      itemMap.set(key, { ...remItem });
    } else {
      const locItem = itemMap.get(key);
      const locTs = getTs(locItem);
      if (remTs > locTs) {
        itemMap.set(key, {
          ...locItem,
          ...remItem,
          checked:
            remItem.checked !== undefined ? remItem.checked : locItem.checked,
          quantity:
            remItem.quantity !== undefined
              ? remItem.quantity
              : locItem.quantity,
          price: remItem.price !== undefined ? remItem.price : locItem.price,
          unit: remItem.unit || locItem.unit,
          store: remItem.store || locItem.store,
          category: remItem.category || locItem.category,
          updatedAt:
            remItem.updatedAt || locItem.updatedAt || new Date().toISOString(),
        });
      }
    }
  });
  result.activeList.items = Array.from(itemMap.values());

  // 3. Merge Purchase Ledger (Union with tombstone exclusion)
  const localLedger = Array.isArray(local.purchaseLedger)
    ? local.purchaseLedger
    : [];
  const remoteLedger = Array.isArray(remote.purchaseLedger)
    ? remote.purchaseLedger
    : [];
  const ledgerMap = new Map();

  const getLedgerKey = (rec) => {
    if (rec.id !== undefined && rec.id !== null) return `id_${rec.id}`;
    if (rec.timestamp) return `ts_${rec.timestamp}_${rec.itemName}`;
    return `rec_${rec.itemName}_${rec.store}_${rec.date}_${rec.unitPrice}`;
  };

  localLedger.forEach((rec) => {
    const k = getLedgerKey(rec);
    const delTs = getTs(
      tombLedger[rec.id] || tombLedger[String(rec.id)] || tombLedger[k]
    );
    if (delTs > 0) return;
    ledgerMap.set(k, { ...rec });
  });

  remoteLedger.forEach((rec) => {
    const k = getLedgerKey(rec);
    const delTs = getTs(
      tombLedger[rec.id] || tombLedger[String(rec.id)] || tombLedger[k]
    );
    if (delTs > 0) return;
    if (!ledgerMap.has(k)) {
      ledgerMap.set(k, { ...rec });
    }
  });
  result.purchaseLedger = Array.from(ledgerMap.values());

  // 4. Merge Stores (Union with tombstone exclusion)
  const localStores = Array.isArray(local.stores)
    ? local.stores
    : DEFAULT_STORES;
  const remoteStores = Array.isArray(remote.stores) ? remote.stores : [];
  const storesSet = new Set([...localStores, ...remoteStores]);
  result.stores = Array.from(storesSet).filter((s) => {
    if (!s) return false;
    const delTs = getTs(tombStores[s] || tombStores[s.toLowerCase()]);
    return delTs === 0;
  });
  if (result.stores.length === 0) {
    result.stores = [...DEFAULT_STORES];
  }

  // 5. Merge Settings
  if (remote.settings) {
    result.settings = {
      ...local.settings,
      language: remote.settings.language || local.settings?.language || "vi",
      currency: remote.settings.currency || local.settings?.currency || "VND",
      tripPhase:
        local.settings?.tripPhase || remote.settings.tripPhase || "PLANNING",
      grouping: remote.settings.grouping || local.settings?.grouping || "AISLE",
    };
  }

  return result;
}

function merge3Way(baseSnapshot, liveState, remoteData) {
  if (!baseSnapshot) return mergeCloudState(liveState, remoteData);
  if (!remoteData) return liveState;
  const baseMergedRemote = mergeCloudState(baseSnapshot, remoteData);
  return mergeCloudState(baseMergedRemote, liveState);
}

function reconcileMemoryState(newState) {
  if (!newState) return;
  memoryState.activeList = newState.activeList || {
    id: "default",
    title: "Danh Sách Mua Sắm",
    items: [],
  };
  memoryState.catalog = newState.catalog || [];
  memoryState.purchaseLedger = newState.purchaseLedger || [];
  memoryState.stores =
    Array.isArray(newState.stores) && newState.stores.length > 0
      ? newState.stores
      : [...DEFAULT_STORES];
  memoryState._deleted = newState._deleted || {
    items: {},
    ledger: {},
    stores: {},
  };
  if (newState.settings) {
    memoryState.settings = {
      ...memoryState.settings,
      ...newState.settings,
    };
  }
  saveToLocalStorage();
  if (typeof renderApp === "function") renderApp();
  if (typeof renderPriceLedgerTable === "function") {
    const searchInput = document.getElementById("ledgerSearchInput");
    renderPriceLedgerTable(searchInput ? searchInput.value : "");
  }
}

// Google Drive Cloud Sync Provider (Composite Provider)
class GoogleDriveStorageProvider extends StorageProvider {
  constructor(localProvider = null) {
    super();
    this.local = localProvider || new IndexedDBStorageProvider();
    this.remoteFileId = null;
    this.isSyncing = false;
    this.needsTrailingSync = false;
  }

  async init() {
    await this.local.init();
    return true;
  }

  async getState() {
    return this.local.getState();
  }

  async saveState(state) {
    await this.local.saveState(state);
    triggerDebouncedCloudSync();
    return true;
  }

  getStatus() {
    return {
      provider: "googledrive",
      connected: !!googleAuthState.accessToken,
      lastSync: googleAuthState.lastSyncTime,
      syncing: this.isSyncing || googleAuthState.isSyncing,
      lastError: googleAuthState.lastError,
    };
  }

  async sync(forcePush = false, forcePull = false) {
    if (!googleAuthState.accessToken) {
      return { success: false, error: "Not authenticated" };
    }
    if (this.isSyncing) {
      this.needsTrailingSync = true;
      return { success: true, queued: true };
    }

    this.isSyncing = true;
    this.needsTrailingSync = false;
    googleAuthState.isSyncing = true;
    updateSyncStatusUI("syncing");

    const snapshotBase = JSON.parse(JSON.stringify(memoryState));

    try {
      const fileMeta = await this.findRemoteFile();
      this.remoteFileId = fileMeta?.id || null;

      if (forcePush || (!fileMeta && !forcePull)) {
        const payload = createCloudPayload(memoryState);
        if (this.remoteFileId) {
          await this.updateRemoteFile(this.remoteFileId, payload);
        } else {
          const created = await this.createRemoteFile(payload);
          this.remoteFileId = created?.id || null;
        }
      } else if (forcePull) {
        if (this.remoteFileId) {
          const remoteData = await this.readRemoteFile(this.remoteFileId);
          if (remoteData) {
            const merged = mergeCloudState(
              {
                activeList: { items: [] },
                purchaseLedger: [],
                stores: [],
                _deleted: { items: {}, ledger: {}, stores: {} },
              },
              remoteData
            );
            reconcileMemoryState(merged);
          }
        }
      } else {
        let remoteData = null;
        if (this.remoteFileId) {
          remoteData = await this.readRemoteFile(this.remoteFileId);
        }
        if (remoteData) {
          const merged = merge3Way(snapshotBase, memoryState, remoteData);
          reconcileMemoryState(merged);
          const updatedPayload = createCloudPayload(merged);
          await this.updateRemoteFile(this.remoteFileId, updatedPayload);
        } else {
          const payload = createCloudPayload(memoryState);
          const created = await this.createRemoteFile(payload);
          this.remoteFileId = created?.id || null;
        }
      }

      googleAuthState.lastSyncTime = new Date().toISOString();
      googleAuthState.lastError = null;
      googleAuthState.isSyncing = false;
      updateSyncStatusUI("synced");
      if (typeof renderApp === "function") renderApp();
      return {
        success: true,
        timestamp: googleAuthState.lastSyncTime,
      };
    } catch (err) {
      console.error("Google Drive sync failed:", err);
      googleAuthState.lastError = err.message || "Sync failed";
      googleAuthState.isSyncing = false;
      updateSyncStatusUI("error");
      return { success: false, error: googleAuthState.lastError };
    } finally {
      this.isSyncing = false;
      googleAuthState.isSyncing = false;
      if (this.needsTrailingSync) {
        this.needsTrailingSync = false;
        setTimeout(() => this.sync(), 100);
      }
    }
  }

  async findRemoteFile() {
    const q = `name = '${GDRIVE_APP_DATA_FILE_NAME}' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(
      q
    )}&fields=files(id,name,modifiedTime,version)`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${googleAuthState.accessToken}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`Drive files query returned status ${res.status}`);
    }
    const data = await res.json();
    return data.files && data.files.length > 0 ? data.files[0] : null;
  }

  async readRemoteFile(fileId) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${googleAuthState.accessToken}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to read remote file: ${res.status}`);
    }
    const text = await res.text();
    return JSON.parse(text);
  }

  async createRemoteFile(payload) {
    const boundary = "-------314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: GDRIVE_APP_DATA_FILE_NAME,
      parents: ["appDataFolder"],
      mimeType: "application/json",
    };

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(payload) +
      closeDelimiter;

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleAuthState.accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );
    if (!res.ok) {
      throw new Error(`Failed to create remote file: ${res.status}`);
    }
    return res.json();
  }

  async updateRemoteFile(fileId, payload) {
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${googleAuthState.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      throw new Error(`Failed to update remote file: ${res.status}`);
    }
    return res.json();
  }
}

function parseGitHubRateLimitError(res, errData) {
  if (!res) return null;
  const is403or429 = res.status === 403 || res.status === 429;
  const remaining =
    res.headers && typeof res.headers.get === "function"
      ? res.headers.get("x-ratelimit-remaining")
      : null;
  const resetHeader =
    res.headers && typeof res.headers.get === "function"
      ? res.headers.get("x-ratelimit-reset") || res.headers.get("retry-after")
      : null;
  const msgLower = (errData?.message || "").toLowerCase();
  const isRateLimit =
    (is403or429 && remaining === "0") ||
    msgLower.includes("rate limit") ||
    msgLower.includes("secondary rate limit") ||
    msgLower.includes("api rate limit");

  if (!isRateLimit) return null;

  let timeStr = "";
  let minutesLeft = 1;
  if (resetHeader) {
    const resetNum = parseInt(resetHeader, 10);
    if (!isNaN(resetNum)) {
      const resetDate =
        resetNum > 1000000000
          ? new Date(resetNum * 1000)
          : new Date(Date.now() + resetNum * 1000);
      timeStr = resetDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      minutesLeft = Math.max(
        1,
        Math.ceil((resetDate.getTime() - Date.now()) / 60000)
      );
    }
  }
  const lang = typeof currentLanguage !== "undefined" ? currentLanguage : "vi";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;
  const template =
    t.error_github_ratelimit ||
    (lang === "vi"
      ? "Đã đạt giới hạn yêu cầu GitHub API. Tự động mở lại lúc {time} (sau {mins} phút)."
      : "GitHub API rate limit exceeded. Resets at {time} (in {mins}m).");
  if (timeStr) {
    return template.replace("{time}", timeStr).replace("{mins}", minutesLeft);
  }
  return lang === "vi"
    ? "Đã đạt giới hạn yêu cầu GitHub API. Vui lòng thử lại sau."
    : "GitHub API rate limit reached. Please try again later.";
}

// GitHub Gist Storage Provider
class GitHubGistStorageProvider extends StorageProvider {
  constructor(localStorageProvider) {
    super();
    this.local = localStorageProvider;
    this.filename = "smart_buy_list_data.json";
    this.description =
      "Smart Buy-List & Unit Price Tracker Database Backup (Secret)";
    this.isSyncing = false;
    this.needsTrailingSync = false;
  }

  async init() {
    if (this.local) await this.local.init();
  }

  async getState() {
    return this.local.getState();
  }

  async saveState(state) {
    await this.local.saveState(state);
    triggerDebouncedCloudSync();
    return true;
  }

  getStatus() {
    return {
      provider: "github",
      connected: !!githubAuthState.token,
      lastSync: githubAuthState.lastSyncTime,
      gistId: githubAuthState.gistId,
      syncing: this.isSyncing || githubAuthState.isSyncing,
      lastError: githubAuthState.lastError,
    };
  }

  async validateToken(token) {
    if (!token || typeof token !== "string") {
      throw new Error("Missing GitHub Personal Access Token");
    }
    const trimmed = token.trim();
    if (trimmed.startsWith("github_pat_")) {
      throw new Error(
        "Fine-grained tokens (github_pat_...) are not supported for Gists by GitHub. Please create a Classic PAT with 'gist' scope (ghp_...)."
      );
    }
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${trimmed}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const rateLimitMsg = parseGitHubRateLimitError(res, errData);
      if (rateLimitMsg) {
        throw new Error(rateLimitMsg);
      }
      const msg = errData?.message || `HTTP ${res.status}`;
      throw new Error(`GitHub auth failed: ${msg}`);
    }
    const scopes =
      res.headers && typeof res.headers.get === "function"
        ? res.headers.get("x-oauth-scopes") || ""
        : "";
    if (scopes && !scopes.includes("gist")) {
      throw new Error(
        "GitHub token is missing the 'gist' scope. Please generate a Classic PAT with the 'gist' permission checkbox enabled."
      );
    }
    const user = await res.json();
    return { user, scopes };
  }

  async discoverOrCreateGist(token, explicitGistId) {
    if (explicitGistId && explicitGistId.trim()) {
      const gistRes = await fetch(
        `https://api.github.com/gists/${explicitGistId.trim()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );
      if (gistRes.ok) {
        return explicitGistId.trim();
      }
    }

    // Search user gists for smart_buy_list_data.json
    try {
      const listRes = await fetch("https://api.github.com/gists?per_page=100", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      if (listRes.ok) {
        const gists = await listRes.json();
        const existing = gists.find((g) => g.files && g.files[this.filename]);
        if (existing) {
          return existing.id;
        }
      } else {
        const errData = await listRes.json().catch(() => null);
        const rateLimitMsg = parseGitHubRateLimitError(listRes, errData);
        if (rateLimitMsg) {
          throw new Error(rateLimitMsg);
        }
      }
    } catch (e) {
      if (
        e.message &&
        (e.message.includes("rate limit") || e.message.includes("giới hạn"))
      ) {
        throw e;
      }
      console.warn("Gist auto-discovery error:", e);
    }

    // Auto-create new secret Gist
    const localState = await this.local.getState();
    const payload = createCloudPayload(localState || memoryState);
    const createRes = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        description: this.description,
        public: false,
        files: {
          [this.filename]: {
            content: JSON.stringify(payload, null, 2),
          },
        },
      }),
    });
    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => null);
      const rateLimitMsg = parseGitHubRateLimitError(createRes, errData);
      if (rateLimitMsg) {
        throw new Error(rateLimitMsg);
      }
      const detail = errData?.message ? `: ${errData.message}` : "";
      throw new Error(
        `Failed to create secret Gist: HTTP ${createRes.status}${detail}`
      );
    }
    const createdGist = await createRes.json();
    return createdGist.id;
  }

  async readRemoteGist(gistId, token) {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const rateLimitMsg = parseGitHubRateLimitError(res, errData);
      if (rateLimitMsg) {
        throw new Error(rateLimitMsg);
      }
      const detail = errData?.message ? `: ${errData.message}` : "";
      throw new Error(`Failed to read Gist: HTTP ${res.status}${detail}`);
    }
    const gist = await res.json();
    const file = gist.files && gist.files[this.filename];
    if (!file) {
      return { gist, data: null };
    }

    let contentText = file.content;
    if ((file.truncated || !contentText) && file.raw_url) {
      // Strip Authorization header when fetching raw CDN URL to prevent 403 / CORS rejection
      const rawRes = await fetch(file.raw_url);
      if (rawRes.ok) {
        contentText = await rawRes.text();
      }
    }

    if (!contentText) {
      return { gist, data: null };
    }

    try {
      const data =
        typeof contentText === "string" ? JSON.parse(contentText) : contentText;
      return { gist, data };
    } catch (e) {
      console.warn("Failed to parse remote Gist JSON:", e);
      return { gist, data: null };
    }
  }

  async updateRemoteGist(gistId, payload, token) {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        description: this.description,
        files: {
          [this.filename]: {
            content: JSON.stringify(payload, null, 2),
          },
        },
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const rateLimitMsg = parseGitHubRateLimitError(res, errData);
      if (rateLimitMsg) {
        throw new Error(rateLimitMsg);
      }
      const detail = errData?.message ? `: ${errData.message}` : "";
      throw new Error(`Failed to update Gist: HTTP ${res.status}${detail}`);
    }
    return res.json();
  }

  async sync(forcePush = false, forcePull = false) {
    if (!githubAuthState.token) {
      return { success: false, error: "Not authenticated with GitHub" };
    }
    if (this.isSyncing) {
      this.needsTrailingSync = true;
      return { success: true, queued: true };
    }

    this.isSyncing = true;
    this.needsTrailingSync = false;
    githubAuthState.isSyncing = true;
    updateSyncStatusUI("syncing");

    const snapshotBase = JSON.parse(JSON.stringify(memoryState));

    try {
      const token = githubAuthState.token;
      if (!githubAuthState.gistId) {
        const gistId = await this.discoverOrCreateGist(
          token,
          githubAuthState.gistId
        );
        githubAuthState.gistId = gistId;
        if (githubAuthState.rememberToken) {
          try {
            localStorage.setItem("github_sync_gist_id", gistId);
          } catch (e) {}
        }
      }

      const gistId = githubAuthState.gistId;
      if (!gistId) throw new Error("Could not locate or create Gist ID");

      const { gist, data: remoteData } = await this.readRemoteGist(
        gistId,
        token
      );
      const localState = (await this.local.getState()) || memoryState;

      if (forcePush || (!remoteData && !forcePull)) {
        const payload = createCloudPayload(localState);
        await this.updateRemoteGist(gistId, payload, token);
      } else if (forcePull) {
        if (remoteData) {
          const merged = mergeCloudState(
            {
              activeList: { items: [] },
              purchaseLedger: [],
              stores: [],
              _deleted: { items: {}, ledger: {}, stores: {} },
            },
            remoteData
          );
          reconcileMemoryState(merged);
        }
      } else {
        // Deterministic 3-Way Merge with In-Flight Concurrency Protection
        if (remoteData) {
          const merged = merge3Way(snapshotBase, memoryState, remoteData);
          reconcileMemoryState(merged);
          const payload = createCloudPayload(merged);
          await this.updateRemoteGist(gistId, payload, token);
        } else {
          const payload = createCloudPayload(localState);
          await this.updateRemoteGist(gistId, payload, token);
        }
      }

      githubAuthState.lastSyncTime = new Date().toISOString();
      githubAuthState.lastError = null;
      githubAuthState.isSyncing = false;
      updateSyncStatusUI("synced");
      updateGithubGistUI();
      if (typeof renderApp === "function") renderApp();
      return {
        success: true,
        timestamp: githubAuthState.lastSyncTime,
        gistId: githubAuthState.gistId,
      };
    } catch (err) {
      console.error("GitHub Gist sync failed:", err);
      githubAuthState.lastError = err.message || "Sync failed";
      githubAuthState.isSyncing = false;
      updateSyncStatusUI("error");
      return { success: false, error: githubAuthState.lastError };
    } finally {
      this.isSyncing = false;
      githubAuthState.isSyncing = false;
      if (this.needsTrailingSync) {
        this.needsTrailingSync = false;
        setTimeout(() => this.sync(), 100);
      }
    }
  }
}

// Storage Manager (Singleton Registry)
class StorageManager {
  constructor() {
    this.local = new IndexedDBStorageProvider();
    this.providers = {
      none: this.local,
      googledrive: new GoogleDriveStorageProvider(this.local),
      github: new GitHubGistStorageProvider(this.local),
    };
    this.activeProviderType = "none";
  }

  getProvider() {
    return this.local;
  }

  getCloudProvider() {
    return this.providers[this.activeProviderType] || this.local;
  }

  getActiveProviderType() {
    return this.activeProviderType;
  }

  setActiveCloudProvider(type) {
    const valid = ["none", "googledrive", "github"].includes(type)
      ? type
      : "none";
    this.activeProviderType = valid;
    if (typeof memoryState !== "undefined" && memoryState.settings) {
      memoryState.settings.cloudProvider = valid;
      this.local.saveState(memoryState).catch(() => {});
    }
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("smart_buy_cloud_provider", valid);
      } catch (e) {}
    }
    updateSyncStatusUI(this.getCloudProviderStatus());
  }

  getCloudProviderStatus() {
    if (this.activeProviderType === "github") {
      return githubAuthState.token
        ? githubAuthState.lastError
          ? "error"
          : "synced"
        : "offline";
    }
    if (this.activeProviderType === "googledrive") {
      return googleAuthState.accessToken
        ? googleAuthState.lastError
          ? "error"
          : "synced"
        : "offline";
    }
    return "offline";
  }

  async init() {
    const res = await this.local.init();
    if (typeof localStorage !== "undefined") {
      try {
        const saved = localStorage.getItem("smart_buy_cloud_provider");
        if (saved && ["none", "googledrive", "github"].includes(saved)) {
          this.activeProviderType = saved;
        }
      } catch (e) {}
    }
    return res;
  }

  async getState() {
    return this.local.getState();
  }

  async saveState(state) {
    await this.local.saveState(state);
    triggerDebouncedCloudSync();
    return true;
  }

  async sync(forcePush = false, forcePull = false) {
    if (this.activeProviderType === "github" && githubAuthState.token) {
      return this.providers.github.sync(forcePush, forcePull);
    }
    if (
      this.activeProviderType === "googledrive" &&
      googleAuthState.accessToken
    ) {
      return this.providers.googledrive.sync(forcePush, forcePull);
    }
    return this.local.sync(forcePush, forcePull);
  }
}

const storageManager = new StorageManager();

const githubAuthState = {
  token: null,
  gistId: null,
  user: null,
  lastSyncTime: null,
  rememberToken: true,
  isSyncing: false,
  lastError: null,
};

async function initGithubAuthState() {
  if (dbInstance && storageManager?.local?.getSettingFromIDB) {
    try {
      const idbToken =
        await storageManager.local.getSettingFromIDB("github_sync_token");
      const idbGistId = await storageManager.local.getSettingFromIDB(
        "github_sync_gist_id"
      );
      if (idbToken) {
        githubAuthState.token = idbToken;
        githubAuthState.rememberToken = true;
        const tokenInput = document.getElementById("githubTokenInput");
        if (tokenInput) tokenInput.value = idbToken;
      }
      if (idbGistId) {
        githubAuthState.gistId = idbGistId;
        const gistIdInput = document.getElementById("githubGistIdInput");
        if (gistIdInput) gistIdInput.value = idbGistId;
      }
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("github_sync_token");
        localStorage.removeItem("github_sync_gist_id");
      }
      updateGithubGistUI();
      return;
    } catch (e) {}
  }

  if (typeof localStorage === "undefined") return;
  try {
    const savedToken = localStorage.getItem("github_sync_token");
    const savedGistId = localStorage.getItem("github_sync_gist_id");
    if (savedToken) {
      githubAuthState.token = savedToken;
      githubAuthState.rememberToken = true;
      const tokenInput = document.getElementById("githubTokenInput");
      if (tokenInput) tokenInput.value = savedToken;
    }
    if (savedGistId) {
      githubAuthState.gistId = savedGistId;
      const gistIdInput = document.getElementById("githubGistIdInput");
      if (gistIdInput) gistIdInput.value = savedGistId;
    }
    updateGithubGistUI();
  } catch (e) {}
}

let syncDebounceTimer = null;
let syncFirstMutationTime = null;

function triggerDebouncedCloudSync() {
  const providerType = storageManager.getActiveProviderType();
  if (providerType === "github" && !githubAuthState.token) return;
  if (providerType === "googledrive" && !googleAuthState.accessToken) return;
  if (providerType === "none") return;

  updateSyncStatusUI("pending");

  const now = Date.now();
  if (!syncFirstMutationTime) {
    syncFirstMutationTime = now;
  }

  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);

  // Relaxed, calm idle debounce: 15s idle delay, capped at 45s from first mutation
  const elapsed = now - syncFirstMutationTime;
  const delayMs = elapsed > 30000 ? 5000 : 15000;

  syncDebounceTimer = setTimeout(() => {
    syncDebounceTimer = null;
    syncFirstMutationTime = null;
    storageManager.sync();
  }, delayMs);
}

function flushPendingCloudSync() {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
    syncFirstMutationTime = null;
    const providerType = storageManager.getActiveProviderType();
    if (
      (providerType === "github" && githubAuthState.token) ||
      (providerType === "googledrive" && googleAuthState.accessToken)
    ) {
      storageManager.sync();
    }
  }
}

function copyCurrentOriginToClipboard() {
  const origin =
    (typeof window !== "undefined" &&
      window.location &&
      window.location.origin) ||
    "http://localhost";
  const tr = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    navigator.clipboard.writeText
  ) {
    navigator.clipboard
      .writeText(origin)
      .then(() => {
        showToast(tr.toast_origin_copied || "Origin copied to clipboard!");
      })
      .catch(() => {
        showToast(origin);
      });
  } else {
    showToast(origin);
  }
}

function handleCloudProviderChange(type) {
  storageManager.setActiveCloudProvider(type);
  const lang = memoryState?.settings?.language || "vi";
  const tr = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  if (type === "github") {
    if (!githubAuthState.token) {
      showToast(
        tr.github_token_placeholder ||
          "Please configure your GitHub Personal Access Token"
      );
    } else {
      storageManager.sync();
    }
  } else if (type === "googledrive") {
    if (!googleAuthState.accessToken) {
      handleGoogleSignIn();
    } else {
      storageManager.sync();
    }
  }
}

async function handleGithubConnect() {
  const tokenInput = document.getElementById("githubTokenInput");
  const gistIdInput = document.getElementById("githubGistIdInput");
  const rememberCheckbox = document.getElementById(
    "githubRememberTokenCheckbox"
  );

  const token = tokenInput ? tokenInput.value.trim() : "";
  const gistId = gistIdInput ? gistIdInput.value.trim() : "";
  const remember = rememberCheckbox ? rememberCheckbox.checked : true;

  const lang = memoryState?.settings?.language || "vi";
  const tr = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  if (!token) {
    showToast(
      tr.toast_github_token_invalid ||
        "Please enter a GitHub Personal Access Token"
    );
    return;
  }

  showToast(tr.cloud_sync_syncing || "Connecting & verifying GitHub token...");
  try {
    const ghProvider = storageManager.providers.github;
    const { user } = await ghProvider.validateToken(token);
    githubAuthState.token = token;
    githubAuthState.user = user;
    githubAuthState.gistId = gistId || null;
    githubAuthState.rememberToken = remember;

    if (remember) {
      if (dbInstance && storageManager?.local?.setSettingInIDB) {
        await storageManager.local.setSettingInIDB("github_sync_token", token);
        if (gistId) {
          await storageManager.local.setSettingInIDB(
            "github_sync_gist_id",
            gistId
          );
        }
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("github_sync_token");
          localStorage.removeItem("github_sync_gist_id");
        }
      } else if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem("github_sync_token", token);
          if (gistId) localStorage.setItem("github_sync_gist_id", gistId);
        } catch (e) {}
      }
    } else {
      if (dbInstance && storageManager?.local?.setSettingInIDB) {
        await storageManager.local.setSettingInIDB("github_sync_token", null);
        await storageManager.local.setSettingInIDB("github_sync_gist_id", null);
      }
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.removeItem("github_sync_token");
          localStorage.removeItem("github_sync_gist_id");
        } catch (e) {}
      }
    }

    storageManager.setActiveCloudProvider("github");
    showToast(tr.toast_github_connected || "Connected to GitHub Gist!");
    await ghProvider.sync();
    if (gistIdInput && githubAuthState.gistId) {
      gistIdInput.value = githubAuthState.gistId;
    }
    updateGithubGistUI();
  } catch (err) {
    console.error("GitHub connect error:", err);
    const errMsg =
      err && err.message
        ? err.message
        : tr.toast_github_token_invalid ||
          "Invalid GitHub token or missing gist scope";
    showToast(errMsg);
    updateSyncStatusUI("error");
  }
}

function handleGithubDisconnect() {
  githubAuthState.token = null;
  githubAuthState.gistId = null;
  githubAuthState.user = null;
  githubAuthState.lastSyncTime = null;
  githubAuthState.lastError = null;

  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem("github_sync_token");
      localStorage.removeItem("github_sync_gist_id");
    } catch (e) {}
  }
  if (
    dbInstance &&
    typeof dbInstance.transaction === "function" &&
    storageManager?.local?.setSettingInIDB
  ) {
    try {
      storageManager.local
        .setSettingInIDB("github_sync_token", null)
        .catch(() => {});
      storageManager.local
        .setSettingInIDB("github_sync_gist_id", null)
        .catch(() => {});
    } catch (e) {}
  }
  const tokenInput = document.getElementById("githubTokenInput");
  const gistIdInput = document.getElementById("githubGistIdInput");
  if (tokenInput) tokenInput.value = "";
  if (gistIdInput) gistIdInput.value = "";

  const lang = memoryState?.settings?.language || "vi";
  const tr = TRANSLATIONS[lang] || TRANSLATIONS.vi;
  showToast(tr.toast_github_disconnected || "Disconnected from GitHub Gist.");
  updateGithubGistUI();
  updateSyncStatusUI("offline");
}

function toggleGithubTokenVisibility() {
  const input = document.getElementById("githubTokenInput");
  const btn = document.getElementById("btnToggleGithubTokenVisibility");
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    if (btn) btn.textContent = "🙈";
  } else {
    input.type = "password";
    if (btn) btn.textContent = "👁️";
  }
}

function updateGithubGistUI() {
  if (typeof document === "undefined") return;
  const isConnected = !!githubAuthState.token;
  const btnConnect = document.getElementById("btnGithubConnect");
  const btnDisconnect = document.getElementById("btnGithubDisconnect");
  const actions = document.getElementById("githubGistActions");
  const viewLink = document.getElementById("githubViewGistLink");

  if (btnConnect && btnDisconnect) {
    if (isConnected) {
      btnConnect.classList.add("hidden");
      btnDisconnect.classList.remove("hidden");
      btnDisconnect.classList.add("flex");
      if (actions) actions.classList.remove("hidden");
    } else {
      btnConnect.classList.remove("hidden");
      btnDisconnect.classList.add("hidden");
      btnDisconnect.classList.remove("flex");
      if (actions) actions.classList.add("hidden");
    }
  }

  if (viewLink) {
    if (githubAuthState.gistId) {
      viewLink.href = `https://gist.github.com/${githubAuthState.gistId}`;
      viewLink.classList.remove("hidden");
    } else {
      viewLink.classList.add("hidden");
    }
  }
}

function loadGisScript() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.google?.accounts?.oauth2) return;
  const existingScript = document.getElementById("googleGisScript");
  if (existingScript) return;

  try {
    const script = document.createElement("script");
    script.id = "googleGisScript";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initGoogleAuthClient();
    };
    script.onerror = () => {
      console.warn("Google Identity Services script failed to load (offline).");
      updateSyncStatusUI("offline");
    };
    if (document.head) {
      document.head.appendChild(script);
    }
  } catch (e) {
    console.warn("Failed to append GIS script", e);
  }
}

function initGoogleAuthClient() {
  let storedClientId = null;
  try {
    storedClientId = localStorage.getItem("google_client_id");
  } catch (e) {}

  if (storedClientId) {
    googleAuthState.clientId = storedClientId;
    const inputEl = document.getElementById("googleClientIdInput");
    if (inputEl) inputEl.value = storedClientId;
  }

  if (
    typeof window === "undefined" ||
    !window.google?.accounts?.oauth2 ||
    !googleAuthState.clientId
  ) {
    return;
  }

  try {
    googleAuthState.tokenClient = window.google.accounts.oauth2.initTokenClient(
      {
        client_id: googleAuthState.clientId,
        scope: GDRIVE_APP_DATA_SCOPE,
        callback: (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            googleAuthState.accessToken = tokenResponse.access_token;
            googleAuthState.expiresIn = tokenResponse.expires_in || 3600;
            googleAuthState.tokenExpiresAt =
              Date.now() + googleAuthState.expiresIn * 1000;
            showToast(
              (typeof t === "function" && t("toast_cloud_connected")) ||
                "Connected to Google Drive!"
            );
            updateSyncStatusUI("synced");
            storageManager.sync();
          } else if (tokenResponse?.error) {
            console.error("OAuth error:", tokenResponse.error);
            googleAuthState.lastError = tokenResponse.error;
            showToast(
              (typeof t === "function" && t("toast_cloud_sync_error")) ||
                "Google Drive sync error"
            );
            updateSyncStatusUI("error");
          }
        },
      }
    );
  } catch (e) {
    console.warn("Failed to initialize Google Token Client", e);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { createCloudPayload, mergeCloudState, merge3Way };
}
