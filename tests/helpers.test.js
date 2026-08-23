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
      let _val = "";
      const el = {
        id,
        get value() {
          return _val;
        },
        set value(v) {
          _val = v == null ? "" : String(v);
        },
        _innerText: "",
        get innerText() {
          return this._innerText;
        },
        set innerText(v) {
          this._innerText = String(v);
        },
        get textContent() {
          return this._innerText;
        },
        set textContent(v) {
          this._innerText = String(v);
        },
        _innerHTML: "",
        get innerHTML() {
          return this._innerHTML;
        },
        set innerHTML(v) {
          this._innerHTML = String(v);
          if (v === "") this.children = [];
        },
        children: [],
        parentElement: null,
        style: {},
        remove() {
          if (
            this.parentElement &&
            Array.isArray(this.parentElement.children)
          ) {
            const idx = this.parentElement.children.indexOf(this);
            if (idx >= 0) this.parentElement.children.splice(idx, 1);
          }
        },
        querySelector: (sel) => getEl("dyn_query_" + sel.replace(/^[#.]/, "")),
        querySelectorAll: () => [],
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
          if (ch) ch.parentElement = this;
          this.children.push(ch);
        },
        // Canvas stub — satisfies chart renderers (renderGrowthChart etc.) without a real DOM
        getContext() {
          return {
            clearRect() {},
            fillRect() {},
            strokeRect() {},
            beginPath() {},
            closePath() {},
            moveTo() {},
            lineTo() {},
            arc() {},
            fill() {},
            stroke() {},
            save() {},
            restore() {},
            scale() {},
            translate() {},
            drawImage() {},
            getImageData: () => ({ data: [] }),
            putImageData() {},
            createLinearGradient: () => ({ addColorStop() {} }),
            createRadialGradient: () => ({ addColorStop() {} }),
            measureText: () => ({ width: 0 }),
            fillText() {},
            strokeText() {},
            setTransform() {},
            canvas: { width: 300, height: 150, style: {}, toDataURL: () => "" },
          };
        },
        toDataURL: () => "",
        width: 300,
        height: 150,
      };
      domElements[id] = el;
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
      getElementById: (id) => {
        if (
          id === "documentElement" ||
          id === "body" ||
          htmlContent.includes(`id="${id}"`) ||
          htmlContent.includes(`id='${id}'`)
        ) {
          return getEl(id);
        }
        return null;
      },
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
    TextEncoder: global.TextEncoder,
    TextDecoder: global.TextDecoder,
    Uint8Array: global.Uint8Array,
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
    Chart: Object.assign(
      function Chart(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.data = (config && config.data) || { labels: [], datasets: [] };
        this.options = (config && config.options) || {};
        this.destroy = function () {};
        this.update = function () {};
      },
      { getChart: () => null, register: () => {} }
    ),
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
    ctx.parseFormattedNumber(ctx.workingCSVData[targetIdx]["Principal"]) ===
      95000000,
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
    ctx.parseFormattedNumber(
      ctx.document.getElementById("inputSalary").value
    ) === 45000000,
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

  // Test 8b: Percent-encoded URL Hash (simulating messaging apps / chat links)
  const encodedHash = encodeURIComponent(hash);
  ctx.location.hash = encodedHash;
  ctx.document.getElementById("inputSalary").value = "0";
  const percentLoadSuccess = ctx.loadFromURL();
  assert(
    percentLoadSuccess === true,
    `loadFromURL() successfully decompressed percent-encoded LZ-String URL hash`
  );
  assert(
    ctx.parseFormattedNumber(
      ctx.document.getElementById("inputSalary").value
    ) === 45000000,
    `loadFromURL() restored inputSalary from percent-encoded hash: 45,000,000`
  );

  // Test 8c: Empty CSV array serialization & restoration
  ctx.syncCSVData([]);
  ctx.shareSimulation();
  ctx.workingCSVData = [{ "Account Name": "Temp Account" }];
  const emptyCsvLoad = ctx.loadFromURL();
  assert(
    emptyCsvLoad === true,
    `loadFromURL() successfully loaded empty portfolio state`
  );
  assert(
    ctx.workingCSVData.length === 0,
    `loadFromURL() restored empty CSV data array without default fallback`
  );

  // Test 9: Schema versioning & parameter migration (R2, R22)
  assert(ctx.SCHEMA_VERSION === 4, `SCHEMA_VERSION constant is defined as 4`);
  const nullMigrated = ctx.migrateParams(null);
  assert(nullMigrated === null, `migrateParams(null) safely returns null`);
  const stringMigrated = ctx.migrateParams("invalid-param-payload");
  assert(
    stringMigrated === null,
    `migrateParams("invalid") safely returns null`
  );
  const legacyV0Params = { salary: "25000000", goal: "500000000" };
  const v4Migrated = ctx.migrateParams(legacyV0Params);
  assert(
    v4Migrated !== null &&
      v4Migrated.schemaVersion === 4 &&
      v4Migrated.salary === "25000000" &&
      v4Migrated.autoTermThreshold === "200000000" &&
      v4Migrated.autoTermMonths === "6" &&
      v4Migrated.emergencyBuffer === "30000000" &&
      v4Migrated.annualBonusMultiplier === "1.0" &&
      v4Migrated.annualBonusMonth === "1",
    `migrateParams stamps legacy v0 payload with schemaVersion: 4, emergency buffer, and annual bonus defaults`
  );
  const alreadyV1 = {
    schemaVersion: 1,
    salary: "35000000",
    sixMRate: "6.0",
  };
  const v1ToV4 = ctx.migrateParams(alreadyV1);
  assert(
    v1ToV4.salary === "35000000" &&
      v1ToV4.schemaVersion === 4 &&
      v1ToV4.autoTermRate === "6.0" &&
      v1ToV4.emergencyBuffer === "30000000" &&
      v1ToV4.annualBonusMultiplier === "1.0",
    `migrateParams upgrades v1 payload to v4 preserving rate settings and adding emergency buffer & annual bonus`
  );

  // Test 10: Multibyte UTF-8 Base64 round-trip (R8)
  const testUnicodeStr = JSON.stringify({
    title: "Tiết Kiệm Lãi Suất ₫ 250.000.000 (Ngân Hàng Ngoại Thương)",
    symbol: "₫",
    vietnamese: "Đà Nẵng, Cần Thơ, TP Hồ Chí Minh, Hà Nội",
  });
  const encodedB64 = ctx.utf8ToBase64(testUnicodeStr);
  const decodedStr = ctx.base64ToUtf8(encodedB64);
  assert(
    decodedStr === testUnicodeStr,
    `utf8ToBase64 / base64ToUtf8 preserves multibyte characters and ₫ currency symbols without loss`
  );

  // Test 11: addWithdrawalRow()
  const prevCount = ctx.workingCSVData.length;
  ctx.addWithdrawalRow();
  const addedWithdrawal = ctx.workingCSVData[ctx.workingCSVData.length - 1];
  assert(
    ctx.workingCSVData.length === prevCount + 1 &&
      addedWithdrawal.Type === "Withdrawal",
    `addWithdrawalRow() successfully appended a Withdrawal row`
  );

  // Test 12: generateRecurringRows()
  ctx.document.getElementById("recurType").value = "Non-Term Pool";
  ctx.document.getElementById("recurName").value = "Freelance Inflow";
  ctx.document.getElementById("recurAmount").value = "10000000";
  ctx.document.getElementById("recurFreq").value = "3"; // Quarterly
  ctx.document.getElementById("recurStartDate").value = "2026-01-01";
  ctx.document.getElementById("recurEndDate").value = "2026-10-01"; // Jan, Apr, Jul, Oct (4 entries)
  const beforeRecur = ctx.workingCSVData.length;
  ctx.generateRecurringRows();
  assert(
    ctx.workingCSVData.length === beforeRecur + 4,
    `generateRecurringRows() created 4 discrete quarterly rows over Jan-Oct 2026`
  );

  // Test 13: LZ-String URL Compression & Legacy Base64 Fallback (Issue #6)
  const realisticPortfolioJson = JSON.stringify({
    p: {
      schemaVersion: 4,
      targetDate: "2030-01-01",
      salary: "50000000",
      salaryGrowth: "8.0",
      annualBonusMultiplier: "1.5",
      annualBonusMonth: "1",
      inflation: "3.5",
      goal: "5000000000",
      poolRate: "0.5",
      autoTermThreshold: "100000000",
      emergencyBuffer: "30000000",
      autoTermMonths: "6",
      autoTermRate: "5.8",
      sixMRate: "5.8",
    },
    csv: [
      {
        "Account Name": "Tài Khoản Tiết Kiệm Techcombank",
        Principal: "100000000",
        "Start Date": "2026-01-01",
        "End Date": "2026-07-01",
        Interest: "5.8",
        Type: "Term Saving",
        Bank: "Techcombank",
      },
      {
        "Account Name": "Sổ Tiết Kiệm Kỳ Hạn Vietcombank",
        Principal: "200000000",
        "Start Date": "2026-03-01",
        "End Date": "2026-09-01",
        Interest: "6.0",
        Type: "Term Saving",
        Bank: "Vietcombank",
      },
      {
        "Account Name": "Quỹ Dự Phòng Khẩn Cấp Linh Hoạt VPBank",
        Principal: "50000000",
        "Start Date": "2026-01-01",
        "End Date": "2030-01-01",
        Interest: "0.5",
        Type: "Non-Term Pool",
        Bank: "VPBank",
      },
      {
        "Account Name": "Sổ Tiết Kiệm Bậc Thang MB Bank",
        Principal: "150000000",
        "Start Date": "2026-05-01",
        "End Date": "2026-11-01",
        Interest: "5.9",
        Type: "Term Saving",
        Bank: "MB Bank",
      },
    ],
  });
  const lzCompressed = ctx.LZString.compressToEncodedURIComponent(
    realisticPortfolioJson
  );
  const lzDecompressed =
    ctx.LZString.decompressFromEncodedURIComponent(lzCompressed);
  assert(
    lzDecompressed === realisticPortfolioJson,
    `LZString compress/decompress roundtrip accurately preserves Unicode JSON`
  );
  const b64Size = ctx.utf8ToBase64(realisticPortfolioJson).length;
  assert(
    lzCompressed.length < b64Size,
    `LZString URL hash (${lzCompressed.length} chars) is significantly more compact than Base64 (${b64Size} chars)`
  );

  // Test legacy Base64 decoding fallback in loadFromURL
  const legacyB64 = ctx.utf8ToBase64(
    JSON.stringify({
      p: { targetDate: "2035-12-31", salary: "80000000", schemaVersion: 1 },
      csv: [{ "Account Name": "Legacy B64 Sổ", Principal: "200000000" }],
    })
  );
  ctx.location.hash = legacyB64;
  const legacyLoaded = ctx.loadFromURL();
  assert(
    legacyLoaded === true,
    `loadFromURL() seamlessly decompresses legacy Base64 URL hashes via automatic fallback`
  );
  assert(
    ctx.parseFormattedNumber(
      ctx.document.getElementById("inputSalary").value
    ) === 80000000,
    `loadFromURL restored legacy payload inputSalary: "80000000"`
  );

  // Test 14: Persona Presets Configuration & Undo Safeguard (Issue #6)
  assert(
    Array.isArray(ctx.PERSONA_PRESETS) && ctx.PERSONA_PRESETS.length === 4,
    `PERSONA_PRESETS contains 4 defined strategy presets`
  );
  const presetIds = ctx.PERSONA_PRESETS.map((p) => p.id);
  assert(
    presetIds.includes("fresh_grad") &&
      presetIds.includes("fire_aspirant") &&
      presetIds.includes("home_downpayment") &&
      presetIds.includes("bank_ladder"),
    `PERSONA_PRESETS defines all 4 required personas: [${presetIds.join(", ")}]`
  );

  // Snapshot before preset apply
  const salaryBeforePreset = ctx.document.getElementById("inputSalary").value;
  ctx.applyPreset("fresh_grad");
  assert(
    ctx.parseFormattedNumber(
      ctx.document.getElementById("inputSalary").value
    ) === 15000000 &&
      ctx.parseFormattedNumber(
        ctx.document.getElementById("inputSavingsGoal").value
      ) === 200000000,
    `applyPreset("fresh_grad") loaded Fresh Graduate parameters (Salary: 15M, Goal: 200M)`
  );
  assert(
    ctx._undoState !== null,
    `applyPreset recorded previous state in _undoState for 5-second safeguard`
  );

  // Trigger undo
  ctx.undoPresetApply();
  assert(
    ctx.document.getElementById("inputSalary").value === salaryBeforePreset,
    `undoPresetApply() restored previous salary ("${salaryBeforePreset}")`
  );
  assert(
    ctx._undoState === null,
    `undoPresetApply() cleared _undoState after successful rollback`
  );

  // Test 15: Currency Input Masking & Verbal Helpers (ADR-0011, Issue #8)
  assert(
    typeof ctx.formatNumberWithSeparators === "function",
    `formatNumberWithSeparators helper is globally defined`
  );
  assert(
    ctx.formatNumberWithSeparators(25000000, "en") === "25,000,000",
    `formatNumberWithSeparators(25000000, 'en') formats with comma separators`
  );
  assert(
    ctx.formatNumberWithSeparators(25000000, "vi") === "25.000.000",
    `formatNumberWithSeparators(25000000, 'vi') formats with dot separators`
  );
  assert(
    ctx.formatNumberWithSeparators("1500000000", "en") === "1,500,000,000",
    `formatNumberWithSeparators("1500000000", 'en') formats string number with commas`
  );
  assert(
    ctx.formatNumberWithSeparators(0, "en") === "0",
    `formatNumberWithSeparators(0, 'en') formats zero`
  );
  assert(
    ctx.formatNumberWithSeparators("", "en") === "",
    `formatNumberWithSeparators("", 'en') formats empty string as ""`
  );

  assert(
    typeof ctx.parseFormattedNumber === "function",
    `parseFormattedNumber helper is globally defined`
  );
  assert(
    ctx.parseFormattedNumber("25,000,000") === 25000000,
    `parseFormattedNumber("25,000,000") parses comma-separated string to integer`
  );
  assert(
    ctx.parseFormattedNumber("25.000.000") === 25000000,
    `parseFormattedNumber("25.000.000") parses dot-separated string to integer`
  );
  assert(
    ctx.parseFormattedNumber(" 1,500,000,000 VND ") === 1500000000,
    `parseFormattedNumber(" 1,500,000,000 VND ") handles currency symbols and whitespace`
  );
  assert(
    ctx.parseFormattedNumber(0) === 0 && ctx.parseFormattedNumber("") === 0,
    `parseFormattedNumber handles zero and empty string safely`
  );

  assert(
    typeof ctx.getSpelledOutAmount === "function",
    `getSpelledOutAmount helper is globally defined`
  );
  assert(
    ctx.getSpelledOutAmount(25000000, "vi") === "25 Triệu VND",
    `getSpelledOutAmount(25000000, 'vi') returns '25 Triệu VND'`
  );
  assert(
    ctx.getSpelledOutAmount(25000000, "en") === "25 Million VND",
    `getSpelledOutAmount(25000000, 'en') returns '25 Million VND'`
  );
  assert(
    ctx.getSpelledOutAmount(1500000000, "vi") === "1.5 Tỷ VND",
    `getSpelledOutAmount(1500000000, 'vi') returns '1.5 Tỷ VND'`
  );
  assert(
    ctx.getSpelledOutAmount(1500000000, "en") === "1.5 Billion VND",
    `getSpelledOutAmount(1500000000, 'en') returns '1.5 Billion VND'`
  );
  assert(
    ctx.getSpelledOutAmount(500000, "vi") === "500 Nghìn VND",
    `getSpelledOutAmount(500000, 'vi') returns '500 Nghìn VND'`
  );
  assert(
    ctx.getSpelledOutAmount(500000, "en") === "500 Thousand VND",
    `getSpelledOutAmount(500000, 'en') returns '500 Thousand VND'`
  );

  // Test applyCurrencyMask with cursor preservation
  const mockInput = {
    id: "inputSalary",
    value: "250000000",
    selectionStart: 4,
    setSelectionRange(s, e) {
      this.selectionStart = s;
      this.selectionEnd = e;
    },
  };
  ctx.applyCurrencyMask(mockInput, "en");
  assert(
    mockInput.value === "250,000,000",
    `applyCurrencyMask correctly formats mock input value to '250,000,000'`
  );

  // Test 16: Quick Preset Chips & Delta Modifiers (Issue #11)
  assert(
    typeof ctx.setSalaryValue === "function",
    `setSalaryValue helper is globally defined`
  );
  ctx.setSalaryValue(35000000);
  assert(
    ctx.parseFormattedNumber(
      ctx.document.getElementById("inputSalary").value
    ) === 35000000,
    `setSalaryValue(35000000) set inputSalary to 35M VND`
  );

  assert(
    typeof ctx.addSalaryDelta === "function",
    `addSalaryDelta helper is globally defined`
  );
  ctx.addSalaryDelta(5000000);
  assert(
    ctx.parseFormattedNumber(
      ctx.document.getElementById("inputSalary").value
    ) === 40000000,
    `addSalaryDelta(5000000) incremented salary from 35M to 40M VND`
  );

  assert(
    typeof ctx.setSavingsGoalValue === "function",
    `setSavingsGoalValue helper is globally defined`
  );
  ctx.setSavingsGoalValue(1000000000);
  assert(
    ctx.parseFormattedNumber(
      ctx.document.getElementById("inputSavingsGoal").value
    ) === 1000000000,
    `setSavingsGoalValue(1000000000) set savings goal to 1B VND`
  );

  assert(
    typeof ctx.setAutoTermThresholdValue === "function",
    `setAutoTermThresholdValue helper is globally defined`
  );
  ctx.setAutoTermThresholdValue(150000000);
  assert(
    ctx.parseFormattedNumber(
      ctx.document.getElementById("inputAutoTermThreshold").value
    ) === 150000000,
    `setAutoTermThresholdValue(150000000) set Auto Term Threshold to 150M VND`
  );

  assert(
    typeof ctx.setEmergencyBufferValue === "function",
    `setEmergencyBufferValue helper is globally defined`
  );
  ctx.setEmergencyBufferValue(50000000);
  assert(
    ctx.parseFormattedNumber(
      ctx.document.getElementById("inputEmergencyBuffer").value
    ) === 50000000,
    `setEmergencyBufferValue(50000000) set Emergency Buffer to 50M VND`
  );

  assert(
    typeof ctx.updatePresetChipActiveStates === "function",
    `updatePresetChipActiveStates helper is globally defined`
  );

  // Test 17: Multi-Year Calendar Heatmap Matrix & Tooltips (ADR-0012, Issue #9)
  assert(
    typeof ctx.setHeatmapMetricMode === "function",
    `setHeatmapMetricMode helper is globally defined`
  );
  ctx.setHeatmapMetricMode("inflow");
  assert(
    ctx.heatmapMetricMode === "inflow",
    `setHeatmapMetricMode('inflow') toggled metric mode to 'inflow'`
  );
  ctx.setHeatmapMetricMode("wealth");
  assert(
    ctx.heatmapMetricMode === "wealth",
    `setHeatmapMetricMode('wealth') toggled metric mode back to 'wealth'`
  );

  assert(
    typeof ctx.showHeatmapTooltip === "function" &&
      typeof ctx.hideHeatmapTooltip === "function",
    `showHeatmapTooltip and hideHeatmapTooltip helpers are globally defined`
  );

  // Test 18: Full-Width Savings Hub KPIs & Category Filtering (ADR-0013, Issue #10)
  assert(
    typeof ctx.filterSavingsCategory === "function",
    `filterSavingsCategory helper is globally defined`
  );
  ctx.filterSavingsCategory("auto_term");
  assert(
    ctx.activeSavingsCategory === "auto_term",
    `filterSavingsCategory('auto_term') set activeSavingsCategory to 'auto_term'`
  );
  ctx.filterSavingsCategory("all");
  assert(
    ctx.activeSavingsCategory === "all",
    `filterSavingsCategory('all') reset activeSavingsCategory to 'all'`
  );

  assert(
    typeof ctx.updateSavingsHubKPIs === "function",
    `updateSavingsHubKPIs helper is globally defined`
  );

  const mockPortfolio = [
    {
      id: "1",
      name: "Fixed 1",
      principal: 100000000,
      rate: 6.0,
      status: "ACTIVE",
      type: "CSV",
    },
    {
      id: "2",
      name: "Fixed 2",
      principal: 200000000,
      rate: 7.5,
      status: "ACTIVE",
      type: "CSV",
    },
    {
      id: "3",
      name: "Auto Term #1",
      principal: 150000000,
      rate: 6.5,
      status: "ACTIVE",
      type: "AUTO_6M",
    },
    {
      id: "4",
      name: "Matured 1",
      principal: 50000000,
      rate: 5.0,
      status: "MATURED",
      type: "CSV",
    },
    {
      id: "5",
      name: "Auto Term #2 Matured",
      principal: 60000000,
      rate: 6.0,
      status: "MATURED",
      type: "AUTO_6M",
    },
    {
      id: "6",
      name: "Withdrawal 1",
      principal: 30000000,
      rate: 0,
      status: "WITHDRAWAL",
      type: "Withdrawal",
    },
  ];
  ctx.renderSavingsTable(mockPortfolio);
  // Total active locked principal = 100M + 200M + 150M = 450M
  // Active accounts = 3, Auto sweeps = 1
  // Weighted rate = (100*6 + 200*7.5 + 150*6.5) / 450 = (600 + 1500 + 975) / 450 = 3075 / 450 = 6.833%
  assert(
    ctx.document.getElementById("kpiActiveAccounts").innerText === "3",
    `updateSavingsHubKPIs computed active accounts count (3)`
  );
  assert(
    ctx.document.getElementById("kpiAutoSweeps").innerText === "1",
    `updateSavingsHubKPIs computed auto sweeps count (1)`
  );
  assert(
    ctx.document.getElementById("kpiWeightedRate").innerText.startsWith("6.83"),
    `updateSavingsHubKPIs computed weighted average rate (6.83%/yr)`
  );

  const tbody = ctx.document.getElementById("savingsTableBody");
  ctx.filterSavingsCategory("all");
  assert(
    tbody.children.length === 6,
    `renderFilteredSavingsTable('all') shows all 6 accounts`
  );

  ctx.filterSavingsCategory("active_fixed");
  assert(
    tbody.children.length === 2,
    `renderFilteredSavingsTable('active_fixed') shows 2 active fixed accounts`
  );

  ctx.filterSavingsCategory("auto_term");
  assert(
    tbody.children.length === 1,
    `renderFilteredSavingsTable('auto_term') shows only 1 active auto-term account (excluding matured auto-terms)`
  );

  ctx.filterSavingsCategory("matured");
  assert(
    tbody.children.length === 2,
    `renderFilteredSavingsTable('matured') shows 2 matured accounts (CSV + Auto Term)`
  );

  ctx.filterSavingsCategory("withdrawals");
  assert(
    tbody.children.length === 1,
    `renderFilteredSavingsTable('withdrawals') shows 1 withdrawal`
  );

  // Test 19: Modal Lifecycle Controller & Dialog Safeguards (ADR-0014, Issue #12)
  assert(
    typeof ctx.dismissAllModals === "function",
    `dismissAllModals helper is globally defined`
  );
  ctx.showOnboarding();
  const onboardModal = ctx.document.getElementById("onboardingOverlay");
  assert(
    onboardModal.classList.contains("flex") &&
      !onboardModal.classList.contains("hidden"),
    `showOnboarding opened onboarding modal`
  );
  ctx.toggleCSVModal(true);
  const csvModalEl = ctx.document.getElementById("csvModal");
  assert(
    !csvModalEl.classList.contains("hidden"),
    `toggleCSVModal(true) opened CSV modal`
  );
  assert(
    onboardModal.classList.contains("hidden"),
    `toggleCSVModal(true) enforced single-active-modal by closing onboarding overlay`
  );
  ctx.dismissAllModals();
  assert(
    csvModalEl.classList.contains("hidden") &&
      onboardModal.classList.contains("hidden"),
    `dismissAllModals() cleanly closed all active modals`
  );

  // Test 20: formatNumberWithSeparators & parseFormattedNumber Edge Cases & Extreme Values
  assert(
    ctx.formatNumberWithSeparators(1000000000000, "en") === "1,000,000,000,000",
    "formatNumberWithSeparators formats Trillions with commas"
  );
  assert(
    ctx.formatNumberWithSeparators(1000000000000, "vi") === "1.000.000.000.000",
    "formatNumberWithSeparators formats Trillions with dots"
  );
  assert(
    ctx.formatNumberWithSeparators(-50000000, "en") === "-50,000,000",
    "formatNumberWithSeparators formats negative values"
  );
  assert(
    ctx.parseFormattedNumber("  $ 150,000,000 VND  ") === 150000000,
    "parseFormattedNumber strips currency prefixes, suffixes, and whitespace"
  );
  assert(
    ctx.parseFormattedNumber("-25.000.000") === -25000000,
    "parseFormattedNumber handles negative formatted strings"
  );
  assert(
    ctx.parseFormattedNumber("invalid_text_without_digits") === 0,
    "parseFormattedNumber returns 0 for non-numerical string"
  );
  assert(
    ctx.parseFormattedNumber(null) === 0 &&
      ctx.parseFormattedNumber(undefined) === 0,
    "parseFormattedNumber safely returns 0 for null and undefined"
  );

  // Test 21: getSpelledOutAmount Full Tiers & Boundary Values
  assert(
    ctx.getSpelledOutAmount(10000000000, "vi") === "10 Tỷ VND",
    "getSpelledOutAmount: 10B VND in VI returns '10 Tỷ VND'"
  );
  assert(
    ctx.getSpelledOutAmount(10000000000, "en") === "10 Billion VND",
    "getSpelledOutAmount: 10B VND in EN returns '10 Billion VND'"
  );
  assert(
    ctx.getSpelledOutAmount(2500000000, "vi") === "2.5 Tỷ VND",
    "getSpelledOutAmount: 2.5B VND in VI returns '2.5 Tỷ VND'"
  );
  assert(
    ctx.getSpelledOutAmount(100000000, "vi") === "100 Triệu VND",
    "getSpelledOutAmount: 100M VND in VI returns '100 Triệu VND'"
  );
  assert(
    ctx.getSpelledOutAmount(1000000, "en") === "1 Million VND",
    "getSpelledOutAmount: 1M VND in EN returns '1 Million VND'"
  );
  assert(
    ctx.getSpelledOutAmount(750000, "vi") === "750 Nghìn VND",
    "getSpelledOutAmount: 750k VND in VI returns '750 Nghìn VND'"
  );
  assert(
    ctx.getSpelledOutAmount(500, "vi") === "500 VND",
    "getSpelledOutAmount: sub-thousand returns raw '500 VND'"
  );
  assert(
    ctx.getSpelledOutAmount(0, "vi") === "" &&
      ctx.getSpelledOutAmount(-100000, "vi") === "",
    "getSpelledOutAmount: zero or negative returns empty string"
  );

  // Test 22: applyCurrencyMask Typing Simulation & Caret Stability
  const typingMock = {
    id: "inputSalary",
    value: "1000000",
    selectionStart: 7,
    setSelectionRange(s, e) {
      this.selectionStart = s;
    },
  };
  ctx.applyCurrencyMask(typingMock, "en");
  assert(
    typingMock.value === "1,000,000",
    "applyCurrencyMask formats 1000000 to '1,000,000'"
  );

  // Deleting all input
  const emptyMock = {
    id: "inputSalary",
    value: "",
    selectionStart: 0,
    setSelectionRange() {},
  };
  ctx.applyCurrencyMask(emptyMock, "en");
  assert(
    emptyMock.value === "",
    "applyCurrencyMask preserves empty string when input is cleared"
  );

  // Test 23: LZ-String URL Compression & Malformed Hash Resilience
  ctx.location.hash = "#invalid_corrupt_lz_payload_12345";
  const malformedLoad = ctx.loadFromURL();
  assert(
    malformedLoad === false,
    "loadFromURL() safely handles corrupted hash without throwing unhandled exceptions"
  );

  // Test 24: Persona Presets Configuration & All 4 Strategy Loads
  const presets = ctx.PERSONA_PRESETS;
  assert(
    presets.length === 4,
    "PERSONA_PRESETS defines all 4 required financial strategy presets"
  );

  ctx.applyPreset("fire_aspirant");
  assert(
    ctx.parseFormattedNumber(
      ctx.document.getElementById("inputSalary").value
    ) === 60000000,
    "applyPreset('fire_aspirant') sets salary to 60M"
  );
  assert(
    ctx.parseFormattedNumber(
      ctx.document.getElementById("inputSavingsGoal").value
    ) === 5000000000,
    "applyPreset('fire_aspirant') sets savings goal to 5B"
  );

  ctx.applyPreset("home_downpayment");
  assert(
    ctx.parseFormattedNumber(
      ctx.document.getElementById("inputSalary").value
    ) === 35000000,
    "applyPreset('home_downpayment') sets salary to 35M"
  );

  ctx.applyPreset("bank_ladder");
  assert(
    ctx.workingCSVData.length >= 3,
    "applyPreset('bank_ladder') loads multi-tier term deposit portfolio"
  );

  // Test 25: Recurring Cashflow Schedule Generator Frequencies
  // Monthly (freq = 1) over 6 months -> 6 entries
  ctx.document.getElementById("recurType").value = "Withdrawal";
  ctx.document.getElementById("recurName").value = "Monthly Rent";
  ctx.document.getElementById("recurAmount").value = "8000000";
  ctx.document.getElementById("recurFreq").value = "1"; // Monthly
  ctx.document.getElementById("recurStartDate").value = "2026-01-01";
  ctx.document.getElementById("recurEndDate").value = "2026-06-01";
  const preMonthlyCount = ctx.workingCSVData.length;
  ctx.generateRecurringRows();
  assert(
    ctx.workingCSVData.length === preMonthlyCount + 6,
    "generateRecurringRows() created 6 monthly withdrawal rows"
  );

  // Annual (freq = 12) over 2 years -> 2 entries
  ctx.document.getElementById("recurType").value = "Non-Term Pool";
  ctx.document.getElementById("recurName").value = "Annual Bonus";
  ctx.document.getElementById("recurAmount").value = "50000000";
  ctx.document.getElementById("recurFreq").value = "12"; // Annual
  ctx.document.getElementById("recurStartDate").value = "2026-01-01";
  ctx.document.getElementById("recurEndDate").value = "2027-01-01";
  const preAnnualCount = ctx.workingCSVData.length;
  ctx.generateRecurringRows();
  assert(
    ctx.workingCSVData.length === preAnnualCount + 2,
    "generateRecurringRows() created 2 annual entries"
  );

  // Test 26: Savings Hub KPI Math with Boundary & Empty Portfolios
  ctx.updateSavingsHubKPIs([]);
  assert(
    ctx.document.getElementById("kpiActiveAccounts").innerText === "0",
    "Empty portfolio yields 0 active accounts"
  );
  assert(
    ctx.document.getElementById("kpiAutoSweeps").innerText === "0",
    "Empty portfolio yields 0 auto sweeps"
  );
  assert(
    ctx.document.getElementById("kpiWeightedRate").innerText === "0.00%/yr",
    "Empty portfolio yields 0.00%/yr weighted rate"
  );

  // Only Matured accounts portfolio
  const maturedOnlyPortfolio = [
    {
      id: "m1",
      name: "Old Term",
      principal: 100000000,
      rate: 7.0,
      status: "MATURED",
      type: "CSV",
    },
  ];
  ctx.updateSavingsHubKPIs(maturedOnlyPortfolio);
  assert(
    ctx.document.getElementById("kpiActiveAccounts").innerText === "0",
    "Matured-only portfolio yields 0 active accounts"
  );
  assert(
    ctx.document.getElementById("kpiLockedPrincipal").innerText.startsWith("0"),
    "Matured-only portfolio yields 0 locked principal"
  );

  // Test 27: CSV Editor Validation Safeguards (End Date < Start Date)
  ctx.toggleCSVModal(true);
  const csvModalElTest27 = ctx.document.getElementById("csvModal");
  assert(
    !csvModalElTest27.classList.contains("hidden"),
    "CSV modal is open prior to invalid save attempt"
  );

  ctx.syncCSVData([
    {
      "Account Name": "Invalid Dates Account",
      Principal: "50000000",
      "Start Date": "2026-12-01",
      "End Date": "2026-01-01", // End Date before Start Date
      Interest: "5.0",
      Type: "Term Saving",
      Bank: "VCB",
    },
  ]);
  // Attempt to save invalid data
  ctx.saveCSVEditorData();
  assert(
    !csvModalElTest27.classList.contains("hidden"),
    "saveCSVEditorData() rejects invalid date range (End < Start) and leaves CSV modal open"
  );

  // Now fix date range and save successfully
  ctx.syncCSVData([
    {
      "Account Name": "Valid Dates Account",
      Principal: "50000000",
      "Start Date": "2026-01-01",
      "End Date": "2027-12-01",
      Interest: "5.0",
      Type: "Term Saving",
      Bank: "VCB",
    },
  ]);
  ctx.saveCSVEditorData();
  assert(
    csvModalElTest27.classList.contains("hidden"),
    "saveCSVEditorData() accepts valid date range, saves data, and closes CSV modal"
  );

  // Test 28: Keyboard & Dialog Manager Safeguards
  ctx.dismissAllModals();
  // Call dismissAllModals when no modal is open (should be a safe no-op)
  let noopError = false;
  try {
    ctx.dismissAllModals();
  } catch (e) {
    noopError = true;
  }
  assert(
    noopError === false,
    "dismissAllModals() when 0 modals are open executes safely as a no-op"
  );

  // Test 29: AI Advisory Blueprints & Custom Inquiries in Dossier Engine
  const testParams = {
    targetDateStr: "2028-01-01",
    monthlySalary: 40000000,
    salaryGrowthRate: 0.06,
    annualBonusMultiplier: 1.5,
    annualBonusMonth: 1,
    inflationRate: 0.04,
    poolAnnualRate: 0.005,
    autoTermThreshold: 200000000,
    emergencyBuffer: 50000000,
    autoTermMonths: 6,
    autoTermAnnualRate: 0.06,
    savingsGoal: 1000000000,
  };
  const simResultA = ctx.simulate(testParams, [
    {
      "Account Name": "VCB Savings",
      Principal: "200000000",
      "Start Date": "2026-01-01",
      "End Date": "2026-07-01",
      Interest: "6.0",
      Type: "Term Saving",
      Bank: "VCB",
    },
  ]);

  const fireMd = ctx.generateFinancialHealthMarkdown(testParams, simResultA, {
    blueprint: "fire",
    locale: "en",
  });
  assert(
    fireMd.includes(
      "FIRE (Financial Independence, Retire Early) Acceleration"
    ) && fireMd.includes("Safe Withdrawal Rate (SWR 3.5% - 4.0%)"),
    "generateFinancialHealthMarkdown accurately renders FIRE blueprint persona"
  );

  const realEstateMd = ctx.generateFinancialHealthMarkdown(
    testParams,
    simResultA,
    {
      blueprint: "real_estate",
      locale: "en",
    }
  );
  assert(
    realEstateMd.includes("Real Estate Downpayment & Milestone Sizing") &&
      realEstateMd.includes("Downpayment Target Feasibility"),
    "generateFinancialHealthMarkdown accurately renders Real Estate blueprint persona"
  );

  const ladderMd = ctx.generateFinancialHealthMarkdown(testParams, simResultA, {
    blueprint: "ladder",
    locale: "en",
  });
  assert(
    ladderMd.includes("Deposit Ladder & Emergency Buffer Optimization") &&
      ladderMd.includes("Multi-Tenor Ladder Diversification"),
    "generateFinancialHealthMarkdown accurately renders Deposit Ladder blueprint persona"
  );

  const customNotes =
    "Client is planning a sabbatical in Year 2; analyze cashflow vulnerability.";
  const customNotesMd = ctx.generateFinancialHealthMarkdown(
    testParams,
    simResultA,
    {
      blueprint: "general",
      customInquiries: customNotes,
      locale: "en",
    }
  );
  assert(
    customNotesMd.includes("### 📝 Custom Inquiries from Client:") &&
      customNotesMd.includes(customNotes),
    "generateFinancialHealthMarkdown appends custom inquiries block when provided"
  );

  // Test 30: Dual-Pass Scenario Comparison Audit & 3-Tier Deficit Scoring
  const testParamsB = {
    ...testParams,
    monthlySalary: 55000000,
    savingsGoal: 1200000000,
  };
  const simResultB = ctx.simulate(testParamsB, [
    {
      "Account Name": "VCB Savings",
      Principal: "200000000",
      "Start Date": "2026-01-01",
      "End Date": "2026-07-01",
      Interest: "6.0",
      Type: "Term Saving",
      Bank: "VCB",
    },
  ]);

  const compareMd = ctx.generateFinancialHealthMarkdown(
    testParams,
    simResultA,
    {
      blueprint: "compare",
      scenarioBResult: simResultB,
      scenarioBParams: testParamsB,
      locale: "en",
    }
  );
  assert(
    compareMd.includes(
      "Strategic Comparative Audit Matrix (Scenario A vs B)"
    ) &&
      compareMd.includes("Ending Total Wealth") &&
      compareMd.includes("Scenario A (Baseline)") &&
      compareMd.includes("Scenario B (Projected)"),
    "generateFinancialHealthMarkdown renders side-by-side Scenario A vs B audit matrix table"
  );

  // Moderate Deficit vs Safe vs Critical Deficit scoring verification
  const safeMd = ctx.generateFinancialHealthMarkdown(testParams, simResultA, {
    locale: "en",
  });
  assert(
    safeMd.includes("🟢 SAFE") &&
      safeMd.includes("0 liquid pool deficit events"),
    "Deficit scoring classifies healthy simulation as 🟢 SAFE"
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
