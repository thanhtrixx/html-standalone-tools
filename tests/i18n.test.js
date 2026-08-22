const fs = require("fs");
const path = require("path");
const vm = require("vm");

async function runI18nTests() {
  console.log(
    "🌐 Running i18n Verification Tests for personal-finance-savings-predictor...\n"
  );
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  const htmlPath = path.join(
    __dirname,
    "..",
    "personal-finance-savings-predictor",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  // Extract inline script
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");

  // Create sandbox
  const domElements = {};
  function getOrCreateEl(id) {
    if (!domElements[id]) {
      domElements[id] = {
        id,
        value: "",
        innerText: "",
        textContent: "",
        _innerHTML: "",
        get innerHTML() {
          return this._innerHTML;
        },
        set innerHTML(val) {
          this._innerHTML = val;
          if (val === "") this.children = [];
        },
        children: [],
        style: {},
        classList: {
          classes: new Set(),
          add(c) {
            this.classes.add(c);
          },
          remove(c) {
            this.classes.delete(c);
          },
          toggle(c, force) {
            if (force === undefined) {
              if (this.classes.has(c)) this.classes.delete(c);
              else this.classes.add(c);
            } else if (force) this.classes.add(c);
            else this.classes.delete(c);
          },
          contains(c) {
            return this.classes.has(c);
          },
        },
        parentElement: {
          classList: {
            add() {},
            remove() {},
            toggle() {},
          },
        },
        setAttribute() {},
        getAttribute() {
          return null;
        },
        addEventListener() {},
        removeEventListener() {},
        remove() {},
        getContext: () => ({ fillRect() {}, drawImage() {} }),
        appendChild(child) {
          if (!this.children) this.children = [];
          this.children.push(child);
        },
        click() {},
      };
    }
    return domElements[id];
  }

  const querySelectorAllResults = [];
  const sandbox = {
    window: {},
    tailwind: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    document: {
      addEventListener: () => {},
      removeEventListener: () => {},
      getElementById: (id) => getOrCreateEl(id),
      querySelector: (sel) => getOrCreateEl(sel.replace(/^[#.]/, "")),
      querySelectorAll: (sel) => {
        // Simple mock for querySelectorAll
        if (sel === "[data-i18n]") {
          const matches = [
            ...htmlContent.matchAll(/data-i18n=["']([^"']+)["']/g),
          ];
          return matches.map((m) => ({
            getAttribute: () => m[1],
            tagName: "SPAN",
            innerHTML: "",
          }));
        }
        if (sel === "[data-i18n-title]") {
          const matches = [
            ...htmlContent.matchAll(/data-i18n-title=["']([^"']+)["']/g),
          ];
          return matches.map((m) => ({
            getAttribute: () => m[1],
            title: "",
          }));
        }
        if (sel === ".onboarding-step") {
          return [getOrCreateEl("step1"), getOrCreateEl("step2")];
        }
        return [];
      },
      createElement: (tag) =>
        getOrCreateEl("dynamic_" + tag + "_" + Math.random()),
      body: getOrCreateEl("body"),
      documentElement: getOrCreateEl("documentElement"),
    },
    console: console,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    localStorage: {
      store: {},
      getItem(k) {
        return this.store[k] !== undefined ? this.store[k] : null;
      },
      setItem(k, v) {
        this.store[k] = String(v);
      },
      clear() {
        this.store = {};
      },
    },
    Chart: function () {
      return {
        destroy() {},
        update() {},
        canvas: {
          width: 800,
          height: 400,
          getContext: () => ({ fillRect() {}, drawImage() {} }),
        },
      };
    },
    navigator: { clipboard: { writeText: async () => {} } },
    location: {
      href: "http://localhost/",
      search: "",
      origin: "http://localhost",
      pathname: "/",
    },
  };
  sandbox.Chart.getChart = () => null;
  sandbox.Chart.register = () => {};
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);

  const TRANSLATIONS = sandbox.TRANSLATIONS;
  assert(
    TRANSLATIONS && TRANSLATIONS.en && TRANSLATIONS.vi,
    "TRANSLATIONS dictionary loaded with en and vi"
  );

  // Test 1: Key Parity
  const enKeys = Object.keys(TRANSLATIONS.en);
  const viKeys = Object.keys(TRANSLATIONS.vi);
  const missingInVi = enKeys.filter((k) => !(k in TRANSLATIONS.vi));
  const missingInEn = viKeys.filter((k) => !(k in TRANSLATIONS.en));

  assert(
    missingInVi.length === 0,
    `All EN keys exist in VI (missing: ${missingInVi.join(", ") || "none"})`
  );
  assert(
    missingInEn.length === 0,
    `All VI keys exist in EN (missing: ${missingInEn.join(", ") || "none"})`
  );

  // Test 2: No Vietnamese characters in English dictionary
  const vietnameseRegex =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ₫]/i;
  const enMixedEntries = [];
  for (const [k, v] of Object.entries(TRANSLATIONS.en)) {
    if (typeof v === "string" && vietnameseRegex.test(v)) {
      enMixedEntries.push(`${k}: "${v}"`);
    }
  }
  assert(
    enMixedEntries.length === 0,
    `No Vietnamese characters in EN dictionary (violations: ${enMixedEntries.join("; ") || "none"})`
  );

  // Test 3: Currency Formatting
  sandbox.changeLanguage("en");
  const enCurr = sandbox.formatCurrency(250000000);
  assert(
    enCurr === "250,000,000 VND",
    `English currency format is standard: "${enCurr}"`
  );
  assert(!enCurr.includes("₫"), "English currency contains no ₫ symbol");

  sandbox.changeLanguage("vi");
  const viCurr = sandbox.formatCurrency(250000000);
  assert(
    viCurr === "250.000.000 ₫",
    `Vietnamese currency format is standard: "${viCurr}"`
  );
  assert(
    !viCurr.includes("VND"),
    "Vietnamese currency contains no VND acronym"
  );

  // Test 4: Date Display Formatting
  const testDate = new Date(2026, 7, 22); // Aug 22, 2026
  sandbox.changeLanguage("en");
  const enDate = sandbox.formatDateDisplay(testDate);
  assert(
    enDate === "2026-08-22",
    `English date format is YYYY-MM-DD: "${enDate}"`
  );

  sandbox.changeLanguage("vi");
  const viDate = sandbox.formatDateDisplay(testDate);
  assert(
    viDate === "22/08/2026",
    `Vietnamese date format is DD/MM/YYYY: "${viDate}"`
  );

  // Test 5: Simulation Execution & UI language purity
  // Set mock form values
  getOrCreateEl("inputTargetDate").value = "2028-08-22";
  getOrCreateEl("inputSalary").value = "30000000";
  getOrCreateEl("inputSalaryGrowth").value = "5";
  getOrCreateEl("inputInflation").value = "4";
  getOrCreateEl("inputSavingsGoal").value = "1000000000";
  getOrCreateEl("inputPoolRate").value = "0.5";
  getOrCreateEl("input6MRate").value = "5.8";

  // Run in English
  sandbox.changeLanguage("en");
  sandbox.runSimulation();

  const enYieldText = getOrCreateEl("metricInterestPercentage").innerText;
  assert(
    enYieldText.includes("yield") && !enYieldText.includes("tỷ suất"),
    `EN yield text pure: "${enYieldText}"`
  );

  const enDepositText = getOrCreateEl("metricSalaryCount").innerText;
  assert(
    enDepositText.includes("monthly deposits") &&
      !enDepositText.includes("lần gửi"),
    `EN deposit text pure: "${enDepositText}"`
  );

  const enGoalText = getOrCreateEl("goalTargetText").innerText;
  assert(
    enGoalText.startsWith("Goal:") && enGoalText.includes("VND"),
    `EN goal text pure: "${enGoalText}"`
  );

  // Run in Vietnamese
  sandbox.changeLanguage("vi");
  sandbox.runSimulation();

  const viYieldText = getOrCreateEl("metricInterestPercentage").innerText;
  assert(
    viYieldText.includes("tỷ suất") && !viYieldText.includes("yield"),
    `VI yield text pure: "${viYieldText}"`
  );

  const viDepositText = getOrCreateEl("metricSalaryCount").innerText;
  assert(
    viDepositText.includes("lần gửi hàng tháng") &&
      !viDepositText.includes("monthly deposits"),
    `VI deposit text pure: "${viDepositText}"`
  );

  const viGoalText = getOrCreateEl("goalTargetText").innerText;
  assert(
    viGoalText.startsWith("Mục tiêu:") && viGoalText.includes("₫"),
    `VI goal text pure: "${viGoalText}"`
  );

  // Test 6: Logs and Badges Purity
  // In EN
  sandbox.changeLanguage("en");
  sandbox.runSimulation();
  const enLogContainer = getOrCreateEl("simulationLogContainer");
  const enLogText = (enLogContainer.children || [])
    .map((c) => c.innerHTML || "")
    .join(" ");
  assert(
    !vietnameseRegex.test(enLogText),
    "EN simulation logs contain no Vietnamese characters"
  );

  // In VI
  sandbox.changeLanguage("vi");
  sandbox.runSimulation();
  const viLogContainer = getOrCreateEl("simulationLogContainer");
  const viLogText = (viLogContainer.children || [])
    .map((c) => c.innerHTML || "")
    .join(" ");
  assert(
    viLogText.includes("Nạp Lương Hàng Tháng") ||
      viLogText.includes("Đáo Hạn") ||
      viLogText.includes("Tạo Sổ Tiết Kiệm"),
    "VI simulation logs contain Vietnamese milestone titles"
  );
  assert(
    !viLogText.includes("Monthly Salary Deposited"),
    "VI simulation logs contain no English milestone titles"
  );

  // Test 7: Comparison Mode Purity
  sandbox.changeLanguage("en");
  sandbox.runComparison();
  const enCompGoal = getOrCreateEl("compAGoal").innerText;
  assert(
    !enCompGoal.includes("Chưa đạt"),
    `EN comparison goal text pure: "${enCompGoal}"`
  );

  sandbox.changeLanguage("vi");
  sandbox.runComparison();
  const viCompGoal = getOrCreateEl("compAGoal").innerText;
  assert(
    !viCompGoal.includes("Not yet"),
    `VI comparison goal text pure: "${viCompGoal}"`
  );

  console.log(
    `\n📊 i18n Test Summary: ${passCount} Passed, ${failCount} Failed\n`
  );
  if (failCount > 0) {
    process.exit(1);
  }
}

runI18nTests().catch((err) => {
  console.error("i18n test failure:", err);
  process.exit(1);
});
