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
      randomUUID: () =>
        "sticky_test_uuid_" + Math.random().toString(36).substring(2, 9),
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
  "\n🧪 Running Issue #385 - Sticky Grouping Headers with Subtotal Rollup Tests...\n"
);

// Test 1: By Aisle (Department) Sticky Header & Subtotal Rollup
{
  const { sandbox, getOrCreateElement } = loadTestSandbox();

  sandbox.currentGrouping = "AISLE";
  sandbox.currentLanguage = "en";
  sandbox.currentCurrency = "USD";
  sandbox.currentStoreFilter = "ALL";
  sandbox.currentCategoryFilter = "ALL";

  const testItems = [
    {
      id: "item-1",
      name: "Organic Apples",
      price: 4.5,
      category: "produce",
      quantity: 1,
      unit: "kg",
      checked: false,
    },
    {
      id: "item-2",
      name: "Fresh Spinach",
      price: 2.5,
      category: "produce",
      quantity: 1,
      unit: "bunch",
      checked: false,
    },
    {
      id: "item-3",
      name: "Almond Milk",
      price: 3.75,
      category: "dairy_eggs",
      quantity: 1,
      unit: "bottle",
      checked: false,
    },
  ];

  sandbox.memoryState.activeList = { items: testItems };
  sandbox.renderItemList();

  const itemListHtml = getOrCreateElement("activeItemsList").innerHTML;

  assert(
    itemListHtml.includes("sticky top-14 z-10") &&
      itemListHtml.includes("backdrop-blur-md") &&
      itemListHtml.includes("bg-slate-900/90"),
    "STICKY-01: Aisle section headers include sticky top-14, z-10, and backdrop-blur styling"
  );

  assert(
    itemListHtml.includes("Produce & Fruits") && itemListHtml.includes("🥦"),
    "STICKY-02: Aisle section headers render department icon and name"
  );

  assert(
    itemListHtml.includes("2 items • $7.00"),
    "STICKY-03: Produce department header rolls up correct item count and subtotal ($7.00)"
  );

  assert(
    itemListHtml.includes("1 items • $3.75"),
    "STICKY-04: Dairy department header rolls up correct item count and subtotal ($3.75)"
  );

  assert(
    itemListHtml.includes("tabular-nums"),
    "STICKY-05: Subtotal spend badge includes tabular-nums for numeric alignment"
  );
}

// Test 2: By Store Sticky Header & Subtotal Rollup
{
  const { sandbox, getOrCreateElement } = loadTestSandbox();

  sandbox.currentGrouping = "STORE";
  sandbox.currentLanguage = "en";
  sandbox.currentCurrency = "USD";
  sandbox.currentStoreFilter = "ALL";
  sandbox.currentCategoryFilter = "ALL";

  const testItems = [
    {
      id: "s-1",
      name: "Sourdough Bread",
      price: 5.0,
      store: "Whole Foods",
      category: "bakery",
      checked: false,
    },
    {
      id: "s-2",
      name: "Avocado",
      price: 3.0,
      store: "Whole Foods",
      category: "produce",
      checked: false,
    },
    {
      id: "s-3",
      name: "Ground Coffee",
      price: 12.0,
      store: "Trader Joe's",
      category: "beverages",
      checked: false,
    },
  ];

  sandbox.memoryState.activeList = { items: testItems };
  sandbox.renderItemList();

  const itemListHtml = getOrCreateElement("activeItemsList").innerHTML;

  assert(
    itemListHtml.includes("sticky top-14 z-10") &&
      itemListHtml.includes("backdrop-blur-md"),
    "STICKY-06: Store grouping headers include sticky top-14 and backdrop-blur styling"
  );

  assert(
    itemListHtml.includes("🏬") && itemListHtml.includes("Whole Foods"),
    "STICKY-07: Store grouping headers render store icon and sanitized store name"
  );

  assert(
    itemListHtml.includes("2 items • $8.00"),
    "STICKY-08: Whole Foods store header rolls up item count and subtotal ($8.00)"
  );

  assert(
    itemListHtml.includes("1 items • $12.00"),
    "STICKY-09: Trader Joe's store header rolls up item count and subtotal ($12.00)"
  );
}

// Test 3: Vietnamese Localization in Header Rollup
{
  const { sandbox, getOrCreateElement } = loadTestSandbox();

  sandbox.currentGrouping = "AISLE";
  sandbox.currentLanguage = "vi";
  sandbox.currentCurrency = "VND";
  sandbox.currentStoreFilter = "ALL";
  sandbox.currentCategoryFilter = "ALL";

  const testItems = [
    {
      id: "v-1",
      name: "Rau muống",
      price: 15000,
      category: "produce",
      checked: false,
    },
    {
      id: "v-2",
      name: "Cà chua",
      price: 25000,
      category: "produce",
      checked: false,
    },
  ];

  sandbox.memoryState.activeList = { items: testItems };
  sandbox.renderItemList();

  const itemListHtml = getOrCreateElement("activeItemsList").innerHTML;

  assert(
    itemListHtml.includes("Rau Củ & Trái Cây") && itemListHtml.includes("🥦"),
    "STICKY-10: Aisle headers render Vietnamese department name"
  );

  assert(
    itemListHtml.includes("2 mặt hàng"),
    "STICKY-11: Header badge shows Vietnamese item count label ('2 mặt hàng')"
  );

  assert(
    itemListHtml.includes("40.000"),
    "STICKY-12: Header badge calculates VND subtotal spend correctly (40.000 ₫)"
  );
}

// Test 4: Checked Items Excluded from Unchecked Header Subtotals
{
  const { sandbox, getOrCreateElement } = loadTestSandbox();

  sandbox.currentGrouping = "AISLE";
  sandbox.currentLanguage = "en";
  sandbox.currentCurrency = "USD";
  sandbox.currentStoreFilter = "ALL";
  sandbox.currentCategoryFilter = "ALL";

  const testItems = [
    {
      id: "c-1",
      name: "Item 1",
      price: 10.0,
      category: "pantry",
      checked: false,
    },
    {
      id: "c-2",
      name: "Item 2",
      price: 20.0,
      category: "pantry",
      checked: true, // checked, should not be in aisle active rollup
    },
  ];

  sandbox.memoryState.activeList = { items: testItems };
  sandbox.renderItemList();

  const itemListHtml = getOrCreateElement("activeItemsList").innerHTML;

  assert(
    itemListHtml.includes("1 items • $10.00"),
    "STICKY-13: Checked items are excluded from unchecked department subtotal rollup"
  );
}

console.log(`\nIssue #385 Test Summary: ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
