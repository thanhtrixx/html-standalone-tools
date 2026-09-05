const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyListSettingsEngine() {
  const htmlPath = path.join(
    __dirname,
    "../..",
    "smart-buy-list-price-tracker",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");

  const storageMock = {};
  const domElements = {};
  const appendedAnchors = [];

  function getMockEl(id) {
    if (!domElements[id]) {
      const classSet = new Set(["hidden"]);
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
        writeText: () => Promise.resolve(),
        readText: () => Promise.resolve(""),
      },
      share: () => Promise.resolve(),
    },
    document: {
      getElementById: (id) => getMockEl(id),
      createElement: (tag) => {
        const el = {
          tagName: tag.toUpperCase(),
          className: "",
          textContent: "",
          classList: { add: () => {}, remove: () => {}, contains: () => false },
          remove: () => {},
          setAttribute: (k, v) => {
            el[k] = v;
          },
          click: () => {},
        };
        if (tag === "a") appendedAnchors.push(el);
        return el;
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      documentElement: {
        classList: { contains: () => false, add: () => {}, remove: () => {} },
      },
      body: {
        style: {},
        appendChild: (child) => {
          if (child && child.tagName === "A") appendedAnchors.push(child);
        },
      },
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
    appendedAnchors,
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
    "\n🧪 Running Smart Buy-List Settings Backup File & Interchange Test Suite...\n"
  );

  try {
    const htmlPath = path.join(
      __dirname,
      "../..",
      "smart-buy-list-price-tracker",
      "index.html"
    );
    const rawHtml = fs.readFileSync(htmlPath, "utf8");

    // --- Section 1: DOM Elements & Markup Verification ---
    console.log("--- Section 1: DOM Elements & Markup Verification ---");

    assert(
      !rawHtml.includes('id="btnOpenQrScanner"') &&
        !rawHtml.includes("openQrScannerModal()"),
      "SETTINGS-01a: Settings modal strictly does NOT contain 'Scan QR Code' trigger button"
    );
    assert(
      !rawHtml.includes('id="qrScannerModal"'),
      "SETTINGS-01b: QR Scanner modal (#qrScannerModal) is completely purged from DOM"
    );
    assert(
      !rawHtml.includes('id="qrVideoFeed"'),
      "SETTINGS-01c: QR video feed element is completely purged from DOM"
    );
    assert(
      rawHtml.includes('id="btnExportBackup"'),
      "SETTINGS-01d: Settings modal contains #btnExportBackup button"
    );
    assert(
      rawHtml.includes('id="btnExportBackupText">Export File</span>'),
      "SETTINGS-01e: Export button initial text is 'Export File'"
    );
    assert(
      rawHtml.includes('id="btnCopyBackupJson"'),
      "SETTINGS-01f: Settings modal contains #btnCopyBackupJson button"
    );
    assert(
      rawHtml.includes('id="btnImportBackupText">Import File</span>'),
      "SETTINGS-01g: Import label contains 'Import File'"
    );
    assert(
      rawHtml.includes('id="btnPasteJson"'),
      "SETTINGS-01h: Settings modal contains #btnPasteJson button"
    );

    // --- Section 2: Function Exports & Operations ---
    console.log("\n--- Section 2: Function Exports & Operations ---");

    const { sandbox } = loadBuyListSettingsEngine();

    assert(
      typeof sandbox.exportJsonBackup === "function",
      "SETTINGS-02a: exportJsonBackup is exported globally"
    );
    assert(
      typeof sandbox.copyBackupJson === "function",
      "SETTINGS-02b: copyBackupJson is exported globally"
    );
    assert(
      typeof sandbox.pasteJsonFromClipboard === "function",
      "SETTINGS-02c: pasteJsonFromClipboard is exported globally"
    );
    assert(
      typeof sandbox.handleBackupFileImport === "function",
      "SETTINGS-02d: handleBackupFileImport is exported globally"
    );
    assert(
      typeof sandbox.openQrScannerModal === "undefined",
      "SETTINGS-02e: openQrScannerModal is purged and undefined"
    );

    // --- Section 3: Backup File Export Execution ---
    console.log("\n--- Section 3: Backup File Export Execution ---");

    let toastMsg = "";
    sandbox._mockToast = (msg) => {
      toastMsg = msg;
    };
    vm.runInContext(
      "const _orig_showToast = showToast; showToast = (msg) => { if (window._mockToast) window._mockToast(msg); return _orig_showToast(msg); };",
      sandbox
    );
    sandbox.exportJsonBackup();
    assert(
      toastMsg.length > 0,
      `SETTINGS-03a: exportJsonBackup triggers confirmation toast (Got: '${toastMsg}')`
    );
    vm.runInContext("showToast = _orig_showToast;", sandbox);

    // --- Section 4: Bilingual Translation Key Parity ---
    console.log("\n--- Section 4: Bilingual Translation Key Parity ---");

    const enDict = sandbox.TRANSLATIONS?.en || {};
    const viDict = sandbox.TRANSLATIONS?.vi || {};

    assert(
      enDict.btn_export_json_backup === "Export File",
      "SETTINGS-04a: English translation for btn_export_json_backup is 'Export File'"
    );
    assert(
      viDict.btn_export_json_backup === "Xuất Tệp",
      "SETTINGS-04b: Vietnamese translation for btn_export_json_backup is 'Xuất Tệp'"
    );
    assert(
      enDict.btn_import_json_backup === "Import File",
      "SETTINGS-04c: English translation for btn_import_json_backup is 'Import File'"
    );
    assert(
      viDict.btn_import_json_backup === "Nhập Tệp",
      "SETTINGS-04d: Vietnamese translation for btn_import_json_backup is 'Nhập Tệp'"
    );
  } catch (err) {
    console.error("❌ Test Execution Error:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(
    `📊 Settings Backup File & Interchange Test Summary: ${passed} Passed, ${failed} Failed`
  );
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
