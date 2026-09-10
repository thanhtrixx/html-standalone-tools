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
      randomUUID: () => "item_test_uuid_1234",
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

  return sandbox;
}

console.log(
  "\n🧪 Running Smart Buy-List In-Aisle Glanceability & Deal Badges Suite...\n"
);

try {
  const sandbox = loadTestSandbox();

  const itemGreat = {
    id: "item-deal-great",
    name: "Organic Milk",
    price: 3.5,
    quantity: 1,
    unit: "L",
    category: "dairy",
    store: "ALDI",
    checked: false,
  };

  const itemSpike = {
    id: "item-deal-spike",
    name: "Free-range Eggs",
    price: 9.0,
    quantity: 1,
    unit: "ea",
    category: "dairy",
    store: "Whole Foods",
    checked: false,
  };

  sandbox.memoryState.purchaseLedger = [
    {
      id: "hist-1",
      itemName: "Organic Milk",
      price: 5.0,
      quantity: 1,
      unit: "L",
      unitPrice: 5.0,
      baseUnit: "L",
      store: "ALDI",
      timestamp: Date.now() - 100000,
    },
    {
      id: "hist-2",
      itemName: "Free-range Eggs",
      price: 4.0,
      quantity: 1,
      unit: "ea",
      unitPrice: 4.0,
      baseUnit: "ea",
      store: "Trader Joe's",
      timestamp: Date.now() - 100000,
    },
  ];

  sandbox.setTripPhase("PLANNING");
  const planningCardHtml = sandbox.renderItemCard(itemGreat);

  assert(
    planningCardHtml.includes("tabular-nums") &&
      planningCardHtml.includes('data-action="edit-price"'),
    "GLANCE-01: Planning mode price button contains 'tabular-nums' class for number alignment"
  );
  assert(
    planningCardHtml.includes("tabular-nums text-emerald-400 font-semibold"),
    "GLANCE-02: Planning mode normalized unit price tag contains 'tabular-nums' class"
  );

  assert(
    planningCardHtml.includes("border-emerald-500/50"),
    "GLANCE-03: GREAT_DEAL badge renders WCAG AA high-contrast border 'border-emerald-500/50'"
  );

  const spikeCardHtml = sandbox.renderItemCard(itemSpike);
  assert(
    spikeCardHtml.includes("border-red-500/50"),
    "GLANCE-04: PRICE_SPIKE badge renders WCAG AA high-contrast border 'border-red-500/50'"
  );

  sandbox.setTripPhase("IN_STORE");
  const buyCardHtml = sandbox.renderItemCard(itemGreat);

  assert(
    buyCardHtml.includes("tabular-nums text-base sm:text-lg"),
    "GLANCE-05: Buy mode price button renders prominent bold tabular-nums typography"
  );
  assert(
    buyCardHtml.includes("hidden sm:inline ml-1"),
    "GLANCE-06: Deal badge supports responsive expansion (icon only on mobile, icon + label on sm:)"
  );
} catch (err) {
  console.error("❌ Test Execution Exception:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Smart Buy-List In-Aisle Glanceability Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
