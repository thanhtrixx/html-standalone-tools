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
  "\n🧪 Running Smart Buy-List Price History Re-order & Batch Restocking Test Suite...\n"
);

const indexPath = path.join(
  __dirname,
  "../smart-buy-list-price-tracker/index.html"
);
const htmlContent = fs.readFileSync(indexPath, "utf-8");

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
        checked: false,
        textContent: "",
        innerHTML: "",
        className: "",
        children: [],
        style: {},
        placeholder: "",
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
        appendChild: function (child) {
          this.children.push(child);
        },
        addEventListener: function () {},
        removeEventListener: function () {},
        setAttribute: function (k, v) {
          this[k] = v;
        },
        getAttribute: function (k) {
          return this[k];
        },
        remove: function () {},
      };
    }
    return elements[id];
  }

  // Pre-seed known DOM element IDs
  [
    "priceLedgerModal",
    "ledgerModalTitle",
    "ledgerModalTitleText",
    "ledgerSearchInput",
    "ledgerTableContainer",
    "ledgerTableBody",
    "thSelect",
    "thDate",
    "thItem",
    "thStore",
    "thSize",
    "thPaid",
    "thUnitPrice",
    "thAction",
    "ledgerSelectAllCheckbox",
    "ledgerBatchBar",
    "btnLedgerSelectAllToggle",
    "ledgerSelectedCountText",
    "ledgerSelectedTotalText",
    "btnAddSelectedLedgerToBuyList",
    "btnTextAddSelectedLedger",
    "toastContainer",
    "activeListContainer",
    "tripSummaryCard",
    "langToggleBtn",
    "settingsLanguageSelect",
    "settingsCurrencySelect",
    "pwaVersionBadge",
  ].forEach(getOrCreateElement);

  const documentMock = {
    getElementById: (id) => getOrCreateElement(id),
    getElementsByName: () => [],
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        value: "",
        checked: false,
        textContent: "",
        innerHTML: "",
        className: "",
        children: [],
        style: {},
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
        },
        appendChild: function (child) {
          this.children.push(child);
        },
        remove: function () {},
        setAttribute: function (k, v) {
          this[k] = v;
        },
        getAttribute: function (k) {
          return this[k];
        },
      };
      return el;
    },
    addEventListener: () => {},
    documentElement: {
      classList: {
        classes: new Set(["dark"]),
        contains: (c) => c === "dark",
        add: () => {},
        remove: () => {},
      },
    },
    body: { style: {} },
  };

  const sandbox = {
    console,
    document: documentMock,
    window: {
      document: documentMock,
      addEventListener: () => {},
      scrollTo: () => {},
      navigator: { vibrate: () => {}, serviceWorker: null },
      location: { reload: () => {} },
    },
    navigator: {
      vibrate: () => {},
      serviceWorker: null,
      clipboard: { writeText: () => Promise.resolve() },
    },
    localStorage: {
      store: {},
      getItem: function (k) {
        return this.store[k] || null;
      },
      setItem: function (k, v) {
        this.store[k] = String(v);
      },
      removeItem: function (k) {
        delete this.store[k];
      },
      clear: function () {
        this.store = {};
      },
    },
    tailwind: {},
    setTimeout: (fn) => {
      if (typeof fn === "function") fn();
    },
    setInterval: () => 1,
    clearInterval: () => {},
    clearTimeout: () => {},
    Date,
    Math,
    Set,
    Array,
    Object,
    Number,
    String,
    Boolean,
    JSON,
    RegExp,
  };

  sandbox.window.tailwind = sandbox.tailwind;
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);

  return { sandbox, elements, getOrCreateElement };
}

// --- Section 1: HTML Markup & Component Structure ---
console.log("--- Section 1: HTML Markup & Component Structure ---");
assert(
  htmlContent.includes('id="priceLedgerModal"'),
  "REORDER-01: priceLedgerModal container exists in index.html"
);
assert(
  htmlContent.includes('id="ledgerSelectAllCheckbox"'),
  "REORDER-02: Select All checkbox exists in table header"
);
assert(
  htmlContent.includes('id="thSelect"') &&
    htmlContent.includes('id="thAction"'),
  "REORDER-03: thSelect and thAction column headers exist in ledger table"
);
assert(
  htmlContent.includes('id="ledgerBatchBar"'),
  "REORDER-04: Sticky batch restocking bar (#ledgerBatchBar) exists in modal"
);
assert(
  htmlContent.includes('id="btnLedgerSelectAllToggle"') &&
    htmlContent.includes('id="btnAddSelectedLedgerToBuyList"'),
  "REORDER-05: Batch bar contains Select All toggle and Add Selected button"
);
assert(
  htmlContent.includes('id="pwaVersionBadge"') &&
    /v3\.\d+\.0/.test(htmlContent),
  "REORDER-06: PWA version badge updated to v3.2.0 or higher"
);

// --- Section 2: Single-Item 1-Tap Quick-Add from Ledger ---
console.log("\n--- Section 2: Single-Item 1-Tap Quick-Add from Ledger ---");
{
  const { sandbox } = createMockSandbox();
  const memoryState = sandbox.window.memoryState;
  assert(
    typeof sandbox.window.addLedgerItemToBuyList === "function",
    "REORDER-07: addLedgerItemToBuyList function is exported globally"
  );

  // Initialize clean state
  memoryState.activeList.items = [];
  memoryState.purchaseLedger = [
    {
      id: "log-1",
      itemName: "Organic Almond Milk",
      store: "Trader Joe's",
      date: "2026-08-20",
      quantity: 2,
      unit: "l",
      price: 5.5,
      unitPrice: 2.75,
    },
  ];

  sandbox.window.addLedgerItemToBuyList("log-1");

  assert(
    memoryState.activeList.items.length === 1,
    "REORDER-08: Active list contains 1 item after 1-tap add"
  );
  const added = memoryState.activeList.items[0];
  assert(
    added.name === "Organic Almond Milk",
    "REORDER-09: Item name matches historical ledger record"
  );
  assert(
    added.store === "Trader Joe's",
    "REORDER-10: Item store matches historical ledger record"
  );
  assert(
    added.quantity === 2 && added.unit === "l",
    "REORDER-11: Quantity and unit snapshot inherited accurately"
  );
  assert(
    added.price === 5.5,
    "REORDER-12: Expected price matches historical package price"
  );
  assert(
    added.checked === false,
    "REORDER-13: Re-ordered item initializes in unchecked state"
  );
}

// --- Section 3: Case-Insensitive Deduplication & Quantity Consolidation ---
console.log(
  "\n--- Section 3: Case-Insensitive Deduplication & Quantity Consolidation ---"
);
{
  const { sandbox } = createMockSandbox();
  const memoryState = sandbox.window.memoryState;

  // Active list already has 1 Whole Milk
  memoryState.activeList.items = [
    {
      id: "item-101",
      name: "fresh whole milk",
      category: "dairy_eggs",
      store: "Costco",
      quantity: 1,
      unit: "l",
      price: 3.2,
      checked: false,
    },
  ];

  memoryState.purchaseLedger = [
    {
      id: "log-milk",
      itemName: "Fresh Whole Milk",
      store: "Costco",
      date: "2026-08-25",
      quantity: 2,
      unit: "l",
      price: 3.4,
      unitPrice: 1.7,
    },
  ];

  sandbox.window.addLedgerItemToBuyList("log-milk");

  assert(
    memoryState.activeList.items.length === 1,
    "REORDER-14: Active list does not create duplicate row for existing item"
  );
  const updated = memoryState.activeList.items[0];
  assert(
    updated.quantity === 3,
    "REORDER-15: Target quantity is incremented by historical amount (1 + 2 = 3)"
  );
  assert(
    Math.abs(updated.price - 6.6) < 0.001,
    "REORDER-16: Estimated line price accumulated additively ($3.20 + $3.40 = $6.60)"
  );
}

// --- Section 4: Multi-Select Checkbox Selection & Sticky Batch Bar ---
console.log(
  "\n--- Section 4: Multi-Select Checkbox Selection & Sticky Batch Bar ---"
);
{
  const { sandbox, elements } = createMockSandbox();
  sandbox.window.setLanguage("en");
  sandbox.window.setCurrency("USD");
  const memoryState = sandbox.window.memoryState;
  memoryState.purchaseLedger = [
    {
      id: "log-a",
      itemName: "Item A",
      store: "Costco",
      date: "2026-08-01",
      quantity: 1,
      unit: "ea",
      price: 10.0,
      unitPrice: 10.0,
    },
    {
      id: "log-b",
      itemName: "Item B",
      store: "Costco",
      date: "2026-08-02",
      quantity: 2,
      unit: "kg",
      price: 15.0,
      unitPrice: 7.5,
    },
  ];

  // Initially render ledger table
  sandbox.window.renderPriceLedgerTable("");
  assert(
    elements.ledgerBatchBar.classList.contains("hidden"),
    "REORDER-17: Batch bar is hidden when 0 items are selected"
  );

  // Toggle item A selection
  sandbox.window.toggleLedgerRowSelect("log-a", true);
  assert(
    !elements.ledgerBatchBar.classList.contains("hidden"),
    "REORDER-18: Batch bar appears when an item is selected"
  );
  assert(
    elements.ledgerSelectedCountText.textContent.includes("1"),
    "REORDER-19: Selection counter displays '1 items selected'"
  );
  assert(
    elements.ledgerSelectedTotalText.textContent.includes("10.00"),
    "REORDER-20: Estimated total preview computes $10.00"
  );

  // Toggle item B selection
  sandbox.window.toggleLedgerRowSelect("log-b", true);
  assert(
    elements.ledgerSelectedCountText.textContent.includes("2"),
    "REORDER-21: Selection counter updates to '2 items selected'"
  );
  assert(
    elements.ledgerSelectedTotalText.textContent.includes("25.00"),
    "REORDER-22: Estimated total preview computes $25.00 ($10 + $15)"
  );

  // Deselect item A
  sandbox.window.toggleLedgerRowSelect("log-a", false);
  assert(
    elements.ledgerSelectedCountText.textContent.includes("1"),
    "REORDER-23: Selection counter decrements to '1 items selected'"
  );

  // Deselect item B
  sandbox.window.toggleLedgerRowSelect("log-b", false);
  assert(
    elements.ledgerBatchBar.classList.contains("hidden"),
    "REORDER-24: Batch bar hides automatically when all selections are cleared"
  );
}

// --- Section 5: Select All / Deselect All Toggle ---
console.log("\n--- Section 5: Select All / Deselect All Toggle ---");
{
  const { sandbox, elements } = createMockSandbox();
  sandbox.window.setLanguage("en");
  sandbox.window.setCurrency("USD");
  const memoryState = sandbox.window.memoryState;
  memoryState.purchaseLedger = [
    {
      id: "log-1",
      itemName: "Item 1",
      store: "Store A",
      date: "2026-08-01",
      quantity: 1,
      unit: "ea",
      price: 5.0,
      unitPrice: 5.0,
    },
    {
      id: "log-2",
      itemName: "Item 2",
      store: "Store B",
      date: "2026-08-02",
      quantity: 1,
      unit: "ea",
      price: 8.0,
      unitPrice: 8.0,
    },
  ];

  sandbox.window.renderPriceLedgerTable("");

  // Invoke Select All
  sandbox.window.toggleSelectAllLedgerRows(true);
  assert(
    sandbox.window.selectedLedgerIds.size === 2,
    "REORDER-25: Select All adds all visible rows to selectedLedgerIds"
  );
  assert(
    elements.ledgerSelectAllCheckbox &&
      elements.ledgerSelectAllCheckbox.checked === true,
    "REORDER-26: Header select all checkbox is checked"
  );
  assert(
    (elements.btnLedgerSelectAllToggleText &&
      (elements.btnLedgerSelectAllToggleText.textContent.includes("Deselect") ||
        elements.btnLedgerSelectAllToggleText.textContent.includes(
          "Bỏ chọn"
        ))) ||
      (elements.btnLedgerSelectAllToggle &&
        (elements.btnLedgerSelectAllToggle.textContent
          .toLowerCase()
          .includes("deselect") ||
          elements.btnLedgerSelectAllToggle.textContent
            .toLowerCase()
            .includes("bỏ chọn"))),
    "REORDER-27: Toggle button label switches to 'Deselect All'"
  );

  // Deselect all
  sandbox.window.toggleSelectAllLedgerRows(false);
  assert(
    sandbox.window.selectedLedgerIds.size === 0,
    "REORDER-28: Deselect All clears all selectedLedgerIds"
  );
  assert(
    elements.ledgerSelectAllCheckbox.checked === false,
    "REORDER-29: Header select all checkbox is unchecked"
  );
  assert(
    elements.ledgerBatchBar.classList.contains("hidden"),
    "REORDER-30: Batch bar is hidden after deselecting all"
  );
}

// --- Section 6: Batch Re-order Execution ---
console.log("\n--- Section 6: Batch Re-order Execution ---");
{
  const { sandbox, elements } = createMockSandbox();
  const memoryState = sandbox.window.memoryState;
  memoryState.activeList.items = [];
  memoryState.purchaseLedger = [
    {
      id: "p1",
      itemName: "Coffee Beans",
      store: "Local Market",
      date: "2026-08-10",
      quantity: 500,
      unit: "g",
      price: 8.0,
      unitPrice: 16.0,
    },
    {
      id: "p2",
      itemName: "Olive Oil",
      store: "Trader Joe's",
      date: "2026-08-12",
      quantity: 1,
      unit: "l",
      price: 9.0,
      unitPrice: 9.0,
    },
  ];

  sandbox.window.renderPriceLedgerTable("");
  sandbox.window.toggleSelectAllLedgerRows(true);
  sandbox.window.addSelectedLedgerItemsToBuyList();

  assert(
    memoryState.activeList.items.length === 2,
    "REORDER-31: Batch addition transfers all 2 items into active Buy List"
  );
  assert(
    sandbox.window.selectedLedgerIds.size === 0,
    "REORDER-32: selectedLedgerIds is cleared following batch addition"
  );
  assert(
    elements.ledgerBatchBar.classList.contains("hidden"),
    "REORDER-33: Batch bar is hidden after batch addition"
  );
}

// --- Section 7: In-Modal Feedback & Navigation Action ---
console.log("\n--- Section 7: In-Modal Feedback & Navigation Action ---");
{
  const { sandbox, elements } = createMockSandbox();
  let actionTriggered = false;

  sandbox.window.showToast("Test Reorder", {
    actionText: "View List",
    onAction: () => {
      actionTriggered = true;
    },
  });

  const toastContainer = elements.toastContainer;
  assert(
    toastContainer.children.length > 0,
    "REORDER-34: showToast appends toast element into #toastContainer"
  );
  const toastEl = toastContainer.children[0];
  assert(
    toastEl.children.length >= 2,
    "REORDER-35: Toast contains message span and action button"
  );
  const btn = toastEl.children.find((c) => c.tagName === "BUTTON");
  assert(
    btn && btn.textContent === "View List",
    "REORDER-36: Toast action button displays 'View List'"
  );

  // Invoke action
  btn.onclick({ stopPropagation: () => {} });
  assert(
    actionTriggered === true,
    "REORDER-37: Clicking toast action invokes onAction callback"
  );
}

// --- Section 8: Bilingual Translation Parity ---
console.log("\n--- Section 8: Bilingual Translation Parity ---");
{
  const { sandbox } = createMockSandbox();
  const TRANSLATIONS = sandbox.window.TRANSLATIONS;

  const REQUIRED_KEYS = [
    "th_select",
    "th_action",
    "ledger_add_to_list",
    "ledger_quick_add_title",
    "ledger_select_all",
    "ledger_deselect_all",
    "ledger_selected_count",
    "ledger_selected_total",
    "btn_add_selected_ledger",
    "toast_items_added_to_list",
    "toast_item_added_to_list",
    "toast_item_qty_incremented",
    "toast_action_view_list",
  ];

  REQUIRED_KEYS.forEach((key) => {
    const enVal = TRANSLATIONS.en[key];
    const viVal = TRANSLATIONS.vi[key];
    assert(
      enVal && enVal.trim().length > 0,
      `I18N-EN-${key}: English dictionary contains '${key}'`
    );
    assert(
      viVal && viVal.trim().length > 0,
      `I18N-VI-${key}: Vietnamese dictionary contains '${key}'`
    );
  });
}

console.log("\n==================================================");
console.log(
  `📊 Price History Re-order Test Summary: ${passCount} Passed, ${failCount} Failed`
);
console.log("==================================================\n");

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
