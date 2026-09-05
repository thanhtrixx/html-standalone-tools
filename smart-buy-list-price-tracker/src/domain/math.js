/* =========================================================================
       2. PURE MATH & NORMALIZATION FUNCTIONS
       ========================================================================= */
if (typeof DIMENSIONS === "undefined" && typeof require !== "undefined") {
  try {
    const _units = require("./units.js");
    if (typeof globalThis !== "undefined") {
      Object.assign(globalThis, _units);
    }
  } catch (_) {}
}

function normalizeQuantity(quantity, unit) {
  const q = parseFloat(quantity);
  if (isNaN(q) || q <= 0) {
    return {
      baseQuantity: 0,
      baseUnit: "ea",
      dimension: DIMENSIONS.COUNT,
    };
  }
  const unitKey = (unit || "").toLowerCase().replace(/[\s-]/g, "_");
  const spec = UNIT_CONVERSIONS[unitKey] || {
    dimension: DIMENSIONS.COUNT,
    baseUnit: "ea",
    multiplier: 1.0,
  };
  return {
    baseQuantity: q * spec.multiplier,
    baseUnit: spec.baseUnit,
    dimension: spec.dimension,
  };
}

function normalizeUnitPrice(price, quantity, unit) {
  const p = parseFloat(price);
  const q = parseFloat(quantity);
  if (isNaN(p) || p <= 0 || isNaN(q) || q <= 0) return 0;
  const { baseQuantity } = normalizeQuantity(q, unit);
  if (baseQuantity <= 0) return 0;
  return p / baseQuantity;
}

function generateItemId(prefix = "item") {
  const timestamp = Date.now();
  let randomSuffix = "";
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    randomSuffix = crypto.randomUUID().slice(0, 8);
  } else if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    randomSuffix = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } else {
    randomSuffix = Math.random().toString(36).slice(2, 10);
  }
  return `${prefix}_${timestamp}_${randomSuffix}`;
}

function isValidId(id) {
  return typeof id === "string" && /^[a-zA-Z0-9_-]+$/.test(id);
}

function normalizeItemKey(name) {
  return typeof name === "string" ? name.trim().toLowerCase() : "";
}

function evaluateDealScore(candidateUnitPrice, historicalLedger = []) {
  const price = parseFloat(candidateUnitPrice);
  if (
    isNaN(price) ||
    price <= 0 ||
    !Array.isArray(historicalLedger) ||
    historicalLedger.length === 0
  ) {
    return {
      score: "NEW_ITEM",
      isAllTimeLow: false,
      diffPercent: 0,
      minPrice: price,
      avgPrice: price,
      lastPrice: price,
    };
  }

  // Sort ledger chronologically (oldest to newest) to identify true chronological last valid purchase
  const chronologicalLedger = [...historicalLedger].sort((a, b) => {
    const timeA = new Date(a.date || a.timestamp || 0).getTime();
    const timeB = new Date(b.date || b.timestamp || 0).getTime();
    return timeA - timeB;
  });
  const chronologicalValid = chronologicalLedger
    .map((l) => parseFloat(l.unitPrice))
    .filter((p) => !isNaN(p) && p > 0);

  const validPrices = historicalLedger
    .map((l) => parseFloat(l.unitPrice))
    .filter((p) => !isNaN(p) && p > 0);
  if (validPrices.length === 0) {
    return {
      score: "NEW_ITEM",
      isAllTimeLow: false,
      diffPercent: 0,
      minPrice: price,
      avgPrice: price,
      lastPrice: price,
    };
  }

  const minPrice = validPrices.reduce((m, p) => (p < m ? p : m), Infinity);
  const avgPrice =
    validPrices.reduce((sum, val) => sum + val, 0) / validPrices.length;
  const lastPrice =
    chronologicalValid.length > 0
      ? chronologicalValid[chronologicalValid.length - 1]
      : validPrices[validPrices.length - 1];

  const isAllTimeLow = price <= minPrice + 0.0001;
  const diffPercent = ((price - avgPrice) / avgPrice) * 100;

  let score = "FAIR_PRICE";
  if (isAllTimeLow || price <= avgPrice * 0.9) {
    score = "GREAT_DEAL";
  } else if (price > avgPrice * 1.1 || price > lastPrice * 1.15) {
    score = "PRICE_SPIKE";
  }

  return {
    score,
    isAllTimeLow,
    diffPercent,
    minPrice,
    avgPrice,
    lastPrice,
  };
}

function comparePackages(pkgA, pkgB) {
  const normA = normalizeQuantity(pkgA.quantity, pkgA.unit);
  const normB = normalizeQuantity(pkgB.quantity, pkgB.unit);

  if (normA.dimension !== normB.dimension) {
    return {
      error: "DIMENSION_MISMATCH",
      winner: null,
      savingsPercent: 0,
      savingsPerUnit: 0,
    };
  }

  const rawPriceA = parseFloat(pkgA.price) || 0;
  const discountA = parseFloat(pkgA.discountPercent) || 0;
  const effectivePriceA =
    discountA > 0 ? rawPriceA * (1 - discountA / 100) : rawPriceA;

  const rawPriceB = parseFloat(pkgB.price) || 0;
  const discountB = parseFloat(pkgB.discountPercent) || 0;
  const effectivePriceB =
    discountB > 0 ? rawPriceB * (1 - discountB / 100) : rawPriceB;

  const unitPriceA = normalizeUnitPrice(
    effectivePriceA,
    pkgA.quantity,
    pkgA.unit
  );
  const unitPriceB = normalizeUnitPrice(
    effectivePriceB,
    pkgB.quantity,
    pkgB.unit
  );

  if (Math.abs(unitPriceA - unitPriceB) < 0.0001) {
    return {
      winner: "TIE",
      unitPriceA,
      unitPriceB,
      savingsPercent: 0,
      savingsPerUnit: 0,
      baseUnit: normA.baseUnit,
    };
  }

  if (unitPriceA < unitPriceB) {
    const diff = unitPriceB - unitPriceA;
    const pct = (diff / unitPriceB) * 100;
    return {
      winner: "A",
      unitPriceA,
      unitPriceB,
      savingsPercent: pct,
      savingsPerUnit: diff,
      baseUnit: normA.baseUnit,
    };
  } else {
    const diff = unitPriceA - unitPriceB;
    const pct = (diff / unitPriceA) * 100;
    return {
      winner: "B",
      unitPriceA,
      unitPriceB,
      savingsPercent: pct,
      savingsPerUnit: diff,
      baseUnit: normA.baseUnit,
    };
  }
}

function renderSparklineSvg(prices, width = 120, height = 32) {
  if (!Array.isArray(prices) || prices.length === 0) return "";
  const valid = prices
    .map((p) => parseFloat(p))
    .filter((p) => !isNaN(p) && p > 0);
  if (valid.length === 0) return "";

  const padding = 4;
  const w = width - padding * 2;
  const h = height - padding * 2;

  if (valid.length === 1) {
    const y = height / 2;
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="overflow-visible"><line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#10b981" stroke-width="2" stroke-dasharray="3,3" /><circle cx="${width / 2}" cy="${y}" r="3" fill="#10b981" /></svg>`;
  }

  const min = valid.reduce((m, p) => (p < m ? p : m), Infinity);
  const max = valid.reduce((m, p) => (p > m ? p : m), -Infinity);
  const range = max - min === 0 ? 1 : max - min;

  const points = valid
    .map((p, idx) => {
      const x = padding + (idx / (valid.length - 1)) * w;
      const y = padding + h - ((p - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const isDropping = valid[valid.length - 1] <= valid[0];
  const strokeColor = isDropping ? "#10b981" : "#f87171";

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="overflow-visible"><polyline fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${points}" /></svg>`;
}

function getItemStoreComparison(itemName) {
  if (!itemName) return [];
  const itemKey = normalizeItemKey(itemName);
  const ledger =
    typeof memoryState !== "undefined" &&
    memoryState &&
    memoryState.purchaseLedger
      ? memoryState.purchaseLedger
      : typeof globalThis !== "undefined" &&
          globalThis.memoryState &&
          globalThis.memoryState.purchaseLedger
        ? globalThis.memoryState.purchaseLedger
        : [];
  const history = ledger.filter(
    (l) => normalizeItemKey(l.itemName) === itemKey
  );
  if (history.length === 0) return [];

  const storeMap = {};
  history.forEach((rec) => {
    const s = rec.store || "Supermarket";
    if (!storeMap[s]) {
      storeMap[s] = [];
    }
    storeMap[s].push(rec);
  });

  return Object.keys(storeMap).map((store) => {
    const records = storeMap[store];
    const prices = records.map((r) => r.unitPrice);
    const lowestUnitPrice = prices.reduce((m, p) => (p < m ? p : m), Infinity);
    const avgUnitPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const lastRecord = records[records.length - 1];
    return {
      store,
      recordCount: records.length,
      lowestUnitPrice,
      avgUnitPrice,
      lastUnitPrice: lastRecord.unitPrice,
      lastDate: lastRecord.date,
      unit: lastRecord.unit,
    };
  });
}

if (typeof module !== "undefined" && module.exports) {
  if (typeof globalThis !== "undefined") {
    globalThis.normalizeQuantity = normalizeQuantity;
    globalThis.normalizeUnitPrice = normalizeUnitPrice;
    globalThis.generateItemId = generateItemId;
    globalThis.isValidId = isValidId;
    globalThis.normalizeItemKey = normalizeItemKey;
    globalThis.evaluateDealScore = evaluateDealScore;
    globalThis.comparePackages = comparePackages;
    globalThis.renderSparklineSvg = renderSparklineSvg;
    globalThis.getItemStoreComparison = getItemStoreComparison;
  }
  module.exports = {
    normalizeQuantity,
    normalizeUnitPrice,
    generateItemId,
    isValidId,
    normalizeItemKey,
    evaluateDealScore,
    comparePackages,
    renderSparklineSvg,
    getItemStoreComparison,
  };
}
