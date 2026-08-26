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

  // Test 3: AI Real Estate Decision Dossier Markdown Generation (Bilingual Parity)
  assert(
    typeof app.generateAIDossierMarkdown === "function",
    "generateAIDossierMarkdown function is defined"
  );

  // Blueprint: Verdict (VI vs EN)
  const mdVerdictVi = app.generateAIDossierMarkdown(testParams, {
    blueprint: "verdict",
    anonymize: false,
    lang: "vi",
  });
  assert(
    mdVerdictVi.includes("Hồ Sơ Tư Vấn Quyết Định: Mua Nhà vs Thuê Nhà"),
    "Dossier includes Vietnamese header title"
  );
  assert(
    mdVerdictVi.includes("Mục tiêu tư vấn:") &&
      mdVerdictVi.includes("Điểm hòa vốn") &&
      mdVerdictVi.includes("Khuyến nghị chiến lược hành động cụ thể"),
    "Verdict blueprint includes Vietnamese advisory objective and prompt questions"
  );

  const mdVerdictEn = app.generateAIDossierMarkdown(testParams, {
    blueprint: "verdict",
    anonymize: false,
    lang: "en",
  });
  assert(
    mdVerdictEn.includes(
      "Real Estate Decision Dossier: Buy vs. Rent Comparison"
    ),
    "Dossier includes English header title"
  );
  assert(
    mdVerdictEn.includes("Advisory Objective:") &&
      mdVerdictEn.includes("Is the net worth crossover horizon of") &&
      mdVerdictEn.includes(
        "Strategic recommendations and concrete action plan"
      ),
    "Verdict blueprint includes English advisory objective and prompt questions"
  );

  // Blueprint: Stress-Test (VI vs EN)
  const mdStressVi = app.generateAIDossierMarkdown(testParams, {
    blueprint: "stress_test",
    anonymize: false,
    lang: "vi",
  });
  assert(
    mdStressVi.includes("Kiểm tra độ căng thẳng tài chính (Stress-Test)") &&
      mdStressVi.includes("Rủi ro khi lãi suất thả nổi vượt 12%–14%"),
    "Stress-test blueprint contains Vietnamese prompt questions"
  );

  const mdStressEn = app.generateAIDossierMarkdown(testParams, {
    blueprint: "stress_test",
    anonymize: false,
    lang: "en",
  });
  assert(
    mdStressEn.includes(
      "Stress-test financial resilience against floating interest rate spikes"
    ) &&
      mdStressEn.includes(
        "Risk exposure if floating mortgage rates rise to 12%–14%"
      ),
    "Stress-test blueprint contains English prompt questions"
  );

  // Blueprint: FIRE Optimization (VI vs EN)
  const mdFireVi = app.generateAIDossierMarkdown(testParams, {
    blueprint: "fire",
    anonymize: false,
    lang: "vi",
  });
  assert(
    mdFireVi.includes(
      "Tối ưu hóa lộ trình Tự do Tài chính & Nghỉ hưu sớm (FIRE)"
    ) &&
      mdFireVi.includes("Tác động của việc khóa vốn lớn vào tài sản cố định") &&
      mdFireVi.includes(
        "So sánh hiệu quả sinh lời giữa BĐS vs Danh mục cổ phiếu/ETF"
      ),
    "FIRE blueprint includes Vietnamese FIRE optimization prompts"
  );

  const mdFireEn = app.generateAIDossierMarkdown(testParams, {
    blueprint: "fire",
    anonymize: false,
    lang: "en",
  });
  assert(
    mdFireEn.includes(
      "Optimize the financial trajectory for Financial Independence, Retire Early (FIRE)"
    ) &&
      mdFireEn.includes(
        "Impact of tying up capital into illiquid primary residential equity"
      ) &&
      mdFireEn.includes(
        "Long-term return trade-offs between property equity appreciation vs. diversified stock/ETF portfolio"
      ),
    "FIRE blueprint includes English FIRE optimization prompts"
  );

  // Blueprint: Asset & Debt Allocation (VI vs EN)
  const mdAllocationVi = app.generateAIDossierMarkdown(testParams, {
    blueprint: "asset_allocation",
    anonymize: false,
    lang: "vi",
  });
  assert(
    mdAllocationVi.includes(
      "Đánh giá phân bổ danh mục tài sản và tỷ trọng đòn bẩy tài chính"
    ) &&
      mdAllocationVi.includes("Tỷ lệ đòn bẩy vay") &&
      mdAllocationVi.includes("Đa dạng hóa danh mục đầu tư"),
    "Asset Allocation blueprint includes Vietnamese leverage and diversification prompts"
  );

  const mdAllocationEn = app.generateAIDossierMarkdown(testParams, {
    blueprint: "asset_allocation",
    anonymize: false,
    lang: "en",
  });
  assert(
    mdAllocationEn.includes(
      "Assess portfolio asset allocation and debt leverage weighting"
    ) &&
      mdAllocationEn.includes("Is the debt leverage ratio") &&
      mdAllocationEn.includes(
        "Portfolio diversification across real estate equity versus liquid investment assets"
      ),
    "Asset Allocation blueprint includes English leverage and diversification prompts"
  );

  // Custom Query (VI vs EN)
  const mdCustomVi = app.generateAIDossierMarkdown(testParams, {
    blueprint: "custom",
    customQuery: "Đánh giá căn hộ studio cho thuê",
    lang: "vi",
  });
  assert(
    mdCustomVi.includes(
      "**Yêu cầu tùy chỉnh:** Đánh giá căn hộ studio cho thuê"
    ),
    "Custom prompt blueprint renders Vietnamese custom request"
  );

  const mdCustomEn = app.generateAIDossierMarkdown(testParams, {
    blueprint: "custom",
    customQuery: "Evaluate short-term Airbnb rental feasibility",
    lang: "en",
  });
  assert(
    mdCustomEn.includes(
      "**Custom Request:** Evaluate short-term Airbnb rental feasibility"
    ),
    "Custom prompt blueprint renders English custom request"
  );

  // Test 4: Privacy Anonymization Mask (Zero-Leak Mode)
  const mdAnonymizedEn = app.generateAIDossierMarkdown(testParams, {
    blueprint: "stress_test",
    anonymize: true,
    lang: "en",
  });
  assert(
    mdAnonymizedEn.includes("🔒 ANONYMIZED (Home Multiples & Shares)"),
    "Anonymized dossier header flags ANONYMIZED privacy mode in English"
  );
  assert(
    mdAnonymizedEn.includes("1.0x (Baseline Home Price)"),
    "Home price is normalized to 1.0x baseline multiple in English"
  );
  assert(
    mdAnonymizedEn.includes("% of Home Price"),
    "Currency values are transformed to percentage shares of Home Price in English"
  );

  const mdAnonymizedVi = app.generateAIDossierMarkdown(testParams, {
    blueprint: "stress_test",
    anonymize: true,
    lang: "vi",
  });
  assert(
    mdAnonymizedVi.includes("🔒 ẨN DANH (Bội số giá nhà & Tỷ lệ %)"),
    "Anonymized dossier header flags ẨN DANH privacy mode in Vietnamese"
  );
  assert(
    mdAnonymizedVi.includes("1.0x (Giá nhà cơ sở)"),
    "Home price is normalized to 1.0x multiple in Vietnamese"
  );
  assert(
    mdAnonymizedVi.includes("% Giá nhà"),
    "Currency values are transformed to percentage shares of Home Price in Vietnamese"
  );

  // Test 5: Live DOM Preview Reactivity on Language Toggle
  app.openAIDossierModal();
  app.toggleLanguage("en");
  const textareaEn = app.document.getElementById("dossierMarkdownTextarea");
  assert(
    textareaEn.value.includes("Real Estate Decision Dossier") &&
      textareaEn.value.includes("Advisory Objective:"),
    "Live preview textarea dynamically updates to English when toggleLanguage('en') is invoked"
  );

  app.toggleLanguage("vi");
  const textareaVi = app.document.getElementById("dossierMarkdownTextarea");
  assert(
    textareaVi.value.includes("Hồ Sơ Tư Vấn Quyết Định") &&
      textareaVi.value.includes("Mục tiêu tư vấn:"),
    "Live preview textarea dynamically updates to Vietnamese when toggleLanguage('vi') is invoked"
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
