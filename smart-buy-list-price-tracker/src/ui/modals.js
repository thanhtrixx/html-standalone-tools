/* =========================================================================
       10. UTILITIES, THEMES, LOCALIZATION & MODAL CONTROLLER
       ========================================================================= */
let modalHistoryStack = [];

function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("hidden");
    if (!modalHistoryStack.includes(id)) {
      modalHistoryStack.push(id);
      try {
        if (window.history && window.history.pushState) {
          window.history.pushState({ modalId: id }, "");
        }
      } catch (e) {
        // Ignore sandboxed history errors
      }
    }
    if (document.body && document.body.style) {
      document.body.style.overflow = "hidden";
    }
  }
}

function closeModal(id, fromPopState = false) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("hidden");
  }
  const index = modalHistoryStack.indexOf(id);
  if (index > -1) {
    modalHistoryStack.splice(index, 1);
    if (!fromPopState) {
      try {
        if (
          window.history &&
          window.history.state &&
          window.history.state.modalId === id
        ) {
          window.history.back();
        }
      } catch (e) {
        // Ignore sandboxed history errors
      }
    }
  }
  if (modalHistoryStack.length === 0) {
    if (document.body && document.body.style) {
      document.body.style.overflow = "";
    }
  }
}

function handleModalBackdropClick(event, id) {
  if (event.target === event.currentTarget) {
    closeModal(id);
  }
}

function handlePopState(event) {
  // Tier 1: If any modal is open, close topmost modal and stay on current tab
  if (modalHistoryStack.length > 0) {
    const topModal = modalHistoryStack[modalHistoryStack.length - 1];
    closeModal(topModal, true);
    return;
  }

  // Tier 2: Tab navigation history
  const targetTab = event && event.state && event.state.tab;
  if (targetTab && TAB_ORDER.includes(targetTab)) {
    if (targetTab !== currentActiveTab) {
      setActiveTab(targetTab, { fromPopState: true, preserveItem: true });
    }
  } else if (currentActiveTab !== "PLANNING") {
    // If history is at root / empty state and user is not on PLANNING, return to PLANNING
    setActiveTab("PLANNING", { fromPopState: true });
  }
  // Tier 3: If on PLANNING with empty modalHistoryStack, let browser back / PWA exit occur naturally
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.contains("dark");
  if (isDark) {
    html.classList.remove("dark");
    html.classList.add("light");
    if (memoryState && memoryState.settings) {
      memoryState.settings.theme = "light";
    }
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) themeBtn.textContent = "☀️";
  } else {
    html.classList.remove("light");
    html.classList.add("dark");
    if (memoryState && memoryState.settings) {
      memoryState.settings.theme = "dark";
    }
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) themeBtn.textContent = "🌙";
  }
  saveToLocalStorage();
}

function setLanguage(lang) {
  if (lang !== "en" && lang !== "vi") return;
  currentLanguage = lang;
  if (document.documentElement) {
    document.documentElement.lang = lang;
  }
  if (memoryState && memoryState.settings) {
    memoryState.settings.language = lang;
  }
  saveToLocalStorage();
  const t = TRANSLATIONS[currentLanguage];
  const langBtn = document.getElementById("langToggleBtn");
  if (langBtn) {
    langBtn.textContent = currentLanguage === "vi" ? "🇻🇳" : "🇺🇸";
    langBtn.title =
      currentLanguage === "vi"
        ? (t && t.lang_flag_toggle_vi) ||
          "Ngôn ngữ: 🇻🇳 Việt Nam (Tiếng Việt) — Bấm để đổi sang 🇺🇸 United States (English)"
        : (t && t.lang_flag_toggle_en) ||
          "Language: 🇺🇸 United States (English) — Click to switch to 🇻🇳 Việt Nam (Tiếng Việt)";
  }
  const langSelect = document.getElementById("settingsLanguageSelect");
  if (langSelect) langSelect.value = currentLanguage;
  applyTranslations();
  renderApp();
  runComparatorCalc();
  updateLiveUnitPreview();
}

function toggleLanguage() {
  setLanguage(currentLanguage === "en" ? "vi" : "en");
}

function setCurrency(cur) {
  currentCurrency = cur;
  if (memoryState && memoryState.settings) {
    memoryState.settings.currency = cur;
  }
  saveToLocalStorage();
  const curSelect = document.getElementById("settingsCurrencySelect");
  if (curSelect) curSelect.value = currentCurrency;
  renderQuickPriceAdjustmentChips();
  renderApp();
}

function getVerbalAmount(amount, lang = currentLanguage) {
  const num = Math.abs(parseFloat(amount) || 0);
  if (lang === "vi") {
    if (num >= 1e9) {
      const b = (num / 1e9).toFixed(1).replace(/\.0$/, "");
      return `${b} Tỷ VND`;
    }
    if (num >= 1e6) {
      const m = (num / 1e6).toFixed(1).replace(/\.0$/, "");
      return `${m} Triệu VND`;
    }
    if (num >= 1e3) {
      const k = (num / 1e3).toFixed(1).replace(/\.0$/, "");
      return `${k} Nghìn VND`;
    }
    return `${num} VND`;
  } else {
    if (num >= 1e9) {
      const b = (num / 1e9).toFixed(1).replace(/\.0$/, "");
      return `${b} Billion ${currentCurrency}`;
    }
    if (num >= 1e6) {
      const m = (num / 1e6).toFixed(1).replace(/\.0$/, "");
      return `${m} Million ${currentCurrency}`;
    }
    if (num >= 1e3) {
      const k = (num / 1e3).toFixed(1).replace(/\.0$/, "");
      return `${k} Thousand ${currentCurrency}`;
    }
    return `${num} ${currentCurrency}`;
  }
}

function handleGlobalKeyDown(e) {
  if (e.key === "Escape") {
    if (modalHistoryStack.length > 0) {
      const topModalId = modalHistoryStack[modalHistoryStack.length - 1];
      closeModal(topModalId);
    } else {
      [
        "editItemModal",
        "quickPriceModal",
        "storeManagerModal",
        "shareModal",
        "importModal",
        "pasteJsonModal",
        "tripCompleteModal",
        "settingsModal",
      ].forEach((id) => closeModal(id));
    }
  }
  const tag = (e.target && e.target.tagName) || "";
  if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
  if (e.key === "n" || e.key === "N") {
    e.preventDefault();
    const smartInput = document.getElementById("smartQuickInput");
    if (smartInput) {
      smartInput.focus();
    } else {
      const input = document.getElementById("inputItemName");
      if (input) input.focus();
    }
  } else if (e.key === "c" || e.key === "C") {
    e.preventDefault();
    openComparatorModal();
  } else if (e.key === "s" || e.key === "S") {
    e.preventDefault();
    openShareModal();
  }
}

function applyTranslations() {
  const t = TRANSLATIONS[currentLanguage];
  const el = (id, text) => {
    const e = document.getElementById(id);
    if (e && text !== undefined) e.textContent = text;
  };

  // Header & Navigation
  el("headerTitle", t.app_title);
  el("headerSubtitle", t.app_subtitle);
  el("btnShareText", t.btn_share_header || "Share");
  const langBtn = document.getElementById("langToggleBtn");
  if (langBtn) {
    langBtn.textContent = currentLanguage === "vi" ? "🇻🇳" : "🇺🇸";
    langBtn.title =
      currentLanguage === "vi"
        ? t.lang_flag_toggle_vi ||
          "Ngôn ngữ: 🇻🇳 Việt Nam (Tiếng Việt) — Bấm để đổi sang 🇺🇸 United States (English)"
        : t.lang_flag_toggle_en ||
          "Language: 🇺🇸 United States (English) — Click to switch to 🇻🇳 Việt Nam (Tiếng Việt)";
  }
  el("tripSummaryHeading", t.trip_summary_heading || "Shopping Trip");
  el("labelStoreFilter", t.store_filter || "Store:");
  el("kpiItemsLabel", t.kpi_items);
  el("kpiSpentLabel", t.kpi_spent);
  el("kpiEstimatedLabel", t.kpi_estimated);
  el("tripProgressTitle", t.progress_pacing || "Shopping Progress");
  el("tripRemainingSpendLabel", t.remaining_spend || "Remaining");
  if (currentPhase === "PLANNING") {
    el("tripSummaryPrompt", t.trip_planning_prompt || "Ready to Complete Trip");
  } else {
    el("tripSummaryPrompt", t.trip_active);
  }
  el("btnFinishTripText", t.btn_finish_trip);
  el("navLabelList", t.nav_list);
  el("navLabelCompare", t.nav_compare);
  el("navLabelLedger", t.nav_ledger);
  el("navLabelShare", t.nav_share);
  el("navLabelPlanning", t.nav_planning || t.tab_planning || "Planning");
  el("navLabelBuyMode", t.nav_buy_mode || t.tab_in_store || "Buy");

  // Banner & Empty State
  el("sampleDataText", t.sample_banner_text);
  el("btnKeepSample", t.btn_keep_sample || "Keep");
  el("btnClearSample", t.btn_clear_sample || "Clear");
  el("listTitleText", t.list_title);
  el("btnGroupByAisle", t.by_aisle);
  el("btnGroupByStore", t.by_store);
  el("emptyListTitle", t.empty_title);
  if (currentPhase === "IN_STORE") {
    el(
      "emptyListDesc",
      t.empty_buy_mode_desc ||
        "No items to buy right now. Switch to Planning mode to add items."
    );
  } else {
    el("emptyListDesc", t.empty_planning_desc || t.empty_desc);
  }
  el(
    "btnEmptySwitchToPlanningText",
    t.btn_empty_switch_to_planning || "Switch to Planning"
  );
  el("checkedSectionTitle", t.checked_section);
  el("checkedToggleHint", t.tap_toggle);

  // Smart Quick-Entry Omnibox
  el("smartQuickHeadingText", t.smart_quick_heading || "Quick Add Item");
  el(
    "btnToggleAdvancedAddText",
    t.smart_quick_advanced_toggle || "Detailed Options"
  );
  const smartQuickStore = document.getElementById("smartQuickStoreSelect");
  if (smartQuickStore)
    smartQuickStore.title =
      t.smart_quick_store_title || "Target store for quick add";
  const smartInput = document.getElementById("smartQuickInput");
  if (smartInput)
    smartInput.placeholder =
      t.smart_quick_placeholder ||
      "Quick add e.g. Whole Milk 35k/l, Beef 120k 500g, Eggs 30k 10 ea...";
  const smartAddBtn = document.getElementById("btnSmartQuickAdd");
  if (smartAddBtn)
    smartAddBtn.title = (t.smart_quick_add_btn || "Add Item") + " (Enter)";

  // Add Item Form
  el("addItemHeading", t.add_item_title);
  el("labelItemQty", t.label_qty);
  el("labelItemUnit", t.label_unit);
  el("labelItemPrice", t.label_price);
  el("btnAddItemText", t.btn_add_item);
  el("liveDealBadge", t.new_item || "New Item");
  el(
    "liveUnitPreviewText",
    `${t.unit_price_preview || "Unit Price:"} ${formatCurrency(0)} / L`
  );
  const inputName = document.getElementById("inputItemName");
  if (inputName) inputName.placeholder = t.item_name_placeholder;
  renderCategoryOptions();
  renderUnitOptions();

  // 1. Comparator Modal
  el("compModalTitleText", t.comp_modal_title);
  el("compModalDesc", t.comp_modal_desc);
  el("compItemNameLabel", t.comp_comparing_item);
  el("compActiveBadge", t.comp_package_a_active);
  el("labelPackageA", t.comp_package_a_label);
  el("labelPackageB", t.comp_package_b_label);
  el("labelPriceA", t.comp_price);
  el("labelPriceB", t.comp_price);
  el("labelQtyA", t.comp_qty);
  el("labelQtyB", t.comp_qty);
  el("labelUnitA", t.comp_unit);
  el("labelUnitB", t.comp_unit);
  el("labelNormPriceA", t.comp_unit_price);
  el("labelNormPriceB", t.comp_unit_price);
  el("btnCloseComparator", t.btn_close);
  el("btnApplyWinnerText", t.btn_apply_winner || "Apply Winner to List");
  el("btnApplyWinner", t.btn_apply_winner_form || "Apply Winner to Form");

  // 2. Share Modal
  el("shareModalTitleText", t.share_modal_title);
  el("shareModalDesc", t.share_modal_desc);
  el("btnNativeShareText", t.btn_native_share);
  el(
    "btnCopyTextChecklistText",
    t.btn_copy_text_checklist || "Copy Formatted Checklist"
  );
  el("btnCopyUrlText", t.btn_copy_url);
  el(
    "btnExportBuyListFileText",
    t.btn_export_buylist_file || "Download Buy-List File (.json)"
  );

  // 3. Import Modal
  el("importModalTitleText", t.import_modal_title);
  el("importListTitle", t.import_list_title);
  el(
    "importItemCount",
    (t.import_item_count || "Contains {count} items").replace(
      "{count}",
      window.pendingSharedList ? window.pendingSharedList.items.length : 5
    )
  );
  el("btnImportMergeText", t.btn_import_merge);
  el("btnImportReplaceText", t.btn_import_replace);

  // 3.5. Paste JSON Fallback Modal
  el("pasteModalTitleText", t.paste_modal_title || "Paste JSON / Share Link");
  el("pasteModalDesc", t.paste_modal_desc);
  el("btnSubmitPasteJsonText", t.btn_submit_paste || "Import Data");
  const pasteTextarea = document.getElementById("pasteJsonTextarea");
  if (pasteTextarea)
    pasteTextarea.placeholder =
      t.paste_modal_placeholder || "Paste JSON or #share= link here...";

  // 3.6. Merge Review Modal & Store-Scoped Sharing
  el("mergeReviewModalTitleText", t.merge_modal_title);
  el("mergeReviewModalSubtitle", t.merge_modal_subtitle);
  el("lblStatNew", t.merge_stat_new);
  el("lblStatPrice", t.merge_stat_price);
  el("lblStatQty", t.merge_stat_qty);
  el("lblStatMatch", t.merge_stat_match);
  el("lblGlobalQtyStrategy", t.merge_global_qty_strategy);
  el("optQtySum", t.merge_qty_sum);
  el("optQtyRemote", t.merge_qty_remote);
  el("optQtyLocal", t.merge_qty_local);
  el("lblUpdatePriceCatalog", t.merge_update_price_catalog);
  el("btnApplyMergeText", t.btn_apply_merge);
  el("btnImportNewListText", t.btn_import_new_list_snapshot);
  el("lblShareScope", t.lbl_share_scope);
  el(
    "shareScopeAllLabel",
    currentLanguage === "vi" ? "Tất Cả Cửa Hàng" : "All Stores"
  );

  // 4. Trip Complete Modal
  el("tripModalTitleText", t.trip_modal_title);
  el("tripModalPurchasedLabel", t.trip_modal_purchased_label);
  el("tripModalTotalSpentLabel", t.trip_modal_total_spent_label);
  el("tripModalTotalSpentVal", formatCurrency(0));
  const itemsWord = currentLanguage === "vi" ? "mặt hàng" : "items";
  const leftWord =
    currentLanguage === "vi" ? "mặt hàng chưa mua." : "items left unchecked.";
  el("tripModalPurchasedCount", `0 ${itemsWord}`);
  el("unpurchasedCountText", `0 ${leftWord}`);
  el("labelRolloverChoice", t.label_rollover_choice);
  el("optRolloverText", t.opt_rollover_text);
  el("optDiscardText", t.opt_discard_text);
  el("btnFinalizeTrip", t.btn_finalize_trip);

  // 5. Price Ledger Modal
  el("ledgerModalTitleText", t.ledger_modal_title);
  const ledgerInput = document.getElementById("ledgerSearchInput");
  if (ledgerInput) ledgerInput.placeholder = t.ledger_search_placeholder;
  el("thSelect", t.th_select || "Select");
  el("thDate", t.th_date);
  el("thItem", t.th_item);
  el("thStore", t.th_store);
  el("thSize", t.th_size);
  el("thPaid", t.th_paid);
  el("thUnitPrice", t.th_unit_price);
  el("thDealRating", t.th_deal_rating || "Deal Rating");
  el("thAction", t.th_action || "Action");
  el("btnLedgerSelectAllToggle", t.ledger_select_all || "Select All");
  el(
    "btnTextAddSelectedLedger",
    t.btn_add_selected_ledger || "Add Selected to Buy List"
  );
  el(
    "btnTextDeleteSelectedLedger",
    t.ledger_delete_selected || "Delete Selected"
  );

  // 5.5. Full Item Edit Modal
  el("editItemModalHeading", t.edit_modal_title || "Edit Item Details");
  el("editItemNameLabel", t.edit_item_name_label || "Item Name");
  el("editItemCategoryLabel", t.edit_item_cat_label || "Category / Department");
  el("editItemStoreLabel", t.edit_item_store_label || "Assigned Store");
  el("editItemQtyLabel", t.edit_item_qty_label || "Qty");
  el("editItemUnitLabel", t.edit_item_unit_label || "Unit");
  el("editItemPriceLabel", t.edit_item_price_label || "Price");
  el("btnCancelEditItem", t.btn_cancel || "Cancel");
  el("btnSaveEditItem", t.btn_save_edit_item || "Save Changes");

  // 6. Quick Price Modal
  el("quickPriceModalHeading", t.quick_price_title || "Quick Price Update");
  el("quickPriceItemNameLabel", t.quick_price_item_name);
  el("quickPriceInputLabel", t.quick_price_shelf);
  el("quickQtyInputLabel", t.quick_price_qty);
  el("quickPriceAdjustLabel", t.quick_price_adjust_label);
  el("btnCancelQuickPrice", t.btn_cancel);
  el("btnSaveQuickPrice", t.btn_save_price || "Update Price");

  // 7. Store Manager Modal
  el("storeManagerModalTitle", t.manage_stores_title || "Manage Stores");
  const newStoreInput = document.getElementById("inputNewStoreName");
  if (newStoreInput) newStoreInput.placeholder = t.input_store_placeholder;
  el("btnAddStoreSubmit", t.add_store_btn || "Add Store");
  el("storeManagerListLabel", t.existing_stores_label);
  el("btnCloseStoreManager", t.btn_close);

  // 8. Settings Modal
  el("settingsModalTitle", t.settings_title || "Settings");
  el(
    "settingsModalSubtitle",
    t.settings_subtitle ||
      "Configure stores, preferences, language, and data backups"
  );
  el("settingsStoreTitle", t.settings_store_title);
  el("settingsStoreDesc", t.settings_store_desc);
  el("btnManageStoresInSettings", t.manage_stores_title);
  el("settingsPrefHeading", t.settings_pref_heading);
  el("settingsDefaultCurrencyLabel", t.settings_default_currency);
  el("settingsLanguageLabel", t.settings_language_label || "Language");
  el("settingsDefaultGroupingLabel", t.settings_default_grouping);
  el("optGroupingAisle", t.grouping_by_aisle);
  el("optGroupingStore", t.grouping_by_store);
  const langSelect = document.getElementById("settingsLanguageSelect");
  if (langSelect) langSelect.value = currentLanguage;
  el("settingsDataHeading", t.settings_data_heading);
  el("btnExportBackupText", t.btn_export_json_backup);
  el("btnCopyBackupJsonText", t.btn_copy_backup_json || "Copy JSON");
  el("btnImportBackupText", t.btn_import_json_backup);
  el("btnPasteJsonText", t.btn_paste_json || "Paste JSON");
  el("btnResetSampleDataText", t.btn_load_sample_data || "Load Sample Data");
  el(
    "btnClearAllDataInSettingsText",
    t.btn_clear_all_data_settings || t.btn_clear_all_data || "Clear All Data"
  );
  el("btnRestoreLastSnapshotText", t.btn_restore_last_snapshot);

  // 8.0. Backup Restore Preview Modal (Issue #308)
  el("backupPreviewModalTitle", t.backup_preview_title);
  el("backupPreviewSubtitle", t.backup_preview_subtitle);
  el("btnConfirmBackupRestoreText", t.btn_confirm_restore);

  el("settingsSyncTitle", t.settings_sync_title);
  el("settingsSyncStatus", t.settings_sync_status);
  el("settingsSyncBadge", t.badge_local_only);

  // 8.1. Multi-Provider Cloud Sync Section
  el("cloudSyncTitle", t.cloud_sync_title || "Cloud Synchronization");
  el(
    "cloudProviderLabel",
    t.cloud_provider_label || "Active Cloud Storage Provider"
  );
  el("optProviderNone", t.cloud_provider_none || "Disabled (Local Only)");
  el(
    "optProviderGDrive",
    t.cloud_provider_googledrive || "Google Drive (AppData)"
  );
  el("optProviderGitHub", t.cloud_provider_github || "GitHub Gist (Secret)");

  // Google Drive Panel
  el(
    "cloudSyncClientIdLabel",
    t.cloud_sync_client_id_label || "Google OAuth 2.0 Client ID"
  );
  el("gdriveGuideLinkText", t.gdrive_guide_link || "Setup Guide (2 min) ↗");
  el(
    "gdriveOriginLabel",
    t.gdrive_origin_label || "Authorized JavaScript Origin:"
  );
  el("btnCopyOriginText", t.btn_copy_origin || "📋 Copy");
  const clientIdInput = document.getElementById("googleClientIdInput");
  if (clientIdInput)
    clientIdInput.placeholder =
      t.cloud_sync_client_id_placeholder ||
      "e.g. 12345-abc.apps.googleusercontent.com";
  el("btnGoogleSignInText", t.btn_google_signin || "Sign in with Google");
  el("btnGoogleSignOutText", t.btn_google_signout || "Disconnect Drive");
  el("btnGoogleSyncNowText", t.btn_google_sync_now || "Sync Now");
  el("btnForceUploadText", t.btn_force_upload || "Force Upload to Cloud");
  el(
    "btnForceDownloadText",
    t.btn_force_download || "Force Download from Cloud"
  );

  const btnGSync = document.getElementById("btnGoogleSyncNow");
  if (btnGSync) btnGSync.title = t.sync_now_tooltip || "";
  const btnFU = document.getElementById("btnForceUpload");
  if (btnFU) btnFU.title = t.force_upload_tooltip || "";
  const btnFD = document.getElementById("btnForceDownload");
  if (btnFD) btnFD.title = t.force_download_tooltip || "";

  // GitHub Gist Panel
  el(
    "githubTokenLabel",
    t.github_token_label || "GitHub Personal Access Token (PAT)"
  );
  el(
    "githubTokenHelperLink",
    t.github_token_helper || "Create token on GitHub ↗"
  );
  const tokenInput = document.getElementById("githubTokenInput");
  if (tokenInput)
    tokenInput.placeholder =
      t.github_token_placeholder || "ghp_... or github_pat_...";
  el("githubGistIdLabel", t.github_gist_id_label || "Gist ID (Optional)");
  const gistIdInput = document.getElementById("githubGistIdInput");
  if (gistIdInput)
    gistIdInput.placeholder =
      t.github_gist_id_placeholder || "Auto-discovered or paste Gist ID";
  el(
    "githubRememberTokenLabel",
    t.github_remember_token || "Remember token on this device"
  );
  el("btnGithubConnectText", t.btn_github_connect || "Connect & Verify");
  el("btnGithubDisconnectText", t.btn_github_disconnect || "Disconnect");
  el("btnGithubSyncNowText", t.btn_github_sync_now || "Sync Now");
  el("btnGithubForceUploadText", t.btn_force_upload || "Force Upload to Cloud");
  el(
    "btnGithubForceDownloadText",
    t.btn_force_download || "Force Download from Cloud"
  );
  el("githubViewGistLink", t.github_view_gist || "View Gist on GitHub ↗");

  const btnGHSync = document.getElementById("btnGithubSyncNow");
  if (btnGHSync) btnGHSync.title = t.sync_now_tooltip || "";
  const btnGHFU = document.getElementById("btnGithubForceUpload");
  if (btnGHFU) btnGHFU.title = t.force_upload_tooltip || "";
  const btnGHFD = document.getElementById("btnGithubForceDownload");
  if (btnGHFD) btnGHFD.title = t.force_download_tooltip || "";

  el(
    "cloudSyncPopoverHeading",
    "☁️ " + (t.cloud_sync_popover_title || "Trạng thái Cloud Sync")
  );
  el("btnHeaderSyncNowText", t.btn_sync_now || "Đồng bộ ngay");

  updateSyncStatusUI(storageManager.getCloudProviderStatus());

  el("settingsPwaTitle", t.pwa_section_title || "App Updates & Cache (PWA)");
  el("btnCheckUpdatesText", t.check_updates_btn || "Check for Updates");
  el("btnPurgeCacheText", t.purge_cache_btn || "Purge Cache & Reload");
  el("btnCloseSettings", t.btn_close);

  // PWA Update Toast
  el("updateToastTitle", t.update_available_title || "New Version Available");
  el(
    "updateToastDesc",
    t.update_available_desc || "A new version of Smart Buy-List is ready."
  );
  el("btnApplyPwaUpdate", t.update_btn_refresh || "Update Now");

  // Dynamic ARIA Labels
  const setAria = (element, val) => {
    if (element && typeof element.setAttribute === "function") {
      element.setAttribute("aria-label", val);
    }
  };

  setAria(
    langBtn,
    t.aria_toggle_language ||
      (currentLanguage === "vi"
        ? "Đổi sang Tiếng Anh"
        : "Switch language to Vietnamese")
  );
  setAria(
    document.getElementById("themeToggleBtn"),
    t.aria_toggle_theme || "Toggle dark/light theme"
  );
  setAria(
    document.getElementById("btnOpenSettings"),
    t.aria_open_settings || "Open settings"
  );
  setAria(
    document.getElementById("btnOpenShareModal"),
    t.aria_open_share || "Open share options"
  );
  setAria(smartAddBtn, t.aria_quick_add_btn || "Add item to buy list");
  setAria(
    document.getElementById("navPlanningBtn"),
    t.aria_nav_planning || "Switch to Planning mode"
  );
  setAria(
    document.getElementById("navBuyModeBtn"),
    t.aria_nav_buymode || "Switch to Buy mode"
  );
  setAria(
    document.getElementById("navLedgerBtn"),
    t.aria_nav_ledger || "Open price history ledger"
  );
  setAria(
    document.getElementById("navCompareBtn"),
    t.aria_nav_compare || "Open package comparator"
  );
  setAria(
    document.getElementById("btnSaveClientId"),
    t.aria_save_client_id || "Save Client ID"
  );
  setAria(
    document.getElementById("btnToggleGithubTokenVisibility"),
    t.aria_toggle_token_visibility || "Toggle token visibility"
  );

  if (
    typeof document !== "undefined" &&
    typeof document.querySelectorAll === "function"
  ) {
    const closeBtns = document.querySelectorAll(
      '[data-i18n-aria="modal_close_btn"]'
    );
    if (closeBtns && typeof closeBtns.forEach === "function") {
      closeBtns.forEach((btn) => {
        setAria(btn, t.modal_close_btn || "Close dialog");
      });
    }
  }
}

function showToast(message, options = {}) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className =
    "bg-slate-800 border border-emerald-500/80 text-slate-100 text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto flex items-center justify-between gap-3";

  if (
    options &&
    options.actionText &&
    typeof options.onAction === "function" &&
    typeof toast.appendChild === "function"
  ) {
    const msgSpan = document.createElement("span");
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);

    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    actionBtn.className =
      "bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold px-2 py-1 rounded-lg text-[11px] transition-all cursor-pointer whitespace-nowrap shadow";
    actionBtn.textContent = options.actionText;
    actionBtn.onclick = (e) => {
      if (e && typeof e.stopPropagation === "function") {
        e.stopPropagation();
      }
      if (typeof toast.remove === "function") {
        toast.remove();
      }
      options.onAction();
    };
    toast.appendChild(actionBtn);
  } else {
    toast.textContent = message;
  }

  if (typeof container.appendChild === "function") {
    container.appendChild(toast);
  }

  setTimeout(() => {
    if (toast.classList && typeof toast.classList.remove === "function") {
      toast.classList.remove("translate-y-2", "opacity-0");
    }
  }, 10);

  setTimeout(() => {
    if (toast.classList && typeof toast.classList.add === "function") {
      toast.classList.add("opacity-0", "-translate-y-2");
    }
    setTimeout(() => {
      if (typeof toast.remove === "function") {
        toast.remove();
      }
    }, 300);
  }, 3500);
}

function handleItemAutocomplete(val) {
  const dropdown = document.getElementById("autocompleteDropdown");
  if (!dropdown) return;
  const q = (val || "").toLowerCase().trim();
  if (q.length < 1) {
    dropdown.classList.add("hidden");
    return;
  }

  const matches = memoryState.purchaseLedger
    .filter((l) => l.itemName.toLowerCase().includes(q))
    .map((l) => l.itemName);
  const unique = Array.from(new Set(matches)).slice(0, 5);

  if (unique.length === 0) {
    dropdown.classList.add("hidden");
    return;
  }

  dropdown.innerHTML = unique
    .map((name) => {
      const safeName = sanitizeHTML(name);
      const escapedName = safeName.replace(/'/g, "\\'");
      return `
        <button type="button" onclick="selectAutocomplete('${escapedName}')" class="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-emerald-600/30 hover:text-white transition-colors">
          <span aria-hidden="true">🔍</span> ${safeName}
        </button>
      `;
    })
    .join("");
  dropdown.classList.remove("hidden");
}

function selectAutocomplete(name) {
  const input = document.getElementById("inputItemName");
  if (input) input.value = name;
  const dropdown = document.getElementById("autocompleteDropdown");
  if (dropdown) dropdown.classList.add("hidden");
}

function toggleCheckedSection() {
  const list = document.getElementById("checkedItemsList");
  const chevron = document.getElementById("checkedChevron");
  if (list) {
    list.classList.toggle("hidden");
    if (chevron)
      chevron.textContent = list.classList.contains("hidden") ? "▶" : "▼";
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    openModal,
    closeModal,
    openEditItemModal,
    openQuickPriceModal,
  };
}
