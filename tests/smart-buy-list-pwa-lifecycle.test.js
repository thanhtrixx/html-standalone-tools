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
    TextEncoder: typeof TextEncoder !== "undefined" ? TextEncoder : undefined,
    TextDecoder: typeof TextDecoder !== "undefined" ? TextDecoder : undefined,
    Uint8Array,
    CompressionStream:
      typeof CompressionStream !== "undefined" ? CompressionStream : undefined,
    DecompressionStream:
      typeof DecompressionStream !== "undefined"
        ? DecompressionStream
        : undefined,
    Response: typeof Response !== "undefined" ? Response : undefined,
    Blob: typeof Blob !== "undefined" ? Blob : undefined,
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
    history: {
      state: null,
      stack: [],
      pushState(state) {
        this.state = state;
        this.stack.push(state);
      },
      replaceState(state) {
        this.state = state;
        if (this.stack.length > 0) {
          this.stack[this.stack.length - 1] = state;
        } else {
          this.stack.push(state);
        }
      },
      back() {
        if (this.stack.length > 1) {
          this.stack.pop();
          this.state = this.stack[this.stack.length - 1];
        } else if (this.stack.length === 1) {
          this.stack.pop();
          this.state = null;
        }
      },
    },
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

async function runTests() {
  console.log("\n🧪 Running Smart Buy-List PWA & Lifecycle Test Suite...\n");

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

    const encoded = await sandbox.encodeSharePayload(sampleList);
    assert(
      typeof encoded === "string" && encoded.length > 0,
      "SHARE-01a: Active list successfully serialized to payload"
    );
    assert(
      encoded.startsWith("cz:"),
      "SHARE-01-cz: encodeSharePayload produces compressed string prefixed with cz:"
    );

    const decoded = await sandbox.decodeSharePayload(encoded);
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

    // Test legacy uncompressed Base64 payload decoding
    const legacyCompact = {
      t: "Legacy Test List",
      i: [["Legacy Item", "produce", "Local Market", 3, "kg", 15.0]],
    };
    const legacyB64 = Buffer.from(
      JSON.stringify(legacyCompact),
      "utf8"
    ).toString("base64");
    const legacyDecoded = await sandbox.decodeSharePayload(legacyB64);
    assert(
      legacyDecoded !== null &&
        legacyDecoded.title === "Legacy Test List" &&
        legacyDecoded.items[0].name === "Legacy Item",
      "SHARE-01-legacy: decodeSharePayload transparently decodes legacy uncompressed Base64 payloads"
    );

    // Test 15-item compression ratio and URL length < 800 chars
    const largeList = {
      title: "Weekly Family Shopping Haul",
      items: [],
    };
    for (let i = 1; i <= 15; i++) {
      largeList.items.push({
        name: `Mặt hàng thực phẩm gia đình số ${i}`,
        category: "produce",
        store: "Bách Hoá Xanh",
        quantity: 2,
        unit: "kg",
        price: 35000 + i * 1000,
        checked: false,
      });
    }
    const largeEncoded = await sandbox.encodeSharePayload(largeList);
    const uncompressedRawLen = JSON.stringify(largeList).length;
    const compressionRatio = 1 - largeEncoded.length / uncompressedRawLen;
    assert(
      largeEncoded.startsWith("cz:") && compressionRatio >= 0.5,
      `SHARE-01-ratio: Compression achieved ${(compressionRatio * 100).toFixed(1)}% reduction for 15 items`
    );
    const fullShareUrl = `https://tools.example.com/smart-buy-list-price-tracker/#share=${largeEncoded}`;
    assert(
      fullShareUrl.length < 800,
      `SHARE-01-url-len: 15-item share URL (${fullShareUrl.length} chars) is well under 800 chars limit`
    );

    // 1.5. HUMAN-READABLE CHECKLIST TEXT GENERATION & STANDALONE FILE EXPORT
    console.log(
      "\n--- Section 1.5: Human-Readable Checklist Text & Standalone File Export ---"
    );

    assert(
      typeof sandbox.generateBuyListTextChecklist === "function",
      "SHARE-01e: generateBuyListTextChecklist is exported globally"
    );
    assert(
      typeof sandbox.copyBuyListTextChecklist === "function",
      "SHARE-01f: copyBuyListTextChecklist is exported globally"
    );
    assert(
      typeof sandbox.exportBuyListJsonFile === "function",
      "SHARE-01g: exportBuyListJsonFile is exported globally"
    );

    const checklistText =
      await sandbox.generateBuyListTextChecklist(sampleList);
    assert(
      checklistText.includes("Weekend Barbecue Haul") &&
        checklistText.includes("- [ ] Ribeye Steak (2 kg [Costco])") &&
        checklistText.includes(
          "- [ ] Charcoal Briquettes (1 pk [Local Market])"
        ) &&
        checklistText.includes("#share="),
      "SHARE-01h: generateBuyListTextChecklist formats title, items, store tags, and share link correctly"
    );

    // Test toast notification triggers on copy actions
    let shareToast = "";
    sandbox._mockShowToast = (msg) => {
      shareToast = msg;
    };
    vm.runInContext(
      "const _orig_showToast = showToast; showToast = (msg) => { if (window._mockShowToast) window._mockShowToast(msg); return _orig_showToast(msg); };",
      sandbox
    );

    sandbox.memoryState.activeList = sampleList;
    await sandbox.copyBuyListTextChecklist();
    assert(
      shareToast.length > 0,
      `SHARE-01i: copyBuyListTextChecklist triggers toast notification (Got: '${shareToast}')`
    );

    shareToast = "";
    sandbox.exportBuyListJsonFile();
    assert(
      shareToast.length > 0,
      `SHARE-01j: exportBuyListJsonFile triggers toast notification (Got: '${shareToast}')`
    );
    vm.runInContext("showToast = _orig_showToast;", sandbox);

    // 2. CORRUPTED & MALFORMED PAYLOAD RESILIENCE
    console.log("\n--- Section 2: Error Resilience on Malformed Hash ---");

    const corruptResult = await sandbox.decodeSharePayload(
      "invalid!!!not-base64-@@@"
    );
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
    assert(
      fs.existsSync(iconPath),
      "PWA-01: icon.svg exists in tool directory"
    );

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
        rawHtml.includes('href="./icon-180.png"'),
      "PWA-04: index.html links to ./icon-180.png as apple-touch-icon"
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
      swContent.includes("smart-buy-list-v" + manifestContent.version),
      "PWA-14: sw.js bumps cache version to smart-buy-list-v3.2.0 or higher"
    );
    assert(
      /v[3-9]\.\d+\.\d+/.test(rawHtml) &&
        rawHtml.includes('id="pwaVersionBadge"'),
      "PWA-14b: index.html displays synchronized version badge v3.2.0 or higher"
    );
    assert(
      swContent.includes('"./icon.svg"') || swContent.includes("'./icon.svg'"),
      "PWA-15: sw.js pre-caches ./icon.svg in ASSETS_TO_CACHE"
    );
    assert(
      swContent.includes("CACHE_NAME") &&
        swContent.includes("fetch") &&
        swContent.includes("caches.match"),
      "PWA-16: sw.js implements fetch interceptor"
    );
    assert(
      swContent.includes("navigate") &&
        (swContent.includes("text/html") ||
          swContent.includes("request.mode")) &&
        (swContent.includes("Promise.race") ||
          swContent.includes("setTimeout")),
      "PWA-17: sw.js implements Network-First strategy with timeout for navigation/HTML requests"
    );
    assert(
      swContent.includes("SKIP_WAITING") && swContent.includes("skipWaiting"),
      "PWA-18: sw.js handles message event with SKIP_WAITING to invoke skipWaiting()"
    );

    // 5. CLIENT UPDATE LIFECYCLE & OPTION HUB CACHE CONTROLS
    console.log(
      "\n--- Section 5: Client Update Lifecycle & Option Hub QA Controls ---"
    );

    assert(
      rawHtml.includes('id="pwaUpdateToast"'),
      "PWA-19: index.html contains #pwaUpdateToast element"
    );
    assert(
      rawHtml.includes('id="btnApplyPwaUpdate"') ||
        rawHtml.includes("applyPwaUpdate()"),
      "PWA-20: index.html contains update trigger button"
    );
    assert(
      typeof sandbox.showUpdateToast === "function",
      "PWA-21: showUpdateToast function is exported globally"
    );
    assert(
      typeof sandbox.applyPwaUpdate === "function",
      "PWA-22: applyPwaUpdate function is exported globally"
    );
    assert(
      typeof sandbox.checkForUpdates === "function",
      "PWA-23: checkForUpdates function is exported globally"
    );
    assert(
      typeof sandbox.purgeCacheAndReload === "function",
      "PWA-24: purgeCacheAndReload function is exported globally"
    );
    assert(
      rawHtml.includes("checkForUpdates()") &&
        rawHtml.includes("purgeCacheAndReload()"),
      "PWA-25: Option Hub settings modal contains Check Updates and Purge Cache actions"
    );

    // Check translation dictionary parity for PWA update keys
    const enDict = sandbox.TRANSLATIONS?.en || {};
    const viDict = sandbox.TRANSLATIONS?.vi || {};
    const updateKeys = [
      "update_available_title",
      "update_available_desc",
      "update_btn_refresh",
      "check_updates_btn",
      "purge_cache_btn",
      "up_to_date_msg",
      "checking_updates_msg",
    ];

    updateKeys.forEach((k) => {
      assert(
        typeof enDict[k] === "string" && enDict[k].length > 0,
        `PWA-I18N: English translation exists for '${k}'`
      );
      assert(
        typeof viDict[k] === "string" && viDict[k].length > 0,
        `PWA-I18N: Vietnamese translation exists for '${k}'`
      );
    });

    // 6. ENHANCED SHARE MODAL DOM & TRANSLATION PARITY
    console.log("\n--- Section 6: Enhanced Share Modal DOM & I18n Parity ---");

    assert(
      !rawHtml.includes('id="shareQrContainer"'),
      "SHARE-DOM-01: #shareQrContainer is removed from share modal markup"
    );
    assert(
      !rawHtml.includes('id="qrHintText"'),
      "SHARE-DOM-02: #qrHintText is removed from share modal markup"
    );
    assert(
      rawHtml.includes('id="btnCopyTextChecklist"'),
      "SHARE-DOM-03: #btnCopyTextChecklist button exists in share modal markup"
    );
    assert(
      rawHtml.includes('id="btnExportBuyListFile"'),
      "SHARE-DOM-04: #btnExportBuyListFile button exists in share modal markup"
    );

    const shareKeys = [
      "share_modal_title",
      "share_modal_desc",
      "btn_native_share",
      "btn_copy_text_checklist",
      "btn_copy_url",
      "btn_export_buylist_file",
      "toast_share_copied",
      "toast_text_checklist_copied",
      "toast_list_file_exported",
    ];

    shareKeys.forEach((k) => {
      assert(
        typeof enDict[k] === "string" && enDict[k].length > 0,
        `SHARE-I18N: English translation exists for '${k}'`
      );
      assert(
        typeof viDict[k] === "string" && viDict[k].length > 0,
        `SHARE-I18N: Vietnamese translation exists for '${k}'`
      );
    });

    // 7. SOCIAL SHARE METADATA (OPEN GRAPH & TWITTER CARDS - ISSUE #256)
    console.log(
      "\n--- Section 7: Open Graph & Twitter Card Social Metadata ---"
    );

    assert(
      /<meta\s+property="og:title"\s+content="[^"]+"/i.test(rawHtml),
      "OG-01: <meta property='og:title'> present in <head>"
    );
    assert(
      /<meta\s+property="og:description"\s+content="[^"]+"/i.test(rawHtml),
      "OG-02: <meta property='og:description'> present in <head>"
    );
    assert(
      /<meta\s+property="og:image"\s+content="https:\/\/trile\.dev\/tools\/smart-buy-list-price-tracker\/og-image\.png"/i.test(
        rawHtml
      ),
      "OG-03: <meta property='og:image'> present with absolute URL"
    );
    assert(
      /<meta\s+property="og:url"\s+content="https:\/\/trile\.dev\/tools\/smart-buy-list-price-tracker\/"/i.test(
        rawHtml
      ),
      "OG-04: <meta property='og:url'> present with canonical tool URL"
    );
    assert(
      /<meta\s+property="og:type"\s+content="website"/i.test(rawHtml),
      "OG-05: <meta property='og:type' content='website'> present"
    );
    assert(
      /<meta\s+name="twitter:card"\s+content="summary_large_image"/i.test(
        rawHtml
      ),
      "TWITTER-01: <meta name='twitter:card' content='summary_large_image'> present"
    );
    assert(
      /<meta\s+name="twitter:title"\s+content="[^"]+"/i.test(rawHtml),
      "TWITTER-02: <meta name='twitter:title'> present in <head>"
    );
    assert(
      /<meta\s+name="twitter:description"\s+content="[^"]+"/i.test(rawHtml),
      "TWITTER-03: <meta name='twitter:description'> present in <head>"
    );

    const ogImagePath = path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "og-image.png"
    );
    assert(
      fs.existsSync(ogImagePath),
      "OG-ASSET-01: og-image.png asset exists in tool directory"
    );
    const ogImageBuffer = fs.readFileSync(ogImagePath);
    assert(
      ogImageBuffer.length > 0 &&
        ogImageBuffer[0] === 0x89 &&
        ogImageBuffer[1] === 0x50 &&
        ogImageBuffer[2] === 0x4e &&
        ogImageBuffer[3] === 0x47,
      "OG-ASSET-02: og-image.png is a valid PNG binary file"
    );
    const ogImgWidth = ogImageBuffer.readUInt32BE(16);
    const ogImgHeight = ogImageBuffer.readUInt32BE(20);
    assert(
      ogImgWidth >= 1200 && ogImgHeight >= 630,
      `OG-ASSET-03: og-image.png meets social resolution standard (>=1200x630, got ${ogImgWidth}x${ogImgHeight})`
    );

    // 8. CODE HYGIENE & PWA CLEANUP (ISSUE #257)
    console.log("\n--- Section 8: Code Hygiene & PWA Cleanup (Issue #257) ---");

    // 8.1 Apple touch icon PNG file
    const touchIconPath = path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "icon-180.png"
    );
    assert(
      fs.existsSync(touchIconPath),
      "HYGIENE-01: icon-180.png exists in tool directory"
    );
    const touchIconBuf = fs.readFileSync(touchIconPath);
    assert(
      touchIconBuf.readUInt32BE(16) === 180 &&
        touchIconBuf.readUInt32BE(20) === 180,
      "HYGIENE-02: icon-180.png is exactly 180x180 resolution"
    );

    // 8.2 noscript element
    assert(
      /<noscript>[\s\S]*?<\/noscript>/i.test(rawHtml),
      "HYGIENE-03: <noscript> fallback element is present in body"
    );

    // 8.3 rel="noopener noreferrer" on all target="_blank" links
    const blankMatches = [
      ...rawHtml.matchAll(/<a\s+[^>]*target=["']_blank["'][^>]*>/gi),
    ];
    assert(
      blankMatches.length >= 3,
      `HYGIENE-04a: Found ${blankMatches.length} target="_blank" links`
    );
    const allSecured = blankMatches.every((m) =>
      /rel=["'][^"']*noopener[^"']*noreferrer[^"']*["']/i.test(m[0])
    );
    assert(
      allSecured,
      "HYGIENE-04b: All target='_blank' anchor tags specify rel='noopener noreferrer'"
    );

    // 8.4 Service Worker fetch routing
    assert(
      swContent.includes('request.mode === "navigate"') &&
        swContent.includes('caches.match("./index.html")'),
      "HYGIENE-05a: sw.js returns cached index.html fallback for navigation requests"
    );
    const cacheFirstSection = swContent.split(
      "// Cache-First strategy for static assets"
    )[1];
    assert(
      cacheFirstSection &&
        !cacheFirstSection.includes('caches.match("./index.html")'),
      "HYGIENE-05b: sw.js does not return index.html for failed static asset / API requests"
    );

    // 8.5 Share URL size guard
    const longItems = [];
    for (let i = 0; i < 150; i++) {
      longItems.push({
        id: `item_${i}_${Math.random().toString(36).slice(2)}`,
        name: `Grocery Item Name ${i} Unique Token ${Math.random().toString(36).slice(2)} With Descriptive Ingredients and Notes`,
        category: `cat_${i % 10}_${Math.random().toString(36).slice(2)}`,
        store: `Store Location ${i % 5} Branch ${Math.random().toString(36).slice(2)}`,
        quantity: 10 + i,
        unit: "kg",
        price: 150000 + i * 1000,
        checked: false,
      });
    }
    sandbox.memoryState.activeList = {
      title: "Extremely Long Grocery Shopping List",
      items: longItems,
    };
    const toasts = [];
    sandbox._mockShowToast = (msg) => {
      toasts.push(msg);
    };
    vm.runInContext(
      "const _orig_showToast2 = showToast; showToast = (msg) => { if (window._mockShowToast) window._mockShowToast(msg); return _orig_showToast2(msg); };",
      sandbox
    );
    await sandbox.copyShareUrl();
    assert(
      toasts.some(
        (t) =>
          typeof t === "string" && (t.includes("2,048") || t.includes("2.048"))
      ),
      "HYGIENE-06: copyShareUrl displays warning toast when URL exceeds 2048 chars"
    );
    vm.runInContext("showToast = _orig_showToast2;", sandbox);

    // 8.6 Single source window exports
    const exportBlockMatch = rawHtml.match(
      /\/\/\s*Global exports for test runner[\s\S]*?<\/script>/
    );
    assert(
      Boolean(exportBlockMatch),
      "HYGIENE-07a: Global exports block exists at end of script"
    );
    const exportMatches = [
      ...exportBlockMatch[0].matchAll(/window\.([a-zA-Z0-9_$]+)\s*=/g),
    ].map((m) => m[1]);
    const counts = {};
    exportMatches.forEach((prop) => {
      counts[prop] = (counts[prop] || 0) + 1;
    });
    const duplicateExports = Object.keys(counts).filter((k) => counts[k] > 1);
    assert(
      duplicateExports.length === 0,
      `HYGIENE-07b: Zero duplicate window.* assignments in export block (Duplicates: ${duplicateExports.join(", ") || "none"})`
    );

    // ==========================================
    // Section 9: Two-Tier Native PWA Back Navigation & Bottom Nav Hook (Issue #294)
    // ==========================================
    console.log(
      "\n--- Section 9: Two-Tier Native PWA Back Navigation & Bottom Nav Hook ---"
    );

    // BACK-NAV-01: The bottom navigation <nav> element has id="bottomNavBar"
    assert(
      rawHtml.includes('<nav id="bottomNavBar"') ||
        rawHtml.includes('<nav\n      id="bottomNavBar"'),
      'BACK-NAV-01: The bottom navigation <nav> element has id="bottomNavBar"'
    );

    // BACK-NAV-02: Switching tabs pushes { tab } state into history without redundant duplicate pushes
    sandbox.history.stack = [{ tab: "PLANNING" }];
    sandbox.history.state = { tab: "PLANNING" };
    sandbox.setActiveTab("BUY");
    assert(
      sandbox.history.state &&
        sandbox.history.state.tab === "BUY" &&
        sandbox.history.stack.length === 2,
      'BACK-NAV-02a: setActiveTab("BUY") pushes { tab: "BUY" } to history stack'
    );
    // Calling same tab again should NOT push duplicate entry
    sandbox.setActiveTab("BUY");
    assert(
      sandbox.history.stack.length === 2,
      "BACK-NAV-02b: Calling setActiveTab on already active tab does not create redundant duplicate history push"
    );

    // BACK-NAV-03: Switching tabs further pushes new tab
    sandbox.setActiveTab("PRICE_HISTORY");
    assert(
      sandbox.history.state &&
        sandbox.history.state.tab === "PRICE_HISTORY" &&
        sandbox.history.stack.length === 3,
      'BACK-NAV-03: setActiveTab("PRICE_HISTORY") pushes { tab: "PRICE_HISTORY" } to history stack'
    );

    // BACK-NAV-04: Pressing back (popstate) activates previous tab
    sandbox.handlePopState({ state: { tab: "BUY" } });
    assert(
      sandbox.currentActiveTab === "BUY",
      'BACK-NAV-04: handlePopState with { tab: "BUY" } activates BUY tab'
    );

    // BACK-NAV-05: Pressing back with modal open closes topmost modal and retains active tab
    sandbox.modalHistoryStack.push("editItemModal");
    sandbox.handlePopState({ state: { tab: "PLANNING" } });
    assert(
      !sandbox.modalHistoryStack.includes("editItemModal"),
      "BACK-NAV-05a: handlePopState with open modal closes the topmost modal"
    );
    assert(
      sandbox.currentActiveTab === "BUY",
      "BACK-NAV-05b: Closing modal via popstate does not alter the active tab"
    );

    // BACK-NAV-06: Returning to PLANNING root on back navigation when not on PLANNING
    sandbox.handlePopState({ state: null });
    assert(
      sandbox.currentActiveTab === "PLANNING",
      "BACK-NAV-06a: handlePopState with null state returns to PLANNING if not already on PLANNING"
    );

    // ==========================================
    // Section 10: Two-Tier PWA Root Back Exit Guard ("Press back again to exit" - Issue #323)
    // ==========================================
    console.log(
      "\n--- Section 10: Two-Tier Root Back Navigation & Exit Guard (ADR-0032) ---"
    );

    let capturedToast = null;
    sandbox.showToast = (msg) => {
      capturedToast = msg;
    };
    sandbox.resetBackPressState();
    sandbox.window.__pwaExitAllowed = false;

    // BACK-EXIT-01: First press on PLANNING root displays localized exit toast
    const stackLenBeforeFirst = sandbox.history.stack.length;
    sandbox.handlePopState({ state: null });
    assert(
      capturedToast &&
        (capturedToast.includes("lần nữa để thoát") ||
          capturedToast.includes("again to exit")),
      `BACK-EXIT-01: First back press on PLANNING root displays warning toast (Got: '${capturedToast}')`
    );

    // BACK-EXIT-02: First press on PLANNING root pushes guard history state
    assert(
      sandbox.history.stack.length === stackLenBeforeFirst + 1 &&
        sandbox.history.state &&
        sandbox.history.state.rootGuard === true,
      "BACK-EXIT-02: First back press pushes { rootGuard: true } history state"
    );

    // BACK-EXIT-03: First press does NOT permit exit yet
    assert(
      !sandbox.window.__pwaExitAllowed,
      "BACK-EXIT-03: First back press does not permit exit"
    );

    // BACK-EXIT-04: Second press within 2000ms allows exit
    const stackLenBeforeSecond = sandbox.history.stack.length;
    sandbox.handlePopState({ state: null });
    assert(
      sandbox.window.__pwaExitAllowed === true,
      "BACK-EXIT-04: Second back press within 2000ms sets __pwaExitAllowed to true"
    );
    assert(
      sandbox.history.stack.length === stackLenBeforeSecond,
      "BACK-EXIT-05: Second back press does not push redundant history state"
    );

    // BACK-EXIT-06: Second press after 2000ms timeout re-arms guard
    sandbox.resetBackPressState();
    sandbox.window.__pwaExitAllowed = false;
    capturedToast = null;
    // Simulate first press after timeout
    sandbox.handlePopState({ state: null });
    assert(
      capturedToast !== null && !sandbox.window.__pwaExitAllowed,
      "BACK-EXIT-06: Back press after reset/timeout re-arms guard and displays toast again"
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
}

runTests();
