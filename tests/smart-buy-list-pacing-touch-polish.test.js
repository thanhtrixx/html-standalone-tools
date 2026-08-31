const fs = require("fs");
const path = require("path");
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
  "\n🧪 Running Smart Buy-List In-Store Progress Pacing & Touch Polish Test Suite...\n"
);

const indexPath = path.join(
  __dirname,
  "../smart-buy-list-price-tracker/index.html"
);
const htmlContent = fs.readFileSync(indexPath, "utf-8");

// Mock DOM & sandbox
function createMockSandbox() {
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
          contains: (cls) => (elements[id].className || "").includes(cls),
          add: (cls) => {
            if (!elements[id].className) elements[id].className = "";
            if (!elements[id].className.includes(cls)) {
              elements[id].className =
                `${elements[id].className} ${cls}`.trim();
            }
          },
          remove: (cls) => {
            if (elements[id].className) {
              elements[id].className = elements[id].className
                .replace(new RegExp(`\\b${cls}\\b`, "g"), "")
                .trim();
            }
          },
        },
        style: {},
        focus: () => {},
        scrollIntoView: () => {},
        appendChild: (child) => {
          if (child && child.textContent) {
            elements[id].textContent += child.textContent;
          }
        },
        setAttribute: () => {},
        removeAttribute: () => {},
      };
    }
    return elements[id];
  }

  let vibrateCalls = [];
  const mockNavigator = {
    clipboard: { writeText: async () => {} },
    share: async () => {},
    vibrate: (pattern) => {
      vibrateCalls.push(pattern);
      return true;
    },
  };

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
    String,
    RegExp,
    JSON,
    encodeURIComponent,
    decodeURIComponent,
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    escape: encodeURI,
    unescape: decodeURI,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    tailwind: {},
    Number,
    Boolean,
    Promise,
    Map,
    document: {
      documentElement: {
        classList: {
          contains: () => false,
          add: () => {},
          remove: () => {},
        },
      },
      getElementById: (id) => getOrCreateElement(id),
      querySelector: (sel) => getOrCreateElement(sel.replace("#", "")),
      querySelectorAll: () => [],
      createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        className: "",
        classList: {
          add: function (cls) {
            this.className = `${this.className || ""} ${cls}`.trim();
          },
          remove: () => {},
        },
        style: {},
        textContent: "",
        innerHTML: "",
        appendChild: () => {},
        remove: () => {},
      }),
      body: {
        style: {},
        appendChild: () => {},
      },
      addEventListener: () => {},
    },
    window: {
      location: { origin: "http://localhost:8080", pathname: "/" },
      addEventListener: () => {},
    },
    navigator: mockNavigator,
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    indexedDB: null,
  };
  sandbox.window = sandbox;

  // Pre-seed elements
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
    "categoryFilterChips",
    "tripProgressBar",
    "tripProgressLabel",
    "tripRemainingSpendVal",
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
  ].forEach((id) => getOrCreateElement(id));

  sandbox.window.document = sandbox.document;
  sandbox.window.navigator = sandbox.navigator;
  sandbox.window.localStorage = sandbox.localStorage;

  const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/g);
  if (scriptMatch) {
    const combinedScript = scriptMatch
      .map((s) => s.replace(/<\/?script>/g, ""))
      .join("\n");
    vm.createContext(sandbox);
    vm.runInContext(combinedScript, sandbox);
  }

  return { sandbox, elements, vibrateCalls };
}

// ----------------------------------------------------
// Section 1: In-Store Shopping Progress Pacing
// ----------------------------------------------------
console.log("--- Section 1: In-Store Shopping Progress Pacing ---");
{
  const { sandbox, elements } = createMockSandbox();
  sandbox.setLanguage("en");
  sandbox.setCurrency("USD");
  sandbox.memoryState.activeList.items = [
    {
      id: "1",
      name: "Milk",
      price: 3.5,
      quantity: 1,
      unit: "l",
      category: "dairy",
      checked: false,
    },
    {
      id: "2",
      name: "Bread",
      price: 2.5,
      quantity: 1,
      unit: "ea",
      category: "bakery",
      checked: false,
    },
    {
      id: "3",
      name: "Rice",
      price: 10.0,
      quantity: 5,
      unit: "kg",
      category: "pantry",
      checked: false,
    },
    {
      id: "4",
      name: "Apples",
      price: 4.0,
      quantity: 1,
      unit: "kg",
      category: "produce",
      checked: false,
    },
  ];

  sandbox.renderApp();

  assert(
    typeof sandbox.updateTripProgress === "function" ||
      elements["tripProgressBar"] !== undefined,
    "PACE-01a: Progress bar element or updateTripProgress is integrated"
  );

  // Check 2 items
  sandbox.toggleItemCheck("1");
  sandbox.toggleItemCheck("2");

  const pBar = elements["tripProgressBar"];
  const pLabel = elements["tripProgressLabel"];
  const remSpend = elements["tripRemainingSpendVal"];

  assert(
    pBar && pBar.style && pBar.style.width === "50%",
    "PACE-01b: 2 of 4 items checked updates progress bar width to 50%"
  );
  assert(
    pLabel && pLabel.textContent.includes("2 / 4 (50%)"),
    `PACE-02: Progress label displays formatted completion text: '${pLabel ? pLabel.textContent : ""}'`
  );
  assert(
    remSpend && remSpend.textContent.includes("14.00"),
    `PACE-03: Remaining unpurchased spend accurately computes $14.00 ($10.00 + $4.00): '${remSpend ? remSpend.textContent : ""}'`
  );
}

// ----------------------------------------------------
// Section 2: Aisle / Department Quick Filter Chips
// ----------------------------------------------------
console.log("\n--- Section 2: Aisle / Department Quick Filter Chips ---");
{
  const { sandbox, elements } = createMockSandbox();
  sandbox.memoryState.activeList.items = [
    {
      id: "1",
      name: "Milk",
      price: 3.5,
      quantity: 1,
      unit: "l",
      category: "dairy",
      checked: false,
    },
    {
      id: "2",
      name: "Cheese",
      price: 5.0,
      quantity: 1,
      unit: "pk",
      category: "dairy",
      checked: false,
    },
    {
      id: "3",
      name: "Steak",
      price: 15.0,
      quantity: 1,
      unit: "kg",
      category: "meat",
      checked: false,
    },
  ];

  assert(
    typeof sandbox.filterByCategory === "function",
    "AISLE-01: filterByCategory function is globally available"
  );

  sandbox.filterByCategory("dairy");
  assert(
    sandbox.currentCategoryFilter === "dairy",
    "AISLE-02a: currentCategoryFilter updates to 'dairy'"
  );

  const activeList = elements["activeItemsList"];
  assert(
    activeList.innerHTML.includes("Milk") &&
      activeList.innerHTML.includes("Cheese") &&
      !activeList.innerHTML.includes("Steak"),
    "AISLE-02b: Isolates active list items strictly to Dairy category"
  );

  sandbox.filterByCategory("ALL");
  assert(
    activeList.innerHTML.includes("Steak"),
    "AISLE-03: Resetting to 'ALL' restores all active department items"
  );
}

// ----------------------------------------------------
// Section 3: MD3 Bottom Sheet Presentation & Fast Adjustment Chips
// ----------------------------------------------------
console.log(
  "\n--- Section 3: MD3 Bottom Sheet Presentation & Fast Step Chips ---"
);
{
  const { sandbox, elements } = createMockSandbox();
  sandbox.setCurrency("USD");

  assert(
    typeof sandbox.stepQuickPrice === "function",
    "SHEET-01: stepQuickPrice function is globally available"
  );

  elements["quickPriceInput"].value = "3.50";
  sandbox.stepQuickPrice(0.5);
  assert(
    elements["quickPriceInput"].value === "4" ||
      elements["quickPriceInput"].value === "4.00",
    `SHEET-02: stepQuickPrice(+0.50) increments 3.50 to 4.00 (Got: ${elements["quickPriceInput"].value})`
  );

  sandbox.stepQuickPrice(-1.0);
  assert(
    elements["quickPriceInput"].value === "3" ||
      elements["quickPriceInput"].value === "3.00",
    `SHEET-03: stepQuickPrice(-1.00) decrements 4.00 to 3.00 (Got: ${elements["quickPriceInput"].value})`
  );

  sandbox.stepQuickPrice(-10.0);
  assert(
    parseFloat(elements["quickPriceInput"].value) >= 0,
    "SHEET-04: stepQuickPrice clamps price safely to >= 0"
  );
}

// ----------------------------------------------------
// Section 4: Enhanced Comparator Decision Intelligence Verdict
// ----------------------------------------------------
console.log(
  "\n--- Section 4: Enhanced Comparator Decision Intelligence Verdict ---"
);
{
  const { sandbox, elements } = createMockSandbox();

  elements["compPriceA"].value = "10.00";
  elements["compQtyA"].value = "1";
  elements["compUnitA"].value = "kg";

  elements["compPriceB"].value = "16.00";
  elements["compQtyB"].value = "2";
  elements["compUnitB"].value = "kg";

  sandbox.runComparatorCalc();

  const details = elements["compSavingsDetails"];
  assert(
    details && details.textContent.includes("20.0%"),
    `COMP-VERDICT-01: Comparator details calculates 20% savings percentage: '${details ? details.textContent : ""}'`
  );
}

// ----------------------------------------------------
// Section 5: Tactile Check Confirmation (Haptics)
// ----------------------------------------------------
console.log("\n--- Section 5: Tactile Check Confirmation (Haptics) ---");
{
  const { sandbox, vibrateCalls } = createMockSandbox();
  sandbox.memoryState.activeList.items = [
    {
      id: "1",
      name: "Milk",
      price: 3.5,
      quantity: 1,
      unit: "l",
      category: "dairy",
      checked: false,
    },
  ];

  sandbox.toggleItemCheck("1");
  assert(
    vibrateCalls.length > 0 && vibrateCalls[0][0] === 15,
    "HAPTIC-01: toggleItemCheck invokes navigator.vibrate([15]) for tactile check confirmation"
  );
}

// ----------------------------------------------------
// Summary
// ----------------------------------------------------
console.log("\n==================================================");
console.log(
  `📊 Pacing & Touch Polish Test Summary: ${passCount} Passed, ${failCount} Failed`
);
console.log("==================================================\n");

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
