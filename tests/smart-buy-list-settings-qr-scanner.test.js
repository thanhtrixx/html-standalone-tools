const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyListScannerEngine(options = {}) {
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
  const domElements = {};
  const trackStoppedFlags = [];
  let userMediaRequestedFacingMode = null;
  let vibratePatterns = [];

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
        srcObject: null,
        style: {},
        appendChild() {},
        focus() {},
        scrollIntoView() {},
        play() {
          return Promise.resolve();
        },
        pause() {},
      };
    }
    return domElements[id];
  }

  const mockTrack = {
    kind: "video",
    stop() {
      trackStoppedFlags.push(true);
    },
  };

  const mockMediaStream = {
    getTracks() {
      return [mockTrack];
    },
  };

  class MockBarcodeDetector {
    constructor(opts) {
      this.formats = opts?.formats || [];
    }
    async detect(source) {
      if (options.detectedBarcodes !== undefined) {
        return options.detectedBarcodes;
      }
      return [];
    }
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
    BarcodeDetector: MockBarcodeDetector,
    requestAnimationFrame: (fn) => 101,
    cancelAnimationFrame: (id) => {},
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
      vibrate: (pattern) => {
        vibratePatterns.push(pattern);
        return true;
      },
      clipboard: {
        writeText: () => Promise.resolve(),
        readText: () => Promise.resolve(""),
      },
      mediaDevices: {
        getUserMedia: (constraints) => {
          if (options.cameraError) {
            return Promise.reject(new Error("Camera permission denied"));
          }
          userMediaRequestedFacingMode =
            constraints?.video?.facingMode || "environment";
          return Promise.resolve(mockMediaStream);
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
    trackStoppedFlags,
    getRequestedFacingMode: () => userMediaRequestedFacingMode,
    getVibratePatterns: () => vibratePatterns,
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
    "\n🧪 Running Smart Buy-List Settings QR Scanner Test Suite...\n"
  );

  try {
    const htmlPath = path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "index.html"
    );
    const rawHtml = fs.readFileSync(htmlPath, "utf8");

    // --- Section 1: DOM Elements & Actions ---
    console.log("--- Section 1: DOM Elements & Markup Verification ---");

    assert(
      rawHtml.includes('id="btnOpenQrScanner"') ||
        rawHtml.includes("openQrScannerModal()"),
      "SCAN-01a: Settings modal contains 'Scan QR Code' trigger button"
    );
    assert(
      rawHtml.includes('id="qrScannerModal"'),
      "SCAN-01b: QR Scanner modal (#qrScannerModal) exists in DOM"
    );
    assert(
      rawHtml.includes('id="qrVideoFeed"'),
      "SCAN-01c: Scanner modal contains #qrVideoFeed video element"
    );
    assert(
      rawHtml.includes('id="btnFlipCamera"') ||
        rawHtml.includes("flipQrCamera()"),
      "SCAN-01d: Scanner modal contains Flip Camera toggle button"
    );
    assert(
      rawHtml.includes('id="qrImageFileInput"'),
      "SCAN-01e: Scanner modal contains image file input (#qrImageFileInput) fallback"
    );
    assert(
      rawHtml.includes('id="btnUploadQrImage"'),
      "SCAN-01f: Scanner modal contains Upload QR Image button"
    );

    // --- Section 2: Global Function Exports ---
    console.log("\n--- Section 2: Scanner Function Exports ---");

    const {
      sandbox,
      domElements,
      trackStoppedFlags,
      getRequestedFacingMode,
      getVibratePatterns,
    } = loadBuyListScannerEngine();

    assert(
      typeof sandbox.openQrScannerModal === "function",
      "SCAN-02a: openQrScannerModal is exported globally"
    );
    assert(
      typeof sandbox.closeQrScannerModal === "function",
      "SCAN-02b: closeQrScannerModal is exported globally"
    );
    assert(
      typeof sandbox.flipQrCamera === "function",
      "SCAN-02c: flipQrCamera is exported globally"
    );
    assert(
      typeof sandbox.handleScannedQrResult === "function",
      "SCAN-02d: handleScannedQrResult is exported globally"
    );
    assert(
      typeof sandbox.handleQrImageUpload === "function",
      "SCAN-02e: handleQrImageUpload is exported globally"
    );

    // --- Section 3: Hardware Stream Lifecycle & Modal Controls ---
    console.log("\n--- Section 3: Camera Hardware Stream Lifecycle ---");

    // Open scanner modal
    await sandbox.openQrScannerModal();
    const modalEl = domElements["qrScannerModal"];
    assert(
      modalEl && !modalEl.classList.contains("hidden"),
      "SCAN-03a: openQrScannerModal reveals #qrScannerModal"
    );
    assert(
      getRequestedFacingMode() === "environment",
      "SCAN-03b: Default camera requested facingMode is 'environment' (back camera)"
    );

    // Close scanner modal
    sandbox.closeQrScannerModal();
    assert(
      modalEl && modalEl.classList.contains("hidden"),
      "SCAN-03c: closeQrScannerModal hides #qrScannerModal"
    );
    assert(
      trackStoppedFlags.length > 0 && trackStoppedFlags[0] === true,
      "SCAN-03d: Closing scanner strictly stops and releases all media stream tracks"
    );

    // --- Section 4: Camera Flip / Facing Mode Switching ---
    console.log("\n--- Section 4: Camera Facing Mode Toggle ---");

    await sandbox.openQrScannerModal();
    await sandbox.flipQrCamera();
    assert(
      sandbox.currentCameraFacingMode === "user",
      "SCAN-04a: flipQrCamera toggles facingMode to 'user' (front camera)"
    );
    await sandbox.flipQrCamera();
    assert(
      sandbox.currentCameraFacingMode === "environment",
      "SCAN-04b: flipQrCamera toggles facingMode back to 'environment'"
    );
    sandbox.closeQrScannerModal();

    // --- Section 5: Scanned QR Decoding & Smart Merge Routing ---
    console.log("\n--- Section 5: QR Result Dispatch & Routing ---");

    const sampleList = {
      title: "Shared Picnic Items",
      items: [
        {
          name: "Watermelon",
          category: "produce",
          store: "Costco",
          quantity: 1,
          unit: "ea",
          price: 6.99,
        },
      ],
    };
    const sharePayload = sandbox.encodeSharePayload(sampleList);
    const validShareUrl = `https://tools.example.com/#share=${sharePayload}`;

    // Test 5A: Scanned #share= URL
    sandbox.handleScannedQrResult(validShareUrl);
    assert(
      sandbox.pendingSharedList !== null &&
        sandbox.pendingSharedList.title === "Shared Picnic Items",
      "SCAN-05a: Scanned #share= URL decoded and staged to pendingSharedList"
    );
    assert(
      sandbox.pendingSharedList.items[0].name === "Watermelon",
      "SCAN-05b: Scanned items correctly parsed from QR code payload"
    );
    assert(
      getVibratePatterns().length > 0,
      "SCAN-05c: Successful scan triggered haptic vibration"
    );

    // Test 5B: Scanned Buy-List JSON
    const jsonList = JSON.stringify({
      title: "Pantry Restock",
      items: [{ name: "Olive Oil", price: 14.5, quantity: 1, unit: "btl" }],
    });
    sandbox.handleScannedQrResult(jsonList);
    assert(
      sandbox.pendingSharedList !== null &&
        sandbox.pendingSharedList.title === "Pantry Restock",
      "SCAN-05d: Scanned Buy-List JSON staged to pendingSharedList"
    );

    // Test 5C: Scanned Arbitrary / Non-Buylist Content
    sandbox.pendingSharedList = null;
    sandbox.handleScannedQrResult("https://example.com/random-website");
    assert(
      sandbox.pendingSharedList === null,
      "SCAN-05e: Non-buylist scanned content does not open import modal or corrupt state"
    );

    // --- Section 6: Bilingual Translation Key Parity ---
    console.log("\n--- Section 6: Bilingual Translation Key Parity ---");

    const enDict = sandbox.TRANSLATIONS?.en || {};
    const viDict = sandbox.TRANSLATIONS?.vi || {};
    const scannerKeys = [
      "btn_scan_qr",
      "scan_modal_title",
      "scan_modal_desc",
      "btn_flip_camera",
      "btn_upload_qr_image",
      "toast_camera_permission_denied",
      "toast_scanned_external",
      "toast_no_qr_in_image",
    ];

    scannerKeys.forEach((k) => {
      assert(
        typeof enDict[k] === "string" && enDict[k].length > 0,
        `SCAN-I18N: English translation exists for '${k}'`
      );
      assert(
        typeof viDict[k] === "string" && viDict[k].length > 0,
        `SCAN-I18N: Vietnamese translation exists for '${k}'`
      );
    });
  } catch (err) {
    console.error("❌ Test Execution Error:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(
    `📊 Settings QR Scanner Test Summary: ${passed} Passed, ${failed} Failed`
  );
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
