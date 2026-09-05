/* =========================================================================
       6d. TOUCH SWIPE GESTURE CONTROLLER
       ========================================================================= */
let touchState = {
  startX: 0,
  startY: 0,
  currentX: 0,
  itemId: null,
  isSwiping: false,
};

function handleTouchStart(e, itemId) {
  if (!e.touches || e.touches.length === 0) return;
  touchState.startX = e.touches[0].clientX;
  touchState.startY = e.touches[0].clientY;
  touchState.currentX = touchState.startX;
  touchState.itemId = itemId;
  touchState.isSwiping = false;

  const card = document.getElementById(`itemCard-${itemId}`);
  if (card) {
    card.style.transition = "none";
  }
}

function handleTouchMove(e, itemId) {
  if (touchState.itemId !== itemId || !e.touches || e.touches.length === 0)
    return;
  const currentX = e.touches[0].clientX;
  const currentY = e.touches[0].clientY;
  const deltaX = currentX - touchState.startX;
  const deltaY = currentY - touchState.startY;

  if (Math.abs(deltaY) > Math.abs(deltaX) && !touchState.isSwiping) {
    return;
  }

  touchState.isSwiping = true;
  touchState.currentX = currentX;

  const clampedDelta = Math.max(-120, Math.min(120, deltaX));
  const card = document.getElementById(`itemCard-${itemId}`);
  if (card) {
    card.style.transform = `translateX(${clampedDelta}px)`;
  }

  const rightReveal = document.getElementById(`swipeRightReveal-${itemId}`);
  const leftReveal = document.getElementById(`swipeLeftReveal-${itemId}`);
  if (rightReveal && leftReveal) {
    if (clampedDelta > 0) {
      rightReveal.style.opacity = "1";
      leftReveal.style.opacity = "0";
    } else if (clampedDelta < 0) {
      rightReveal.style.opacity = "0";
      leftReveal.style.opacity = "1";
    } else {
      rightReveal.style.opacity = "1";
      leftReveal.style.opacity = "1";
    }
  }
}

function handleTouchEnd(e, itemId) {
  if (touchState.itemId !== itemId) return;
  const deltaX = touchState.currentX - touchState.startX;
  const card = document.getElementById(`itemCard-${itemId}`);

  if (card) {
    card.style.transition = "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)";
    card.style.transform = "translateX(0px)";
  }

  const rightReveal = document.getElementById(`swipeRightReveal-${itemId}`);
  const leftReveal = document.getElementById(`swipeLeftReveal-${itemId}`);
  if (rightReveal) rightReveal.style.opacity = "";
  if (leftReveal) leftReveal.style.opacity = "";

  const SWIPE_THRESHOLD = 60;
  if (touchState.isSwiping) {
    if (deltaX > SWIPE_THRESHOLD) {
      handleItemSwipeAction(itemId, "RIGHT");
    } else if (deltaX < -SWIPE_THRESHOLD) {
      handleItemSwipeAction(itemId, "LEFT");
    }
  }

  touchState.itemId = null;
  touchState.isSwiping = false;
}

function handleTouchCancel(e, itemId) {
  const card = document.getElementById(`itemCard-${itemId}`);
  if (card) {
    card.style.transition = "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)";
    card.style.transform = "translateX(0px)";
  }
  const rightReveal = document.getElementById(`swipeRightReveal-${itemId}`);
  const leftReveal = document.getElementById(`swipeLeftReveal-${itemId}`);
  if (rightReveal) rightReveal.style.opacity = "";
  if (leftReveal) leftReveal.style.opacity = "";
  touchState.itemId = null;
  touchState.isSwiping = false;
}

function handleItemSwipeAction(itemId, direction) {
  if (direction === "RIGHT") {
    toggleItemCheck(itemId);
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function"
    ) {
      navigator.vibrate([15]);
    }
  } else if (direction === "LEFT") {
    openItemComparator(itemId);
  }
}

function handleCardClick(e, itemId) {
  if (touchState.isSwiping) return;
  if (e && e.target && e.target.closest && e.target.closest("[data-action]"))
    return;
  toggleItemCheck(itemId);
}

/* =========================================================================
       6e. PAGE HORIZONTAL SWIPE GESTURE CONTROLLER (4 TABS)
       ========================================================================= */
let pageTouchState = {
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  active: false,
};

function handlePageTouchStart(e) {
  if (!e.touches || e.touches.length === 0) return;
  const target = e.target;
  if (
    target.closest("[role='dialog']") ||
    target.closest("input, select, textarea, button") ||
    target.closest("[id^='cardContainer-']") ||
    target.closest("[id^='itemCard-']") ||
    target.closest(".custom-scroll")
  ) {
    pageTouchState.active = false;
    return;
  }

  pageTouchState.startX = e.touches[0].clientX;
  pageTouchState.startY = e.touches[0].clientY;
  pageTouchState.currentX = pageTouchState.startX;
  pageTouchState.currentY = pageTouchState.startY;
  pageTouchState.active = true;
}

function handlePageTouchMove(e) {
  if (!pageTouchState.active || !e.touches || e.touches.length === 0) return;
  pageTouchState.currentX = e.touches[0].clientX;
  pageTouchState.currentY = e.touches[0].clientY;
}

function handlePageTouchEnd(e) {
  if (!pageTouchState.active) return;
  const deltaX = pageTouchState.currentX - pageTouchState.startX;
  const deltaY = pageTouchState.currentY - pageTouchState.startY;
  pageTouchState.active = false;

  const PAGE_SWIPE_THRESHOLD = 50;
  if (
    Math.abs(deltaX) >= PAGE_SWIPE_THRESHOLD &&
    Math.abs(deltaX) > Math.abs(deltaY) * 1.5
  ) {
    if (deltaX > 0) {
      handlePageSwipeAction("RIGHT");
    } else {
      handlePageSwipeAction("LEFT");
    }
  }
}

function handlePageSwipeAction(direction) {
  const currentIndex = TAB_ORDER.indexOf(currentActiveTab);
  if (currentIndex === -1) return;

  if (direction === "RIGHT" && currentIndex > 0) {
    setActiveTab(TAB_ORDER[currentIndex - 1]);
  } else if (direction === "LEFT" && currentIndex < TAB_ORDER.length - 1) {
    setActiveTab(TAB_ORDER[currentIndex + 1]);
  }
}

function handleItemCardDelegatedClick(event) {
  const actionBtn =
    event.target && event.target.closest
      ? event.target.closest("[data-action]")
      : null;
  if (!actionBtn) return;

  const action = actionBtn.getAttribute("data-action");
  const itemId = actionBtn.getAttribute("data-item-id");
  if (!itemId) return;

  if (action === "toggle-check") {
    toggleItemCheck(itemId);
  } else if (action === "edit-price") {
    openQuickPriceEdit(itemId);
  } else if (action === "edit-item") {
    openFullItemEdit(itemId);
  } else if (action === "compare") {
    openItemComparator(itemId);
  } else if (action === "delete-item") {
    deleteItem(itemId);
  }
}

function renderItemCard(item) {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
  const isChecked = Boolean(item.checked);
  const swipeRightCue = isChecked
    ? t.swipe_undo_cue || "Undo"
    : t.swipe_done_cue || "Done";
  const swipeRightBg = isChecked ? "bg-amber-600" : "bg-emerald-600";
  const swipeRightIcon = isChecked ? "↺" : "✓";
  const swipeCompCue = t.swipe_compare_cue || "Compare";

  const safeId = sanitizeHTML(item.id);
  const safeName = sanitizeHTML(item.name);
  const safeUnit = sanitizeHTML(item.unit);

  const unitPrice = normalizeUnitPrice(item.price, item.quantity, item.unit);
  const { baseUnit } = normalizeQuantity(item.quantity, item.unit);
  const itemKey = normalizeItemKey(item.name);
  const history = (memoryState.purchaseLedger || []).filter(
    (l) =>
      (itemKey && normalizeItemKey(l.itemName) === itemKey) ||
      l.itemId === item.id
  );
  const deal = evaluateDealScore(unitPrice, history);

  let dealBadgeHtml = "";
  const cleanDealLabel = (raw) => (raw || "").replace(/^[🟢🟡🔴⚪]\s*/, "");

  if (deal.score === "GREAT_DEAL") {
    const rawLabel = t.badge_great_deal || "🟢 Great Deal";
    dealBadgeHtml = `
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50 shrink-0" title="${rawLabel}">
              <span aria-hidden="true">🟢</span>
              <span class="hidden sm:inline ml-1">${cleanDealLabel(rawLabel)}</span>
            </span>`;
  } else if (deal.score === "PRICE_SPIKE") {
    const rawLabel = t.badge_price_spike || "🔴 Price Spike";
    dealBadgeHtml = `
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-950 text-red-300 border border-red-700/50 shrink-0" title="${rawLabel}">
              <span aria-hidden="true">🔴</span>
              <span class="hidden sm:inline ml-1">${cleanDealLabel(rawLabel)}</span>
            </span>`;
  } else if (deal.score === "FAIR_PRICE") {
    const rawLabel = t.badge_fair_price || "🟡 Fair Price";
    dealBadgeHtml = `
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/50 shrink-0" title="${rawLabel}">
              <span aria-hidden="true">🟡</span>
              <span class="hidden sm:inline ml-1">${cleanDealLabel(rawLabel)}</span>
            </span>`;
  } else if (deal.score === "NEW_ITEM" || !deal.score) {
    const rawLabel = t.badge_new_item || "⚪ New Item";
    dealBadgeHtml = `
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0" title="${rawLabel}">
              <span aria-hidden="true">⚪</span>
              <span class="hidden sm:inline ml-1">${cleanDealLabel(rawLabel)}</span>
            </span>`;
  }

  if (currentPhase === "IN_STORE") {
    return `
          <div class="relative overflow-hidden rounded-2xl group shadow-sm select-none" id="cardContainer-${safeId}">
            <!-- Swipe Action Backgrounds -->
            <div class="absolute inset-0 flex items-center justify-between pointer-events-none rounded-2xl">
              <!-- Left Reveal (Green/Done on Unchecked, Amber/Undo on Checked) -->
              <div class="h-full ${swipeRightBg} flex items-center gap-1.5 px-4 text-white font-bold text-xs" id="swipeRightReveal-${safeId}">
                <span aria-hidden="true">${swipeRightIcon}</span>
                <span>${swipeRightCue}</span>
              </div>
              <!-- Right Reveal (Indigo on Left Swipe) -->
              <div class="h-full bg-indigo-600 flex items-center gap-1.5 px-4 text-white font-bold text-xs ml-auto" id="swipeLeftReveal-${safeId}">
                <span aria-hidden="true">⚖️</span>
                <span>${swipeCompCue}</span>
              </div>
            </div>

            <!-- Foreground Swipeable Card (Buy Mode: Ultra-Minimalist) -->
            <div 
              id="itemCard-${safeId}"
              data-item-id="${safeId}"
              ontouchstart="handleTouchStart(event, '${safeId}')"
              ontouchmove="handleTouchMove(event, '${safeId}')"
              ontouchend="handleTouchEnd(event, '${safeId}')"
              ontouchcancel="handleTouchCancel(event, '${safeId}')"
              onclick="handleCardClick(event, '${safeId}')"
              class="relative z-10 ${item.checked ? "bg-slate-950 border-slate-800/80" : "bg-slate-900 border-slate-800"} border rounded-2xl p-3.5 sm:p-4 transition-transform duration-200 ease-out flex items-center justify-between gap-3 cursor-pointer"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <!-- Big Thumb-Friendly Checkbox -->
                <button
                  type="button"
                  data-action="toggle-check"
                  data-item-id="${safeId}"
                  aria-label="${(isChecked ? t.aria_uncheck_item || "Mark as unpurchased" : t.aria_check_item || "Mark as purchased") + ": " + safeName}"
                  class="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold border transition-all shrink-0 ${item.checked ? "bg-emerald-600 border-emerald-500 text-white shadow-sm" : "bg-slate-800 border-slate-700 text-transparent hover:border-emerald-500"}"
                >
                  <span aria-hidden="true">✓</span>
                </button>

                <!-- Item Info (Clean Name Only) -->
                <div class="flex-1 min-w-0">
                  <span class="font-bold text-base text-slate-100 truncate block ${item.checked ? "line-through text-slate-500" : ""}">${safeName}</span>
                </div>
              </div>

              <!-- Deal Badge (Tablet & Desktop >= 640px) -->
              ${dealBadgeHtml ? `<div class="hidden sm:flex items-center shrink-0">${dealBadgeHtml}</div>` : ""}

              <!-- Price (Clickable for quick shelf price update) -->
              <div class="shrink-0">
                <button
                  type="button"
                  data-action="edit-price"
                  data-item-id="${safeId}"
                  aria-label="${(t.aria_edit_price || "Update item price") + ": " + safeName}"
                  class="font-bold text-base text-slate-100 hover:text-emerald-400 bg-slate-800/70 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/60 transition-colors"
                  title="Update Price"
                >
                  ${formatCurrency(item.price)}
                </button>
              </div>
            </div>
          </div>
        `;
  }

  const catInfo = CATEGORIES[item.category] || CATEGORIES.other;

  return `
        <div class="relative overflow-hidden rounded-2xl group shadow-sm select-none" id="cardContainer-${safeId}">
          <!-- Swipe Action Backgrounds -->
          <div class="absolute inset-0 flex items-center justify-between pointer-events-none rounded-2xl">
            <!-- Left Reveal (Green/Done on Unchecked, Amber/Undo on Checked) -->
            <div class="h-full ${swipeRightBg} flex items-center gap-1.5 px-4 text-white font-bold text-xs" id="swipeRightReveal-${safeId}">
              <span aria-hidden="true">${swipeRightIcon}</span>
              <span>${swipeRightCue}</span>
            </div>
            <!-- Right Reveal (Indigo on Left Swipe) -->
            <div class="h-full bg-indigo-600 flex items-center gap-1.5 px-4 text-white font-bold text-xs ml-auto" id="swipeLeftReveal-${safeId}">
              <span aria-hidden="true">⚖️</span>
              <span>${swipeCompCue}</span>
            </div>
          </div>

          <!-- Foreground Swipeable Card (Planning Mode: Streamlined 3-Row) -->
          <div 
            id="itemCard-${safeId}"
            data-item-id="${safeId}"
            ontouchstart="handleTouchStart(event, '${safeId}')"
            ontouchmove="handleTouchMove(event, '${safeId}')"
            ontouchend="handleTouchEnd(event, '${safeId}')"
            ontouchcancel="handleTouchCancel(event, '${safeId}')"
            class="relative z-10 ${item.checked ? "bg-slate-950 border-slate-800/80" : "bg-slate-900 border-slate-800"} border rounded-2xl p-3.5 sm:p-4 transition-transform duration-200 ease-out space-y-3"
          >
            <!-- Row 1: Header (Checkbox + Category Icon + Item Name) -->
            <div class="flex items-center gap-3 min-w-0">
              <button
                type="button"
                data-action="toggle-check"
                data-item-id="${safeId}"
                aria-label="${(isChecked ? t.aria_uncheck_item || "Mark as unpurchased" : t.aria_check_item || "Mark as purchased") + ": " + safeName}"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-all shrink-0 ${item.checked ? "bg-emerald-600 border-emerald-500 text-white shadow-sm" : "bg-slate-800 border-slate-700 text-transparent hover:border-emerald-500"} cursor-pointer"
                title="Toggle Check"
              >
                <span aria-hidden="true">✓</span>
              </button>
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <span class="text-base shrink-0" aria-hidden="true">${catInfo.icon}</span>
                <span class="font-bold text-sm sm:text-base text-slate-100 truncate ${item.checked ? "line-through text-slate-500" : ""}">${safeName}</span>
              </div>
            </div>

            <!-- Row 2: Metrics & Unit Pricing Intelligence -->
            <div class="flex items-center justify-between gap-2 text-xs bg-slate-950/60 p-2 sm:p-2.5 rounded-xl border border-slate-800/80">
              <div class="flex items-center gap-2 flex-wrap min-w-0">
                <button
                  type="button"
                  data-action="edit-item"
                  data-item-id="${safeId}"
                  aria-label="${(t.aria_edit_item || "Edit item details") + ": " + safeName}"
                  class="font-semibold text-slate-200 hover:text-emerald-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 transition-colors cursor-pointer"
                  title="Adjust details"
                >
                  <span aria-hidden="true">📦</span> ${item.quantity} ${safeUnit}
                </button>
                ${unitPrice > 0 ? `<span class="text-emerald-400 font-semibold bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-800/40">${formatCurrency(unitPrice)} / ${baseUnit}</span>` : ""}
                ${dealBadgeHtml}
              </div>
              <div class="text-right text-[11px] text-slate-400 shrink-0">
                ${history.length > 0 ? `<span title="All-Time Low recorded price">${TRANSLATIONS[currentLanguage].atl_price_label || "ATL:"} <strong class="text-emerald-400 font-semibold">${formatCurrency(deal.minPrice)}/${baseUnit}</strong></span>` : `<span class="text-slate-500 italic">${TRANSLATIONS[currentLanguage].new_item || "New Item"}</span>`}
              </div>
            </div>

            <!-- Row 3: Action Toolbar & Total Estimated Spend -->
            <div class="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <div class="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  data-action="compare"
                  data-item-id="${safeId}"
                  aria-label="${(t.aria_nav_compare || "Compare") + ": " + safeName}"
                  class="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-indigo-900/60 rounded-lg border border-slate-700/60 hover:border-indigo-500/50 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Compare Pack Sizes"
                >
                  <span aria-hidden="true">⚖️</span>
                  <span>${TRANSLATIONS[currentLanguage].nav_compare || "Compare"}</span>
                </button>
                <button
                  type="button"
                  data-action="edit-item"
                  data-item-id="${safeId}"
                  aria-label="${(t.aria_edit_item || "Edit") + ": " + safeName}"
                  class="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Edit Item Details"
                >
                  <span aria-hidden="true">✏️</span>
                  <span>${TRANSLATIONS[currentLanguage].edit_btn || "Edit"}</span>
                </button>
                <button
                  type="button"
                  data-action="delete-item"
                  data-item-id="${safeId}"
                  aria-label="${(t.aria_delete_item || "Delete item") + ": " + safeName}"
                  class="px-2.5 py-1 text-xs font-semibold text-red-300 hover:text-red-200 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/40 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                  title="${TRANSLATIONS[currentLanguage].delete_item_title || TRANSLATIONS[currentLanguage].remove_btn || "Remove"}"
                >
                  <span aria-hidden="true">🗑️</span>
                  <span>${TRANSLATIONS[currentLanguage].remove_btn || "Remove"}</span>
                </button>
              </div>
              <div class="text-right">
                <button
                  type="button"
                  data-action="edit-item"
                  data-item-id="${safeId}"
                  aria-label="${(t.aria_edit_item || "Edit item") + ": " + safeName}"
                  class="font-bold text-sm sm:text-base text-slate-100 hover:text-emerald-400 transition-colors block text-right cursor-pointer"
                  title="Update Price / Details"
                >
                  ${formatCurrency(item.price)}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
}

function toggleItemCheck(id) {
  if (typeof store !== "undefined" && store && store.toggleItemCheck) {
    return store.toggleItemCheck(id);
  }
  const item = memoryState.activeList.items.find((i) => i.id === id);
  if (item) {
    item.checked = !item.checked;
    touchItem(item);
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function"
    ) {
      navigator.vibrate([15]);
    }
    saveToLocalStorage();
    renderApp();
  }
}

function deleteItem(id) {
  if (!id) return;
  if (typeof store !== "undefined" && store && store.deleteItem) {
    return store.deleteItem(id);
  }
  recordDeletedItem(id);
  memoryState.activeList.items = memoryState.activeList.items.filter(
    (i) => i.id !== id
  );
  saveToLocalStorage();
  renderApp();
}

function addItem(item) {
  if (typeof store !== "undefined" && store && store.addItem) {
    return store.addItem(item);
  }
  touchItem(item);
  if (!memoryState.activeList.items) memoryState.activeList.items = [];
  memoryState.activeList.items.push(item);
  saveToLocalStorage();
  renderApp();
  return item;
}

function handleAddItemSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById("inputItemName");
  const qtyInput = document.getElementById("inputItemQty");
  const unitInput = document.getElementById("inputItemUnit");
  const priceInput = document.getElementById("inputItemPrice");
  const catInput = document.getElementById("inputItemCategory");
  const storeInput = document.getElementById("inputItemStore");

  const name = nameInput.value.trim();
  if (!name) return;

  const newItem = {
    id: generateItemId("item"),
    name,
    category: catInput.value,
    store: storeInput.value,
    quantity: parseFloat(qtyInput.value) || 1,
    unit: unitInput.value,
    price: parseFloat(priceInput.value) || 0,
    checked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (typeof addItem === "function") {
    addItem(newItem);
  } else {
    touchItem(newItem);
    memoryState.activeList.items.push(newItem);
    saveToLocalStorage();
    renderApp();
  }

  nameInput.value = "";
  priceInput.value = "";
  showToast(TRANSLATIONS[currentLanguage].toast_item_added);
}

function updateLiveUnitPreview() {
  const price =
    parseFloat(document.getElementById("inputItemPrice").value) || 0;
  const qty = parseFloat(document.getElementById("inputItemQty").value) || 0;
  const unit = document.getElementById("inputItemUnit").value;
  const previewPill = document.getElementById("liveUnitPreviewPill");
  const previewText = document.getElementById("liveUnitPreviewText");
  const t = TRANSLATIONS[currentLanguage];

  if (price > 0 && qty > 0) {
    const unitPrice = normalizeUnitPrice(price, qty, unit);
    const { baseUnit } = normalizeQuantity(qty, unit);
    const prefix = t.unit_price_preview || "Unit Price:";
    if (previewText)
      previewText.textContent = `${prefix} ${formatCurrency(unitPrice)} / ${baseUnit}`;
    if (previewPill) previewPill.classList.remove("hidden");
  } else {
    if (previewPill) previewPill.classList.add("hidden");
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {};
}
