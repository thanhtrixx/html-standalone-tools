/* =========================================================================
       7. IN-AISLE PACKAGE COMPARATOR & QUICK PRICE ADJUSTMENT
       ========================================================================= */
let activeComparingItemId = null;

function openComparatorModal() {
  activeComparingItemId = null;
  const banner = document.getElementById("compComparingItemBanner");
  const btnApplyWinner = document.getElementById("btnApplyWinnerToList");
  if (banner) banner.classList.add("hidden");
  if (btnApplyWinner) btnApplyWinner.classList.add("hidden");
  setActiveTab("COMPARATOR");
  runComparatorCalc();
}

function openItemComparator(itemId) {
  activeComparingItemId = itemId;
  const item = memoryState.activeList.items.find((i) => i.id === itemId);
  if (item) {
    const compPriceA = document.getElementById("compPriceA");
    const compQtyA = document.getElementById("compQtyA");
    const compUnitA = document.getElementById("compUnitA");
    const compUnitB = document.getElementById("compUnitB");
    const banner = document.getElementById("compComparingItemBanner");
    const nameLabel = document.getElementById("compItemNameLabel");
    const unitLabel = document.getElementById("compItemCurrentUnitLabel");
    const btnApplyWinner = document.getElementById("btnApplyWinnerToList");

    if (compPriceA) compPriceA.value = item.price;
    if (compQtyA) compQtyA.value = item.quantity;
    if (compUnitA && item.unit) {
      const target = item.unit.trim().toLowerCase();
      let matched = null;
      if (compUnitA.options && compUnitA.options.length > 0) {
        matched = Array.from(compUnitA.options).find(
          (o) => o.value.toLowerCase() === target
        );
      }
      compUnitA.value = matched
        ? matched.value
        : target === "l"
          ? "L"
          : item.unit;
    }
    if (compUnitB && item.unit) {
      const norm = normalizeQuantity(1, item.unit);
      if (norm && norm.baseUnit) {
        const targetBase = norm.baseUnit.toLowerCase();
        let matched = null;
        if (compUnitB.options && compUnitB.options.length > 0) {
          matched = Array.from(compUnitB.options).find(
            (o) => o.value.toLowerCase() === targetBase
          );
        }
        compUnitB.value = matched
          ? matched.value
          : targetBase === "l"
            ? "L"
            : norm.baseUnit;
      }
    }
    if (nameLabel) nameLabel.textContent = item.name;
    if (unitLabel) {
      const activeLabel = currentLanguage === "vi" ? "Hiện tại" : "Active";
      unitLabel.textContent = `(${activeLabel}: ${item.quantity} ${item.unit} @ ${formatCurrency(item.price)})`;
    }
    if (banner) banner.classList.remove("hidden");
    if (btnApplyWinner) btnApplyWinner.classList.remove("hidden");
  }
  setActiveTab("COMPARATOR", { preserveItem: true });
  runComparatorCalc();
}

function applyWinnerToActiveItem() {
  if (!activeComparingItemId) {
    applyComparatorWinner();
    return;
  }
  const item = memoryState.activeList.items.find(
    (i) => i.id === activeComparingItemId
  );
  if (!item) {
    setActiveTab(currentPhase === "IN_STORE" ? "BUY" : "PLANNING");
    return;
  }

  const pA = parseFloat(document.getElementById("compPriceA").value) || 0;
  const qA = parseFloat(document.getElementById("compQtyA").value) || 0;
  const uA = document.getElementById("compUnitA").value;
  const pB = parseFloat(document.getElementById("compPriceB").value) || 0;
  const qB = parseFloat(document.getElementById("compQtyB").value) || 0;
  const uB = document.getElementById("compUnitB").value;

  const res = comparePackages(
    { price: pA, quantity: qA, unit: uA, name: "A" },
    { price: pB, quantity: qB, unit: uB, name: "B" }
  );

  if (res.winner === "B" || res.winner === "Package B") {
    item.price = pB;
    item.quantity = qB;
    item.unit = uB;
  } else {
    item.price = pA;
    item.quantity = qA;
    item.unit = uA;
  }
  touchItem(item);

  saveToLocalStorage();
  renderApp();
  setActiveTab(currentPhase === "IN_STORE" ? "BUY" : "PLANNING");
  showToast(
    TRANSLATIONS[currentLanguage].toast_winner_applied ||
      "Applied winning deal to item!"
  );
}

/**
 * Bidirectional unit group auto-sync for the comparator.
 * When user changes unit group of one package (e.g. Weight → Volume),
 * the other package's unit is updated to the default base unit of that
 * same dimension, keeping both packages comparable.
 * @param {'A'|'B'} source — which package triggered the change
 */
function syncComparatorUnitGroup(source) {
  const compUnitA = document.getElementById("compUnitA");
  const compUnitB = document.getElementById("compUnitB");
  if (!compUnitA || !compUnitB) return;

  const valA = compUnitA.value;
  const valB = compUnitB.value;

  const dimA = normalizeQuantity(1, valA).dimension;
  const dimB = normalizeQuantity(1, valB).dimension;

  // Map dimension back to default base unit
  const dimensionToBaseUnit = {
    [DIMENSIONS.MASS]: "kg",
    [DIMENSIONS.VOLUME]: "L",
    [DIMENSIONS.COUNT]: "ea",
  };

  if (dimA !== dimB) {
    if (source === "A") {
      // Source A changed — sync B to A's dimension base unit
      compUnitB.value = dimensionToBaseUnit[dimA] || "ea";
    } else {
      // Source B changed — sync A to B's dimension base unit
      compUnitA.value = dimensionToBaseUnit[dimB] || "ea";
    }
  }

  // Always re-compare after any unit change
  runComparatorCalc();
}

function runComparatorCalc() {
  const pA = parseFloat(document.getElementById("compPriceA").value) || 0;
  const qA = parseFloat(document.getElementById("compQtyA").value) || 0;
  const uA = document.getElementById("compUnitA").value;

  const pB = parseFloat(document.getElementById("compPriceB").value) || 0;
  const qB = parseFloat(document.getElementById("compQtyB").value) || 0;
  const uB = document.getElementById("compUnitB").value;

  const res = comparePackages(
    { price: pA, quantity: qA, unit: uA, name: "A" },
    { price: pB, quantity: qB, unit: uB, name: "B" }
  );

  const normTextA = document.getElementById("compNormA");
  const normTextB = document.getElementById("compNormB");
  const badge = document.getElementById("compWinnerBadge");
  const details = document.getElementById("compSavingsDetails");
  const t = TRANSLATIONS[currentLanguage];

  if (normTextA)
    normTextA.textContent = `${formatCurrency(res.unitPriceA || 0)} / ${res.baseUnit || "unit"}`;
  if (normTextB)
    normTextB.textContent = `${formatCurrency(res.unitPriceB || 0)} / ${res.baseUnit || "unit"}`;

  if (res.error === "DIMENSION_MISMATCH") {
    if (badge)
      badge.textContent =
        t.comp_dim_mismatch_title || "⚠️ Different Unit Dimensions";
    if (details)
      details.textContent =
        t.comp_dim_mismatch_desc || "Cannot compare Weight vs Volume directly";
    return;
  }

  if (res.winner === "TIE") {
    if (badge)
      badge.textContent = t.comp_equal_deal_title || "🤝 Equal Value Deal";
    if (details)
      details.textContent =
        t.comp_equal_deal_desc || "Both packages have identical unit prices";
  } else {
    const pkgName =
      res.winner === "A"
        ? currentLanguage === "vi"
          ? "Gói A"
          : "Package A"
        : currentLanguage === "vi"
          ? "Gói B"
          : "Package B";
    if (badge)
      badge.textContent = `🏆 ${(t.comp_winner_pkg_cheaper || "{package} is Cheaper!").replace("{package}", pkgName)}`;
    if (details) {
      if (activeComparingItemId) {
        if (res.winner === "B") {
          details.textContent = (
            t.comp_saves_pct || "Saves {percent}% ({amount} / {unit} cheaper)"
          )
            .replace("{percent}", res.savingsPercent.toFixed(1))
            .replace("{amount}", formatCurrency(res.savingsPerUnit))
            .replace("{unit}", res.baseUnit);
        } else {
          details.textContent = (
            t.comp_active_already_cheaper ||
            "Active Item (Package A) is already {percent}% cheaper! ({amount} / {unit} saved)"
          )
            .replace("{percent}", res.savingsPercent.toFixed(1))
            .replace("{amount}", formatCurrency(res.savingsPerUnit))
            .replace("{unit}", res.baseUnit);
        }
      } else {
        details.textContent = (
          t.comp_saves_pct || "Saves {percent}% ({amount} / {unit} cheaper)"
        )
          .replace("{percent}", res.savingsPercent.toFixed(1))
          .replace("{amount}", formatCurrency(res.savingsPerUnit))
          .replace("{unit}", res.baseUnit);
      }
    }
  }
}

function applyComparatorWinner() {
  const pA = parseFloat(document.getElementById("compPriceA").value) || 0;
  const qA = parseFloat(document.getElementById("compQtyA").value) || 0;
  const uA = document.getElementById("compUnitA").value;

  const pB = parseFloat(document.getElementById("compPriceB").value) || 0;
  const qB = parseFloat(document.getElementById("compQtyB").value) || 0;
  const uB = document.getElementById("compUnitB").value;

  const res = comparePackages(
    { price: pA, quantity: qA, unit: uA },
    { price: pB, quantity: qB, unit: uB }
  );

  const winPrice = res.winner === "A" ? pA : pB;
  const winQty = res.winner === "A" ? qA : qB;
  const winUnit = res.winner === "A" ? uA : uB;

  const priceInput = document.getElementById("inputItemPrice");
  const qtyInput = document.getElementById("inputItemQty");
  const unitInput = document.getElementById("inputItemUnit");
  const nameInput = document.getElementById("inputItemName");
  const catInput = document.getElementById("inputItemCategory");
  const storeInput = document.getElementById("inputItemStore");

  if (priceInput) priceInput.value = winPrice;
  if (qtyInput) qtyInput.value = winQty;
  if (unitInput) {
    const matched = Array.from(unitInput.options || []).find(
      (o) => o.value.toLowerCase() === winUnit.toLowerCase()
    );
    unitInput.value = matched ? matched.value : winUnit;
  }

  if (activeComparingItemId) {
    const item = memoryState.activeList.items.find(
      (i) => i.id === activeComparingItemId
    );
    if (item) {
      if (nameInput && item.name) nameInput.value = item.name;
      if (catInput && item.category) catInput.value = item.category;
      if (storeInput && item.store && item.store !== "—")
        storeInput.value = item.store;
    }
  }

  setActiveTab("PLANNING");
  updateLiveUnitPreview();

  if (nameInput) {
    try {
      nameInput.focus();
      nameInput.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e) {}
  }

  showToast(
    TRANSLATIONS[currentLanguage].toast_winner_form_applied ||
      "Winner package applied to form!"
  );
}

function renderQuickPriceAdjustmentChips() {
  const container = document.getElementById("quickPriceAdjustChipsContainer");
  if (!container) return;

  let steps = [];
  if (currentCurrency === "VND") {
    steps = [
      { delta: -50000, label: "-50k", color: "text-slate-300" },
      { delta: -10000, label: "-10k", color: "text-slate-300" },
      { delta: -5000, label: "-5k", color: "text-slate-300" },
      { delta: 5000, label: "+5k", color: "text-emerald-400" },
      { delta: 10000, label: "+10k", color: "text-emerald-400" },
      { delta: 50000, label: "+50k", color: "text-emerald-400" },
    ];
  } else {
    steps = [
      { delta: -1.0, label: "-1.00", color: "text-slate-300" },
      { delta: -0.5, label: "-0.50", color: "text-slate-300" },
      { delta: -0.25, label: "-0.25", color: "text-slate-300" },
      { delta: 0.25, label: "+0.25", color: "text-emerald-400" },
      { delta: 0.5, label: "+0.50", color: "text-emerald-400" },
      { delta: 1.0, label: "+1.00", color: "text-emerald-400" },
    ];
  }

  container.innerHTML = steps
    .map(
      (s) => `
            <button
              type="button"
              onclick="stepQuickPrice(${s.delta})"
              aria-label="${s.delta > 0 ? "Increase price by " + s.label.replace("+", "") : "Decrease price by " + s.label.replace("-", "")}"
              class="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 ${s.color} rounded-lg border border-slate-700 transition-colors active:scale-95 cursor-pointer"
            >
              ${s.label}
            </button>
          `
    )
    .join("");
}

function stepQuickPrice(delta) {
  const input = document.getElementById("quickPriceInput");
  if (!input) return;
  let val = parseFloat(input.value) || 0;
  if (currentCurrency === "VND") {
    val = Math.max(0, Math.round(val + delta));
    input.value = val;
  } else {
    val = Math.max(0, parseFloat((val + delta).toFixed(2)));
    input.value = val.toFixed(2);
  }
}

function openFullItemEdit(itemId) {
  const item = (memoryState.activeList.items || []).find(
    (i) => i.id === itemId
  );
  if (!item) return;

  const hiddenId = document.getElementById("editItemHiddenId");
  const nameInput = document.getElementById("editItemName");
  const catSelect = document.getElementById("editItemCategory");
  const storeSelect = document.getElementById("editItemStore");
  const qtyInput = document.getElementById("editItemQty");
  const unitSelect = document.getElementById("editItemUnit");
  const priceInput = document.getElementById("editItemPrice");

  renderCategoryOptions();
  renderUnitOptions();
  renderStoreFilterOptions();

  if (hiddenId) hiddenId.value = item.id;
  if (nameInput) nameInput.value = item.name || "";
  if (catSelect) catSelect.value = item.category || "produce";
  if (storeSelect)
    storeSelect.value =
      item.store || (memoryState.stores && memoryState.stores[0]) || "WinMart";
  if (qtyInput)
    qtyInput.value = item.quantity !== undefined ? item.quantity : 1;
  if (unitSelect) unitSelect.value = item.unit || "kg";
  if (priceInput) priceInput.value = item.price !== undefined ? item.price : 0;

  updateEditItemLivePreview();
  openModal("editItemModal");
  if (nameInput) {
    setTimeout(() => nameInput.focus(), 50);
  }
}

function updateEditItemLivePreview() {
  const qtyInput = document.getElementById("editItemQty");
  const unitSelect = document.getElementById("editItemUnit");
  const priceInput = document.getElementById("editItemPrice");
  const nameInput = document.getElementById("editItemName");
  const previewText = document.getElementById("editItemUnitPreviewText");
  const dealBadge = document.getElementById("editItemDealBadge");

  const qty = parseFloat(qtyInput ? qtyInput.value : 1) || 1;
  const unit = unitSelect ? unitSelect.value : "kg";
  const price = parseFloat(priceInput ? priceInput.value : 0) || 0;
  const name = (nameInput ? nameInput.value : "").trim();

  const unitPrice = normalizeUnitPrice(price, qty, unit);
  const { baseUnit } = normalizeQuantity(qty, unit);

  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;

  if (previewText) {
    previewText.textContent = `${t.unit_price_preview || "Unit Price:"} ${formatCurrency(unitPrice)} / ${baseUnit}`;
  }

  if (dealBadge) {
    const itemKey = normalizeItemKey(name);
    const history = (memoryState.purchaseLedger || []).filter(
      (l) => itemKey && normalizeItemKey(l.itemName) === itemKey
    );
    const deal = evaluateDealScore(unitPrice, history);
    if (deal.score === "GREAT_DEAL") {
      dealBadge.className =
        "px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/50";
      dealBadge.textContent = t.badge_great_deal || "🟢 Great Deal";
    } else if (deal.score === "PRICE_SPIKE") {
      dealBadge.className =
        "px-2 py-0.5 rounded-md font-bold text-[10px] bg-red-950 text-red-300 border border-red-700/50";
      dealBadge.textContent = t.badge_price_spike || "🔴 Price Spike";
    } else if (deal.score === "FAIR_PRICE") {
      dealBadge.className =
        "px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-950 text-amber-300 border border-amber-700/50";
      dealBadge.textContent = t.badge_fair_price || "🟡 Fair Price";
    } else {
      dealBadge.className =
        "px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-800 text-slate-300 border border-slate-700";
      dealBadge.textContent = t.badge_new_item || "⚪ New Item";
    }
  }
}

function updateItem(id, patch) {
  if (typeof store !== "undefined" && store && store.updateItem) {
    return store.updateItem(id, patch);
  }
  const item = (memoryState.activeList?.items || []).find((i) => i.id === id);
  if (item) {
    Object.assign(item, patch);
    item.updatedAt = Date.now();
    touchItem(item);
    saveToLocalStorage();
    renderApp();
    return item;
  }
  return null;
}

function submitFullItemEdit() {
  const hiddenId = document.getElementById("editItemHiddenId");
  const nameInput = document.getElementById("editItemName");
  const catSelect = document.getElementById("editItemCategory");
  const storeSelect = document.getElementById("editItemStore");
  const qtyInput = document.getElementById("editItemQty");
  const unitSelect = document.getElementById("editItemUnit");
  const priceInput = document.getElementById("editItemPrice");

  if (!hiddenId || !hiddenId.value) return;
  const itemId = hiddenId.value;
  const item = (memoryState.activeList.items || []).find(
    (i) => i.id === itemId
  );
  if (!item) return;

  const name = (nameInput ? nameInput.value : "").trim();
  if (!name) return;

  const patch = {
    name,
    category: catSelect ? catSelect.value : item.category,
    store: storeSelect ? storeSelect.value : item.store,
    quantity: qtyInput ? parseFloat(qtyInput.value) || 1 : item.quantity,
    unit: unitSelect ? unitSelect.value : item.unit,
    price: priceInput ? parseFloat(priceInput.value) || 0 : item.price,
  };

  if (typeof updateItem === "function") {
    updateItem(itemId, patch);
  } else {
    item.name = name;
    if (catSelect) item.category = catSelect.value;
    if (storeSelect) item.store = storeSelect.value;
    if (qtyInput) item.quantity = parseFloat(qtyInput.value) || 1;
    if (unitSelect) item.unit = unitSelect.value;
    if (priceInput) item.price = parseFloat(priceInput.value) || 0;
    item.updatedAt = Date.now();
    touchItem(item);
    saveToLocalStorage();
    renderApp();
  }

  closeModal("editItemModal");
  showToast(
    TRANSLATIONS[currentLanguage].toast_item_updated || "Item details updated!"
  );
}

function openQuickPriceEdit(itemId) {
  const item = memoryState.activeList.items.find((i) => i.id === itemId);
  if (!item) return;

  const idInput = document.getElementById("quickPriceItemId");
  const nameDisplay = document.getElementById("quickPriceItemNameDisplay");
  const priceInput = document.getElementById("quickPriceInput");
  const qtyInput = document.getElementById("quickQtyInput");

  if (idInput) idInput.value = item.id;
  if (nameDisplay)
    nameDisplay.textContent = `${item.name} (${item.quantity} ${item.unit})`;
  if (priceInput) priceInput.value = item.price;
  if (qtyInput) qtyInput.value = item.quantity;

  renderQuickPriceAdjustmentChips();
  openModal("quickPriceModal");
  if (priceInput) priceInput.focus();
}

function submitQuickPriceEdit() {
  const idInput = document.getElementById("quickPriceItemId");
  const priceInput = document.getElementById("quickPriceInput");
  const qtyInput = document.getElementById("quickQtyInput");

  if (!idInput) return;
  const itemId = idInput.value;
  const newPrice = parseFloat(priceInput ? priceInput.value : 0) || 0;
  const newQty = parseFloat(qtyInput ? qtyInput.value : 1) || 1;

  quickUpdateItemPrice(itemId, newPrice, newQty);
  closeModal("quickPriceModal");
}

function quickUpdateItemPrice(itemId, newPrice, newQty) {
  const patch = { price: newPrice };
  if (newQty !== undefined && newQty > 0) patch.quantity = newQty;

  if (typeof updateItem === "function") {
    updateItem(itemId, patch);
  } else {
    const item = memoryState.activeList.items.find((i) => i.id === itemId);
    if (item) {
      item.price = newPrice;
      if (newQty !== undefined && newQty > 0) item.quantity = newQty;
      touchItem(item);
      saveToLocalStorage();
      renderApp();
    }
  }

  showToast(
    TRANSLATIONS[currentLanguage].toast_price_updated || "Price updated!"
  );
}

function focusAddItemInput() {
  setTripPhase("PLANNING");
  const input = document.getElementById("inputItemName");
  if (input) {
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    input.focus();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { runComparatorCalc, openComparatorModalWithItem };
}
