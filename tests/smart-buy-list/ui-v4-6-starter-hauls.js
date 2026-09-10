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
      randomUUID: () => "haul_test_uuid_1234",
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
  "\n🧪 Running Smart Buy-List Starter Hauls & Filter Recovery Suite...\n"
);

try {
  const { sandbox, getOrCreateElement } = loadTestSandbox();

  sandbox.memoryState.activeList = { items: [] };
  sandbox.memoryState.purchaseLedger = [];
  sandbox.setTripPhase("PLANNING");

  // Test 1: Empty state in Planning Mode renders starter haul section
  sandbox.renderItemList();
  const emptyCard = getOrCreateElement("emptyListCard");
  const starterSection = getOrCreateElement("starterHaulSection");
  const clearFiltersBtn = getOrCreateElement("btnClearActiveFilters");

  assert(
    !emptyCard.classList.contains("hidden") &&
      !starterSection.classList.contains("hidden"),
    "STARTER-01: Empty shopping list in Planning Mode renders visible starter haul section"
  );
  assert(
    clearFiltersBtn.classList.contains("hidden"),
    "STARTER-02: Clear Active Filters button is hidden when list is truly empty"
  );

  // Test 2: loadStarterHaul populates weekly essentials
  sandbox.loadStarterHaul("ALL");
  assert(
    sandbox.memoryState.activeList.items.length >= 5,
    "STARTER-03: loadStarterHaul('ALL') populates 5 weekly essentials items into active list"
  );

  // Test 3: Zero-result filter recovery
  sandbox.currentStoreFilter = "Nonexistent_Supermarket_999";
  sandbox.renderItemList();

  const emptyTitle = getOrCreateElement("emptyListTitle");
  assert(
    !clearFiltersBtn.classList.contains("hidden"),
    "STARTER-04: Zero-result filter condition reveals 'Clear Active Filters' recovery button"
  );
  assert(
    emptyTitle.textContent.includes("filters") ||
      emptyTitle.textContent.includes("bộ lọc") ||
      emptyTitle.textContent.includes("phù hợp"),
    "STARTER-05: Zero-result filter state displays contextual filter guidance heading"
  );

  // Test 4: clearActiveFilters resets filters
  sandbox.clearActiveFilters();
  assert(
    sandbox.currentStoreFilter === "ALL" &&
      sandbox.currentCategoryFilter === "ALL",
    "STARTER-06: clearActiveFilters resets currentStoreFilter and currentCategoryFilter to 'ALL'"
  );

  // Test 5: handleItemAutocomplete prompt on zero match
  sandbox.currentLanguage = "en";
  sandbox.handleItemAutocomplete("ExoticDragonFruit123");
  const dropdown = getOrCreateElement("autocompleteDropdown");
  assert(
    !dropdown.classList.contains("hidden") &&
      dropdown.innerHTML.includes("Press Enter to add new item") &&
      dropdown.innerHTML.includes("ExoticDragonFruit123"),
    "STARTER-07: handleItemAutocomplete displays 'Press Enter to add new item' prompt when query has 0 matches"
  );
} catch (err) {
  console.error("❌ Test Execution Exception:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Smart Buy-List Starter Hauls Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
