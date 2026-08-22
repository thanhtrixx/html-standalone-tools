const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadEnvironment() {
  const htmlPath = path.join(
    __dirname,
    "..",
    "personal-finance-savings-predictor",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const scriptMatches = [
    ...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");

  const domElements = {};
  function getEl(id) {
    if (!domElements[id]) {
      domElements[id] = {
        id,
        value: "",
        innerText: "",
        innerHTML: "",
        children: [],
        style: {},
        remove() {},
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
        setAttribute() {},
        getAttribute: () => null,
        addEventListener() {},
        removeEventListener() {},
        appendChild(ch) {
          this.children.push(ch);
        },
      };
    }
    return domElements[id];
  }

  let _hash = "";
  const sandbox = {
    window: {},
    tailwind: {},
    console: console,
    location: {
      href: "http://localhost/",
      search: "",
      get hash() {
        return _hash ? (_hash.startsWith("#") ? _hash : "#" + _hash) : "";
      },
      set hash(v) {
        _hash = v;
      },
      origin: "http://localhost",
      pathname: "/",
    },
    navigator: { clipboard: { writeText: async () => {} } },
    addEventListener: () => {},
    removeEventListener: () => {},
    document: {
      getElementById: (id) => getEl(id),
      querySelector: (sel) => getEl(sel.replace(/^[#.]/, "")),
      querySelectorAll: () => [],
      createElement: (tag) => getEl("dyn_" + tag + "_" + Math.random()),
      addEventListener: () => {},
      removeEventListener: () => {},
      documentElement: getEl("documentElement"),
      body: getEl("body"),
    },
    confirm: () => true,
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    escape: global.escape || escape,
    unescape: global.unescape || unescape,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    Date: global.Date,
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
    Chart: { getChart: () => null, register: () => {} },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(combinedScripts, sandbox);

  return sandbox;
}

async function runHelperTests() {
  console.log("🛠️ Running Helper & CSV Editor Unit Tests...\n");
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

  const ctx = loadEnvironment();

  // Test 1: parseDate()
  const d1 = ctx.parseDate("2026-08-22");
  assert(
    d1.getFullYear() === 2026 && d1.getMonth() === 7 && d1.getDate() === 22,
    `parseDate("2026-08-22") parsed exact year, month, date`
  );
  const dInvalid = ctx.parseDate("invalid-date");
  assert(
    dInvalid instanceof Date && !isNaN(dInvalid.getTime()),
    `parseDate with invalid string falls back safely to Date object`
  );

  // Test 2: formatDate() ISO formatting
  const d2 = new Date(2027, 0, 5); // 2027-01-05
  assert(
    ctx.formatDate(d2) === "2027-01-05",
    `formatDate() produces ISO standard "2027-01-05"`
  );

  // Test 3: formatDateDisplay() Locale-Awareness
  ctx.changeLanguage("en");
  assert(
    ctx.formatDateDisplay(d2) === "2027-01-05",
    `formatDateDisplay() in EN returns "2027-01-05"`
  );

  ctx.changeLanguage("vi");
  assert(
    ctx.formatDateDisplay(d2) === "05/01/2027",
    `formatDateDisplay() in VI returns "05/01/2027"`
  );

  // Test 4: addMonths()
  const baseDate = new Date(2026, 0, 15); // Jan 15, 2026
  const added6M = ctx.addMonths(baseDate, 6);
  assert(
    added6M.getFullYear() === 2026 &&
      added6M.getMonth() === 6 &&
      added6M.getDate() === 15,
    `addMonths(Jan 15, 6) produces Jul 15, 2026`
  );
  const added14M = ctx.addMonths(baseDate, 14);
  assert(
    added14M.getFullYear() === 2027 &&
      added14M.getMonth() === 2 &&
      added14M.getDate() === 15,
    `addMonths across year boundary (Jan 15 + 14M) produces Mar 15, 2027`
  );

  // Test 5: getDaysDiff() and getMonthDiff()
  const startDay = new Date(2026, 0, 1);
  const endDay = new Date(2026, 0, 11);
  assert(
    ctx.getDaysDiff(startDay, endDay) === 10,
    `getDaysDiff() correctly returns 10 days`
  );

  const startMonth = new Date(2026, 0, 1);
  const endMonth = new Date(2027, 5, 1);
  assert(
    ctx.getMonthDiff(startMonth, endMonth) === 17,
    `getMonthDiff() correctly returns 17 months`
  );

  // Test 6: formatCurrency()
  ctx.changeLanguage("en");
  assert(
    ctx.formatCurrency(123456789) === "123,456,789 VND",
    `formatCurrency in EN format matches "123,456,789 VND"`
  );
  assert(
    ctx.formatCurrency(0) === "0 VND",
    `formatCurrency(0) in EN matches "0 VND"`
  );

  ctx.changeLanguage("vi");
  assert(
    ctx.formatCurrency(123456789) === "123.456.789 ₫",
    `formatCurrency in VI format matches "123.456.789 ₫"`
  );
  assert(
    ctx.formatCurrency(0) === "0 ₫",
    `formatCurrency(0) in VI matches "0 ₫"`
  );

  // Test 7: CSV Data Manipulation Operations
  ctx.loadDefaultSampleData();
  const initialLen = ctx.workingCSVData.length;
  assert(
    initialLen >= 4,
    `loadDefaultSampleData() loaded ${initialLen} default rows`
  );

  // Add empty row
  ctx.addEmptyCSVRow();
  assert(
    ctx.workingCSVData.length === initialLen + 1,
    `addEmptyCSVRow() incremented CSV data count to ${ctx.workingCSVData.length}`
  );
  const newRow = ctx.workingCSVData[ctx.workingCSVData.length - 1];
  assert(
    newRow.Type === "Term Saving" && newRow.Principal === "0",
    `New empty row has sensible default values (Term Saving, 0)`
  );

  // Update row field
  const targetIdx = ctx.workingCSVData.length - 1;
  ctx.updateCSVRowField(targetIdx, "Account Name", "Test Vietinbank Term");
  ctx.updateCSVRowField(targetIdx, "Principal", "95000000");
  ctx.updateCSVRowField(targetIdx, "Bank", "Vietinbank");
  assert(
    ctx.workingCSVData[targetIdx]["Account Name"] === "Test Vietinbank Term",
    `updateCSVRowField updated "Account Name"`
  );
  assert(
    ctx.workingCSVData[targetIdx]["Principal"] === "95000000",
    `updateCSVRowField updated "Principal"`
  );
  assert(
    ctx.workingCSVData[targetIdx]["Bank"] === "Vietinbank",
    `updateCSVRowField updated "Bank"`
  );

  // Delete row
  ctx.deleteCSVRow(targetIdx);
  assert(
    ctx.workingCSVData.length === initialLen,
    `deleteCSVRow() restored length back to ${initialLen}`
  );

  // Clear all data (resets to default sample data)
  ctx.clearAllData();
  assert(
    ctx.workingCSVData.length === ctx.DEFAULT_CSV_DATA.length,
    `clearAllData() restored CSV rows to standard default sample data`
  );

  // syncCSVData
  ctx.syncCSVData([
    {
      "Account Name": "Custom Sổ",
      Principal: "70000000",
      "Start Date": "2026-01-01",
      "End Date": "2026-07-01",
      Interest: "5.2",
      Type: "Term Saving",
      Bank: "ACB",
    },
  ]);
  assert(
    ctx.workingCSVData.length === 1 && ctx.workingCSVData[0].Bank === "ACB",
    `syncCSVData() successfully set workingCSVData`
  );

  // Test 8: URL Hash Serialization & Deserialization (R8)
  ctx.document.getElementById("inputTargetDate").value = "2028-12-31";
  ctx.document.getElementById("inputSalary").value = "45000000";
  ctx.document.getElementById("inputSalaryGrowth").value = "7.5";
  ctx.document.getElementById("inputInflation").value = "3.2";
  ctx.document.getElementById("inputSavingsGoal").value = "2000000000";
  ctx.document.getElementById("inputPoolRate").value = "0.8";
  ctx.document.getElementById("input6MRate").value = "6.2";

  ctx.syncCSVData([
    {
      "Account Name": "Sổ Tiết Kiệm Kỳ Hạn ACB (Unicode Test)",
      Principal: "150000000",
      "Start Date": "2026-02-01",
      "End Date": "2027-02-01",
      Interest: "5.5",
      Type: "Term Saving",
      Bank: "ACB",
    },
  ]);

  ctx.shareSimulation();
  const hash = ctx.location.hash;
  assert(
    typeof hash === "string" && hash.length > 20,
    `shareSimulation() encoded simulation parameters and Unicode CSV into URL hash`
  );

  // Reset inputs and test loadFromURL()
  ctx.document.getElementById("inputTargetDate").value = "";
  ctx.document.getElementById("inputSalary").value = "0";
  ctx.workingCSVData = [];

  const loadSuccess = ctx.loadFromURL();
  assert(loadSuccess === true, `loadFromURL() successfully parsed URL hash`);
  assert(
    ctx.document.getElementById("inputTargetDate").value === "2028-12-31",
    `loadFromURL restored inputTargetDate: "2028-12-31"`
  );
  assert(
    ctx.document.getElementById("inputSalary").value === "45000000",
    `loadFromURL restored inputSalary: "45000000"`
  );
  assert(
    ctx.document.getElementById("inputSalaryGrowth").value === "7.5",
    `loadFromURL restored inputSalaryGrowth: "7.5"`
  );
  assert(
    ctx.workingCSVData.length === 1 &&
      ctx.workingCSVData[0]["Account Name"].includes("Unicode Test"),
    `loadFromURL restored Unicode CSV account name: "${ctx.workingCSVData[0]["Account Name"]}"`
  );

  console.log(
    `\n📊 Helper Test Summary: ${passCount} Passed, ${failCount} Failed\n`
  );
  if (failCount > 0) {
    process.exit(1);
  }
}

runHelperTests().catch((err) => {
  console.error("Helper test failed:", err);
  process.exit(1);
});
