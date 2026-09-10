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
      querySelectorAll: (sel) => {
        if (sel && sel.includes("cardMenu-")) {
          return Object.values(elements).filter(
            (el) => el.id && el.id.startsWith("cardMenu-")
          );
        }
        if (sel && sel.includes("cardContainer-")) {
          return Object.values(elements).filter(
            (el) => el.id && el.id.startsWith("cardContainer-")
          );
        }
        return [];
      },
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

// CHECKBOX-BUY: Checkbox hollow outline & conditional checkmark DOM (ADR-0034 / Issue #348 / ADR-0036)
itemMilk.checked = false;
const uncheckedBuyHtml = sb1.renderItemCard(itemMilk);
assert(
  uncheckedBuyHtml.includes("w-11 h-11 rounded-xl") &&
    uncheckedBuyHtml.includes(
      "bg-slate-800/80 border-2 border-slate-600 hover:border-emerald-500"
    ),
  "CHECKBOX-BUY-01: Unchecked Buy Mode checkbox renders w-11 h-11 rounded-xl high-contrast outline"
);
const buyBtnMatch = uncheckedBuyHtml.match(
  /<button[^>]*data-action="toggle-check"[^>]*>([\s\S]*?)<\/button>/
);
assert(
  buyBtnMatch && !buyBtnMatch[1].includes("✓"),
  "CHECKBOX-BUY-02: Unchecked Buy Mode checkbox button contains zero checkmark text or glyphs"
);
assert(
  uncheckedBuyHtml.includes('data-action="toggle-check"') &&
    uncheckedBuyHtml.includes("aria-label="),
  "CHECKBOX-BUY-02b: Buy Mode checkbox has semantic data-action and accessible aria-label"
);

itemMilk.checked = true;
const checkedBuyHtml = sb1.renderItemCard(itemMilk);
assert(
  checkedBuyHtml.includes(
    "bg-emerald-600 border-emerald-500 text-white shadow-sm"
  ) && checkedBuyHtml.includes('<span aria-hidden="true">✓</span>'),
  "CHECKBOX-BUY-03: Checked Buy Mode checkbox renders solid emerald background and bold checkmark"
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

// CHECKBOX-PLAN: Planning checkbox hollow outline & conditional checkmark DOM (ADR-0034 / Issue #348 / ADR-0036)
planItemMilk.checked = false;
const uncheckedPlanHtml = sb2.renderItemCard(planItemMilk);
assert(
  uncheckedPlanHtml.includes("w-8 h-8 rounded-lg") &&
    uncheckedPlanHtml.includes(
      "bg-slate-800/80 border-2 border-slate-600 hover:border-emerald-500"
    ),
  "CHECKBOX-PLAN-01: Unchecked Planning Mode checkbox renders w-8 h-8 rounded-lg high-contrast outline"
);
const planBtnMatch = uncheckedPlanHtml.match(
  /<button[^>]*data-action="toggle-check"[^>]*>([\s\S]*?)<\/button>/
);
assert(
  planBtnMatch && !planBtnMatch[1].includes("✓"),
  "CHECKBOX-PLAN-02: Unchecked Planning Mode checkbox button contains zero checkmark text or glyphs"
);
assert(
  uncheckedPlanHtml.includes('data-action="toggle-check"') &&
    uncheckedPlanHtml.includes("aria-label="),
  "CHECKBOX-PLAN-02b: Planning Mode checkbox has semantic data-action and accessible aria-label"
);

planItemMilk.checked = true;
const checkedPlanHtml = sb2.renderItemCard(planItemMilk);
assert(
  checkedPlanHtml.includes(
    "bg-emerald-600 border-emerald-500 text-white shadow-sm"
  ) && checkedPlanHtml.includes('<span aria-hidden="true">✓</span>'),
  "CHECKBOX-PLAN-03: Checked Planning Mode checkbox renders solid emerald background and bold checkmark"
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
assert(
  editBadge &&
    editBadge.innerHTML.includes('<span aria-hidden="true">') &&
    editBadge.innerHTML.includes('<span class="hidden sm:inline ml-1">'),
  "RESP-BADGE-07a: #editItemDealBadge isolates emoji icon from responsive text label"
);
assert(
  htmlContent.includes('id="editItemDealBadge"') &&
    htmlContent.includes(
      'class="hidden sm:inline ml-1" id="editItemDealBadgeText"'
    ),
  "RESP-BADGE-07b: #editItemDealBadge static HTML template includes responsive breakpoint markup"
);

// RESP-TOUCH-01: Price History bulk action buttons satisfy 44px minimum touch targets (ADR-0034 / Issue #349)
const addSelectedBtnMatch = htmlContent.match(
  /<button[^>]*id="btnAddSelectedLedgerToBuyList"[^>]*class="([^"]*)"/
);
const deleteSelectedBtnMatch = htmlContent.match(
  /<button[^>]*id="btnDeleteSelectedLedger"[^>]*class="([^"]*)"/
);

assert(
  addSelectedBtnMatch &&
    addSelectedBtnMatch[1].includes("min-h-[44px]") &&
    addSelectedBtnMatch[1].includes("py-2.5") &&
    addSelectedBtnMatch[1].includes("px-4"),
  "RESP-TOUCH-01a: #btnAddSelectedLedgerToBuyList has min-h-[44px] py-2.5 px-4 touch targets"
);
assert(
  deleteSelectedBtnMatch &&
    deleteSelectedBtnMatch[1].includes("min-h-[44px]") &&
    deleteSelectedBtnMatch[1].includes("py-2.5") &&
    deleteSelectedBtnMatch[1].includes("px-4"),
  "RESP-TOUCH-01b: #btnDeleteSelectedLedger has min-h-[44px] py-2.5 px-4 touch targets"
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
// SECTION 8: Streamlined Two-Tier Planning Card with Swipe & Overflow (Issue #338)
// -------------------------------------------------------------------------
console.log(
  "\n--- Section 8: Streamlined Two-Tier Planning Card (Issue #338) ---"
);
const sbPlan = createMockSandbox();
sbPlan.loadSampleData();
sbPlan.setTripPhase("PLANNING");

const planItemTier = sbPlan.memoryState.activeList.items[0];
const planCardTierHtml = sbPlan.renderItemCard(planItemTier);

// PLAN-CARD-01: Two-tier structure with 3-dot overflow menu
assert(
  planCardTierHtml.includes('data-action="toggle-card-menu"') &&
    planCardTierHtml.includes("⋯"),
  "PLAN-CARD-01a: Planning card includes 3-dot overflow menu button (⋯)"
);
assert(
  planCardTierHtml.includes(`id="cardMenu-${planItemTier.id}"`),
  "PLAN-CARD-01b: Planning card includes hidden contextual actions menu"
);

// PLAN-CARD-02: Quantity stepper buttons (+ / -) in Tier 2
assert(
  planCardTierHtml.includes('data-action="increment-qty"') &&
    planCardTierHtml.includes('data-action="decrement-qty"'),
  "PLAN-CARD-02: Planning card renders quantity stepper buttons (+ / -)"
);

// PLAN-CARD-03: Tapping card body triggers handlePlanningCardClick
assert(
  typeof sbPlan.handlePlanningCardClick === "function",
  "PLAN-CARD-03a: handlePlanningCardClick exists and is exposed"
);
let openedEditFromDelegation = null;
sbPlan._mockOpenFullItemEdit = (id) => {
  openedEditFromDelegation = id;
};
vm.runInContext(
  "const _orig_edit_plan = openFullItemEdit; openFullItemEdit = (id) => { if (window._mockOpenFullItemEdit) window._mockOpenFullItemEdit(id); return _orig_edit_plan(id); };",
  sbPlan
);
const fakeCardEl = {
  getAttribute: (attr) => (attr === "data-item-id" ? planItemTier.id : null),
};
sbPlan.handleItemCardDelegatedClick({
  target: {
    closest: (selector) => {
      if (selector === "[data-action]") return null;
      if (selector === "[id^='itemCard-']") return fakeCardEl;
      return null;
    },
  },
});
assert(
  openedEditFromDelegation === planItemTier.id,
  "PLAN-CARD-03b: Delegated click on card body triggers openFullItemEdit"
);
vm.runInContext("openFullItemEdit = _orig_edit_plan;", sbPlan);

// PLAN-CARD-04: Standalone bottom row buttons removed; Compare and Remove moved into cardMenu
assert(
  !planCardTierHtml.includes(
    'class="flex items-center justify-between pt-1 border-t border-slate-800/60">\n              <div class="flex items-center gap-1.5 sm:gap-2"'
  ),
  "PLAN-CARD-04: Standalone action toolbar row removed from default card view"
);

// PLAN-CARD-05: Swipe actions (Right -> Done/Undo, Left -> Compare) + 3-dot overflow menu fallback
sbPlan.currentPhase = "PLANNING";
planItemTier.checked = false;
sbPlan.handleItemSwipeAction(planItemTier.id, "RIGHT");
assert(
  planItemTier.checked === true,
  "PLAN-CARD-05a: Swipe right in Planning mode marks item checked (Done)"
);
let swipeCompareId = null;
sbPlan._mockSwipeCompare = (id) => {
  swipeCompareId = id;
};
vm.runInContext(
  "const _orig_comp_plan = openItemComparator; openItemComparator = (id) => { if (window._mockSwipeCompare) window._mockSwipeCompare(id); return _orig_comp_plan(id); };",
  sbPlan
);
sbPlan.handleItemSwipeAction(planItemTier.id, "LEFT");
assert(
  swipeCompareId === planItemTier.id,
  "PLAN-CARD-05b: Swipe left in Planning mode triggers Comparator"
);
vm.runInContext("openItemComparator = _orig_comp_plan;", sbPlan);
assert(
  planCardTierHtml.includes('data-action="compare"') &&
    planCardTierHtml.includes('data-action="delete-item"'),
  "PLAN-CARD-05c: 3-dot overflow menu provides non-touch fallback for Compare and Delete"
);

// PLAN-CARD-06: Unclipped overflow menu toggling and deletion ergonomics (ADR-0034 / Issue #347)
const testMenuEl = sbPlan.document.getElementById(
  `cardMenu-${planItemTier.id}`
);
const testContainerEl = sbPlan.document.getElementById(
  `cardContainer-${planItemTier.id}`
);
testMenuEl.classList.add("hidden");
testContainerEl.classList.add("overflow-hidden");

// Trigger toggle-card-menu action
sbPlan.handleCardAction("toggle-card-menu", planItemTier.id);
assert(
  !testMenuEl.classList.contains("hidden"),
  "PLAN-CARD-06a: toggle-card-menu reveals cardMenu dropdown"
);
assert(
  testContainerEl.classList.contains("overflow-visible") &&
    testContainerEl.classList.contains("z-30") &&
    !testContainerEl.classList.contains("overflow-hidden"),
  "PLAN-CARD-06b: Opening cardMenu applies overflow-visible and z-30 elevation to cardContainer"
);

// Dismiss via closeAllCardMenus
sbPlan.closeAllCardMenus();
assert(
  testMenuEl.classList.contains("hidden"),
  "PLAN-CARD-06c: closeAllCardMenus hides cardMenu dropdown"
);
assert(
  testContainerEl.classList.contains("overflow-hidden") &&
    !testContainerEl.classList.contains("overflow-visible") &&
    !testContainerEl.classList.contains("z-30"),
  "PLAN-CARD-06d: closeAllCardMenus restores overflow-hidden and removes elevation"
);

// Test delete-item from card action deletes item and restores container overflow
sbPlan.handleCardAction("toggle-card-menu", planItemTier.id);
assert(
  testContainerEl.classList.contains("overflow-visible"),
  "PLAN-CARD-06e: Container is overflow-visible before deletion"
);
const initialItemCount = sbPlan.memoryState.activeList.items.length;
sbPlan.handleCardAction("delete-item", planItemTier.id);
assert(
  sbPlan.memoryState.activeList.items.length === initialItemCount - 1 &&
    !sbPlan.memoryState.activeList.items.some((i) => i.id === planItemTier.id),
  "PLAN-CARD-06f: delete-item action in card menu deletes item from active list"
);
assert(
  testContainerEl.classList.contains("overflow-hidden") &&
    !testContainerEl.classList.contains("overflow-visible"),
  "PLAN-CARD-06g: Executing action restores container overflow-hidden"
);

// -------------------------------------------------------------------------
// SECTION 9: Interactive Trip Victory Receipt Modal (Issue #339)
// -------------------------------------------------------------------------
console.log(
  "\n--- Section 9: Interactive Trip Victory Receipt Modal (Issue #339) ---"
);
const sbVic = createMockSandbox();
sbVic.loadSampleData();

// Mock ledger with known baseline prices
const testLedger = [
  {
    id: "rec_milk_1",
    itemName: "Fresh Whole Milk",
    unitPrice: 40000,
    price: 40000,
    quantity: 1,
    unit: "L",
  },
  {
    id: "rec_milk_2",
    itemName: "Fresh Whole Milk",
    unitPrice: 40000,
    price: 40000,
    quantity: 1,
    unit: "L",
  },
];

const checkedItem = {
  id: "item_vic_milk",
  name: "Fresh Whole Milk",
  price: 30000,
  quantity: 1,
  unit: "L",
  checked: true,
};
const uncheckedItem = {
  id: "item_vic_eggs",
  name: "Eggs",
  price: 35000,
  quantity: 1,
  unit: "pack",
  checked: false,
};

const savings = sbVic.calculateTripSavings([checkedItem], testLedger);

// VICTORY-01: Monetary savings vs baseline
assert(
  savings.totalSpent === 30000 &&
    savings.baselineTotal === 40000 &&
    savings.totalSavings === 10000 &&
    savings.overallSavingsPercent === 25,
  "VICTORY-01: calculateTripSavings accurately computes monetary savings against historical price baselines"
);

// VICTORY-02: Best Deal highlight
assert(
  savings.bestDeal &&
    savings.bestDeal.item.id === "item_vic_milk" &&
    savings.bestDeal.savingsPercent === 25 &&
    savings.bestDeal.savingsAmount === 10000,
  "VICTORY-02: calculateTripSavings identifies the single Best Deal of the Trip with percentage savings"
);

// VICTORY-03: 1-Tap Rollover Toggle
const radioYes = { checked: true };
const radioNo = { checked: false };
const track = {
  classList: {
    classes: new Set(["bg-emerald-600"]),
    add(c) {
      this.classes.add(c);
    },
    remove(c) {
      this.classes.delete(c);
    },
    contains(c) {
      return this.classes.has(c);
    },
  },
};
const thumb = {
  classList: {
    classes: new Set(["translate-x-4"]),
    add(c) {
      this.classes.add(c);
    },
    remove(c) {
      this.classes.delete(c);
    },
    contains(c) {
      return this.classes.has(c);
    },
  },
};
const statusText = { textContent: "" };
const statusSubtext = { textContent: "" };

sbVic.document.getElementById = (id) => {
  if (id === "radioRolloverYes") return radioYes;
  if (id === "radioRolloverNo") return radioNo;
  if (id === "tripRolloverSwitchTrack") return track;
  if (id === "tripRolloverSwitchThumb") return thumb;
  if (id === "tripRolloverStatusText") return statusText;
  if (id === "tripRolloverStatusSubtext") return statusSubtext;
  return null;
};

// Toggle to false (DISCARD)
sbVic.toggleTripRolloverAction(false);
assert(
  radioYes.checked === false &&
    radioNo.checked === true &&
    track.classList.contains("bg-slate-700") &&
    thumb.classList.contains("translate-x-0"),
  "VICTORY-03a: toggleTripRolloverAction(false) switches state to DISCARD with visual track animation"
);

// Toggle back to true (ROLLOVER)
sbVic.toggleTripRolloverAction(true);
assert(
  radioYes.checked === true &&
    radioNo.checked === false &&
    track.classList.contains("bg-emerald-600") &&
    thumb.classList.contains("translate-x-4"),
  "VICTORY-03b: toggleTripRolloverAction(true) switches state to ROLLOVER"
);

// VICTORY-04: Trip completion modal setup & celebration trigger
sbVic.memoryState.activeList.items = [checkedItem, uncheckedItem];
sbVic.memoryState.purchaseLedger = testLedger;

let victoryModalOpened = false;
sbVic._mockVictoryOpenModal = (id) => {
  if (id === "tripCompleteModal" || id === "tripVictoryModal") {
    victoryModalOpened = true;
  }
};
vm.runInContext(
  "const _orig_openModal_vic = openModal; openModal = (id) => { if (window._mockVictoryOpenModal) window._mockVictoryOpenModal(id); return _orig_openModal_vic(id); };",
  sbVic
);

const domEls = {};
sbVic.document.getElementById = (id) => {
  if (id === "radioRolloverYes") return radioYes;
  if (id === "radioRolloverNo") return radioNo;
  if (id === "tripRolloverSwitchTrack") return track;
  if (id === "tripRolloverSwitchThumb") return thumb;
  if (id === "tripRolloverStatusText") return statusText;
  if (id === "tripRolloverStatusSubtext") return statusSubtext;
  if (!domEls[id]) {
    domEls[id] = {
      textContent: "",
      classList: {
        classes: new Set(),
        add(c) {
          this.classes.add(c);
        },
        remove(c) {
          this.classes.delete(c);
        },
        contains(c) {
          return this.classes.has(c);
        },
      },
    };
  }
  return domEls[id];
};

sbVic.openTripVictoryModal();
assert(
  victoryModalOpened === true,
  "VICTORY-04a: openTripVictoryModal opens the trip completion modal"
);
vm.runInContext("openModal = _orig_openModal_vic;", sbVic);
assert(
  domEls["tripVictorySavingsHero"] &&
    !domEls["tripVictorySavingsHero"].classList.contains("hidden"),
  "VICTORY-04b: Trip victory savings hero banner is displayed"
);
assert(
  domEls["tripBestDealCard"] &&
    !domEls["tripBestDealCard"].classList.contains("hidden") &&
    domEls["tripBestDealName"].textContent === "Fresh Whole Milk",
  "VICTORY-04c: Best Deal card highlights winning deal item"
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
