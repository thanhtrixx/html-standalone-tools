/* =========================================================================
       6c. OPTION HUB & SETTINGS CONTROLLER
       ========================================================================= */
function openSettingsModal() {
  const curSelect = document.getElementById("settingsCurrencySelect");
  const grpSelect = document.getElementById("settingsGroupingSelect");
  const langSelect = document.getElementById("settingsLanguageSelect");
  if (curSelect) curSelect.value = currentCurrency;
  if (grpSelect) grpSelect.value = currentGrouping;
  if (langSelect) langSelect.value = currentLanguage;
  openModal("settingsModal");
}

function closeSettingsModal() {
  closeModal("settingsModal");
}

function exportJsonBackup() {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(memoryState, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute(
    "download",
    `smart_buy_list_backup_${new Date().toISOString().slice(0, 10)}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast(
    TRANSLATIONS[currentLanguage].toast_backup_exported ||
      "JSON backup exported!"
  );
}

function openBackupPreviewModal(parsed) {
  if (!parsed || typeof parsed !== "object") return;
  window.pendingBackupRestore = parsed;

  const dateEl = document.getElementById("backupPreviewExportDate");
  const verEl = document.getElementById("backupPreviewVersion");
  const curItems = document.getElementById("backupCurrentItemCount");
  const incItems = document.getElementById("backupIncomingItemCount");
  const curLedger = document.getElementById("backupCurrentLedgerCount");
  const incLedger = document.getElementById("backupIncomingLedgerCount");
  const curStores = document.getElementById("backupCurrentStoreCount");
  const incStores = document.getElementById("backupIncomingStoreCount");

  const exportDate =
    parsed.exportDate ||
    parsed.timestamp ||
    (parsed.metadata && parsed.metadata.exportedAt) ||
    null;
  if (dateEl) {
    if (exportDate) {
      try {
        dateEl.textContent = new Date(exportDate).toLocaleString();
      } catch (e) {
        dateEl.textContent = String(exportDate);
      }
    } else {
      dateEl.textContent = "Không xác định / N/A";
    }
  }

  if (verEl) {
    verEl.textContent =
      parsed.appVersion ||
      parsed.version ||
      (parsed.metadata && parsed.metadata.appVersion) ||
      "v4.x";
  }

  if (curItems) {
    curItems.textContent = (memoryState.activeList?.items || []).length;
  }
  if (incItems) {
    incItems.textContent = (parsed.activeList?.items || []).length;
  }

  if (curLedger) {
    curLedger.textContent = (memoryState.purchaseLedger || []).length;
  }
  if (incLedger) {
    incLedger.textContent = (parsed.purchaseLedger || []).length;
  }

  if (curStores) {
    curStores.textContent = (memoryState.stores || []).length;
  }
  if (incStores) {
    incStores.textContent = (parsed.stores || []).length;
  }

  const autoCheck = document.getElementById("backupAutoSnapshotCheckbox");
  if (autoCheck) {
    autoCheck.checked = true;
  }

  openModal("backupPreviewModal");
  applyTranslations();
}

function executeConfirmedBackupRestore() {
  const parsed = window.pendingBackupRestore;
  if (!parsed || typeof parsed !== "object") {
    closeModal("backupPreviewModal");
    return;
  }

  const autoSnapshot = document.getElementById("backupAutoSnapshotCheckbox");
  const shouldSnapshot = autoSnapshot ? autoSnapshot.checked : true;

  if (shouldSnapshot) {
    saveFullStateSnapshot("PRE_BACKUP_RESTORE");
  }

  if (parsed.activeList) memoryState.activeList = parsed.activeList;
  if (Array.isArray(parsed.purchaseLedger))
    memoryState.purchaseLedger = parsed.purchaseLedger;
  if (Array.isArray(parsed.stores)) memoryState.stores = parsed.stores;
  if (parsed.storeAliases && typeof parsed.storeAliases === "object")
    memoryState.storeAliases = parsed.storeAliases;
  if (parsed._deleted && typeof parsed._deleted === "object") {
    memoryState._deleted = parsed._deleted;
  } else if (!memoryState._deleted) {
    memoryState._deleted = { items: {}, ledger: {}, stores: {} };
  }
  pruneDeletedTombstones(memoryState._deleted);
  if (parsed.settings)
    memoryState.settings = Object.assign(memoryState.settings, parsed.settings);

  saveToLocalStorage();
  renderApp();
  const tr = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
  showToast(tr.toast_backup_imported || "Backup imported successfully!");
  window.pendingBackupRestore = null;
  closeModal("backupPreviewModal");
  closeModal("pasteJsonModal");
  closeModal("settingsModal");
}

function handleBackupFileImport(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed && typeof parsed === "object") {
        if (
          parsed.activeList ||
          Array.isArray(parsed.purchaseLedger) ||
          Array.isArray(parsed.stores)
        ) {
          openBackupPreviewModal(parsed);
          if (event.target) event.target.value = "";
          return;
        }
      }
      showToast("Invalid JSON backup format");
    } catch (err) {
      console.error("Failed to parse backup JSON", err);
      showToast("Invalid JSON backup file");
    }
  };
  reader.readAsText(file);
}

function renderStoreFilterChips() {
  const container = document.getElementById("storeFilterChips");
  if (!container) return;

  const stores = memoryState.stores || DEFAULT_STORES;
  const items =
    memoryState.activeList && Array.isArray(memoryState.activeList.items)
      ? memoryState.activeList.items
      : [];
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;

  const availableStores = new Set(items.map((i) => i.store).filter(Boolean));

  if (
    currentStoreFilter !== "ALL" &&
    !availableStores.has(currentStoreFilter)
  ) {
    currentStoreFilter = "ALL";
    const select = document.getElementById("storeFilterSelect");
    if (select) select.value = "ALL";
  }

  const allChip = {
    key: "ALL",
    label: t.store_all || "All Stores",
    count: items.length,
  };

  const relevantStores = stores.filter((s) => availableStores.has(s));
  const storeChips = relevantStores.map((s) => ({
    key: s,
    label: s,
    count: items.filter((i) => i.store === s).length,
  }));

  let html = `
          <button
            type="button"
            onclick="onStoreFilterChange('ALL')"
            aria-label="${allChip.label} (${allChip.count})"
            class="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
              currentStoreFilter === "ALL"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }"
          >
            <span>${allChip.label}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full ${
              currentStoreFilter === "ALL"
                ? "bg-emerald-700 text-emerald-100"
                : "bg-slate-700 text-slate-300"
            }">${allChip.count}</span>
          </button>
        `;

  storeChips.forEach((chip) => {
    const isActive = currentStoreFilter === chip.key;
    const escapedKey = sanitizeHTML(chip.key).replace(/'/g, "\\'");
    const safeLabel = sanitizeHTML(chip.label);
    html += `
            <button
              type="button"
              onclick="onStoreFilterChange('${escapedKey}')"
              aria-label="${safeLabel} (${chip.count})"
              class="px-2.5 py-1 rounded-full text-xs shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
              }"
            >
              <span>${safeLabel}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive
                  ? "bg-emerald-700 text-emerald-100"
                  : "bg-slate-700 text-slate-300"
              }">${chip.count}</span>
            </button>
          `;
  });

  html += `
          <button
            type="button"
            onclick="openStoreManagerModal()"
            class="px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all flex items-center gap-1 bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700 border border-dashed border-slate-700 cursor-pointer"
            title="${t.manage_stores_title || "Manage Stores..."}"
            aria-label="${t.manage_stores_title || "Manage Stores..."}"
          >
            <span aria-hidden="true">⚙️</span>
            <span>${t.manage_stores_title || "Manage Stores..."}</span>
          </button>
        `;

  container.innerHTML = html;
}

function renderCategoryFilterChips() {
  const container = document.getElementById("categoryFilterChips");
  if (!container) return;

  const items = memoryState.activeList.items;
  const availableCategories = new Set(items.map((i) => i.category || "other"));

  const lang = currentLanguage === "vi" ? "vi" : "en";
  const cats = [
    {
      key: "ALL",
      label:
        TRANSLATIONS[currentLanguage].aisle_all ||
        (lang === "vi" ? "Tất Cả" : "All"),
      icon: "🛒",
    },
    ...Object.entries(CATEGORIES).map(([key, cat]) => ({
      key,
      label: cat[lang],
      icon: cat.icon,
    })),
  ];

  const relevantCats = cats.filter(
    (c) =>
      c.key === "ALL" ||
      availableCategories.has(c.key) ||
      (c.key === "dairy" && availableCategories.has("dairy_eggs")) ||
      (c.key === "meat" && availableCategories.has("meat_seafood"))
  );

  container.innerHTML = relevantCats
    .map((c) => {
      const isActive = currentCategoryFilter === c.key;
      const count =
        c.key === "ALL"
          ? items.length
          : items.filter(
              (i) =>
                i.category === c.key ||
                (c.key === "dairy" &&
                  (i.category === "dairy" || i.category === "dairy_eggs")) ||
                (c.key === "meat" &&
                  (i.category === "meat" || i.category === "meat_seafood"))
            ).length;
      return `
            <button
              type="button"
              onclick="filterByCategory('${c.key}')"
              aria-label="${c.label} (${count})"
              class="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1 border ${
                isActive
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                  : "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white"
              }"
            >
              <span aria-hidden="true">${c.icon}</span>
              <span>${c.label}</span>
              <span class="text-[10px] opacity-75">(${count})</span>
            </button>
          `;
    })
    .join("");
}

function renderCategoryOptions() {
  const select = document.getElementById("inputItemCategory");
  const editSelect = document.getElementById("editItemCategory");
  const lang = currentLanguage === "vi" ? "vi" : "en";
  const getOptionsHtml = (currentVal) =>
    Object.entries(CATEGORIES)
      .map(
        ([key, cat]) =>
          `<option value="${key}" ${key === currentVal ? "selected" : ""}>${cat.icon} ${cat[lang]}</option>`
      )
      .join("");

  if (select) {
    select.innerHTML = getOptionsHtml(select.value || "produce");
  }
  if (editSelect) {
    editSelect.innerHTML = getOptionsHtml(editSelect.value || "produce");
  }
}

function renderUnitOptions() {
  const select = document.getElementById("inputItemUnit");
  const editSelect = document.getElementById("editItemUnit");
  const compUnitA = document.getElementById("compUnitA");
  const compUnitB = document.getElementById("compUnitB");
  const lang = currentLanguage === "vi" ? "vi" : "en";

  const generateOptions = (currentVal) =>
    UNIT_GROUPS.map(
      (group) => `
            <optgroup label="${group[lang]}">
              ${group.units
                .map(
                  (u) =>
                    `<option value="${u.key}" ${u.key === currentVal ? "selected" : ""}>${u[lang]}</option>`
                )
                .join("")}
            </optgroup>
          `
    ).join("");

  if (select) {
    const currentVal = select.value || "kg";
    select.innerHTML = generateOptions(currentVal);
  }
  if (editSelect) {
    const currentVal = editSelect.value || "kg";
    editSelect.innerHTML = generateOptions(currentVal);
  }
  if (compUnitA) {
    const currentValA = compUnitA.value || "g";
    compUnitA.innerHTML = generateOptions(currentValA);
  }
  if (compUnitB) {
    const currentValB = compUnitB.value || "kg";
    compUnitB.innerHTML = generateOptions(currentValB);
  }
}

function sanitizeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(
  amount,
  currency = currentCurrency,
  lang = currentLanguage
) {
  const num = parseFloat(amount) || 0;
  try {
    return new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: currency === "VND" || currency === "JPY" ? 0 : 2,
    }).format(num);
  } catch (e) {
    return `$${num.toFixed(2)}`;
  }
}

function renderApp() {
  renderCategoryOptions();
  renderUnitOptions();
  renderStoreFilterOptions();
  renderStoreFilterChips();
  renderCategoryFilterChips();
  renderKpis();
  renderItemList();
}

function renderStoreFilterOptions() {
  const select = document.getElementById("storeFilterSelect");
  const addStoreSelect = document.getElementById("inputItemStore");
  const editStoreSelect = document.getElementById("editItemStore");
  const smartQuickStoreSelect = document.getElementById(
    "smartQuickStoreSelect"
  );
  const stores = memoryState.stores || DEFAULT_STORES;
  const items =
    memoryState.activeList && Array.isArray(memoryState.activeList.items)
      ? memoryState.activeList.items
      : [];
  const availableStores = new Set(items.map((i) => i.store).filter(Boolean));
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;

  if (select) {
    const currentVal = currentStoreFilter;
    select.innerHTML = "";
    const allOpt = document.createElement("option");
    allOpt.value = "ALL";
    allOpt.textContent = t.store_all || "All Stores";
    if (currentVal === "ALL") allOpt.selected = true;
    select.appendChild(allOpt);

    stores.forEach((store) => {
      if (availableStores.has(store)) {
        const opt = document.createElement("option");
        opt.value = store;
        opt.textContent = store;
        if (store === currentVal) opt.selected = true;
        select.appendChild(opt);
      }
    });
    const manageOpt = document.createElement("option");
    manageOpt.value = "MANAGE_STORES";
    manageOpt.textContent = `⚙️ ${t.manage_stores_title || "Manage Stores..."}`;
    select.appendChild(manageOpt);
  }

  if (addStoreSelect) {
    const prevVal = addStoreSelect.value;
    addStoreSelect.innerHTML = "";
    stores.forEach((store) => {
      const opt = document.createElement("option");
      opt.value = store;
      opt.textContent = store;
      if (store === prevVal) opt.selected = true;
      addStoreSelect.appendChild(opt);
    });
    const manageOpt = document.createElement("option");
    manageOpt.value = "MANAGE_STORES";
    manageOpt.textContent = `⚙️ ${t.manage_stores_title || "Manage Stores..."}`;
    addStoreSelect.appendChild(manageOpt);
  }

  if (editStoreSelect) {
    const prevVal = editStoreSelect.value;
    editStoreSelect.innerHTML = "";
    stores.forEach((store) => {
      const opt = document.createElement("option");
      opt.value = store;
      opt.textContent = store;
      if (store === prevVal) opt.selected = true;
      editStoreSelect.appendChild(opt);
    });
    const manageOpt = document.createElement("option");
    manageOpt.value = "MANAGE_STORES";
    manageOpt.textContent = `⚙️ ${t.manage_stores_title || "Manage Stores..."}`;
    editStoreSelect.appendChild(manageOpt);
  }
}

function onAddStoreSelectChange(val) {
  if (val === "MANAGE_STORES") {
    openStoreManagerModal();
    const addStoreSelect = document.getElementById("inputItemStore");
    if (addStoreSelect) {
      const stores = memoryState.stores || DEFAULT_STORES;
      addStoreSelect.value = stores[0] || "Costco";
    }
  }
}

function onEditStoreSelectChange(val) {
  if (val === "MANAGE_STORES") {
    openStoreManagerModal();
    const editStoreSelect = document.getElementById("editItemStore");
    if (editStoreSelect) {
      const stores = memoryState.stores || DEFAULT_STORES;
      editStoreSelect.value = stores[0] || "Costco";
    }
  }
}

function updateTripProgress() {
  const items = memoryState.activeList.items;
  const filtered =
    currentStoreFilter === "ALL"
      ? items
      : items.filter((i) => i.store === currentStoreFilter);

  const checkedItems = filtered.filter((i) => i.checked);
  const uncheckedItems = filtered.filter((i) => !i.checked);

  const totalCount = filtered.length;
  const checkedCount = checkedItems.length;
  const pct = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  const remainingSpend = uncheckedItems.reduce(
    (sum, i) => sum + (parseFloat(i.price) || 0),
    0
  );

  const pBar = document.getElementById("tripProgressBar");
  const pLabel = document.getElementById("tripProgressLabel");
  const remVal = document.getElementById("tripRemainingSpendVal");

  if (pBar) {
    pBar.style.width = `${pct}%`;
  }
  if (pLabel) {
    pLabel.textContent = `${checkedCount} / ${totalCount} (${Math.round(pct)}%)`;
  }
  if (remVal) {
    remVal.textContent = formatCurrency(remainingSpend);
  }
}

function renderKpis() {
  const items = memoryState.activeList.items;
  const filtered =
    currentStoreFilter === "ALL"
      ? items
      : items.filter((i) => i.store === currentStoreFilter);

  const checkedItems = filtered.filter((i) => i.checked);
  const totalEstimated = filtered.reduce(
    (sum, i) => sum + (parseFloat(i.price) || 0),
    0
  );
  const checkedSpent = checkedItems.reduce(
    (sum, i) => sum + (parseFloat(i.price) || 0),
    0
  );

  const kpiItemsVal = document.getElementById("kpiItemsVal");
  const kpiSpentVal = document.getElementById("kpiSpentVal");
  const kpiEstimatedVal = document.getElementById("kpiEstimatedVal");
  const tripRunningTotal = document.getElementById("tripRunningTotal");

  if (kpiItemsVal)
    kpiItemsVal.textContent = `${checkedItems.length} / ${filtered.length}`;
  if (kpiSpentVal) kpiSpentVal.textContent = formatCurrency(checkedSpent);
  if (kpiEstimatedVal)
    kpiEstimatedVal.textContent = formatCurrency(totalEstimated);
  if (tripRunningTotal) {
    const t = TRANSLATIONS[currentLanguage];
    const totalSpentLabel = t.total_spent_label || "Total Spent:";
    tripRunningTotal.textContent = `${totalSpentLabel} ${formatCurrency(checkedSpent)}`;
  }

  const finishBar = document.getElementById("finishTripBar");
  if (finishBar) {
    if (checkedItems.length > 0) {
      finishBar.classList.remove("hidden");
    } else {
      finishBar.classList.add("hidden");
    }
  }
  const tripSummaryPrompt = document.getElementById("tripSummaryPrompt");
  if (tripSummaryPrompt) {
    const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
    if (currentPhase === "PLANNING") {
      tripSummaryPrompt.textContent =
        t.trip_planning_prompt || "Ready to Complete Trip";
    } else {
      tripSummaryPrompt.textContent =
        t.trip_active || "In-Store Shopping Active";
    }
  }

  const listCountBadge = document.getElementById("listCountBadge");
  if (listCountBadge) listCountBadge.textContent = filtered.length;

  updateTripProgress();
}

function renderItemList() {
  const container = document.getElementById("activeItemsList");
  const emptyCard = document.getElementById("emptyListCard");
  const checkedContainer = document.getElementById("checkedItemsList");
  const checkedSection = document.getElementById("checkedItemsSection");
  const checkedBadge = document.getElementById("checkedCountBadge");

  if (!container) return;

  const items = memoryState.activeList.items;
  let filtered =
    currentStoreFilter === "ALL"
      ? items
      : items.filter((i) => i.store === currentStoreFilter);

  if (currentCategoryFilter !== "ALL") {
    filtered = filtered.filter(
      (i) =>
        i.category === currentCategoryFilter ||
        (currentCategoryFilter === "dairy" &&
          (i.category === "dairy" || i.category === "dairy_eggs")) ||
        (currentCategoryFilter === "meat" &&
          (i.category === "meat" || i.category === "meat_seafood"))
    );
  }

  if (filtered.length === 0) {
    if (emptyCard) emptyCard.classList.remove("hidden");
    const btnEmptySwitch = document.getElementById("btnEmptySwitchToPlanning");
    const emptyDesc = document.getElementById("emptyListDesc");
    const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
    if (btnEmptySwitch) {
      if (currentPhase === "IN_STORE") {
        btnEmptySwitch.classList.remove("hidden");
      } else {
        btnEmptySwitch.classList.add("hidden");
      }
    }
    if (emptyDesc) {
      if (currentPhase === "IN_STORE") {
        emptyDesc.textContent =
          t.empty_buy_mode_desc ||
          "No items to buy right now. Switch to Planning mode to add items to your grocery list.";
      } else {
        emptyDesc.textContent =
          t.empty_planning_desc ||
          t.empty_desc ||
          "Add items using the quick-entry box above to start tracking your grocery list and unit prices.";
      }
    }
    container.innerHTML = "";
    if (checkedSection) checkedSection.classList.add("hidden");
    return;
  }

  if (emptyCard) emptyCard.classList.add("hidden");

  const uncheckedItems = filtered.filter((i) => !i.checked);
  const checkedItems = filtered.filter((i) => i.checked);

  // Render Active (Unchecked) Items with Grouping
  if (uncheckedItems.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-2xl border border-slate-800/60">${TRANSLATIONS[currentLanguage].all_items_checked || "All items checked! Ready to complete trip."}</div>`;
  } else if (currentGrouping === "STORE") {
    // Group By Store
    const storeMap = new Map();
    uncheckedItems.forEach((item) => {
      const sName = item.store || "General";
      if (!storeMap.has(sName)) storeMap.set(sName, []);
      storeMap.get(sName).push(item);
    });

    const itemsLabel = currentLanguage === "vi" ? "mặt hàng" : "items";
    let storeHtml = "";
    storeMap.forEach((storeItems, sName) => {
      const storeSubtotal = storeItems.reduce(
        (sum, it) => sum + (parseFloat(it.price) || 0),
        0
      );
      storeHtml += `
              <div class="space-y-2">
                <div class="flex items-center justify-between pt-2 pb-1 px-1">
                  <div class="font-bold text-xs uppercase tracking-wider text-slate-300">
                    <span>${sanitizeHTML(sName)}</span>
                  </div>
                  <span class="text-[11px] font-semibold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60">
                    ${storeItems.length} ${itemsLabel} • ${formatCurrency(storeSubtotal)}
                  </span>
                </div>
                <div class="space-y-2">
                  ${storeItems.map((item) => renderItemCard(item)).join("")}
                </div>
              </div>
            `;
    });
    container.innerHTML = storeHtml;
  } else {
    // Group By Aisle (Department)
    const catOrder = [
      "produce",
      "dairy_eggs",
      "meat_seafood",
      "bakery",
      "pantry",
      "frozen",
      "beverages",
      "household",
      "personal_care",
      "other",
    ];
    const catMap = new Map();
    uncheckedItems.forEach((item) => {
      const cat = item.category || "other";
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat).push(item);
    });

    let aisleHtml = "";
    catOrder.forEach((catKey) => {
      if (catMap.has(catKey)) {
        const catItems = catMap.get(catKey);
        const catInfo = CATEGORIES[catKey] || CATEGORIES.other;
        const catLabel = currentLanguage === "vi" ? catInfo.vi : catInfo.en;
        aisleHtml += `
                <div class="space-y-2">
                  <div class="flex items-center justify-between pt-2 pb-1 px-1">
                    <div class="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-300">
                      <span>${catInfo.icon}</span>
                      <span>${catLabel}</span>
                    </div>
                    <span class="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60">
                      ${catItems.length}
                    </span>
                  </div>
                  <div class="space-y-2">
                    ${catItems.map((item) => renderItemCard(item)).join("")}
                  </div>
                </div>
              `;
        catMap.delete(catKey);
      }
    });

    // Any remaining categories
    catMap.forEach((catItems, catKey) => {
      const catInfo = CATEGORIES[catKey] || CATEGORIES.other;
      const catLabel = currentLanguage === "vi" ? catInfo.vi : catInfo.en;
      aisleHtml += `
              <div class="space-y-2">
                <div class="flex items-center justify-between pt-2 pb-1 px-1">
                  <div class="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-300">
                    <span>${catInfo.icon}</span>
                    <span>${catLabel}</span>
                  </div>
                  <span class="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60">
                    ${catItems.length}
                  </span>
                </div>
                <div class="space-y-2">
                  ${catItems.map((item) => renderItemCard(item)).join("")}
                </div>
              </div>
            `;
    });

    container.innerHTML = aisleHtml;
  }

  // Render Checked Items
  if (checkedItems.length > 0) {
    if (checkedSection) checkedSection.classList.remove("hidden");
    if (checkedBadge) checkedBadge.textContent = checkedItems.length;
    if (checkedContainer)
      checkedContainer.innerHTML = checkedItems
        .map((item) => renderItemCard(item))
        .join("");
  } else {
    if (checkedSection) checkedSection.classList.add("hidden");
  }
}

function setupStoreSubscriptions() {
  if (
    typeof store !== "undefined" &&
    store &&
    typeof store.subscribe === "function"
  ) {
    store.subscribe((state, action) => {
      if (!action || !action.type) {
        renderApp();
        return;
      }

      switch (action.type) {
        case ACTION_TYPES.ITEM_TOGGLE_CHECK:
          renderKpis();
          renderItemList();
          updateTripProgress();
          break;

        case ACTION_TYPES.ITEM_ADD:
        case ACTION_TYPES.ITEM_DELETE:
        case ACTION_TYPES.ITEM_UPDATE:
          renderStoreFilterChips();
          renderCategoryFilterChips();
          renderKpis();
          renderItemList();
          break;

        case ACTION_TYPES.SET_STORE_FILTER:
          renderStoreFilterChips();
          renderKpis();
          renderItemList();
          break;

        case ACTION_TYPES.SET_GROUPING:
        case ACTION_TYPES.SET_TRIP_PHASE:
          renderItemList();
          renderKpis();
          break;

        case ACTION_TYPES.SET_STORES:
        case ACTION_TYPES.SET_STORE_ALIASES:
          renderStoreFilterOptions();
          renderStoreFilterChips();
          break;

        default:
          renderApp();
          break;
      }
    });
  }
}

// Automatically bind store subscriber
setupStoreSubscriptions();

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    renderApp,
    renderPlanningView,
    renderBuyView,
    renderPriceLedgerTable,
    showToast,
    el,
  };
}
