/* =========================================================================
       6b. STORE MANAGEMENT CRUD & CASCADE
       ========================================================================= */
function getStoreAliases(storeName) {
  if (!storeName) return [];
  if (memoryState && memoryState.storeAliases) {
    return Array.isArray(memoryState.storeAliases[storeName])
      ? memoryState.storeAliases[storeName]
      : [];
  }
  if (
    DEFAULT_STORE_ALIASES &&
    Array.isArray(DEFAULT_STORE_ALIASES[storeName])
  ) {
    return DEFAULT_STORE_ALIASES[storeName];
  }
  return [];
}

function setStoreAliases(storeName, aliases) {
  if (!storeName) return false;
  if (!memoryState.storeAliases) {
    memoryState.storeAliases = { ...DEFAULT_STORE_ALIASES };
  }
  let arr = [];
  if (Array.isArray(aliases)) {
    arr = aliases.map((a) => String(a).trim()).filter(Boolean);
  } else if (typeof aliases === "string") {
    arr = aliases
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
  }
  memoryState.storeAliases[storeName] = Array.from(new Set(arr));
  if (typeof saveToLocalStorage === "function") saveToLocalStorage();
  if (typeof renderStoreManagerList === "function") renderStoreManagerList();
  return true;
}

function promptEditStoreAliases(storeName) {
  const current = getStoreAliases(storeName).join(", ");
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const promptTpl =
    t.prompt_edit_store_aliases ||
    "Enter comma-separated aliases for store '{store}':";
  const promptText = promptTpl.replace("{store}", storeName);
  const res = prompt(promptText, current);
  if (res !== null) {
    setStoreAliases(storeName, res);
    showToast(t.toast_store_aliases_updated || "Store aliases updated!");
  }
}

function promptEditStoreAliasesByIndex(idx) {
  const stores = memoryState.stores || DEFAULT_STORES;
  if (idx < 0 || idx >= stores.length) return;
  promptEditStoreAliases(stores[idx]);
}

function addStore(storeName, aliases) {
  if (!storeName || typeof storeName !== "string") return false;
  const name = storeName.trim();
  if (!name) return false;
  if (!memoryState.stores) memoryState.stores = [...DEFAULT_STORES];
  if (memoryState.stores.some((s) => s.toLowerCase() === name.toLowerCase())) {
    showToast(
      TRANSLATIONS[currentLanguage].toast_store_exists || "Store already exists"
    );
    return false;
  }
  if (memoryState._deleted?.stores && memoryState._deleted.stores[name]) {
    delete memoryState._deleted.stores[name];
  }
  memoryState.stores.push(name);
  if (!memoryState.storeAliases) {
    memoryState.storeAliases = { ...DEFAULT_STORE_ALIASES };
  }
  if (aliases) {
    let arr = [];
    if (Array.isArray(aliases)) {
      arr = aliases.map((a) => String(a).trim()).filter(Boolean);
    } else if (typeof aliases === "string") {
      arr = aliases
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
    }
    memoryState.storeAliases[name] = Array.from(new Set(arr));
  } else {
    memoryState.storeAliases[name] = [];
  }
  if (typeof saveToLocalStorage === "function") saveToLocalStorage();
  if (typeof renderStoreFilterOptions === "function")
    renderStoreFilterOptions();
  if (typeof renderStoreManagerList === "function") renderStoreManagerList();
  if (typeof showToast === "function") {
    showToast(
      (typeof TRANSLATIONS !== "undefined" &&
        TRANSLATIONS[currentLanguage] &&
        TRANSLATIONS[currentLanguage].toast_store_added) ||
        "Store added successfully"
    );
  }
  return true;
}

function renameStore(oldName, newName) {
  if (!oldName || !newName || typeof newName !== "string") return false;
  const name = newName.trim();
  if (!name || name === oldName) return false;
  if (!memoryState.stores) memoryState.stores = [...DEFAULT_STORES];

  // Disallow duplicate names
  if (memoryState.stores.includes(name)) {
    if (typeof showToast === "function") {
      showToast(
        (typeof TRANSLATIONS !== "undefined" &&
          TRANSLATIONS[currentLanguage] &&
          TRANSLATIONS[currentLanguage].toast_store_exists) ||
          "Store name already exists"
      );
    }
    return false;
  }

  if (typeof recordDeletedStore === "function") recordDeletedStore(oldName);
  if (memoryState._deleted?.stores && memoryState._deleted.stores[name]) {
    delete memoryState._deleted.stores[name];
  }

  // Update stores array
  memoryState.stores = memoryState.stores.map((s) =>
    s === oldName ? name : s
  );

  // Update storeAliases key map
  if (memoryState.storeAliases && memoryState.storeAliases[oldName]) {
    memoryState.storeAliases[name] = memoryState.storeAliases[oldName];
    delete memoryState.storeAliases[oldName];
  }

  // Update active items
  if (memoryState.activeList && Array.isArray(memoryState.activeList.items)) {
    memoryState.activeList.items.forEach((item) => {
      if (item.store === oldName) {
        item.store = name;
        if (typeof touchItem === "function") touchItem(item);
      }
    });
  }

  // Update purchase ledger
  if (memoryState.purchaseLedger && Array.isArray(memoryState.purchaseLedger)) {
    memoryState.purchaseLedger.forEach((entry) => {
      if (entry.store === oldName) {
        entry.store = name;
      }
    });
  }

  // Update current filter if needed
  if (
    typeof currentStoreFilter !== "undefined" &&
    currentStoreFilter === oldName
  ) {
    currentStoreFilter = name;
  }

  if (typeof saveToLocalStorage === "function") saveToLocalStorage();
  if (typeof renderApp === "function") renderApp();
  if (typeof renderStoreManagerList === "function") renderStoreManagerList();
  if (typeof showToast === "function") {
    showToast(
      (typeof TRANSLATIONS !== "undefined" &&
        TRANSLATIONS[currentLanguage] &&
        TRANSLATIONS[currentLanguage].toast_store_renamed) ||
        "Store renamed successfully"
    );
  }
  return true;
}

function deleteStore(storeName) {
  if (!storeName) return false;
  if (!memoryState.stores) memoryState.stores = [...DEFAULT_STORES];
  if (memoryState.stores.length <= 1) {
    showToast(
      TRANSLATIONS[currentLanguage].toast_store_min_guard ||
        "Must keep at least one store"
    );
    return false;
  }

  recordDeletedStore(storeName);
  memoryState.stores = memoryState.stores.filter((s) => s !== storeName);
  if (memoryState.storeAliases) {
    delete memoryState.storeAliases[storeName];
  }
  const fallbackStore = memoryState.stores[0] || "Other";

  // Reassign active items using this store to fallback
  if (memoryState.activeList && Array.isArray(memoryState.activeList.items)) {
    memoryState.activeList.items.forEach((item) => {
      if (item.store === storeName) {
        item.store = fallbackStore;
        touchItem(item);
      }
    });
  }

  if (currentStoreFilter === storeName) {
    currentStoreFilter = "ALL";
  }

  saveToLocalStorage();
  renderApp();
  renderStoreManagerList();
  showToast(
    TRANSLATIONS[currentLanguage].toast_store_deleted || "Store deleted"
  );
  return true;
}

function renderStoreManagerList() {
  if (typeof document === "undefined") return;
  const container = document.getElementById("storeManagerList");
  if (!container) return;
  const stores = memoryState.stores || DEFAULT_STORES;
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  container.innerHTML = stores
    .map((s, idx) => {
      const safeStore = sanitizeHTML(s);
      const aliases = getStoreAliases(s);
      const safeAliases = sanitizeHTML(aliases.join(", "));
      return `
          <div class="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs space-y-1.5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-slate-200" id="storeNameDisplay-${idx}">${safeStore}</span>
              <div class="flex items-center gap-1">
                <button onclick="promptEditStoreAliasesByIndex(${idx})" class="text-slate-400 hover:text-emerald-400 p-1 cursor-pointer transition-colors" title="${t.aria_edit_store_aliases || "Edit aliases"}" aria-label="${(t.aria_edit_store_aliases || "Edit aliases for") + ": " + safeStore}"><span aria-hidden="true">🏷️</span></button>
                <button onclick="promptRenameStoreByIndex(${idx})" class="text-slate-400 hover:text-emerald-400 p-1 cursor-pointer transition-colors" title="${t.aria_rename_store || "Rename"}" aria-label="${(t.aria_rename_store || "Rename store") + ": " + safeStore}"><span aria-hidden="true">✏️</span></button>
                <button onclick="deleteStoreByIndex(${idx})" class="text-slate-400 hover:text-red-400 p-1 cursor-pointer transition-colors" title="${t.aria_delete_store || "Delete"}" aria-label="${(t.aria_delete_store || "Delete store") + ": " + safeStore}"><span aria-hidden="true">🗑️</span></button>
              </div>
            </div>
            <div class="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span class="text-slate-500">${t.store_aliases_label || "Aliases"}:</span>
              <span class="text-emerald-400 font-mono text-[10px]">${safeAliases || `<span class="text-slate-600 italic">${t.no_aliases || "none"}</span>`}</span>
            </div>
          </div>
        `;
    })
    .join("");
}

function promptRenameStoreByIndex(idx) {
  const stores = memoryState.stores || DEFAULT_STORES;
  if (idx < 0 || idx >= stores.length) return;
  const oldName = stores[idx];
  promptRenameStore(oldName);
}

function deleteStoreByIndex(idx) {
  const stores = memoryState.stores || DEFAULT_STORES;
  if (idx < 0 || idx >= stores.length) return;
  const name = stores[idx];
  deleteStore(name);
}

function promptRenameStore(oldName) {
  const promptText =
    TRANSLATIONS[currentLanguage].prompt_rename_store ||
    `Enter new name for store '${oldName}':`;
  const newName = prompt(promptText, oldName);
  if (newName && newName.trim()) {
    renameStore(oldName, newName.trim());
  }
}

function handleStoreAddSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("inputNewStoreName");
  if (input && input.value.trim()) {
    const added = addStore(input.value.trim());
    if (added) input.value = "";
  }
}

function openStoreManagerModal() {
  renderStoreManagerList();
  openModal("storeManagerModal");
}

function closeStoreManagerModal() {
  closeModal("storeManagerModal");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getStoreAliases,
    setStoreAliases,
    openStoreManagerModal,
    closeStoreManagerModal,
    renderStoreManagerList,
    addStore,
    renameStore,
    deleteStore,
  };
}
