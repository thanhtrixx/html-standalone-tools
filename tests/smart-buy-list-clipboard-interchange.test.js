const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyListEngine(options = {}) {
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
  let clipboardText = options.initialClipboard || "";
  let writtenClipboard = "";
  const domElements = {};

  function getMockEl(id) {
    if (!domElements[id]) {
      const classSet = new Set(["hidden"]); // default modals hidden
      domElements[id] = {
        id,
        classList: {
          classes: classSet,
          add(c) {
            classSet.add(c);
          },
          remove(c) {
            classSet.delete(c);
          },
          contains(c) {
            return classSet.has(c);
          },
        },
        textContent: "",
        innerHTML: "",
        value: "",
        style: {},
        appendChild() {},
        focus() {},
        scrollIntoView() {},
      };
    }
    return domElements[id];
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
    confirm:
      options.mockConfirm !== undefined ? options.mockConfirm : () => true,
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
      clipboard: {
        writeText: (txt) => {
          writtenClipboard = txt;
          clipboardText = txt;
          return Promise.resolve();
        },
        readText: () => {
          if (options.clipboardError) {
            return Promise.reject(new Error("Clipboard read denied"));
          }
          return Promise.resolve(clipboardText);
        },
      },
      share: () => Promise.resolve(),
    },
    document: {
      getElementById: (id) => getMockEl(id),
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
  return {
    sandbox,
    storageMock,
    domElements,
    getWrittenClipboard: () => writtenClipboard,
    setClipboardText: (txt) => {
      clipboardText = txt;
    },
  };
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
    "\n🧪 Running Smart Buy-List Clipboard Interchange Test Suite...\n"
  );

  try {
    const htmlPath = path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "index.html"
    );
    const rawHtml = fs.readFileSync(htmlPath, "utf8");

    // --- Section 1: DOM Elements & Button Verification ---
    console.log("--- Section 1: DOM Elements & Actions ---");

    assert(
      rawHtml.includes('id="btnCopyListJson"') ||
        rawHtml.includes("copyBuyListJson()"),
      "CLIP-01a: Share modal contains Copy Buy-List JSON button"
    );
    assert(
      rawHtml.includes('id="btnCopyBackupJson"') ||
        rawHtml.includes("copyBackupJson()"),
      "CLIP-01b: Settings modal contains Copy Backup JSON button"
    );
    assert(
      rawHtml.includes('id="btnPasteJson"') ||
        rawHtml.includes("pasteJsonFromClipboard()"),
      "CLIP-01c: Settings modal contains Paste JSON button"
    );
    assert(
      rawHtml.includes('id="pasteJsonModal"'),
      "CLIP-01d: Fallback Paste Dialog modal (#pasteJsonModal) exists in DOM"
    );
    assert(
      rawHtml.includes('id="pasteJsonTextarea"'),
      "CLIP-01e: Paste Dialog contains #pasteJsonTextarea input area"
    );

    // --- Section 2: Copy Buy-List JSON Export ---
    console.log("\n--- Section 2: Copy Buy-List JSON Export ---");

    const { sandbox, getWrittenClipboard } = loadBuyListEngine();

    assert(
      typeof sandbox.copyBuyListJson === "function",
      "CLIP-02a: copyBuyListJson is exported globally"
    );

    sandbox.memoryState.activeList = {
      title: "Saturday Farmers Market",
      items: [
        {
          id: "item_1",
          name: "Organic Avocados",
          category: "produce",
          store: "Trader Joe's",
          quantity: 4,
          unit: "ea",
          price: 5.0,
          checked: false,
        },
      ],
    };

    sandbox.copyBuyListJson();
    const copiedList = JSON.parse(getWrittenClipboard());
    assert(
      copiedList.title === "Saturday Farmers Market",
      "CLIP-02b: Copied buy-list JSON includes list title"
    );
    assert(
      Array.isArray(copiedList.items) && copiedList.items.length === 1,
      "CLIP-02c: Copied buy-list JSON includes active items array"
    );
    assert(
      copiedList.items[0].name === "Organic Avocados" &&
        copiedList.items[0].price === 5.0,
      "CLIP-02d: Copied item attributes preserve name and price"
    );

    // --- Section 3: Copy Backup JSON from Settings ---
    console.log("\n--- Section 3: Copy Full Database Backup JSON ---");

    assert(
      typeof sandbox.copyBackupJson === "function",
      "CLIP-03a: copyBackupJson is exported globally"
    );

    sandbox.memoryState.stores = ["Costco", "Trader Joe's", "WinMart"];
    sandbox.copyBackupJson();
    const copiedBackup = JSON.parse(getWrittenClipboard());

    assert(
      copiedBackup.activeList &&
        copiedBackup.stores &&
        Array.isArray(copiedBackup.stores),
      "CLIP-03b: Copied backup JSON contains full memoryState with activeList and stores"
    );
    assert(
      copiedBackup.stores.includes("WinMart"),
      "CLIP-03c: Copied backup JSON preserves custom store list"
    );

    // --- Section 4: Multi-Format Clipboard Import Auto-Detection ---
    console.log("\n--- Section 4: Multi-Format Import Processing ---");

    assert(
      typeof sandbox.processImportData === "function",
      "CLIP-04a: processImportData is exported globally"
    );

    // Test 4A: Full Database Backup JSON Import
    let confirmCalled = false;
    const restoreEngine = loadBuyListEngine({
      mockConfirm: () => {
        confirmCalled = true;
        return true;
      },
    });

    const fullBackupPayload = JSON.stringify({
      activeList: {
        title: "Restored List",
        items: [
          {
            id: "r1",
            name: "Sourdough Bread",
            category: "bakery",
            store: "Bakery",
            quantity: 1,
            unit: "ea",
            price: 4.5,
            checked: false,
          },
        ],
      },
      purchaseLedger: [
        {
          id: "l1",
          itemName: "Sourdough Bread",
          price: 4.5,
          unitPrice: 4.5,
          store: "Bakery",
          date: "2026-08-30",
        },
      ],
      stores: ["Bakery", "Supermarket"],
      settings: { currency: "USD", language: "en" },
    });

    const resBackup =
      restoreEngine.sandbox.processImportData(fullBackupPayload);
    assert(
      resBackup === true,
      "CLIP-04b: Full backup payload returns true on successful parse"
    );
    assert(
      confirmCalled === true,
      "CLIP-04c: Confirmation prompt was triggered before restoring full backup"
    );
    assert(
      restoreEngine.sandbox.memoryState.activeList.title === "Restored List",
      "CLIP-04d: Full backup restored activeList state"
    );
    assert(
      restoreEngine.sandbox.memoryState.purchaseLedger.length === 1,
      "CLIP-04e: Full backup restored purchaseLedger state"
    );

    // Test 4B: Active Buy-List JSON Import (Routes to Smart Merge Protocol)
    const listJsonPayload = JSON.stringify({
      title: "Roommate Groceries",
      items: [
        {
          name: "Oat Milk",
          category: "dairy_eggs",
          store: "Trader Joe's",
          quantity: 2,
          unit: "btl",
          price: 3.99,
        },
      ],
    });

    const listEngine = loadBuyListEngine();
    const resList = listEngine.sandbox.processImportData(listJsonPayload);
    assert(resList === true, "CLIP-05a: Buy-list JSON returns true");
    assert(
      listEngine.sandbox.pendingSharedList !== null &&
        listEngine.sandbox.pendingSharedList.title === "Roommate Groceries",
      "CLIP-05b: Buy-list JSON staged to pendingSharedList for smart merge"
    );
    assert(
      listEngine.sandbox.pendingSharedList.items[0].name === "Oat Milk",
      "CLIP-05c: Staged item correctly parsed from JSON"
    );

    // Test 4C: Shared URL link with #share= payload
    const sampleSharePayload = listEngine.sandbox.encodeSharePayload({
      title: "BBQ Supplies",
      items: [
        {
          name: "Charcoal",
          category: "household",
          store: "Home Depot",
          quantity: 1,
          unit: "pk",
          price: 12.0,
        },
      ],
    });
    const shareUrl = `https://tools.example.com/smart-buy-list-price-tracker/#share=${sampleSharePayload}`;
    const resUrl = listEngine.sandbox.processImportData(shareUrl);
    assert(resUrl === true, "CLIP-06a: Share URL with #share= returns true");
    assert(
      listEngine.sandbox.pendingSharedList.title === "BBQ Supplies",
      "CLIP-06b: Share URL successfully extracted and decoded into pendingSharedList"
    );

    // Test 4D: Corrupted / Unrecognized String Resilience
    const resInvalid = listEngine.sandbox.processImportData(
      "random unparseable garbage text @@##$$"
    );
    assert(
      resInvalid === false,
      "CLIP-07: Unrecognized string returns false gracefully without throwing"
    );

    // --- Section 5: Clipboard Fallback Modal Presentation ---
    console.log(
      "\n--- Section 5: Fallback Modal on Clipboard Permission Failure ---"
    );

    const fallbackEngine = loadBuyListEngine({ clipboardError: true });
    await fallbackEngine.sandbox.pasteJsonFromClipboard();
    // Should open pasteJsonModal gracefully
    const pasteModal = fallbackEngine.domElements["pasteJsonModal"];
    assert(
      pasteModal && !pasteModal.classList.contains("hidden"),
      "CLIP-08: Fallback dialog #pasteJsonModal opened when clipboard read fails"
    );

    // --- Section 6: Bilingual Translation Parity ---
    console.log("\n--- Section 6: Bilingual Translation Key Parity ---");

    const enDict = sandbox.TRANSLATIONS?.en || {};
    const viDict = sandbox.TRANSLATIONS?.vi || {};
    const clipboardKeys = [
      "btn_copy_list_json",
      "btn_copy_backup_json",
      "btn_paste_json",
      "paste_modal_title",
      "paste_modal_desc",
      "paste_modal_placeholder",
      "btn_submit_paste",
      "toast_list_json_copied",
      "toast_backup_json_copied",
      "toast_invalid_clipboard_data",
      "confirm_restore_backup",
    ];

    clipboardKeys.forEach((k) => {
      assert(
        typeof enDict[k] === "string" && enDict[k].length > 0,
        `CLIP-I18N: English translation exists for '${k}'`
      );
      assert(
        typeof viDict[k] === "string" && viDict[k].length > 0,
        `CLIP-I18N: Vietnamese translation exists for '${k}'`
      );
    });
  } catch (err) {
    console.error("❌ Test Execution Error:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(
    `📊 Clipboard Interchange Test Summary: ${passed} Passed, ${failed} Failed`
  );
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
