const fs = require("fs");
const path = require("path");
const { getTrackerHtml } = require("../helpers/smart-buy-list-harness");
const vm = require("vm");

let testCount = 0;
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failCount++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log(
  "\n🧪 Running Smart Buy-List Differentiated Card UX Test Suite...\n"
);

const indexPath = path.join(
  __dirname,
  "../../smart-buy-list-price-tracker/index.html"
);
const htmlContent = getTrackerHtml();

function createMockSandbox() {
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");

  const elements = {};
  function getOrCreateElement(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        tagName: "DIV",
        value: "",
        textContent: "",
        innerHTML: "",
        className: "",
        classList: {
          classes: new Set(),
          add: function (...cls) {
            cls.forEach((c) => this.classes.add(c));
          },
          remove: function (...cls) {
            cls.forEach((c) => this.classes.delete(c));
          },
          contains: function (c) {
            return this.classes.has(c);
          },
          toggle: function (c) {
            if (this.classes.has(c)) this.classes.delete(c);
            else this.classes.add(c);
          },
        },
        style: {},
        focus: () => {},
        scrollIntoView: () => {},
        appendChild: function (child) {
          if (child) {
            const val = child.value || "";
            const txt = child.textContent || "";
            this.innerHTML += `<option value="${val}">${txt}</option>`;
            this.textContent += txt;
          }
        },
        attributes: {},
        setAttribute: function (k, v) {
          this.attributes[k] = String(v);
        },
        getAttribute: function (k) {
          return this.attributes[k] !== undefined ? this.attributes[k] : null;
        },
        removeAttribute: function (k) {
          delete this.attributes[k];
        },
        remove: () => {},
      };
    }
    return elements[id];
  }

  [
    "tabPlanning",
    "tabInStore",
    "navPlanningBtn",
    "navBuyModeBtn",
    "navLedgerBtn",
    "navCompareBtn",
    "navPlanningPill",
    "navBuyModePill",
    "finishTripBar",
    "addItemSection",
    "storeFilterSelect",
    "kpiItemsVal",
    "kpiSpentVal",
    "kpiEstimatedVal",
    "tripRunningTotal",
    "listCountBadge",
    "activeItemsList",
    "emptyListCard",
    "checkedItemsSection",
    "checkedItemsList",
    "checkedCountBadge",
    "inputItemName",
    "inputItemQty",
    "inputItemUnit",
    "inputItemPrice",
    "inputItemCategory",
    "inputItemStore",
    "compPriceA",
    "compQtyA",
    "compUnitA",
    "compPriceB",
    "compQtyB",
    "compUnitB",
    "compNormA",
    "compNormB",
    "compWinnerBadge",
    "compSavingsDetails",
    "compComparingItemBanner",
    "btnApplyWinnerToList",
    "comparatorModal",
    "priceLedgerModal",
    "shareModal",
    "quickPriceModal",
    "quickPriceItemId",
    "quickPriceInput",
    "quickQtyInput",
    "toastContainer",
    "fabAddItem",
    "btnGroupByAisle",
    "btnGroupByStore",
    "settingsGroupingSelect",
    "settingsModal",
    "storeManagerModal",
    "kpiCards",
    "buyModePacingTicker",
    "groupingSwitcherContainer",
    "smartQuickSection",
    "tickerCheckedVal",
    "tickerSpentVal",
    "tickerTotalVal",
    "tickerCheckedText",
  ].forEach((id) => getOrCreateElement(id));

  let vibrateCalls = [];
  const mockNavigator = {
    clipboard: { writeText: async () => {} },
    share: async () => {},
    vibrate: (pattern) => {
      vibrateCalls.push(pattern);
      return true;
    },
  };

  const storageMock = {};
  const sandbox = {
    console,
    Math,
    Date,
    parseFloat,
    parseInt,
    isNaN,
    isFinite,
    Intl,
    Array,
    Object,
    Set,
    Map,
    String,
    RegExp,
    JSON,
    encodeURIComponent,
    decodeURIComponent,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    tailwind: {},
    addEventListener: () => {},
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: mockNavigator,
    document: {
      getElementById: (id) => getOrCreateElement(id),
      querySelector: (sel) => getOrCreateElement(sel.replace("#", "")),
      querySelectorAll: () => [],
      createElement: (tag) => {
        const el = getOrCreateElement(`dyn_${Date.now()}_${Math.random()}`);
        el.tagName = tag.toUpperCase();
        return el;
      },
      documentElement: {
        classList: { contains: () => false, add: () => {}, remove: () => {} },
      },
      body: { style: {} },
    },
    localStorage: {
      getItem: (key) => storageMock[key] || null,
      setItem: (key, val) => {
        storageMock[key] = String(val);
      },
      removeItem: (key) => {
        delete storageMock[key];
      },
      clear: () => {
        Object.keys(storageMock).forEach((k) => delete storageMock[k]);
      },
    },
    getVibrateCalls: () => vibrateCalls,
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  try {
    vm.runInContext(combinedScripts, sandbox);
  } catch (e) {
    console.error("Script execution error:", e);
  }

  return sandbox;
}

// -------------------------------------------------------------------------
// SECTION 1: Buy Mode Minimalist Card Rendering (Issue #159)
// -------------------------------------------------------------------------
console.log("--- Section 1: Buy Mode Minimalist Card Rendering ---");
const sb1 = createMockSandbox();
sb1.loadSampleData();
sb1.setTripPhase("IN_STORE");

const itemMilk = sb1.memoryState.activeList.items[0]; // Fresh Whole Milk
const buyCardHtml = sb1.renderItemCard(itemMilk);

assert(
  typeof buyCardHtml === "string" && buyCardHtml.length > 0,
  "DIFF-BUY-01: renderItemCard returns HTML string in IN_STORE mode"
);

assert(
  buyCardHtml.includes(itemMilk.name),
  `DIFF-BUY-02: Buy Mode card includes item name ('${itemMilk.name}')`
);

assert(
  buyCardHtml.includes('data-action="toggle-check"') ||
    buyCardHtml.includes("toggleItemCheck"),
  "DIFF-BUY-03: Buy Mode card includes big checkbox trigger"
);

assert(
  (buyCardHtml.includes('data-action="edit-price"') ||
    buyCardHtml.includes("openQuickPriceEdit")) &&
    buyCardHtml.includes(sb1.formatCurrency(itemMilk.price)),
  `DIFF-BUY-04: Buy Mode card includes clickable shelf price (${sb1.formatCurrency(itemMilk.price)})`
);

assert(
  !buyCardHtml.includes("openItemComparator"),
  "DIFF-BUY-05: Buy Mode card hides inline comparator button (⚖️)"
);

assert(
  !buyCardHtml.includes("deleteItem"),
  "DIFF-BUY-06: Buy Mode card hides remove/delete button"
);

assert(
  !buyCardHtml.includes("Fair Price") &&
    !buyCardHtml.includes("Great Deal") &&
    !buyCardHtml.includes("Giá hợp lý") &&
    !buyCardHtml.includes("Giá tốt"),
  "DIFF-BUY-07: Buy Mode card hides deal rating badges"
);

assert(
  buyCardHtml.includes("/l") ||
    buyCardHtml.includes("/kg") ||
    buyCardHtml.includes("/L") ||
    buyCardHtml.includes("buy-mode-unit-price"),
  "DIFF-BUY-08 / BUY-UNIT-01: Buy Mode card displays normalized unit price (ADR-0033)"
);

assert(
  buyCardHtml.includes('data-testid="buy-mode-unit-price"'),
  "BUY-UNIT-02: Buy Mode card contains testid hook for unit price"
);

assert(
  buyCardHtml.includes('data-testid="buy-mode-atl-delta"') ||
    buyCardHtml.includes("ATL") ||
    buyCardHtml.includes("% vs ATL"),
  "BUY-UNIT-03: Buy Mode card displays ATL delta indicator when historical ledger records exist"
);

assert(
  !buyCardHtml.includes(itemMilk.store),
  `DIFF-BUY-09 / BUY-UNIT-04: Buy Mode card hides redundant store name badge ('${itemMilk.store}')`
);

assert(
  buyCardHtml.includes("handleTouchStart") &&
    buyCardHtml.includes("swipeRightReveal") &&
    buyCardHtml.includes("swipeLeftReveal"),
  "DIFF-BUY-10: Buy Mode card retains touch swipe containers"
);

// -------------------------------------------------------------------------
// SECTION 2: Buy Mode Interactions & Swipes
// -------------------------------------------------------------------------
console.log("\n--- Section 2: Buy Mode Interactions & Swipes ---");
const initialChecked = itemMilk.checked;
sb1.toggleItemCheck(itemMilk.id);
assert(
  itemMilk.checked !== initialChecked,
  "DIFF-INT-01: toggleItemCheck toggles item checked status"
);

const vibrateCalls = sb1.getVibrateCalls();
assert(
  vibrateCalls.length > 0,
  "DIFF-INT-02: Checking item in Buy Mode triggers tactile haptic vibration"
);

// Test Swipe Right
sb1.handleItemSwipeAction(itemMilk.id, "RIGHT");
assert(
  itemMilk.checked === initialChecked,
  "DIFF-INT-03: Swipe Right toggles item check state"
);

// -------------------------------------------------------------------------
// SECTION 3: Planning Mode Rich Expanded Card Rendering (Issue #160)
// -------------------------------------------------------------------------
console.log("\n--- Section 3: Planning Mode Rich Expanded Card Rendering ---");
const sb2 = createMockSandbox();
sb2.loadSampleData();
sb2.setTripPhase("PLANNING");

const planItemMilk = sb2.memoryState.activeList.items[0];
const planCardHtml = sb2.renderItemCard(planItemMilk);

assert(
  typeof planCardHtml === "string" && planCardHtml.length > 0,
  "DIFF-PLAN-01: renderItemCard returns HTML string in PLANNING mode"
);

assert(
  planCardHtml.includes(planItemMilk.name),
  `DIFF-PLAN-02: Planning Mode card includes item name ('${planItemMilk.name}')`
);

assert(
  planCardHtml.includes("🥛"),
  "DIFF-PLAN-03: Planning Mode card displays category icon ('🥛')"
);

assert(
  !planCardHtml.includes("🏪 " + planItemMilk.store),
  `DIFF-PLAN-04: Planning Mode card streamlines header by removing redundant store name ('${planItemMilk.store}')`
);

assert(
  /fair price|great deal|price spike|giá hợp lý|giá rất tốt|giá tăng cao|món mới/i.test(
    planCardHtml
  ) ||
    planCardHtml.includes("rounded-md text-[10px] font-bold") ||
    planCardHtml.includes("rounded-md text-[11px] font-bold"),
  "DIFF-PLAN-05: Planning Mode card displays deal score badge"
);

assert(
  !planCardHtml.includes("🟡 🟡") &&
    !planCardHtml.includes("🟢 🟢") &&
    !planCardHtml.includes("🔴 🔴"),
  "DIFF-PLAN-05B: Deal score badge contains exactly 1 emoji icon (no duplicate 🟡 🟡, 🟢 🟢, 🔴 🔴)"
);

assert(
  planCardHtml.includes(String(planItemMilk.quantity)) &&
    planCardHtml.includes(planItemMilk.unit),
  `DIFF-PLAN-06: Planning Mode card displays quantity & unit pill ('${planItemMilk.quantity} ${planItemMilk.unit}')`
);

assert(
  planCardHtml.includes("/l") ||
    planCardHtml.includes("/kg") ||
    planCardHtml.includes("/L") ||
    planCardHtml.includes("/ea") ||
    planCardHtml.includes(sb2.formatCurrency(planItemMilk.price)),
  "DIFF-PLAN-07: Planning Mode card displays normalized unit price"
);

assert(
  planCardHtml.includes("ATL:") ||
    planCardHtml.includes("All-Time Low") ||
    planCardHtml.includes("Đáy:"),
  "DIFF-PLAN-08: Planning Mode card displays historical ATL price reference"
);

assert(
  (planCardHtml.includes('data-action="compare"') ||
    planCardHtml.includes("openItemComparator")) &&
    planCardHtml.includes("⚖️"),
  "DIFF-PLAN-09: Planning Mode card includes 1-tap comparator button (⚖️)"
);

assert(
  (planCardHtml.includes('data-action="edit-item"') ||
    planCardHtml.includes("openFullItemEdit") ||
    planCardHtml.includes("openQuickPriceEdit")) &&
    planCardHtml.includes("✏️"),
  "DIFF-PLAN-10: Planning Mode card includes dedicated edit button (✏️)"
);

assert(
  (planCardHtml.includes('data-action="delete-item"') ||
    planCardHtml.includes("deleteItem")) &&
    planCardHtml.includes("🗑️"),
  "DIFF-PLAN-11: Planning Mode card includes dedicated remove button (🗑️)"
);

assert(
  planCardHtml.includes(sb2.formatCurrency(planItemMilk.price)),
  `DIFF-PLAN-12: Planning Mode card displays total estimated price (${sb2.formatCurrency(planItemMilk.price)})`
);

assert(
  planCardHtml.includes('data-action="toggle-check"') ||
    planCardHtml.includes("toggleItemCheck"),
  "DIFF-PLAN-13: Planning Mode card retains functional checkbox for staging"
);

// -------------------------------------------------------------------------
// SECTION 4: QA Fixes (Checked Swipe Undo, Store Sync, FAB & Header Cleanup)
// -------------------------------------------------------------------------
console.log("\n--- Section 4: QA Bugfixes & Ergonomics Polish ---");
const sb3 = createMockSandbox();
sb3.loadSampleData();

// 1. Checked item swipe right reveal
const checkedMilk = { ...sb3.memoryState.activeList.items[0], checked: true };
const checkedCardHtml = sb3.renderItemCard(checkedMilk);

assert(
  checkedCardHtml.includes("bg-amber-600") ||
    checkedCardHtml.includes("bg-orange-600"),
  "DIFF-QA-01: Checked item swipe right uses amber background (bg-amber-600)"
);

assert(
  checkedCardHtml.includes("Undo") ||
    checkedCardHtml.includes("Bỏ chọn") ||
    checkedCardHtml.includes("↺"),
  "DIFF-QA-02: Checked item swipe right displays Undo cue (↺ Undo)"
);

assert(
  !checkedCardHtml.includes(
    'bg-emerald-600 flex items-center gap-1.5 px-4 text-white font-bold text-xs" id="swipeRightReveal'
  ),
  "DIFF-QA-03: Checked item swipe right does not use green Done cue"
);

// 2. FAB and Header Currency removal in HTML
assert(
  !htmlContent.includes('id="fabAddItem"'),
  "DIFF-QA-04: Floating Action Button (#fabAddItem) is removed from HTML"
);

assert(
  !htmlContent.includes('id="currencySelector"'),
  "DIFF-QA-05: Currency selector (#currencySelector) is removed from Header bar HTML"
);

// 3. Store dropdown sync in Add Item form
sb3.addStore("Sprouts Farmers Market");
const addStoreEl = sb3.document.getElementById("inputItemStore");
assert(
  addStoreEl.innerHTML.includes("Sprouts Farmers Market"),
  "DIFF-QA-06: Add Item store dropdown (#inputItemStore) syncs newly added store"
);

assert(
  addStoreEl.innerHTML.includes("MANAGE_STORES"),
  "DIFF-QA-07: Add Item store dropdown (#inputItemStore) includes MANAGE_STORES option"
);

// 4. Checked item card opacity and reveal isolation (Issue #177)
assert(
  !checkedCardHtml.includes("bg-slate-950/40"),
  "DIFF-QA-08: Checked item card does not use translucent bg-slate-950/40"
);

assert(
  checkedCardHtml.includes("bg-slate-950") ||
    checkedCardHtml.includes("bg-slate-900"),
  "DIFF-QA-09: Checked item card uses solid opaque background surface"
);

// -------------------------------------------------------------------------
// SECTION 5: Responsive Deal Badges on Mobile and Tablet (Issue #326)
// -------------------------------------------------------------------------
console.log(
  "\n--- Section 5: Responsive Deal Badges on Mobile and Tablet (Issue #326) ---"
);
const sbBadges = createMockSandbox();
sbBadges.loadSampleData();

// RESP-BADGE-01: Planning Mode cards render compact emoji with hidden sm:inline text label
sbBadges.setTripPhase("PLANNING");
const planItem = sbBadges.memoryState.activeList.items[0];
const planCard = sbBadges.renderItemCard(planItem);
assert(
  planCard.includes('aria-hidden="true">') &&
    planCard.includes('class="hidden sm:inline ml-1"'),
  "RESP-BADGE-01: Planning Mode item card renders emoji icon with 'hidden sm:inline' class for responsive label"
);

// RESP-BADGE-02: Buy Mode renders deal badge on mobile without 'hidden sm:flex' wrapper
sbBadges.setTripPhase("IN_STORE");
const buyCard = sbBadges.renderItemCard(planItem);
assert(
  (buyCard.includes("sm:flex items-center shrink-0") ||
    buyCard.includes("flex items-center shrink-0")) &&
    !buyCard.includes('<div class="hidden sm:flex items-center shrink-0">'),
  "RESP-BADGE-02: Buy Mode card does not hide deal badge on mobile (removes 'hidden sm:flex')"
);

// RESP-BADGE-03: Buy Mode deal badge contains compact emoji and responsive sm:inline label
assert(
  buyCard.includes('aria-hidden="true">') &&
    buyCard.includes('class="hidden sm:inline ml-1"'),
  "RESP-BADGE-03: Buy Mode deal badge renders compact emoji on mobile and expands on tablet/desktop"
);

// RESP-BADGE-04: Comparator result badge renders responsive emoji and hidden sm:inline label
sbBadges.document.getElementById("compPriceA").value = "50000";
sbBadges.document.getElementById("compQtyA").value = "1";
sbBadges.document.getElementById("compUnitA").value = "kg";
sbBadges.document.getElementById("compPriceB").value = "40000";
sbBadges.document.getElementById("compQtyB").value = "1";
sbBadges.document.getElementById("compUnitB").value = "kg";
sbBadges.runComparatorCalc();
const compBadge = sbBadges.document.getElementById("compWinnerBadge");
assert(
  compBadge &&
    compBadge.innerHTML.includes('aria-hidden="true">🏆</span>') &&
    compBadge.innerHTML.includes('class="hidden sm:inline ml-1"'),
  "RESP-BADGE-04: Comparator result badge displays emoji on mobile and sm:inline label on tablet/desktop"
);

// RESP-BADGE-05: Accessible aria-label and title attributes present on all deal badges
assert(
  compBadge.getAttribute("aria-label") && compBadge.getAttribute("title"),
  "RESP-BADGE-05: Comparator result badge preserves accessible aria-label and title tooltip attributes"
);

// RESP-BADGE-06: Edit Item modal deal badge has responsive markup and aria-label
sbBadges.updateEditItemLivePreview();
const editBadge = sbBadges.document.getElementById("editItemDealBadge");
assert(
  editBadge &&
    editBadge.getAttribute("aria-label") &&
    editBadge.innerHTML.includes('class="hidden sm:inline ml-1"'),
  "RESP-BADGE-06: Edit Item modal deal badge provides responsive markup and aria-label"
);

// -------------------------------------------------------------------------
// SECTION 7: Context-Adaptive Viewport & Container Flattening (Issue #337)
// -------------------------------------------------------------------------
console.log(
  "\n--- Section 7: Context-Adaptive Viewport & Pacing Ticker (Issue #337) ---"
);
const sbViewport = createMockSandbox();
sbViewport.loadSampleData();

// VIEWPORT-01: In Planning Mode, kpiCards, smartQuickSection, and groupingSwitcher are visible, buyModePacingTicker is hidden
sbViewport.setTripPhase("PLANNING");
assert(
  !sbViewport.document.getElementById("kpiCards").classList.contains("hidden"),
  "VIEWPORT-01a: Planning Mode displays KPI metric cards (#kpiCards)"
);
assert(
  sbViewport.document
    .getElementById("buyModePacingTicker")
    .classList.contains("hidden"),
  "VIEWPORT-01b: Planning Mode hides ambient pacing ticker (#buyModePacingTicker)"
);
assert(
  !sbViewport.document
    .getElementById("smartQuickSection")
    .classList.contains("hidden"),
  "VIEWPORT-01c: Planning Mode displays quick-entry omnibox (#smartQuickSection)"
);
assert(
  !sbViewport.document
    .getElementById("groupingSwitcherContainer")
    .classList.contains("hidden"),
  "VIEWPORT-01d: Planning Mode displays grouping switcher (#groupingSwitcherContainer)"
);

// VIEWPORT-02: In Buy Mode, kpiCards, smartQuickSection, and groupingSwitcher are hidden, buyModePacingTicker is visible
sbViewport.setTripPhase("BUY");
assert(
  sbViewport.document.getElementById("kpiCards").classList.contains("hidden"),
  "VIEWPORT-02a: Buy Mode hides multi-card KPI bar (#kpiCards)"
);
assert(
  !sbViewport.document
    .getElementById("buyModePacingTicker")
    .classList.contains("hidden"),
  "VIEWPORT-02b: Buy Mode displays single-line ambient pacing ticker (#buyModePacingTicker)"
);
assert(
  sbViewport.document
    .getElementById("smartQuickSection")
    .classList.contains("hidden"),
  "VIEWPORT-02c: Buy Mode hides quick-entry omnibox (#smartQuickSection)"
);
assert(
  sbViewport.document
    .getElementById("groupingSwitcherContainer")
    .classList.contains("hidden"),
  "VIEWPORT-02d: Buy Mode hides grouping switcher (#groupingSwitcherContainer)"
);

// VIEWPORT-03: Pacing ticker accurately formats checked count and spent spend
sbViewport.renderKpis();
const tickerCheckedVal = sbViewport.document.getElementById("tickerCheckedVal");
const tickerSpentVal = sbViewport.document.getElementById("tickerSpentVal");
assert(
  tickerCheckedVal && tickerCheckedVal.textContent.includes("/"),
  `VIEWPORT-03a: Pacing ticker displays checked vs total count (${tickerCheckedVal ? tickerCheckedVal.textContent : ""})`
);
assert(
  tickerSpentVal && tickerSpentVal.textContent.length > 0,
  `VIEWPORT-03b: Pacing ticker displays formatted checked spend (${tickerSpentVal ? tickerSpentVal.textContent : ""})`
);

// VIEWPORT-04: Full page views (Price Ledger, Comparator) are flattened regions without card borders
assert(
  !htmlContent.includes(
    'id="priceLedgerModal"\n          role="dialog"\n          aria-modal="true"\n          aria-labelledby="ledgerModalTitle"\n          class="bg-slate-900 border border-slate-800 rounded-2xl'
  ),
  "VIEWPORT-04a: Price Ledger is flattened from a card dialog to a page region"
);
assert(
  !htmlContent.includes(
    'id="comparatorModal"\n          role="dialog"\n          aria-modal="true"\n          aria-labelledby="compModalTitle"\n          class="bg-slate-900 border border-slate-800 rounded-2xl'
  ),
  "VIEWPORT-04b: Comparator is flattened from a card dialog to a page region"
);

// -------------------------------------------------------------------------
// Summary
// -------------------------------------------------------------------------
console.log(`\n==================================================`);
console.log(
  `📊 Differentiated Card UX Test Summary: ${passCount} Passed, ${failCount} Failed`
);
console.log(`==================================================\n`);

if (failCount > 0) {
  process.exit(1);
}
