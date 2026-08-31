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

async function runTests() {
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

    const checklistText = sandbox.generateBuyListTextChecklist(sampleList);
    assert(
      checklistText.includes("Weekend Barbecue Haul") &&
        checklistText.includes("- [ ] Ribeye Steak (2 kg [Costco])") &&
        checklistText.includes(
          "- [ ] Charcoal Briquettes (1 pk [Local Market])"
        ) &&
        checklistText.includes("#share="),
      "SHARE-01h: generateBuyListTextChecklist formats title, items, store tags, and share link correctly"
    );

    let shareToast = "";
    sandbox.showToast = (msg) => {
      shareToast = msg;
    };
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

    // 2. CORRUPTED & MALFORMED PAYLOAD RESILIENCE
    console.log("\n--- Section 2: Error Resilience on Malformed Hash ---");

    const corruptResult = sandbox.decodeSharePayload(
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
      /CACHE_NAME = "smart-buy-list-v3\.\d+\.0"/.test(swContent),
      "PWA-14: sw.js bumps cache version to smart-buy-list-v3.2.0 or higher"
    );
    assert(
      /v3\.\d+\.0/.test(rawHtml) && rawHtml.includes('id="pwaVersionBadge"'),
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
        swContent.includes("text/html") &&
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
