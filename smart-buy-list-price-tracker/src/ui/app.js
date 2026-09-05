/* =========================================================================
       11. INITIALIZATION & SERVICE WORKER
       ========================================================================= */
function initApp() {
  return initDatabase().then(async () => {
    // Sync restored settings to runtime and UI controls
    if (memoryState && memoryState.settings) {
      if (memoryState.settings.language) {
        currentLanguage = memoryState.settings.language;
      }
      if (document.documentElement) {
        document.documentElement.lang = currentLanguage;
      }
      if (memoryState.settings.currency) {
        currentCurrency = memoryState.settings.currency;
      }
      if (memoryState.settings.tripPhase) {
        currentPhase = memoryState.settings.tripPhase;
      }
      if (memoryState.settings.grouping) {
        currentGrouping = memoryState.settings.grouping;
      }
      if (memoryState.settings.theme === "light") {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        const themeBtn = document.getElementById("themeToggleBtn");
        if (themeBtn) themeBtn.textContent = "☀️";
      } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
        const themeBtn = document.getElementById("themeToggleBtn");
        if (themeBtn) themeBtn.textContent = "🌙";
      }
    }

    // Check for URL share hash
    if (window.location.hash.startsWith("#share=")) {
      const payload = window.location.hash.replace("#share=", "");
      const sharedList = await decodeSharePayload(payload);
      if (sharedList) {
        window.pendingSharedList = sharedList;
        const countEl = document.getElementById("importItemCountBadge");
        if (countEl) countEl.textContent = sharedList.items.length;
        openMergeReviewModal(sharedList);
      }
    }

    // Initial Render
    applyTranslations();
    setTripPhase(currentPhase);
    setGrouping(currentGrouping);
    renderApp();
    runComparatorCalc();

    // Initialize root history state
    try {
      if (
        typeof window !== "undefined" &&
        window.history &&
        window.history.replaceState &&
        !window.history.state
      ) {
        window.history.replaceState(
          { tab: currentActiveTab || "PLANNING" },
          ""
        );
      }
    } catch (e) {
      // Ignore sandboxed history errors
    }

    const langSelect = document.getElementById("settingsLanguageSelect");
    if (langSelect) langSelect.value = currentLanguage;
    const curSelect = document.getElementById("settingsCurrencySelect");
    if (curSelect) curSelect.value = currentCurrency;
    const groupSelect = document.getElementById("settingsGroupingSelect");
    if (groupSelect) groupSelect.value = currentGrouping;

    // Load Google Identity Services and init auth if client ID is configured
    loadGisScript();
    initGoogleAuthClient();

    // Pull cloud sync on startup if authenticated
    if (
      (storageManager.getActiveProviderType() === "googledrive" &&
        googleAuthState.accessToken) ||
      (storageManager.getActiveProviderType() === "github" &&
        githubAuthState.token)
    ) {
      storageManager.sync();
    }

    // Calm Cloud Sync on Visibility Changes
    let lastVisibleTime = Date.now();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flushPendingCloudSync();
      } else if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastVisibleTime;
        if (elapsed > 120000) {
          const activeType = storageManager.getActiveProviderType();
          if (
            (activeType === "googledrive" && googleAuthState.accessToken) ||
            (activeType === "github" && githubAuthState.token)
          ) {
            storageManager.sync();
          }
        }
        lastVisibleTime = Date.now();
      }
    });

    // Cloud Sync Online Reconnect & Auto-Retry
    window.addEventListener("online", () => {
      triggerAutoSyncWithRetry();
    });
    window.addEventListener("offline", () => {
      updateSyncStatusUI("offline");
    });

    // Click outside to dismiss cloud sync diagnostic popover
    document.addEventListener("click", handleCloudSyncPopoverOutsideClick);

    // Delegated item card click listener
    document.addEventListener("click", handleItemCardDelegatedClick);

    // Keyboard navigation shortcuts
    document.addEventListener("keydown", handleGlobalKeyDown);

    // Popstate browser back button handling for modals & tab navigation
    window.addEventListener("popstate", handlePopState);

    // Page horizontal touch swipe listeners for 4-tab navigation
    document.addEventListener("touchstart", handlePageTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handlePageTouchMove, {
      passive: true,
    });
    document.addEventListener("touchend", handlePageTouchEnd, {
      passive: true,
    });

    // Register Service Worker with update lifecycle
    initServiceWorker();
  });
}

let waitingServiceWorker = null;

function hydratePwaVersion() {
  if (
    typeof fetch === "function" &&
    window.location.protocol.startsWith("http")
  ) {
    fetch("./manifest.webmanifest")
      .then((res) => (res.ok ? res.json() : null))
      .then((manifest) => {
        if (manifest && manifest.version) {
          window.APP_VERSION = manifest.version;
          const badge = document.getElementById("pwaVersionBadge");
          if (badge) {
            badge.textContent = "v" + manifest.version;
          }
        }
      })
      .catch(() => {});
  }
}

function initServiceWorker() {
  hydratePwaVersion();

  if (
    !("serviceWorker" in navigator) ||
    !window.location.protocol.startsWith("http")
  ) {
    return;
  }

  navigator.serviceWorker
    .register("./sw.js")
    .then((reg) => {
      window.swRegistration = reg;

      // Check if a worker is already waiting
      if (reg.waiting) {
        waitingServiceWorker = reg.waiting;
        showUpdateToast();
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            waitingServiceWorker = newWorker;
            showUpdateToast();
          }
        });
      });
    })
    .catch(() => {});

  // Reload page when new worker takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  // Trigger update check when tab becomes visible
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && window.swRegistration) {
      window.swRegistration.update().catch(() => {});
    }
  });

  // Periodic check every 60 minutes
  setInterval(
    () => {
      if (window.swRegistration) {
        window.swRegistration.update().catch(() => {});
      }
    },
    60 * 60 * 1000
  );
}

function showUpdateToast() {
  const toast = document.getElementById("pwaUpdateToast");
  if (!toast) return;
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const titleEl = document.getElementById("updateToastTitle");
  const descEl = document.getElementById("updateToastDesc");
  const btnEl = document.getElementById("btnApplyPwaUpdate");
  if (titleEl) titleEl.textContent = t.update_available_title;
  if (descEl) descEl.textContent = t.update_available_desc;
  if (btnEl) btnEl.textContent = t.update_btn_refresh;
  toast.classList.remove("hidden");
}

function applyPwaUpdate() {
  if (waitingServiceWorker) {
    waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
  } else if (window.swRegistration && window.swRegistration.waiting) {
    window.swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
  } else {
    window.location.reload();
  }
}

function checkForUpdates() {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  if (!("serviceWorker" in navigator) || !window.swRegistration) {
    showToast(t.up_to_date_msg || "You are using the latest version.");
    return;
  }
  showToast(t.checking_updates_msg || "Checking for updates...");
  window.swRegistration
    .update()
    .then((reg) => {
      if (reg && reg.waiting) {
        waitingServiceWorker = reg.waiting;
        showUpdateToast();
      } else {
        setTimeout(() => {
          if (!waitingServiceWorker) {
            showToast(t.up_to_date_msg || "You are using the latest version.");
          }
        }, 1000);
      }
    })
    .catch(() => {
      showToast(t.up_to_date_msg || "You are using the latest version.");
    });
}

function purgeCacheAndReload() {
  if ("caches" in window) {
    caches
      .keys()
      .then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      })
      .then(() => {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker
            .getRegistrations()
            .then((registrations) => {
              return Promise.all(registrations.map((r) => r.unregister()));
            })
            .then(() => {
              window.location.reload(true);
            });
        } else {
          window.location.reload(true);
        }
      })
      .catch(() => {
        window.location.reload(true);
      });
  } else {
    window.location.reload(true);
  }
}

if (
  typeof window !== "undefined" &&
  typeof window.addEventListener === "function"
) {
  window.addEventListener("DOMContentLoaded", initApp);
}

function confirmImport(mode) {
  if (!window.pendingSharedList) return;
  if (mode === "MERGE") {
    const existingNames = new Set(
      (memoryState.activeList.items || []).map((i) => i.name.toLowerCase())
    );
    const toAdd = (window.pendingSharedList.items || [])
      .filter((i) => !existingNames.has(i.name.toLowerCase()))
      .map((i) =>
        touchItem({
          ...i,
          store: resolveStoreAlias(i.store),
        })
      );
    if (!memoryState.activeList.items) memoryState.activeList.items = [];
    memoryState.activeList.items.push(...toAdd);
  } else {
    saveActiveListSnapshot("PRE_REPLACE_IMPORT");
    memoryState.activeList.items = (window.pendingSharedList.items || []).map(
      (i) =>
        touchItem({
          ...i,
          store: resolveStoreAlias(i.store),
        })
    );
  }
  saveToLocalStorage();
  closeModal("importModal");
  closeModal("mergeReviewModal");
  renderApp();
  showToast(
    TRANSLATIONS[currentLanguage].toast_import_shared_success ||
      "Shared list successfully imported!"
  );
}

// Global exports for test runner and Node vm sandbox
if (typeof window !== "undefined") {
  window.DEFAULT_STORES = DEFAULT_STORES;
  window.TOMBSTONE_TTL_MS = TOMBSTONE_TTL_MS;
  window.touchItem = touchItem;
  window.pruneDeletedTombstones = pruneDeletedTombstones;
  window.recordDeletedItem = recordDeletedItem;
  window.recordDeletedLedger = recordDeletedLedger;
  window.recordDeletedStore = recordDeletedStore;
  window.normalizeUnitPrice = normalizeUnitPrice;
  window.normalizeQuantity = normalizeQuantity;
  window.comparePackages = comparePackages;
  window.evaluateDealScore = evaluateDealScore;
  window.DIMENSIONS = DIMENSIONS;
  window.UNIT_CONVERSIONS = UNIT_CONVERSIONS;
  window.UNIT_GROUPS = UNIT_GROUPS;
  window.CATEGORIES = CATEGORIES;
  window.TRANSLATIONS = TRANSLATIONS;
  window.memoryState = memoryState;
  window.setTripPhase = setTripPhase;
  window.toggleItemCheck = toggleItemCheck;
  window.deleteItem = deleteItem;
  window.finalizeTripCompletion = finalizeTripCompletion;
  window.loadSampleData = loadSampleData;
  window.clearAllData = clearAllData;
  window.handleItemAutocomplete = handleItemAutocomplete;
  window.renderCategoryOptions = renderCategoryOptions;
  window.renderUnitOptions = renderUnitOptions;
  window.renderApp = renderApp;
  window.applyTranslations = applyTranslations;
  window.initDatabase = initDatabase;
  window.exportJsonBackup = exportJsonBackup;
  window.renderSparklineSvg = renderSparklineSvg;
  window.getItemStoreComparison = getItemStoreComparison;
  window.encodeSharePayload = encodeSharePayload;
  window.decodeSharePayload = decodeSharePayload;
  window.confirmImport = confirmImport;
  window.getVerbalAmount = getVerbalAmount;
  window.toggleTheme = toggleTheme;
  window.toggleLanguage = toggleLanguage;
  window.setCurrency = setCurrency;
  window.formatCurrency = formatCurrency;
  window.sanitizeHTML = sanitizeHTML;
  window.generateItemId = generateItemId;
  window.isValidId = isValidId;
  window.handleItemCardDelegatedClick = handleItemCardDelegatedClick;
  window.handleGlobalKeyDown = handleGlobalKeyDown;
  window.openComparatorModal = openComparatorModal;
  window.openItemComparator = openItemComparator;
  window.applyWinnerToActiveItem = applyWinnerToActiveItem;
  window.openQuickPriceEdit = openQuickPriceEdit;
  window.submitQuickPriceEdit = submitQuickPriceEdit;
  window.quickUpdateItemPrice = quickUpdateItemPrice;
  window.openShareModal = openShareModal;
  window.generateBuyListTextChecklist = generateBuyListTextChecklist;
  window.copyBuyListTextChecklist = copyBuyListTextChecklist;
  window.copyShareUrl = copyShareUrl;
  window.invokeNativeShare = invokeNativeShare;
  window.exportBuyListJsonFile = exportBuyListJsonFile;
  window.focusAddItemInput = focusAddItemInput;
  window.filterByCategory = filterByCategory;
  window.stepQuickPrice = stepQuickPrice;
  window.updateTripProgress = updateTripProgress;
  window.DEFAULT_STORE_ALIASES = DEFAULT_STORE_ALIASES;
  window.getStoreAliases = getStoreAliases;
  window.setStoreAliases = setStoreAliases;
  window.promptEditStoreAliases = promptEditStoreAliases;
  window.promptEditStoreAliasesByIndex = promptEditStoreAliasesByIndex;
  window.addStore = addStore;
  window.renameStore = renameStore;
  window.deleteStore = deleteStore;
  window.renderStoreManagerList = renderStoreManagerList;
  window.promptRenameStore = promptRenameStore;
  window.promptRenameStoreByIndex = promptRenameStoreByIndex;
  window.deleteStoreByIndex = deleteStoreByIndex;
  window.setLanguage = setLanguage;
  window.handleStoreAddSubmit = handleStoreAddSubmit;
  window.openStoreManagerModal = openStoreManagerModal;
  window.closeStoreManagerModal = closeStoreManagerModal;
  window.setGrouping = setGrouping;
  window.openSettingsModal = openSettingsModal;
  window.closeSettingsModal = closeSettingsModal;
  window.handleBackupFileImport = handleBackupFileImport;
  window.copyBuyListJson = copyBuyListJson;
  window.copyBackupJson = copyBackupJson;
  window.pasteJsonFromClipboard = pasteJsonFromClipboard;
  window.openPasteJsonModal = openPasteJsonModal;
  window.submitPasteJson = submitPasteJson;
  window.processImportData = processImportData;

  window.handleTouchStart = handleTouchStart;
  window.handleTouchMove = handleTouchMove;
  window.handleTouchEnd = handleTouchEnd;
  window.handleTouchCancel = handleTouchCancel;
  window.handleItemSwipeAction = handleItemSwipeAction;
  window.renderStoreFilterOptions = renderStoreFilterOptions;
  window.renderKpis = renderKpis;
  window.renderItemList = renderItemList;
  window.renderItemCard = renderItemCard;
  window.onStoreFilterChange = onStoreFilterChange;
  window.initServiceWorker = initServiceWorker;
  window.showUpdateToast = showUpdateToast;
  window.applyPwaUpdate = applyPwaUpdate;
  window.checkForUpdates = checkForUpdates;
  window.purgeCacheAndReload = purgeCacheAndReload;
  window.openPriceLedgerModal = openPriceLedgerModal;
  window.renderPriceLedgerTable = renderPriceLedgerTable;
  window.toggleLedgerRowSelect = toggleLedgerRowSelect;
  window.toggleSelectAllLedgerRows = toggleSelectAllLedgerRows;
  window.addLedgerItemToBuyList = addLedgerItemToBuyList;
  window.addSelectedLedgerItemsToBuyList = addSelectedLedgerItemsToBuyList;
  window.deleteLedgerItem = deleteLedgerItem;
  window.deleteSelectedLedgerItems = deleteSelectedLedgerItems;
  window.processLedgerEntryIntoBuyList = processLedgerEntryIntoBuyList;
  window.updateLedgerBatchBar = updateLedgerBatchBar;
  window.mergeCloudState = mergeCloudState;
  window.merge3Way = merge3Way;
  window.reconcileMemoryState = reconcileMemoryState;
  window.StorageProvider = StorageProvider;
  window.IStorageProvider = StorageProvider;
  window.IndexedDBStorageProvider = IndexedDBStorageProvider;
  window.GoogleDriveStorageProvider = GoogleDriveStorageProvider;
  window.GitHubGistStorageProvider = GitHubGistStorageProvider;
  window.StorageManager = StorageManager;
  window.storageManager = storageManager;
  window.initGithubAuthState = initGithubAuthState;
  window.initGoogleAuthClient = initGoogleAuthClient;
  window.handleGoogleSignIn = handleGoogleSignIn;
  window.handleGoogleSignOut = handleGoogleSignOut;
  window.saveGoogleClientIdFromInput = saveGoogleClientIdFromInput;
  window.handleGithubConnect = handleGithubConnect;
  window.handleGithubDisconnect = handleGithubDisconnect;
  window.toggleGithubTokenVisibility = toggleGithubTokenVisibility;
  window.handleCloudProviderChange = handleCloudProviderChange;
  window.updateGithubGistUI = updateGithubGistUI;
  window.syncCloudNow = syncCloudNow;
  window.forceUploadCloud = forceUploadCloud;
  window.forceDownloadCloud = forceDownloadCloud;
  window.triggerDebouncedCloudSync = triggerDebouncedCloudSync;
  window.updateSyncStatusUI = updateSyncStatusUI;
  window.createCloudPayload = createCloudPayload;
  window.parseSmartGroceryInput = parseSmartGroceryInput;
  window.normalizeUnitCode = normalizeUnitCode;
  window.classifyGroceryCategory = classifyGroceryCategory;
  window.processBatchQuickInput = processBatchQuickInput;
  window.handleSmartQuickInputSubmit = handleSmartQuickInputSubmit;
  window.handleSmartQuickInputChange = handleSmartQuickInputChange;
  window.handleSmartQuickPaste = handleSmartQuickPaste;
  window.toggleAdvancedAddForm = toggleAdvancedAddForm;
  window.undoLastAction = undoLastAction;
  window.renderStoreFilterChips = renderStoreFilterChips;
  window.renderQuickPriceAdjustmentChips = renderQuickPriceAdjustmentChips;
  window.parseGitHubRateLimitError = parseGitHubRateLimitError;
  window.onSmartQuickStoreSelectChange = onSmartQuickStoreSelectChange;
  window.getQuickAddDefaultStore = getQuickAddDefaultStore;
  window.initApp = initApp;
  window.openFullItemEdit = openFullItemEdit;
  window.updateEditItemLivePreview = updateEditItemLivePreview;
  window.submitFullItemEdit = submitFullItemEdit;
  window.onEditStoreSelectChange = onEditStoreSelectChange;
  window.copyCurrentOriginToClipboard = copyCurrentOriginToClipboard;
  window.flushPendingCloudSync = flushPendingCloudSync;
  window.showToast = showToast;
  window.normalizeItemKey = normalizeItemKey;
  window.handlePopState = handlePopState;

  Object.defineProperty(window, "selectedLedgerIds", {
    get: () => selectedLedgerIds,
    set: (v) => {
      selectedLedgerIds = v;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(window, "currentPhase", {
    get: () => currentPhase,
    set: (v) => {
      currentPhase = v;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(window, "currentCategoryFilter", {
    get: () => currentCategoryFilter,
    set: (v) => {
      currentCategoryFilter = v;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(window, "activeComparingItemId", {
    get: () => activeComparingItemId,
    set: (v) => {
      activeComparingItemId = v;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(window, "currentGrouping", {
    get: () => currentGrouping,
    set: (v) => {
      currentGrouping = v;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(window, "currentStoreFilter", {
    get: () => currentStoreFilter,
    set: (v) => {
      currentStoreFilter = v;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(window, "currentLanguage", {
    get: () => currentLanguage,
    set: (v) => {
      currentLanguage = v;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(window, "currentCurrency", {
    get: () => currentCurrency,
    set: (v) => {
      currentCurrency = v;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(window, "googleAuthState", {
    get: () => googleAuthState,
    set: (v) => {
      googleAuthState = v;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(window, "githubAuthState", {
    get: () => githubAuthState,
    set: (v) => {
      githubAuthState = v;
    },
    enumerable: true,
    configurable: true,
  });

  window.TAB_ORDER = TAB_ORDER;
  window.setActiveTab = setActiveTab;
  window.updateBottomNavPills = updateBottomNavPills;
  window.handleModalBackdropClick = handleModalBackdropClick;
  window.handlePageTouchStart = handlePageTouchStart;
  window.handlePageTouchMove = handlePageTouchMove;
  window.handlePageTouchEnd = handlePageTouchEnd;
  window.handlePageSwipeAction = handlePageSwipeAction;
  window.openMergeReviewModal = openMergeReviewModal;
  window.renderMergeReviewModal = renderMergeReviewModal;
  window.computeMergeDiff = computeMergeDiff;
  window.applySmartMerge = applySmartMerge;
  window.importAsNewListWithSnapshot = importAsNewListWithSnapshot;
  window.saveActiveListSnapshot = saveActiveListSnapshot;
  window.setShareScope = setShareScope;
  window.updateShareScopeUI = updateShareScopeUI;
  window.getActiveShareList = getActiveShareList;
  window.resolveStoreAlias = resolveStoreAlias;
  window.onMergeGlobalQtyStrategyChange = onMergeGlobalQtyStrategyChange;
  window.onItemQtyStrategyChange = onItemQtyStrategyChange;
  window.onItemPriceToggle = onItemPriceToggle;
  window.toggleMergeItemInclude = toggleMergeItemInclude;
  window.toggleCloudSyncPopover = toggleCloudSyncPopover;
  window.closeCloudSyncPopover = closeCloudSyncPopover;
  window.handleCloudSyncPopoverOutsideClick =
    handleCloudSyncPopoverOutsideClick;
  window.triggerHeaderManualSync = triggerHeaderManualSync;
  window.openCloudSettingsFromPopover = openCloudSettingsFromPopover;
  window.triggerAutoSyncWithRetry = triggerAutoSyncWithRetry;
  window.openBackupPreviewModal = openBackupPreviewModal;
  window.executeConfirmedBackupRestore = executeConfirmedBackupRestore;
  window.saveFullStateSnapshot = saveFullStateSnapshot;
  window.restoreSnapshot = restoreSnapshot;
  window.restoreLastSnapshot = restoreLastSnapshot;
  window.updateSnapshotsUI = updateSnapshotsUI;

  Object.defineProperty(window, "currentShareScope", {
    get: () => currentShareScope,
    set: (v) => {
      currentShareScope = v;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(window, "currentMergeDiff", {
    get: () => currentMergeDiff,
    set: (v) => {
      currentMergeDiff = v;
    },
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(window, "currentActiveTab", {
    get: () => currentActiveTab,
    set: (v) => {
      currentActiveTab = v;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(window, "modalHistoryStack", {
    get: () => modalHistoryStack,
    set: (v) => {
      modalHistoryStack = v;
    },
    enumerable: true,
    configurable: true,
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    initApp,
    hydratePwaVersion,
    initServiceWorker,
    checkForUpdates,
  };
}
