#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { getTrackerScripts } = require("../helpers/smart-buy-list-harness");
const vm = require("vm");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function loadTestSandbox() {
  const combinedScripts = getTrackerScripts();
  const elements = {};
  const mockStorage = {};

  function getOrCreateElement(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        tagName: "DIV",
        value: "",
        textContent: "",
        innerHTML: "",
        placeholder: "",
        className: "",
        title: "",
        options: [],
        children: [],
        appendChild: function (child) {
          this.children.push(child);
          if (
            child &&
            (child.tagName === "OPTION" || child.value !== undefined)
          ) {
            this.options.push(child);
          }
        },
        classList: {
          classes: new Set(["hidden"]),
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
        focus: function () {},
        blur: function () {},
        addEventListener: function () {},
        removeEventListener: function () {},
        querySelectorAll: function () {
          return [];
        },
        querySelector: function () {
          return null;
        },
      };
    }
    return elements[id];
  }

  const sandbox = {
    console,
    Math,
    Date,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    Promise,
    Intl,
    crypto: {
      randomUUID: () => "popover_test_uuid_1234",
      getRandomValues: (buf) => {
        for (let i = 0; i < buf.length; i++) buf[i] = (i * 17) % 256;
        return buf;
      },
    },
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    encodeURIComponent,
    decodeURIComponent,
    escape,
    unescape,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    tailwind: {},
    localStorage: {
      getItem: (k) => (k in mockStorage ? mockStorage[k] : null),
      setItem: (k, v) => {
        mockStorage[k] = String(v);
      },
      removeItem: (k) => {
        delete mockStorage[k];
      },
      clear: () => {
        for (const k in mockStorage) delete mockStorage[k];
      },
    },
    document: {
      getElementById: (id) => getOrCreateElement(id),
      createElement: (tag) => {
        const el = getOrCreateElement("anon-" + Math.random());
        el.tagName = tag.toUpperCase();
        return el;
      },
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      documentElement: {
        classList: {
          add: () => {},
          remove: () => {},
          toggle: () => {},
          contains: () => false,
        },
      },
      body: {
        style: {},
        classList: {
          add: () => {},
          remove: () => {},
          toggle: () => {},
          contains: () => false,
        },
      },
    },
    navigator: {
      onLine: true,
      serviceWorker: {
        register: async () => ({ addEventListener: () => {} }),
        addEventListener: () => {},
        ready: Promise.resolve({ active: { postMessage: () => {} } }),
      },
      clipboard: {
        writeText: async () => {},
        readText: async () => "",
      },
      vibrate: () => true,
      share: async () => {},
      canShare: () => true,
    },
    location: {
      hash: "",
      reload: () => {},
      origin: "https://example.com",
      pathname: "/",
      search: "",
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    alert: () => {},
    confirm: () => true,
    prompt: (_, def) => def,
  };

  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);

  return { sandbox, getOrCreateElement };
}

console.log(
  "\n🧪 Running Smart Buy-List In-Aisle Quick Price Popover Suite...\n"
);

try {
  const { sandbox, getOrCreateElement } = loadTestSandbox();

  const testItem = {
    id: "item-popover-1",
    name: "Oat Milk Barista",
    price: 4.5,
    quantity: 2,
    unit: "L",
    category: "dairy",
    store: "Trader Joe's",
    checked: false,
  };

  sandbox.memoryState.activeList = { items: [testItem] };
  sandbox.memoryState.purchaseLedger = [];

  // Test 1: openQuickPriceEdit populates inputs and opens modal
  sandbox.openQuickPriceEdit("item-popover-1");
  const priceInput = getOrCreateElement("quickPriceInput");
  const qtyInput = getOrCreateElement("quickQtyInput");
  const modal = getOrCreateElement("quickPriceModal");

  assert(
    priceInput.value == 4.5 && qtyInput.value == 2,
    "POPOVER-01: openQuickPriceEdit pre-fills current price and quantity into inputs"
  );
  assert(
    !modal.classList.contains("hidden"),
    "POPOVER-02: openQuickPriceEdit opens #quickPriceModal by removing 'hidden' class"
  );

  // Test 2: Currency-aware delta chips for VND
  sandbox.currentCurrency = "VND";
  sandbox.renderQuickPriceAdjustmentChips();
  const chipsContainer = getOrCreateElement("quickPriceAdjustChipsContainer");
  assert(
    chipsContainer.innerHTML.includes("+5k") &&
      chipsContainer.innerHTML.includes("+50k"),
    "POPOVER-03: renderQuickPriceAdjustmentChips renders VND delta chips (±5k, ±10k, ±50k)"
  );

  // Test 3: Currency-aware delta chips for USD
  sandbox.currentCurrency = "USD";
  sandbox.renderQuickPriceAdjustmentChips();
  assert(
    chipsContainer.innerHTML.includes("+0.25") &&
      chipsContainer.innerHTML.includes("+1.00"),
    "POPOVER-04: renderQuickPriceAdjustmentChips renders USD delta chips (±0.25, ±0.50, ±1.00)"
  );

  // Test 4: quickUpdateItemPrice updates active item and logs to purchase ledger
  sandbox.quickUpdateItemPrice("item-popover-1", 5.25, 2);
  const updatedItem = sandbox.memoryState.activeList.items.find(
    (i) => i.id === "item-popover-1"
  );
  assert(
    updatedItem && updatedItem.price === 5.25,
    "POPOVER-05: quickUpdateItemPrice updates active item shelf price"
  );

  assert(
    sandbox.memoryState.purchaseLedger.length > 0 &&
      sandbox.memoryState.purchaseLedger[0].price === 5.25 &&
      sandbox.memoryState.purchaseLedger[0].itemName === "Oat Milk Barista",
    "POPOVER-06: quickUpdateItemPrice logs verified shelf price to historical purchaseLedger"
  );
} catch (err) {
  console.error("❌ Test Execution Exception:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Smart Buy-List Quick Price Popover Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
