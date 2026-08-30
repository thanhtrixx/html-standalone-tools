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

  // 4. SERVICE WORKER, ICON & WEB APP MANIFEST FILE CHECKS
  console.log(
    "\n--- Section 4: Progressive Web Application (PWA) & Icon Artifacts ---"
  );

  const iconPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "icon.svg"
  );
  assert(fs.existsSync(iconPath), "PWA-01: icon.svg exists in tool directory");

  const iconContent = fs.existsSync(iconPath)
    ? fs.readFileSync(iconPath, "utf8")
    : "";
  assert(
    iconContent.includes("<svg") &&
      iconContent.includes('viewBox="0 0 512 512"') &&
      iconContent.includes("</svg>"),
    "PWA-02: icon.svg defines a valid 512x512 scalable vector graphic"
  );

  const htmlPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "index.html"
  );
  const rawHtml = fs.readFileSync(htmlPath, "utf8");
  assert(
    rawHtml.includes('rel="icon"') && rawHtml.includes('href="./icon.svg"'),
    "PWA-03: index.html links to ./icon.svg as primary favicon"
  );
  assert(
    rawHtml.includes('rel="apple-touch-icon"') &&
      rawHtml.includes('href="./icon.svg"'),
    "PWA-04: index.html links to ./icon.svg as apple-touch-icon"
  );
  assert(
    rawHtml.includes('name="apple-mobile-web-app-capable"') &&
      rawHtml.includes('content="yes"'),
    "PWA-05: index.html declares apple-mobile-web-app-capable meta tag"
  );
  assert(
    rawHtml.includes('name="apple-mobile-web-app-title"') &&
      rawHtml.includes('content="BuyList"'),
    "PWA-06: index.html declares apple-mobile-web-app-title meta tag"
  );

  const manifestPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "manifest.webmanifest"
  );
  assert(
    fs.existsSync(manifestPath),
    "PWA-07: manifest.webmanifest exists in tool directory"
  );

  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert(
    manifestContent.display === "standalone",
    "PWA-08: Manifest display mode is configured as 'standalone'"
  );
  assert(
    manifestContent.name === "Smart Buy-List & Unit Price Tracker",
    "PWA-09: Manifest name is correctly configured"
  );
  assert(
    Array.isArray(manifestContent.icons) && manifestContent.icons.length >= 2,
    "PWA-10: Manifest contains multiple app icon configurations"
  );
  assert(
    manifestContent.icons.some(
      (icon) =>
        icon.src === "./icon.svg" &&
        icon.purpose === "any" &&
        icon.type === "image/svg+xml"
    ),
    "PWA-11: Manifest declares ./icon.svg with purpose 'any'"
  );
  assert(
    manifestContent.icons.some(
      (icon) =>
        icon.src === "./icon.svg" &&
        icon.purpose === "maskable" &&
        icon.type === "image/svg+xml"
    ),
    "PWA-12: Manifest declares ./icon.svg with purpose 'maskable'"
  );

  const swPath = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "sw.js"
  );
  assert(fs.existsSync(swPath), "PWA-13: sw.js exists in tool directory");

  const swContent = fs.readFileSync(swPath, "utf8");
  assert(
    swContent.includes('CACHE_NAME = "smart-buy-list-v2"') ||
      swContent.includes("smart-buy-list-v2"),
    "PWA-14: sw.js bumps cache version to smart-buy-list-v2"
  );
  assert(
    swContent.includes('"./icon.svg"') || swContent.includes("'./icon.svg'"),
    "PWA-15: sw.js pre-caches ./icon.svg in ASSETS_TO_CACHE"
  );
  assert(
    swContent.includes("CACHE_NAME") &&
      swContent.includes("fetch") &&
      swContent.includes("caches.match"),
    "PWA-16: sw.js implements Cache-First fetch interceptor"
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
