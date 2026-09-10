#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  getTrackerHtml,
  getTrackerScripts,
} = require("../helpers/smart-buy-list-harness");
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
      randomUUID: () => "item_motion_uuid_1234",
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
  "\n🧪 Running Smart Buy-List Spring Micro-Interactions & Motion Suite...\n"
);

try {
  const htmlContent = getTrackerHtml();
  const sandbox = loadTestSandbox();

  // Test 1: Checkbox spring physics CSS defined in index.html
  assert(
    htmlContent.includes('[data-action="toggle-check"]') &&
      htmlContent.includes("cubic-bezier(0.34, 1.56, 0.64, 1)"),
    "MOTION-01: Checkbox [data-action='toggle-check'] styles use tactile spring cubic-bezier(0.34, 1.56, 0.64, 1)"
  );

  // Test 2: Progress bar smooth transition defined in index.html
  assert(
    htmlContent.includes("#tripProgressBar") &&
      htmlContent.includes("cubic-bezier(0.34, 1.56, 0.64, 1)"),
    "MOTION-02: #tripProgressBar transitions width using cubic-bezier easing"
  );

  // Test 3: Spring pop keyframes for checkmark icon
  assert(
    htmlContent.includes("@keyframes spring-pop") &&
      htmlContent.includes("transform: scale(1.2)"),
    "MOTION-03: @keyframes spring-pop defines bounce overshoot scaling for tactile checkmark delight"
  );

  // Test 4: Reduced motion dampens animations to 0.01ms
  assert(
    htmlContent.includes("@media (prefers-reduced-motion: reduce)") &&
      htmlContent.includes("animation-duration: 0.01ms !important") &&
      htmlContent.includes("transition-duration: 0.01ms !important"),
    "MOTION-04: prefers-reduced-motion enforces 0.01ms animation and transition dampening"
  );

  // Test 5: Item card containers include item-card-transition in Planning Mode
  const sampleItem = {
    id: "motion-item-1",
    name: "Almond Milk",
    price: 3.99,
    quantity: 1,
    unit: "L",
    category: "dairy",
    store: "ALDI",
    checked: false,
  };

  sandbox.setTripPhase("PLANNING");
  const planningCard = sandbox.renderItemCard(sampleItem);
  assert(
    planningCard.includes("item-card-transition"),
    "MOTION-05: Planning mode card container includes 'item-card-transition' for smooth section movement"
  );

  // Test 6: Item card containers include item-card-transition in Buy Mode
  sandbox.setTripPhase("IN_STORE");
  const buyCard = sandbox.renderItemCard(sampleItem);
  assert(
    buyCard.includes("item-card-transition"),
    "MOTION-06: Buy mode card container includes 'item-card-transition' for smooth section movement"
  );
} catch (err) {
  console.error("❌ Test Execution Exception:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Smart Buy-List Spring Motion Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
