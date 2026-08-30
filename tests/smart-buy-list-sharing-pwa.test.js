const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyListSharingEngine() {
  const htmlPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");

  const storageMock = {};
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
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    encodeURIComponent,
    decodeURIComponent,
    escape,
    unescape,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    tailwind: {},
    addEventListener: () => {},
    scrollTo: () => {},
    location: { origin: "http://localhost", pathname: "/", hash: "" },
    navigator: {
      clipboard: { writeText: () => Promise.resolve() },
      share: () => Promise.resolve(),
    },
    document: {
      getElementById: () => ({
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        textContent: "",
        innerHTML: "",
        style: {},
        appendChild: () => {},
      }),
      createElement: () => ({
        className: "",
        textContent: "",
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        remove: () => {},
        setAttribute: () => {},
        click: () => {},
      }),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      documentElement: {
        classList: { contains: () => false, add: () => {}, remove: () => {} },
      },
      body: { style: {}, appendChild: () => {} },
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
    indexedDB: null,
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);
  return { sandbox, storageMock };
}

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

console.log(
  "\n🧪 Running Smart Buy-List URL Sharing & PWA Integration Test Suite...\n"
);

try {
  const { sandbox } = loadBuyListSharingEngine();

  // 1. URL STATE ENCODING & DECODING
  console.log("--- Section 1: Serverless URL State Payload Compression ---");

  assert(
    typeof sandbox.encodeSharePayload === "function",
    "encodeSharePayload function is exported globally"
  );
  assert(
    typeof sandbox.decodeSharePayload === "function",
    "decodeSharePayload function is exported globally"
  );

  const sampleList = {
    title: "Weekend Barbecue Haul",
    items: [
      {
        id: "1",
        name: "Ribeye Steak",
        category: "meat_seafood",
        store: "Costco",
        quantity: 2,
        unit: "kg",
        price: 28.5,
        checked: false,
      },
      {
        id: "2",
        name: "Charcoal Briquettes",
        category: "household",
        store: "Local Market",
        quantity: 1,
        unit: "pk",
        price: 9.99,
        checked: false,
      },
    ],
  };

  const encoded = sandbox.encodeSharePayload(sampleList);
  assert(
    typeof encoded === "string" && encoded.length > 0,
    "SHARE-01a: Active list successfully serialized to base64 payload"
  );

  const decoded = sandbox.decodeSharePayload(encoded);
  assert(
    decoded !== null && decoded.title === "Weekend Barbecue Haul",
    "SHARE-01b: Decoded payload preserves list title"
  );
  assert(
    Array.isArray(decoded.items) && decoded.items.length === 2,
    "SHARE-01c: Decoded payload preserves 2 shopping items"
  );
  assert(
    decoded.items[0].name === "Ribeye Steak" &&
      decoded.items[0].quantity === 2 &&
      decoded.items[0].unit === "kg" &&
      decoded.items[0].price === 28.5,
    "SHARE-01d: Decoded item attributes strictly match original data"
  );

  // 2. CORRUPTED & MALFORMED PAYLOAD RESILIENCE
  console.log("\n--- Section 2: Error Resilience on Malformed Hash ---");

  const corruptResult = sandbox.decodeSharePayload("invalid!!!not-base64-@@@");
  assert(
    corruptResult === null,
    "SHARE-02: Corrupted share hash returns null gracefully without throwing"
  );

  // 3. RECIPIENT SMART MERGE PROTOCOL
  console.log(
    "\n--- Section 3: Smart Recipient Import & Deduplication Merge ---"
  );

  // Setup current active list with 1 existing item ("Ribeye Steak")
  sandbox.memoryState.activeList.items = [
    {
      id: "orig_1",
      name: "Ribeye Steak",
      category: "meat_seafood",
      store: "Costco",
      quantity: 1,
      unit: "kg",
      price: 15.0,
      checked: false,
    },
  ];

  // Incoming shared list has "Ribeye Steak" (duplicate name) + "Hamburger Buns" (new item)
  sandbox.pendingSharedList = {
    title: "Incoming BBQ",
    items: [
      {
        id: "inc_1",
        name: "Ribeye Steak",
        category: "meat_seafood",
        store: "Costco",
        quantity: 2,
        unit: "kg",
        price: 28.5,
        checked: false,
      },
      {
        id: "inc_2",
        name: "Hamburger Buns",
        category: "bakery",
        store: "Trader Joe's",
        quantity: 1,
        unit: "pk",
        price: 2.99,
        checked: false,
      },
    ],
  };

  // Execute MERGE
  sandbox.confirmImport("MERGE");
  assert(
    sandbox.memoryState.activeList.items.length === 2,
    "MERGE-01: Merging deduplicates 'Ribeye Steak' and appends 'Hamburger Buns' (Total: 2 items)"
  );
  assert(
    sandbox.memoryState.activeList.items.some(
      (i) => i.name === "Hamburger Buns"
    ),
    "MERGE-02: New item 'Hamburger Buns' exists in merged active list"
  );

  // Execute REPLACE
  sandbox.confirmImport("REPLACE");
  assert(
    sandbox.memoryState.activeList.items.length === 2,
    "REPLACE-01: Replace mode overwrites active list with incoming items"
  );

  // 4. SERVICE WORKER & WEB APP MANIFEST FILE CHECKS
  console.log(
    "\n--- Section 4: Progressive Web Application (PWA) Artifacts ---"
  );

  const manifestPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "manifest.webmanifest"
  );
  assert(
    fs.existsSync(manifestPath),
    "PWA-01: manifest.webmanifest exists in tool directory"
  );

  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert(
    manifestContent.display === "standalone",
    "PWA-02: Manifest display mode is configured as 'standalone'"
  );
  assert(
    manifestContent.name === "Smart Buy-List & Unit Price Tracker",
    "PWA-03: Manifest name is correctly configured"
  );
  assert(
    Array.isArray(manifestContent.icons) && manifestContent.icons.length > 0,
    "PWA-04: Manifest contains app icons array"
  );

  const swPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "sw.js"
  );
  assert(fs.existsSync(swPath), "PWA-05: sw.js exists in tool directory");

  const swContent = fs.readFileSync(swPath, "utf8");
  assert(
    swContent.includes("CACHE_NAME") &&
      swContent.includes("fetch") &&
      swContent.includes("caches.match"),
    "PWA-06: sw.js implements Cache-First fetch interceptor"
  );
} catch (err) {
  console.error("❌ Test Execution Error:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Sharing & PWA Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
