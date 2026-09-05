/* =========================================================================
       9. TRIP COMPLETION & LEDGER LOGGING
       ========================================================================= */
function openTripCompleteModal() {
  const items = memoryState.activeList.items || [];
  const checkedItems = items.filter((i) => i.checked);
  const uncheckedItems = items.filter((i) => !i.checked);

  if (checkedItems.length === 0) {
    const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
    showToast(
      t.toast_no_checked_items ||
        "Please check at least 1 purchased item before completing your trip."
    );
    return;
  }

  const totalSpent = checkedItems.reduce(
    (sum, i) => sum + (parseFloat(i.price) || 0),
    0
  );
  const itemsWord = currentLanguage === "vi" ? "mặt hàng" : "items";
  const leftWord =
    currentLanguage === "vi" ? "mặt hàng chưa mua." : "items left unchecked.";

  document.getElementById("tripModalPurchasedCount").textContent =
    `${checkedItems.length} ${itemsWord}`;
  document.getElementById("tripModalTotalSpentVal").textContent =
    formatCurrency(totalSpent);
  document.getElementById("unpurchasedCountText").textContent =
    `${uncheckedItems.length} ${leftWord}`;

  openModal("tripCompleteModal");
}

function finalizeTripCompletion() {
  saveFullStateSnapshot("TRIP_COMPLETION");
  const items = memoryState.activeList.items;
  const checkedItems = items.filter((i) => i.checked);
  const uncheckedItems = items.filter((i) => !i.checked);

  const rolloverRadios = document.getElementsByName("rolloverAction");
  let rollover = "ROLLOVER";
  for (const r of rolloverRadios) {
    if (r.checked) {
      rollover = r.value;
      break;
    }
  }

  // 1. Append verified prices to Historical Purchase Ledger
  const nowIso = new Date().toISOString();
  const now = nowIso.slice(0, 10);
  checkedItems.forEach((item, idx) => {
    const unitPrice = normalizeUnitPrice(item.price, item.quantity, item.unit);
    const recId = generateItemId("rec");
    memoryState.purchaseLedger.push({
      id: recId,
      itemId: item.id,
      itemName: item.name,
      store: item.store || "Supermarket",
      date: now,
      timestamp: nowIso,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      unitPrice,
    });
    recordDeletedItem(item.id);
  });

  // 2. Handle active items & tombstones
  if (rollover === "ROLLOVER") {
    memoryState.activeList.items = uncheckedItems.map((i) =>
      touchItem({
        ...i,
        checked: false,
      })
    );
  } else {
    uncheckedItems.forEach((i) => recordDeletedItem(i.id));
    memoryState.activeList.items = [];
  }

  saveToLocalStorage();
  if (typeof flushPendingCloudSync === "function") {
    flushPendingCloudSync();
  }
  closeModal("tripCompleteModal");
  setTripPhase("PLANNING");
  renderApp();
  showToast(TRANSLATIONS[currentLanguage].toast_trip_completed);
}

let selectedLedgerIds = new Set();

function openPriceLedgerModal() {
  selectedLedgerIds.clear();
  const searchInput = document.getElementById("ledgerSearchInput");
  if (searchInput) searchInput.value = "";
  setActiveTab("PRICE_HISTORY");
  renderPriceLedgerTable("");
}

function updateLedgerBatchBar(visibleLogs) {
  const batchBar = document.getElementById("ledgerBatchBar");
  if (!batchBar) return;
  const t = TRANSLATIONS[currentLanguage];
  const count = selectedLedgerIds.size;

  if (count === 0) {
    batchBar.classList.add("hidden");
    const selectAllCheckbox = document.getElementById(
      "ledgerSelectAllCheckbox"
    );
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    return;
  }
  batchBar.classList.remove("hidden");

  let total = 0;
  memoryState.purchaseLedger.forEach((l) => {
    if (selectedLedgerIds.has(String(l.id))) {
      total += parseFloat(l.price) || 0;
    }
  });

  const countTextEl = document.getElementById("ledgerSelectedCountText");
  if (countTextEl) {
    const rawCountMsg = t.ledger_selected_count || "{count} items selected";
    countTextEl.textContent = rawCountMsg.replace("{count}", count);
  }

  const totalTextEl = document.getElementById("ledgerSelectedTotalText");
  if (totalTextEl) {
    const rawTotalMsg = t.ledger_selected_total || "Est. Total: {total}";
    totalTextEl.textContent = `(${rawTotalMsg.replace("{total}", formatCurrency(total))})`;
  }

  const selectAllBtn = document.getElementById("btnLedgerSelectAllToggle");
  const currentLogs = visibleLogs || memoryState.purchaseLedger;
  const allSelected =
    currentLogs.length > 0 &&
    currentLogs.every((l) => selectedLedgerIds.has(String(l.id)));
  if (selectAllBtn) {
    selectAllBtn.textContent = allSelected
      ? t.ledger_deselect_all || "Deselect All"
      : t.ledger_select_all || "Select All";
  }

  const selectAllCheckbox = document.getElementById("ledgerSelectAllCheckbox");
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = allSelected;
  }

  const btnTextEl = document.getElementById("btnTextAddSelectedLedger");
  if (btnTextEl) {
    btnTextEl.textContent =
      t.btn_add_selected_ledger || "Add Selected to Buy List";
  }
}

function toggleLedgerRowSelect(id, isChecked) {
  const idStr = String(id);
  if (isChecked) {
    selectedLedgerIds.add(idStr);
  } else {
    selectedLedgerIds.delete(idStr);
  }
  const q = document.getElementById("ledgerSearchInput")?.value || "";
  renderPriceLedgerTable(q);
}

function toggleSelectAllLedgerRows(forceVal) {
  const q = (
    document.getElementById("ledgerSearchInput")?.value || ""
  ).toLowerCase();
  const visibleLogs = memoryState.purchaseLedger.filter(
    (l) =>
      !q ||
      l.itemName.toLowerCase().includes(q) ||
      (l.store && l.store.toLowerCase().includes(q))
  );
  if (visibleLogs.length === 0) return;

  let shouldSelectAll;
  if (typeof forceVal === "boolean") {
    shouldSelectAll = forceVal;
  } else {
    const allSelected = visibleLogs.every((l) =>
      selectedLedgerIds.has(String(l.id))
    );
    shouldSelectAll = !allSelected;
  }

  if (shouldSelectAll) {
    visibleLogs.forEach((l) => selectedLedgerIds.add(String(l.id)));
  } else {
    visibleLogs.forEach((l) => selectedLedgerIds.delete(String(l.id)));
  }
  renderPriceLedgerTable(q);
}

function processLedgerEntryIntoBuyList(entry) {
  if (!entry) return null;
  const name = (entry.itemName || entry.name || "").trim();
  if (!name) return null;

  // Case-insensitive deduplication against active buy list items
  const existing = memoryState.activeList.items.find(
    (item) => item.name && item.name.trim().toLowerCase() === name.toLowerCase()
  );

  if (existing) {
    const incQty = parseFloat(entry.quantity) || 1;
    existing.quantity = (parseFloat(existing.quantity) || 0) + incQty;
    const incPrice = parseFloat(entry.price) || 0;
    existing.price = (parseFloat(existing.price) || 0) + incPrice;
    if (entry.unit && !existing.unit) existing.unit = entry.unit;
    if (entry.store && (!existing.store || existing.store === "—")) {
      existing.store = entry.store;
    }
    touchItem(existing);
    return { type: "incremented", item: existing, entry, incQty };
  }

  // Derive category from catalog, sample active items, or default
  let category = "other";
  const catMatch = memoryState.catalog.find(
    (c) => c.name && c.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (catMatch && catMatch.category) {
    category = catMatch.category;
  } else {
    const sampleMatch =
      typeof SAMPLE_ITEMS !== "undefined"
        ? SAMPLE_ITEMS.find(
            (s) => s.name && s.name.trim().toLowerCase() === name.toLowerCase()
          )
        : null;
    if (sampleMatch && sampleMatch.category) {
      category = sampleMatch.category;
    }
  }

  const newItem = {
    id: generateItemId("item"),
    name: name,
    category: category,
    store: entry.store || memoryState.stores[0] || "Costco",
    quantity: parseFloat(entry.quantity) || 1,
    unit: entry.unit || "ea",
    price: parseFloat(entry.price) || 0,
    checked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  touchItem(newItem);
  memoryState.activeList.items.push(newItem);
  return { type: "created", item: newItem, entry };
}

function addLedgerItemToBuyList(id) {
  const entry = memoryState.purchaseLedger.find(
    (l) => String(l.id) === String(id)
  );
  if (!entry) return;

  const result = processLedgerEntryIntoBuyList(entry);
  saveToLocalStorage();
  renderApp();

  const t = TRANSLATIONS[currentLanguage];
  let msg = "";
  if (result && result.type === "incremented") {
    const raw =
      t.toast_item_qty_incremented ||
      "Increased '{item}' quantity on Buy List (+{qty})!";
    msg = raw.replace("{item}", entry.itemName).replace("{qty}", result.incQty);
  } else {
    const raw = t.toast_item_added_to_list || "Added '{item}' to Buy List!";
    msg = raw.replace("{item}", entry.itemName);
  }

  showToast(msg, {
    actionText: t.toast_action_view_list || "View List",
    onAction: () => {
      closeModal("priceLedgerModal");
      setTripPhase("PLANNING");
      scrollToTop();
    },
  });
}

function addSelectedLedgerItemsToBuyList() {
  if (selectedLedgerIds.size === 0) return;

  const entriesToAdd = memoryState.purchaseLedger.filter((l) =>
    selectedLedgerIds.has(String(l.id))
  );

  entriesToAdd.forEach((entry) => {
    processLedgerEntryIntoBuyList(entry);
  });

  const count = entriesToAdd.length;
  selectedLedgerIds.clear();
  saveToLocalStorage();
  renderApp();
  renderPriceLedgerTable(
    document.getElementById("ledgerSearchInput")?.value || ""
  );

  const t = TRANSLATIONS[currentLanguage];
  const raw = t.toast_items_added_to_list || "Added {count} items to Buy List!";
  const msg = raw.replace("{count}", count);

  showToast(msg, {
    actionText: t.toast_action_view_list || "View List",
    onAction: () => {
      closeModal("priceLedgerModal");
      setTripPhase("PLANNING");
      scrollToTop();
    },
  });
}

function deleteLedgerItem(id) {
  if (id === undefined || id === null) return;
  recordDeletedLedger(id);
  const initialLen = memoryState.purchaseLedger.length;
  memoryState.purchaseLedger = memoryState.purchaseLedger.filter(
    (l) => String(l.id) !== String(id)
  );
  if (memoryState.purchaseLedger.length === initialLen) return;

  selectedLedgerIds.delete(String(id));
  saveToLocalStorage();
  renderApp();
  renderPriceLedgerTable(
    document.getElementById("ledgerSearchInput")?.value || ""
  );

  const t = TRANSLATIONS[currentLanguage];
  showToast(
    t.toast_ledger_item_deleted || "Deleted purchase record from history!"
  );
}

function deleteSelectedLedgerItems() {
  if (selectedLedgerIds.size === 0) return;

  const count = selectedLedgerIds.size;
  selectedLedgerIds.forEach((id) => recordDeletedLedger(id));
  memoryState.purchaseLedger = memoryState.purchaseLedger.filter(
    (l) => !selectedLedgerIds.has(String(l.id))
  );

  selectedLedgerIds.clear();
  saveToLocalStorage();
  renderApp();
  renderPriceLedgerTable(
    document.getElementById("ledgerSearchInput")?.value || ""
  );

  const t = TRANSLATIONS[currentLanguage];
  const raw =
    t.toast_ledger_selected_deleted || "Deleted {count} records from history!";
  const msg = raw.replace("{count}", count);
  showToast(msg);
}

function renderPriceLedgerTable(query = "") {
  const tbody = document.getElementById("ledgerTableBody");
  const mobileContainer = document.getElementById("ledgerMobileCards");
  if (!tbody && !mobileContainer) return;
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;

  // Ensure every entry has an id
  memoryState.purchaseLedger.forEach((l, idx) => {
    if (l.id === undefined || l.id === null) {
      l.id = "ledger-" + idx + "-" + (l.date || "log");
    }
  });

  const q = (query || "").toLowerCase();
  const logs = memoryState.purchaseLedger
    .filter(
      (l) =>
        !q ||
        l.itemName.toLowerCase().includes(q) ||
        (l.store && l.store.toLowerCase().includes(q))
    )
    .reverse();

  if (logs.length === 0) {
    const emptyMsg =
      t.ledger_cards_empty_msg ||
      t.ledger_empty_msg ||
      "No historical purchase records found.";
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-slate-400 text-sm font-medium italic">${emptyMsg}</td></tr>`;
    }
    if (mobileContainer) {
      mobileContainer.innerHTML = `<div class="text-center py-8 px-4 text-slate-400 text-sm font-medium italic bg-slate-950/60 rounded-2xl border border-slate-800">${emptyMsg}</div>`;
    }
    updateLedgerBatchBar([]);
    return;
  }

  // Render Desktop Table Rows (>= 640px)
  if (tbody) {
    tbody.innerHTML = logs
      .map((l) => {
        const { baseUnit } = normalizeQuantity(l.quantity, l.unit);
        const isSelected = selectedLedgerIds.has(String(l.id));
        const safeName = sanitizeHTML(l.itemName);
        const safeStore = sanitizeHTML(l.store || "—");
        const safeUnit = sanitizeHTML(l.unit);
        const safeDate = sanitizeHTML(l.date);

        const itemKey = normalizeItemKey(l.itemName);
        const itemLogs = (memoryState.purchaseLedger || []).filter(
          (other) =>
            (itemKey && normalizeItemKey(other.itemName) === itemKey) ||
            (l.itemId && other.itemId === l.itemId)
        );
        const deal = evaluateDealScore(l.unitPrice, itemLogs);

        let dealBadgeHtml = "";
        const cleanDealLabel = (raw) =>
          (raw || "").replace(/^[🟢🟡🔴⚪]\s*/, "");
        if (deal.score === "GREAT_DEAL") {
          const rawLabel = t.badge_great_deal || "🟢 Great Deal";
          dealBadgeHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50" title="${rawLabel}"><span aria-hidden="true">🟢</span><span class="ml-1">${cleanDealLabel(rawLabel)}</span></span>`;
        } else if (deal.score === "PRICE_SPIKE") {
          const rawLabel = t.badge_price_spike || "🔴 Price Spike";
          dealBadgeHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-red-950 text-red-300 border border-red-700/50" title="${rawLabel}"><span aria-hidden="true">🔴</span><span class="ml-1">${cleanDealLabel(rawLabel)}</span></span>`;
        } else if (deal.score === "FAIR_PRICE") {
          const rawLabel = t.badge_fair_price || "🟡 Fair Price";
          dealBadgeHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700/50" title="${rawLabel}"><span aria-hidden="true">🟡</span><span class="ml-1">${cleanDealLabel(rawLabel)}</span></span>`;
        } else {
          const rawLabel = t.badge_new_item || "⚪ New Item";
          dealBadgeHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700" title="${rawLabel}"><span aria-hidden="true">⚪</span><span class="ml-1">${cleanDealLabel(rawLabel)}</span></span>`;
        }

        return `
            <tr class="hover:bg-slate-800/40 transition-colors ${isSelected ? "bg-emerald-950/20" : ""}">
              <td class="p-3 text-center">
                <input
                  type="checkbox"
                  class="ledger-row-checkbox h-5 w-5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                  data-ledger-id="${l.id}"
                  aria-label="${(t.aria_select_ledger_row || "Select purchase record") + ": " + safeName}"
                  onchange="toggleLedgerRowSelect('${l.id}', this.checked)"
                  ${isSelected ? "checked" : ""}
                />
              </td>
              <td class="p-3 font-mono text-xs text-slate-400">${safeDate}</td>
              <td class="p-3 font-bold text-sm text-slate-100">${safeName}</td>
              <td class="p-3 text-sm text-slate-300">${safeStore}</td>
              <td class="p-3 text-sm text-slate-300 font-medium">${l.quantity} ${safeUnit}</td>
              <td class="p-3 font-bold text-sm text-white">${formatCurrency(l.price)}</td>
              <td class="p-3 font-bold text-sm text-emerald-400">${formatCurrency(l.unitPrice)} / ${baseUnit}</td>
              <td class="p-3 text-center whitespace-nowrap">${dealBadgeHtml}</td>
              <td class="p-3 text-right whitespace-nowrap space-x-1.5">
                <button
                  type="button"
                  onclick="addLedgerItemToBuyList('${l.id}')"
                  class="inline-flex items-center justify-center bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold px-3 py-1.5 rounded-lg border border-emerald-500/40 text-xs transition-colors cursor-pointer active:scale-95"
                  title="${t.ledger_quick_add_title || "Add this item to Buy List"}"
                  aria-label="${(t.aria_add_ledger_row || "Add record to buy list") + ": " + safeName}"
                >
                  <span aria-hidden="true">➕</span>
                </button>
                <button
                  type="button"
                  onclick="deleteLedgerItem('${l.id}')"
                  class="inline-flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold px-2.5 py-1.5 rounded-lg border border-red-500/40 text-xs transition-colors cursor-pointer active:scale-95"
                  title="${t.ledger_delete_item || "Delete record"}"
                  aria-label="${(t.aria_delete_ledger_row || "Delete purchase record") + ": " + safeName}"
                >
                  <span aria-hidden="true">🗑️</span>
                </button>
              </td>
            </tr>
          `;
      })
      .join("");
  }

  // Render Mobile Cards (< 640px)
  if (mobileContainer) {
    mobileContainer.innerHTML = logs
      .map((l) => {
        const { baseUnit } = normalizeQuantity(l.quantity, l.unit);
        const isSelected = selectedLedgerIds.has(String(l.id));
        const safeName = sanitizeHTML(l.itemName);
        const safeStore = sanitizeHTML(l.store || "—");
        const safeUnit = sanitizeHTML(l.unit);
        const safeDate = sanitizeHTML(l.date);
        return `
            <div class="p-3.5 bg-slate-950/80 rounded-2xl border ${isSelected ? "border-emerald-500/60 bg-emerald-950/20" : "border-slate-800"} space-y-2.5 shadow-sm transition-all">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-start gap-2.5 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    class="ledger-row-checkbox h-5 w-5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer mt-0.5 shrink-0"
                    data-ledger-id="${l.id}"
                    aria-label="${(t.aria_select_ledger_row || "Select purchase record") + ": " + safeName}"
                    onchange="toggleLedgerRowSelect('${l.id}', this.checked)"
                    ${isSelected ? "checked" : ""}
                  />
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-bold text-slate-100 leading-snug break-words">${safeName}</div>
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                      <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">${safeStore}</span>
                      <span class="text-[11px] font-mono text-slate-400">${safeDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <div class="text-xs text-slate-300">
                  <span class="text-slate-500">${t.th_size || "Size"}:</span> <span class="font-semibold text-slate-200">${l.quantity} ${safeUnit}</span>
                  <span class="text-slate-600 mx-1">·</span>
                  <span class="text-slate-500">${t.th_paid || "Paid"}:</span> <span class="font-bold text-slate-100">${formatCurrency(l.price)}</span>
                </div>
                <div class="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/50">
                  ${formatCurrency(l.unitPrice)} / ${baseUnit}
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onclick="addLedgerItemToBuyList('${l.id}')"
                  aria-label="${(t.btn_add_selected_ledger || "Add to Buy List") + ": " + safeName}"
                  class="flex-1 min-h-[44px] px-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <span aria-hidden="true">➕</span>
                  <span>${t.btn_add_selected_ledger || "Add to Buy List"}</span>
                </button>
                <button
                  type="button"
                  onclick="deleteLedgerItem('${l.id}')"
                  class="min-h-[44px] px-3 bg-red-950/40 hover:bg-red-900/60 active:scale-95 text-red-300 font-semibold rounded-xl text-xs border border-red-800/40 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  title="${t.ledger_delete_item || "Delete record"}"
                  aria-label="${(t.ledger_delete_item || "Delete record") + ": " + safeName}"
                >
                  <span aria-hidden="true">🗑️</span>
                  <span>${t.btn_delete_ledger_item || "Delete"}</span>
                </button>
              </div>
            </div>
          `;
      })
      .join("");
  }

  updateLedgerBatchBar(logs);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { finishShoppingTrip };
}
