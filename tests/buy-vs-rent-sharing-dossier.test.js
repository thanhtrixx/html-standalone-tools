const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBuyVsRentSharingSandbox() {
  const htmlPath = path.join(
    __dirname,
    "..",
    "buy-vs-rent-home-comparison",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");

  const domElements = {};
  function makeElementStub(id = "") {
    return {
      id,
      value: "",
      innerText: "",
      _innerHTML: "",
      get innerHTML() {
        return this._innerHTML;
      },
      set innerHTML(v) {
        this._innerHTML = v;
      },
      className: "",
      width: 800,
      height: 400,
      style: {},
      children: [],
      classList: {
        classes: new Set(),
        add(c) {
          this.classes.add(c);
        },
        remove(c) {
          this.classes.delete(c);
        },
        toggle(c) {
          if (this.classes.has(c)) this.classes.delete(c);
          else this.classes.add(c);
        },
        contains(c) {
          return this.classes.has(c);
        },
      },
      appendChild(child) {
        this.children.push(child);
      },
      removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx !== -1) this.children.splice(idx, 1);
      },
      getContext: () => ({
        clearRect() {},
        fillRect() {},
        drawImage() {},
      }),
      toDataURL: () => "data:image/png;base64,mock",
      click() {},
      select() {},
      getAttribute: () => null,
      setAttribute: () => {},
      addEventListener: () => {},
    };
  }

  const localStorageStore = {};

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
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    Blob: class Blob {
      constructor(parts) {
        this.parts = parts;
      }
    },
    URL: {
      createObjectURL: () => "blob:mock-url",
      revokeObjectURL: () => {},
    },
    navigator: {
      clipboard: {
        writeText: () => Promise.resolve(),
      },
    },
    location: {
      origin: "http://localhost:3000",
      pathname: "/buy-vs-rent-home-comparison/",
      hash: "",
    },
    tailwind: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    document: {
      body: makeElementStub("body"),
      activeElement: null,
      documentElement: makeElementStub("html"),
      getElementById: (id) => {
        if (!domElements[id]) domElements[id] = makeElementStub(id);
        return domElements[id];
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: (tag) => makeElementStub(tag),
      addEventListener: () => {},
      execCommand: () => true,
    },
    Chart: Object.assign(
      function Chart() {
        this.destroy = function () {};
      },
      { getChart: () => null, register: () => {} }
    ),
    localStorage: {
      getItem: (k) => localStorageStore[k] || null,
      setItem: (k, v) => {
        localStorageStore[k] = String(v);
      },
      removeItem: (k) => {
        delete localStorageStore[k];
      },
      clear: () => {
        for (const k in localStorageStore) delete localStorageStore[k];
      },
    },
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);
  sandbox.localStorageStore = localStorageStore;
  return sandbox;
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
  "\n🚀 Running Buy vs. Rent URL Sharing, AI Dossier & Storage Tests...\n"
);

try {
  const app = loadBuyVsRentSharingSandbox();

  // Test 1: URL Serialization & Deserialization
  assert(
    typeof app.serializeStateToHash === "function",
    "serializeStateToHash function is defined"
  );
  assert(
    typeof app.deserializeStateFromHash === "function",
    "deserializeStateFromHash function is defined"
  );

  const testParams = {
    ...app.DEFAULT_BUY_VS_RENT_PARAMS,
    homePrice: 5000000000,
    monthlyRent: 20000000,
    horizonYears: 15,
  };

  const hash = app.serializeStateToHash(testParams);
  assert(
    typeof hash === "string" && hash.startsWith("#"),
    "Serialized state produces URL hash starting with #"
  );

  const deserialized = app.deserializeStateFromHash(hash);
  assert(deserialized !== null, "Deserialized state is non-null");
  assert(
    deserialized.homePrice === 5000000000,
    "Deserialized homePrice matches original (5.0B)"
  );
  assert(
    deserialized.monthlyRent === 20000000,
    "Deserialized monthlyRent matches original (20M)"
  );
  assert(
    deserialized.horizonYears === 15,
    "Deserialized horizonYears matches original (15y)"
  );

  // Test 2: LocalStorage Persistence
  assert(
    typeof app.saveParamsToStorage === "function",
    "saveParamsToStorage function is defined"
  );
  assert(
    typeof app.loadParamsFromStorage === "function",
    "loadParamsFromStorage function is defined"
  );

  app.saveParamsToStorage(testParams);
  assert(
    app.localStorageStore["buyVsRent_params_v1"] !== undefined,
    "State saved under buyVsRent_params_v1 key"
  );

  const loadedStorage = app.loadParamsFromStorage();
  assert(
    loadedStorage.homePrice === 5000000000,
    "Loaded parameters from localStorage match saved state"
  );

  // Test 3: AI Real Estate Decision Dossier Markdown Generation
  assert(
    typeof app.generateAIDossierMarkdown === "function",
    "generateAIDossierMarkdown function is defined"
  );

  const mdVerdict = app.generateAIDossierMarkdown(testParams, {
    blueprint: "verdict",
    anonymize: false,
    lang: "vi",
  });
  assert(
    mdVerdict.includes("Hồ Sơ Tư Vấn Quyết Định: Mua Nhà vs Thuê Nhà"),
    "Dossier includes Vietnamese header title"
  );
  assert(
    mdVerdict.includes("5.000.000.000 VND") ||
      mdVerdict.includes("5,000,000,000 VND") ||
      mdVerdict.includes("5.0 Tỷ VND"),
    "Standard mode contains absolute currency amounts"
  );
  assert(
    mdVerdict.includes("Đánh Giá Toàn Diện") ||
      mdVerdict.includes("Mục tiêu tư vấn"),
    "Verdict blueprint consultation prompt included"
  );

  // Test 4: Privacy Anonymization Mask (Zero-Leak Mode)
  const mdAnonymized = app.generateAIDossierMarkdown(testParams, {
    blueprint: "stress_test",
    anonymize: true,
    lang: "en",
  });
  assert(
    mdAnonymized.includes("ANONYMIZED"),
    "Anonymized dossier header flags ANONYMIZED privacy mode"
  );
  assert(
    mdAnonymized.includes("1.0x (Baseline Home Price)"),
    "Home price is normalized to 1.0x multiple"
  );
  assert(
    mdAnonymized.includes("% of Home Price"),
    "Currency values are transformed to percentage shares of Home Price"
  );
  assert(
    !mdAnonymized.includes("5,000,000,000 VND"),
    "Absolute monetary figures are strictly masked"
  );

  // Test 5: Additional Consultation Blueprints
  const mdFire = app.generateAIDossierMarkdown(testParams, {
    blueprint: "fire",
    anonymize: false,
    lang: "vi",
  });
  assert(
    mdFire.includes("FIRE") || mdFire.includes("Tự do Tài chính"),
    "FIRE blueprint includes FIRE optimization prompts"
  );

  const mdAllocation = app.generateAIDossierMarkdown(testParams, {
    blueprint: "asset_allocation",
    anonymize: false,
    lang: "vi",
  });
  assert(
    mdAllocation.includes("Phân bổ") || mdAllocation.includes("đòn bẩy"),
    "Asset Allocation blueprint includes leverage and diversification prompts"
  );

  // Test 6: Modal Lifecycle and Onboarding Walkthrough
  assert(
    typeof app.startOnboardingTour === "function",
    "startOnboardingTour is defined"
  );
  assert(typeof app.nextTourStep === "function", "nextTourStep is defined");
  assert(
    typeof app.closeOnboardingTour === "function",
    "closeOnboardingTour is defined"
  );
  assert(
    typeof app.dismissAllModals === "function",
    "dismissAllModals is defined"
  );

  app.openAIDossierModal();
  const dossierModal = app.document.getElementById("aiDossierModal");
  assert(
    !dossierModal.classList.contains("hidden"),
    "AI Dossier modal opened cleanly"
  );

  app.dismissAllModals();
  assert(
    dossierModal.classList.contains("hidden"),
    "dismissAllModals closed AI Dossier modal"
  );

  app.startOnboardingTour();
  const tourModal = app.document.getElementById("onboardingTourModal");
  assert(
    !tourModal.classList.contains("hidden"),
    "Onboarding tour modal opened cleanly"
  );

  app.nextTourStep();
  const tourBadge = app.document.getElementById("tourStepBadge");
  assert(tourBadge.innerText.includes("2"), "nextTourStep advanced to Step 2");

  app.closeOnboardingTour();
  assert(
    tourModal.classList.contains("hidden"),
    "closeOnboardingTour closed modal"
  );
} catch (err) {
  console.error("❌ Test suite encountered runtime exception:", err);
  failed++;
}

console.log("\n==================================================");
console.log(
  `📊 Buy vs. Rent Sharing & Dossier Test Summary: ${passed} Passed, ${failed} Failed`
);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
