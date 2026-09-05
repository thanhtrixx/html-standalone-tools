function handleGoogleSignIn() {
  const inputEl = document.getElementById("googleClientIdInput");
  let storedClientId = null;
  try {
    storedClientId = localStorage.getItem("google_client_id");
  } catch (e) {}

  const clientIdVal =
    (inputEl ? inputEl.value : "") ||
    googleAuthState.clientId ||
    storedClientId;

  if (!clientIdVal) {
    showToast("Please enter a Google OAuth 2.0 Client ID");
    if (inputEl && typeof inputEl.focus === "function") inputEl.focus();
    return;
  }

  googleAuthState.clientId = clientIdVal.trim();
  try {
    localStorage.setItem("google_client_id", googleAuthState.clientId);
  } catch (e) {}

  if (typeof window !== "undefined" && !window.google?.accounts?.oauth2) {
    loadGisScript();
  }

  if (!googleAuthState.tokenClient) {
    initGoogleAuthClient();
  }

  if (googleAuthState.tokenClient) {
    googleAuthState.tokenClient.requestAccessToken({
      prompt: "consent",
    });
  } else {
    showToast(
      (typeof t === "function" && t("cloud_sync_offline")) ||
        "Google Auth service unavailable offline"
    );
  }
}

function handleGoogleSignOut() {
  if (googleAuthState.accessToken && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(
        googleAuthState.accessToken,
        () => {}
      );
    } catch (e) {}
  }
  googleAuthState.accessToken = null;
  googleAuthState.expiresIn = null;
  googleAuthState.tokenExpiresAt = null;
  updateSyncStatusUI("offline");
  showToast(
    (typeof t === "function" && t("toast_cloud_disconnected")) ||
      "Disconnected from Google Drive."
  );
}

function saveGoogleClientIdFromInput() {
  const inputEl = document.getElementById("googleClientIdInput");
  if (inputEl && inputEl.value) {
    const trimmed = inputEl.value.trim();
    googleAuthState.clientId = trimmed;
    try {
      localStorage.setItem("google_client_id", trimmed);
    } catch (e) {}
    initGoogleAuthClient();
    showToast("Google Client ID saved!");
  }
}

async function syncCloudNow() {
  const activeType = storageManager.getActiveProviderType();
  const lang = memoryState?.settings?.language || "vi";
  const tr = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  if (activeType === "github") {
    if (!githubAuthState.token) {
      handleGithubConnect();
      return;
    }
    showToast(tr.cloud_sync_syncing || "Syncing with GitHub Gist...");
    const res = await storageManager.sync();
    if (res.success) {
      showToast(tr.toast_github_sync_success || "GitHub Gist sync completed!");
    } else {
      const errDetail = res.error || "Unknown";
      const errTpl = tr.toast_github_sync_error || "GitHub sync failed: {msg}";
      showToast(errTpl.replace("{msg}", errDetail));
    }
    return;
  }

  if (activeType === "googledrive") {
    if (!googleAuthState.accessToken) {
      handleGoogleSignIn();
      return;
    }
    showToast(tr.cloud_sync_syncing || "Syncing with Google Drive...");
    const res = await storageManager.sync();
    if (res.success) {
      showToast(tr.toast_cloud_sync_success || "Google Drive sync completed!");
    } else {
      showToast(tr.toast_cloud_sync_error || "Google Drive sync failed.");
    }
    return;
  }

  showToast(tr.cloud_sync_offline || "Local / Offline mode active");
}

async function forceUploadCloud() {
  const activeType = storageManager.getActiveProviderType();
  const lang =
    memoryState?.settings?.language ||
    (typeof currentLanguage !== "undefined" ? currentLanguage : "vi");
  const tr = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  if (activeType === "github" && !githubAuthState.token) {
    showToast(
      tr.toast_github_missing_token ||
        "Please connect with a valid GitHub token first."
    );
    return;
  }
  if (activeType === "googledrive" && !googleAuthState.accessToken) {
    showToast(
      tr.toast_gdrive_missing_auth || "Please sign in to Google Drive first."
    );
    return;
  }

  showToast(tr.toast_uploading_cloud || "Uploading local data to cloud...");
  const res = await storageManager.sync(true, false);
  if (res && res.success) {
    showToast(tr.toast_upload_success || "Uploaded to cloud successfully!");
  } else {
    const errDetail = res?.error || "Unknown error";
    const errTpl = tr.toast_upload_error || "Cloud upload failed: {msg}";
    showToast(errTpl.replace("{msg}", errDetail));
  }
}

async function forceDownloadCloud() {
  const activeType = storageManager.getActiveProviderType();
  const lang =
    memoryState?.settings?.language ||
    (typeof currentLanguage !== "undefined" ? currentLanguage : "vi");
  const tr = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  if (activeType === "github" && !githubAuthState.token) {
    showToast(
      tr.toast_github_missing_token ||
        "Please connect with a valid GitHub token first."
    );
    return;
  }
  if (activeType === "googledrive" && !googleAuthState.accessToken) {
    showToast(
      tr.toast_gdrive_missing_auth || "Please sign in to Google Drive first."
    );
    return;
  }

  showToast(
    tr.toast_downloading_cloud || "Downloading remote data from cloud..."
  );
  const res = await storageManager.sync(false, true);
  if (res && res.success) {
    showToast(
      tr.toast_download_success || "Downloaded and merged successfully!"
    );
  } else {
    const errDetail = res?.error || "Unknown error";
    const errTpl = tr.toast_download_error || "Cloud download failed: {msg}";
    showToast(errTpl.replace("{msg}", errDetail));
  }
}

function updateSyncStatusUI(status) {
  if (typeof document === "undefined") return;
  const pill = document.getElementById("cloudSyncStatusPill");
  const lastTime = document.getElementById("cloudSyncLastTime");
  const errorBanner = document.getElementById("cloudSyncErrorBanner");
  const errorBannerText = document.getElementById("cloudSyncErrorBannerText");

  const gdrivePanel = document.getElementById("googleDriveSyncPanel");
  const githubPanel = document.getElementById("githubGistSyncPanel");
  const providerSelect = document.getElementById("cloudProviderSelect");

  const lang = memoryState?.settings?.language || "vi";
  const tr = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  const activeType = storageManager.getActiveProviderType();
  if (providerSelect && providerSelect.value !== activeType) {
    providerSelect.value = activeType;
  }

  if (gdrivePanel) {
    if (activeType === "googledrive") {
      gdrivePanel.classList.remove("hidden");
    } else {
      gdrivePanel.classList.add("hidden");
    }
  }
  if (githubPanel) {
    if (activeType === "github") {
      githubPanel.classList.remove("hidden");
    } else {
      githubPanel.classList.add("hidden");
    }
  }

  const originEl = document.getElementById("gdriveCurrentOrigin");
  if (originEl && typeof window !== "undefined" && window.location) {
    originEl.textContent = window.location.origin || "http://localhost";
  }

  const btnSignIn = document.getElementById("btnGoogleSignIn");
  const btnSignOut = document.getElementById("btnGoogleSignOut");
  const btnGoogleSync = document.getElementById("btnGoogleSyncNow");
  const gdriveAdv = document.getElementById("cloudSyncAdvancedActions");
  const isGDriveConnected = !!googleAuthState.accessToken;
  if (btnSignIn && btnSignOut) {
    if (isGDriveConnected) {
      btnSignIn.classList.add("hidden");
      btnSignOut.classList.remove("hidden");
      btnSignOut.classList.add("flex");
      if (btnGoogleSync) {
        btnGoogleSync.classList.remove("hidden");
        btnGoogleSync.classList.add("flex");
      }
      if (gdriveAdv) gdriveAdv.classList.remove("hidden");
    } else {
      btnSignIn.classList.remove("hidden");
      btnSignOut.classList.add("hidden");
      btnSignOut.classList.remove("flex");
      if (btnGoogleSync) {
        btnGoogleSync.classList.add("hidden");
        btnGoogleSync.classList.remove("flex");
      }
      if (gdriveAdv) gdriveAdv.classList.add("hidden");
    }
  }

  updateGithubGistUI();

  let isConnected = false;
  let syncTime = null;
  let currentError = null;

  if (activeType === "github") {
    isConnected = !!githubAuthState.token;
    syncTime = githubAuthState.lastSyncTime;
    currentError = githubAuthState.lastError;
  } else if (activeType === "googledrive") {
    isConnected = !!googleAuthState.accessToken;
    syncTime = googleAuthState.lastSyncTime;
    currentError = googleAuthState.lastError;
  }

  if (lastTime && syncTime) {
    const date = new Date(syncTime);
    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    lastTime.textContent = (
      tr.cloud_sync_last_synced || "Last synced: {time}"
    ).replace("{time}", timeStr);
  }

  if (status === "syncing") {
    if (pill) {
      pill.textContent = tr.cloud_sync_syncing || "Syncing...";
      pill.className =
        "text-[11px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/50 font-medium";
    }
    if (errorBanner) errorBanner.classList.add("hidden");
  } else if (status === "error" || (isConnected && currentError)) {
    if (pill) {
      pill.textContent = tr.cloud_sync_error || "Sync Error";
      pill.className =
        "text-[11px] text-red-400 bg-red-950/60 px-2 py-0.5 rounded-md border border-red-800/50 font-medium";
    }
    if (errorBanner && errorBannerText) {
      errorBannerText.textContent =
        currentError || tr.cloud_sync_error || "Sync Error";
      errorBanner.classList.remove("hidden");
    }
  } else if (status === "pending") {
    if (pill) {
      pill.textContent = tr.cloud_sync_pending || "Sync pending...";
      pill.className =
        "text-[11px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/50 font-medium";
    }
    if (errorBanner) errorBanner.classList.add("hidden");
  } else if (status === "synced" || (isConnected && status !== "error")) {
    if (pill) {
      pill.textContent = tr.cloud_sync_synced || "Synced";
      pill.className =
        "text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50 font-medium";
    }
    if (errorBanner) errorBanner.classList.add("hidden");
  } else {
    if (pill) {
      pill.textContent = tr.cloud_sync_offline || "Local / Offline";
      pill.className =
        "text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 font-medium";
    }
    if (errorBanner) errorBanner.classList.add("hidden");
  }

  // Synchronize Ambient Header Badge & Diagnostic Popover
  const headerBadge = document.getElementById("headerCloudSyncBadge");
  const headerDot = document.getElementById("headerCloudSyncDot");
  const headerText = document.getElementById("headerCloudSyncText");

  const popoverProvider = document.getElementById("popoverCloudProvider");
  const popoverTarget = document.getElementById("popoverCloudTarget");
  const popoverLastSync = document.getElementById("popoverLastSyncTime");
  const btnHeaderSyncText = document.getElementById("btnHeaderSyncNowText");

  if (headerBadge) {
    if (!isConnected || activeType === "none") {
      headerBadge.classList.add("hidden");
      headerBadge.classList.remove("inline-flex");
      closeCloudSyncPopover();
    } else {
      headerBadge.classList.remove("hidden");
      headerBadge.classList.add("inline-flex");

      if (headerDot) {
        headerDot.className =
          "w-2 h-2 rounded-full inline-block transition-colors";
      }

      if (status === "syncing") {
        if (headerDot) headerDot.classList.add("bg-sky-500", "animate-pulse");
        if (headerText)
          headerText.textContent = tr.cloud_sync_syncing || "Syncing...";
        headerBadge.title =
          (tr.cloud_sync_title || "Cloud Sync") +
          ": " +
          (tr.cloud_sync_syncing || "Syncing...");
        if (btnHeaderSyncText)
          btnHeaderSyncText.textContent = tr.cloud_sync_syncing || "Syncing...";
      } else if (status === "error" || (isConnected && currentError)) {
        if (headerDot) headerDot.classList.add("bg-red-500");
        if (headerText)
          headerText.textContent = tr.cloud_sync_error || "Sync Error";
        headerBadge.title =
          (tr.cloud_sync_title || "Cloud Sync") +
          ": " +
          (currentError || tr.cloud_sync_error || "Sync Error");
        if (btnHeaderSyncText)
          btnHeaderSyncText.textContent = tr.btn_retry_now || "Thử lại ngay";
      } else if (status === "pending") {
        if (headerDot) headerDot.classList.add("bg-amber-500");
        if (headerText)
          headerText.textContent = tr.cloud_sync_pending || "Chờ đồng bộ...";
        headerBadge.title =
          (tr.cloud_sync_title || "Cloud Sync") +
          ": " +
          (tr.cloud_sync_pending || "Chờ đồng bộ...");
        if (btnHeaderSyncText)
          btnHeaderSyncText.textContent = tr.btn_sync_now || "Đồng bộ ngay";
      } else if (status === "offline") {
        if (headerDot) headerDot.classList.add("bg-amber-500");
        if (headerText)
          headerText.textContent = tr.cloud_sync_offline || "Local / Offline";
        headerBadge.title =
          (tr.cloud_sync_title || "Cloud Sync") +
          ": " +
          (tr.cloud_sync_offline || "Local / Offline");
        if (btnHeaderSyncText)
          btnHeaderSyncText.textContent = tr.btn_sync_now || "Đồng bộ ngay";
      } else {
        // synced
        if (headerDot) headerDot.classList.add("bg-emerald-500");
        if (headerText)
          headerText.textContent = tr.cloud_sync_synced || "Đã đồng bộ";
        headerBadge.title =
          (tr.cloud_sync_title || "Cloud Sync") +
          ": " +
          (tr.cloud_sync_synced || "Đã đồng bộ");
        if (btnHeaderSyncText)
          btnHeaderSyncText.textContent = tr.btn_sync_now || "Đồng bộ ngay";
      }
    }
  }

  if (popoverProvider) {
    popoverProvider.textContent =
      activeType === "googledrive"
        ? "Google Drive"
        : activeType === "github"
          ? "GitHub Gist"
          : tr.cloud_provider_none || "Local Only";
  }
  if (popoverTarget) {
    if (activeType === "googledrive") {
      popoverTarget.textContent = "appDataFolder";
      popoverTarget.title = "appDataFolder/smart_buy_list_backup.json";
    } else if (activeType === "github") {
      const gistName = githubAuthState.gistId
        ? githubAuthState.gistId.slice(0, 10) + "..."
        : githubAuthState.username
          ? "@" + githubAuthState.username
          : "Secret Gist";
      popoverTarget.textContent = gistName;
      popoverTarget.title = githubAuthState.gistId || "Secret Gist";
    } else {
      popoverTarget.textContent = "--";
      popoverTarget.title = "";
    }
  }
  if (popoverLastSync) {
    if (syncTime) {
      const date = new Date(syncTime);
      popoverLastSync.textContent = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } else {
      popoverLastSync.textContent = "--";
    }
  }
}

function toggleCloudSyncPopover(event) {
  if (event && typeof event.stopPropagation === "function") {
    event.stopPropagation();
  }
  const popover = document.getElementById("cloudSyncDiagnosticPopover");
  const badge = document.getElementById("headerCloudSyncBadge");
  if (!popover) return;
  const isHidden = popover.classList.contains("hidden");
  if (isHidden) {
    popover.classList.remove("hidden");
    if (badge && typeof badge.setAttribute === "function") {
      badge.setAttribute("aria-expanded", "true");
    }
  } else {
    popover.classList.add("hidden");
    if (badge && typeof badge.setAttribute === "function") {
      badge.setAttribute("aria-expanded", "false");
    }
  }
}

function closeCloudSyncPopover() {
  const popover = document.getElementById("cloudSyncDiagnosticPopover");
  const badge = document.getElementById("headerCloudSyncBadge");
  if (popover) popover.classList.add("hidden");
  if (badge && typeof badge.setAttribute === "function") {
    badge.setAttribute("aria-expanded", "false");
  }
}

function handleCloudSyncPopoverOutsideClick(event) {
  const popover = document.getElementById("cloudSyncDiagnosticPopover");
  const badge = document.getElementById("headerCloudSyncBadge");
  if (popover && !popover.classList.contains("hidden")) {
    const popoverContains =
      typeof popover.contains === "function" && popover.contains(event.target);
    const badgeContains =
      badge &&
      typeof badge.contains === "function" &&
      badge.contains(event.target);
    if (!popoverContains && !badgeContains) {
      closeCloudSyncPopover();
    }
  }
}

function triggerHeaderManualSync() {
  closeCloudSyncPopover();
  const activeType = storageManager.getActiveProviderType();
  if (activeType === "none") {
    openSettingsModal();
    return;
  }
  if (activeType === "googledrive" && !googleAuthState.accessToken) {
    openSettingsModal();
    return;
  }
  if (activeType === "github" && !githubAuthState.token) {
    openSettingsModal();
    return;
  }
  flushPendingCloudSync();
  storageManager.sync();
}

function openCloudSettingsFromPopover() {
  closeCloudSyncPopover();
  openSettingsModal();
  setTimeout(() => {
    const section = document.getElementById("cloudSyncSection");
    if (section && typeof section.scrollIntoView === "function") {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 120);
}

let syncRetryCount = 0;
const MAX_SYNC_RETRIES = 3;
let syncRetryTimer = null;

async function triggerAutoSyncWithRetry(isRetry = false) {
  if (!isRetry) syncRetryCount = 0;
  if (syncRetryTimer) {
    clearTimeout(syncRetryTimer);
    syncRetryTimer = null;
  }

  const activeType = storageManager.getActiveProviderType();
  const isConnected =
    (activeType === "googledrive" && !!googleAuthState.accessToken) ||
    (activeType === "github" && !!githubAuthState.token);

  if (!isConnected) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    updateSyncStatusUI("offline");
    return;
  }

  try {
    updateSyncStatusUI("syncing");
    const res = await storageManager.sync();
    if (res && res.success) {
      syncRetryCount = 0;
      updateSyncStatusUI("synced");
    } else {
      throw new Error(res?.error || "Sync failed");
    }
  } catch (err) {
    console.warn("[CloudSync] Auto-sync attempt failed:", err);
    if (syncRetryCount < MAX_SYNC_RETRIES) {
      syncRetryCount++;
      updateSyncStatusUI("pending");
      const backoffDelay = Math.min(1000 * Math.pow(2, syncRetryCount), 8000);
      syncRetryTimer = setTimeout(() => {
        triggerAutoSyncWithRetry(true);
      }, backoffDelay);
    } else {
      updateSyncStatusUI("error");
    }
  }
}

async function initDatabase() {
  if (
    typeof navigator !== "undefined" &&
    navigator.storage &&
    typeof navigator.storage.persist === "function"
  ) {
    try {
      await navigator.storage.persist();
    } catch (e) {}
  }
  const localInit = await storageManager.init();
  await initGithubAuthState();
  return localInit;
}

function saveToLocalStorage() {
  if (
    dbInstance &&
    typeof dbInstance.transaction === "function" &&
    storageManager?.local?.writeFullStateToIDB
  ) {
    try {
      storageManager.local.writeFullStateToIDB(memoryState).catch(() => {});
    } catch (e) {}
  }
  try {
    localStorage.setItem("smart_buy_list_state", JSON.stringify(memoryState));
  } catch (e) {
    console.warn("Failed to save to localStorage", e);
  }
  triggerDebouncedCloudSync();
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem("smart_buy_list_state");
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryState = Object.assign(memoryState, parsed);
      if (
        !memoryState.stores ||
        !Array.isArray(memoryState.stores) ||
        memoryState.stores.length === 0
      ) {
        memoryState.stores = [...DEFAULT_STORES];
      }
      if (!memoryState._deleted || typeof memoryState._deleted !== "object") {
        memoryState._deleted = { items: {}, ledger: {}, stores: {} };
      }
      pruneDeletedTombstones(memoryState._deleted);
    }
    const rawSnaps = localStorage.getItem("smart_buy_list_snapshots");
    if (rawSnaps) {
      try {
        const parsedSnaps = JSON.parse(rawSnaps);
        if (Array.isArray(parsedSnaps)) {
          memoryState.snapshots = parsedSnaps.slice(0, 5);
          updateSnapshotsUI();
        }
      } catch (e) {}
    }
  } catch (e) {
    console.warn("Failed to parse localStorage state", e);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    handleGoogleSignIn,
    handleGoogleSignOut,
    syncCloudNow,
    forceUploadCloud,
    forceDownloadCloud,
    updateSyncStatusUI,
    initDatabase,
    saveToLocalStorage,
    loadFromLocalStorage,
  };
}
