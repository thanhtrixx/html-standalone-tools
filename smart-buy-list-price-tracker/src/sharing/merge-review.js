function computeMergeDiff(incomingItems = [], activeItems = []) {
  const activeMap = new Map();
  for (const item of activeItems) {
    const key = normalizeItemKey(item.name);
    if (key && !activeMap.has(key)) {
      activeMap.set(key, item);
    }
  }

  const diffItems = [];
  let newCount = 0;
  let priceDiffCount = 0;
  let qtyDiffCount = 0;
  let matchCount = 0;

  for (const incItem of incomingItems) {
    const key = normalizeItemKey(incItem.name);
    const normalizedStore = resolveStoreAlias(incItem.store);
    const itemWithNormalizedStore = {
      ...incItem,
      store: normalizedStore,
    };
    const local = activeMap.get(key);

    if (!local) {
      diffItems.push({
        status: "NEW",
        incoming: itemWithNormalizedStore,
        local: null,
        selectedQtyStrategy: "REMOTE",
        useRemotePrice: true,
        includeInMerge: true,
      });
      newCount++;
    } else {
      const hasQtyDiff = Number(local.quantity) !== Number(incItem.quantity);
      const hasPriceDiff =
        Math.abs(Number(local.price || 0) - Number(incItem.price || 0)) > 0.001;

      let status = "MATCH";
      if (hasPriceDiff && hasQtyDiff) {
        status = "PRICE_AND_QTY_DIFF";
        priceDiffCount++;
        qtyDiffCount++;
      } else if (hasPriceDiff) {
        status = "PRICE_DIFF";
        priceDiffCount++;
      } else if (hasQtyDiff) {
        status = "QTY_DIFF";
        qtyDiffCount++;
      } else {
        status = "MATCH";
        matchCount++;
      }

      diffItems.push({
        status,
        incoming: itemWithNormalizedStore,
        local,
        hasQtyDiff,
        hasPriceDiff,
        selectedQtyStrategy: hasQtyDiff ? "SUM" : "LOCAL",
        useRemotePrice: hasPriceDiff,
        includeInMerge: true,
      });
    }
  }

  return {
    diffItems,
    counts: {
      newCount,
      priceDiffCount,
      qtyDiffCount,
      matchCount,
      total: incomingItems.length,
    },
  };
}

let currentMergeDiff = null;

function renderMergeReviewModal(sharedList) {
  if (!sharedList || !Array.isArray(sharedList.items)) return;
  window.pendingSharedList = sharedList;

  const diffResult = computeMergeDiff(
    sharedList.items,
    (memoryState && memoryState.activeList && memoryState.activeList.items) ||
      []
  );
  currentMergeDiff = diffResult;

  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;

  const statNew = document.getElementById("mergeStatNewCount");
  const statPrice = document.getElementById("mergeStatPriceCount");
  const statQty = document.getElementById("mergeStatQtyCount");
  const statMatch = document.getElementById("mergeStatMatchCount");
  if (statNew) statNew.textContent = diffResult.counts.newCount;
  if (statPrice) statPrice.textContent = diffResult.counts.priceDiffCount;
  if (statQty) statQty.textContent = diffResult.counts.qtyDiffCount;
  if (statMatch) statMatch.textContent = diffResult.counts.matchCount;

  const catalogCheckbox = document.getElementById("mergeUpdatePriceCatalog");
  if (catalogCheckbox && typeof catalogCheckbox.hasAttribute === "function") {
    if (!catalogCheckbox.hasAttribute("data-user-toggled")) {
      catalogCheckbox.checked = true;
    }
  } else if (catalogCheckbox) {
    catalogCheckbox.checked = true;
  }

  const container = document.getElementById("mergeDiffList");
  if (!container) return;
  container.innerHTML = "";

  const currencySymbol =
    memoryState.settings && memoryState.settings.currency === "USD" ? "$" : "₫";

  diffResult.diffItems.forEach((diff, idx) => {
    const inc = diff.incoming;
    const loc = diff.local;
    const card = document.createElement("div");
    card.className =
      "bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 text-xs";

    let badgeHtml = "";
    if (diff.status === "NEW") {
      badgeHtml = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">[🆕 ${t.badge_new_item || "New"}]</span>`;
    } else if (diff.status === "PRICE_AND_QTY_DIFF") {
      badgeHtml = `
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">[🔄 ${t.badge_price_diff || "Price Update"}]</span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">[⚖️ ${t.badge_qty_diff || "Qty Diff"}]</span>
            `;
    } else if (diff.status === "PRICE_DIFF") {
      badgeHtml = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">[🔄 ${t.badge_price_diff || "Price Update"}]</span>`;
    } else if (diff.status === "QTY_DIFF") {
      badgeHtml = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">[⚖️ ${t.badge_qty_diff || "Qty Diff"}]</span>`;
    } else {
      badgeHtml = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-700/40 text-slate-300 border border-slate-600/40">[✅ ${t.badge_matched || "Match"}]</span>`;
    }

    let controlsHtml = "";
    if (diff.status === "NEW") {
      controlsHtml = `
              <div class="flex items-center justify-between text-slate-400">
                <span>${inc.quantity} ${inc.unit || "ea"} @ ${inc.price > 0 ? inc.price.toLocaleString() + currencySymbol : "N/A"} (${inc.store || "General"})</span>
                <label class="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium">
                  <input type="checkbox" checked onchange="toggleMergeItemInclude(${idx}, this.checked)" class="rounded border-slate-700 text-emerald-500 bg-slate-800" />
                  <span>${currentLanguage === "vi" ? "Thêm" : "Add"}</span>
                </label>
              </div>
            `;
    } else {
      let qtySection = "";
      if (diff.hasQtyDiff) {
        qtySection = `
                <div class="space-y-1 pt-1 border-t border-slate-800/80">
                  <div class="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>${currentLanguage === "vi" ? "Số lượng" : "Quantity"}: Local <b>${loc.quantity}</b> vs Remote <b>${inc.quantity}</b></span>
                    <select onchange="onItemQtyStrategyChange(${idx}, this.value)" class="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-[11px] cursor-pointer">
                      <option value="SUM" ${diff.selectedQtyStrategy === "SUM" ? "selected" : ""}>Sum (${Number(loc.quantity) + Number(inc.quantity)})</option>
                      <option value="REMOTE" ${diff.selectedQtyStrategy === "REMOTE" ? "selected" : ""}>Take Remote (${inc.quantity})</option>
                      <option value="LOCAL" ${diff.selectedQtyStrategy === "LOCAL" ? "selected" : ""}>Keep Local (${loc.quantity})</option>
                    </select>
                  </div>
                </div>
              `;
      }

      let priceSection = "";
      if (diff.hasPriceDiff) {
        const locP =
          loc.price > 0 ? loc.price.toLocaleString() + currencySymbol : "N/A";
        const incP =
          inc.price > 0 ? inc.price.toLocaleString() + currencySymbol : "N/A";
        priceSection = `
                <div class="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
                  <span>${currentLanguage === "vi" ? "Giá" : "Price"}: Local <b>${locP}</b> vs Remote <b>${incP}</b></span>
                  <label class="flex items-center gap-1 cursor-pointer text-slate-300">
                    <input type="checkbox" ${diff.useRemotePrice ? "checked" : ""} onchange="onItemPriceToggle(${idx}, this.checked)" class="rounded border-slate-700 text-emerald-500 bg-slate-800" />
                    <span>${currentLanguage === "vi" ? "Dùng giá mới" : "Use new price"}</span>
                  </label>
                </div>
              `;
      }

      controlsHtml = `${qtySection}${priceSection}`;
    }

    card.innerHTML = `
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-200">${inc.name}</span>
              <div class="flex items-center gap-1">${badgeHtml}</div>
            </div>
            ${controlsHtml}
          `;
    container.appendChild(card);
  });
}

function onMergeGlobalQtyStrategyChange(strategy) {
  if (!currentMergeDiff) return;
  currentMergeDiff.diffItems.forEach((d) => {
    if (d.hasQtyDiff) {
      d.selectedQtyStrategy = strategy;
    }
  });
  const container = document.getElementById("mergeDiffList");
  if (container) {
    const selects = container.querySelectorAll("select");
    for (let i = 0; i < selects.length; i++) {
      selects[i].value = strategy;
    }
  }
}

function onItemQtyStrategyChange(idx, strategy) {
  if (currentMergeDiff && currentMergeDiff.diffItems[idx]) {
    currentMergeDiff.diffItems[idx].selectedQtyStrategy = strategy;
  }
}

function onItemPriceToggle(idx, useRemote) {
  if (currentMergeDiff && currentMergeDiff.diffItems[idx]) {
    currentMergeDiff.diffItems[idx].useRemotePrice = useRemote;
  }
}

function toggleMergeItemInclude(idx, include) {
  if (currentMergeDiff && currentMergeDiff.diffItems[idx]) {
    currentMergeDiff.diffItems[idx].includeInMerge = include;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { resolveStoreAlias, computeMergeDiff };
}
