const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {
  discoverTools,
  buildTool,
  buildCompanionAssets,
  extractToolVersion,
  inlineLocalAssets,
  parseEnvContent,
  loadEnvFiles,
  resolveDestDir,
  syncToolToExternal,
} = require("../scripts/build");

async function runTests() {
  console.log("🧪 Running Build Pipeline Tests...\n");
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

  // Test 1: Tool discovery
  const tools = discoverTools();
  assert(tools.length >= 3, `Found ${tools.length} tool(s) in repository`);
  assert(
    tools.some((t) => t.name === "personal-finance-savings-predictor"),
    'Discovered "personal-finance-savings-predictor" tool'
  );
  assert(
    tools.some((t) => t.name === "buy-vs-rent-home-comparison"),
    'Discovered "buy-vs-rent-home-comparison" tool'
  );
  assert(
    tools.some((t) => t.name === "smart-buy-list-price-tracker"),
    'Discovered "smart-buy-list-price-tracker" tool'
  );

  // Test 2: Inlining local assets helper
  const mockDir = path.join(__dirname, "mock_tool");
  fs.mkdirSync(mockDir, { recursive: true });
  fs.writeFileSync(
    path.join(mockDir, "test.css"),
    "body { background: #000; }",
    "utf8"
  );
  fs.writeFileSync(
    path.join(mockDir, "test.js"),
    'console.log("hello");',
    "utf8"
  );

  const mockHtml = `<html><head><link rel="stylesheet" href="./test.css"><script src="./test.js"></script></head><body></body></html>`;
  const inlined = inlineLocalAssets(mockHtml, mockDir);
  assert(
    inlined.includes("<style>\nbody { background: #000; }\n</style>"),
    "Inlines local CSS properly"
  );
  assert(
    inlined.includes('<script>\nconsole.log("hello");\n</script>'),
    "Inlines local JS properly"
  );

  // Clean up mock dir
  fs.rmSync(mockDir, { recursive: true, force: true });

  // Test 3: Build tool execution
  const predictorTool = tools.find(
    (t) => t.name === "personal-finance-savings-predictor"
  );
  const buildResult = await buildTool(predictorTool);

  assert(
    buildResult.minifiedSize > 0,
    `Compacted output produced (${buildResult.minifiedSize} bytes)`
  );
  assert(
    buildResult.minifiedSize < buildResult.originalSize,
    `Compacted size (${buildResult.minifiedSize} B) is smaller than original (${buildResult.originalSize} B) with ${buildResult.savings}% reduction`
  );

  // Test 4: Verify output files exist
  const toolDistPath = path.join(predictorTool.dir, "dist", "index.html");
  const rootDistPath = path.join(
    __dirname,
    "..",
    "dist",
    predictorTool.name,
    "index.html"
  );
  assert(
    fs.existsSync(toolDistPath),
    `Tool-scoped dist exists: ${path.relative(path.join(__dirname, ".."), toolDistPath)}`
  );
  assert(
    fs.existsSync(rootDistPath),
    `Root dist exists: ${path.relative(path.join(__dirname, ".."), rootDistPath)}`
  );

  // Test 5: Verify compacted HTML integrity & script extractability
  const compactedHtml = fs.readFileSync(toolDistPath, "utf8");
  assert(
    compactedHtml.startsWith("<!doctype html>"),
    "Compacted HTML has standard DOCTYPE"
  );
  assert(compactedHtml.includes("<title>"), "Compacted HTML preserves <title>");
  assert(
    compactedHtml.includes('<canvas id="chartGrowth">'),
    "Compacted HTML preserves required DOM elements"
  );

  // Test 6: Verify JavaScript execution from compacted HTML
  const scriptMatches = [
    ...compactedHtml.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/gi),
  ];
  assert(
    scriptMatches.length >= 1,
    `Found ${scriptMatches.length} inline script block(s) in compacted HTML`
  );

  let evalSuccess = false;
  try {
    const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");
    // Mock browser globals for simulation engine test
    const sandbox = {
      window: {},
      tailwind: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      document: {
        getElementById: () => ({
          addEventListener: () => {},
          value: "",
          classList: { add: () => {}, remove: () => {} },
          innerHTML: "",
          innerText: "",
        }),
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
      },
      console: console,
      localStorage: { getItem: () => null, setItem: () => {} },
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
      navigator: { clipboard: { writeText: async () => {} } },
      location: { href: "http://localhost/", search: "" },
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(combinedScripts, sandbox);
    evalSuccess = typeof sandbox.simulate === "function";
  } catch (e) {
    evalSuccess = false;
    console.error("JS Syntax/Runtime Error in compacted script:", e);
  }
  assert(
    evalSuccess,
    "Inline JavaScript in compacted HTML is syntactically valid and simulate() function is available"
  );

  // Test 7: Verify Release packager creates assets and zip archive
  const testReleaseDir = path.join(__dirname, "test_release_assets");
  const { main: packReleaseMain } = require("../scripts/pack-release");
  process.argv = [
    "node",
    "scripts/pack-release.js",
    `--out-dir=${testReleaseDir}`,
    "--version=v9.9.9",
  ];
  await packReleaseMain();

  const stagedHtml = path.join(
    testReleaseDir,
    "personal-finance-savings-predictor.html"
  );
  const stagedZip = path.join(
    testReleaseDir,
    "html-standalone-tools-v9.9.9.zip"
  );

  assert(
    fs.existsSync(stagedHtml),
    "Release packager staged standalone tool HTML"
  );
  assert(
    fs.existsSync(stagedZip),
    "Release packager created unified ZIP bundle"
  );
  assert(fs.statSync(stagedHtml).size > 0, "Staged tool HTML is non-empty");
  assert(fs.statSync(stagedZip).size > 0, "Staged ZIP bundle is non-empty");

  // Clean up test release dir
  fs.rmSync(testReleaseDir, { recursive: true, force: true });

  // Test 8: Preservation of Key Interactive DOM Selectors in Compacted Deliverable
  const requiredDomIds = [
    "inputSalary",
    "inputSavingsGoal",
    "inputTargetDate",
    "savingsHubSection",
    "compareSection",
    "onboardingOverlay",
    "csvModal",
    "presetsModal",
    "heatmapGrid",
    "heatmapTooltip",
    "chartGrowth",
    "chartGoalRing",
    "kpiLockedPrincipal",
    "kpiActiveAccounts",
    "kpiWeightedRate",
  ];
  requiredDomIds.forEach((id) => {
    assert(
      compactedHtml.includes(`id="${id}"`) ||
        compactedHtml.includes(`id='${id}'`),
      `Compacted HTML preserves critical DOM element ID '${id}'`
    );
  });

  // Test 9: Bilingual Translation Dictionary in Compacted Output
  const combinedScripts = scriptMatches.map((m) => m[1]).join("\n");
  const testSandbox = {
    window: {},
    tailwind: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    document: {
      getElementById: () => ({
        addEventListener: () => {},
        value: "",
        classList: { add: () => {}, remove: () => {} },
        innerHTML: "",
        innerText: "",
      }),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
    },
    console: console,
    localStorage: { getItem: () => null, setItem: () => {} },
    Chart: Object.assign(function () {}, {
      getChart: () => null,
      register: () => {},
    }),
    navigator: { clipboard: { writeText: async () => {} } },
    location: { href: "http://localhost/", search: "" },
  };
  testSandbox.window = testSandbox;
  vm.createContext(testSandbox);
  vm.runInContext(combinedScripts, testSandbox);

  assert(
    testSandbox.TRANSLATIONS &&
      testSandbox.TRANSLATIONS.en &&
      testSandbox.TRANSLATIONS.vi,
    "Compacted script defines complete TRANSLATIONS object with EN and VI"
  );
  assert(
    Object.keys(testSandbox.TRANSLATIONS.en).length ===
      Object.keys(testSandbox.TRANSLATIONS.vi).length,
    `Compacted translations retain perfect key parity (${Object.keys(testSandbox.TRANSLATIONS.en).length} keys)`
  );

  // Test 10: Pure Simulation Calculation Integrity in Compacted Sandbox
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sixMonthsLater = new Date(today.getTime());
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  const compactedSimRes = testSandbox.simulate(
    {
      targetDateStr: testSandbox.formatDate(sixMonthsLater),
      monthlySalary: 30000000,
      salaryGrowthRate: 0,
      inflationRate: 0,
      poolAnnualRate: 0.05,
      autoTermThreshold: 0,
      savingsGoal: 0,
    },
    [
      {
        "Account Name": "Starting Pool",
        Principal: "100000000",
        "Start Date": testSandbox.formatDate(today),
        "End Date": testSandbox.formatDate(sixMonthsLater),
        Type: "Non-Term Pool",
      },
    ]
  );
  assert(
    compactedSimRes !== null && compactedSimRes.totals.totalWealth > 250000000,
    `Simulation executed from compacted deliverable produces expected wealth (${Math.round(compactedSimRes ? compactedSimRes.totals.totalWealth : 0).toLocaleString()} VND)`
  );

  // Test 11: Multi-Format Test Report Artifacts Verification
  const reportDir = path.join(__dirname, "..", "test-reports");
  const reportHtml = path.join(reportDir, "index.html");
  const reportJson = path.join(reportDir, "results.json");
  const reportXml = path.join(reportDir, "junit.xml");

  if (fs.existsSync(reportHtml)) {
    assert(
      fs.statSync(reportHtml).size > 100,
      "test-reports/index.html interactive report exists and is non-empty"
    );
  }
  if (fs.existsSync(reportJson)) {
    assert(
      fs.statSync(reportJson).size > 100,
      "test-reports/results.json structured report exists and is non-empty"
    );
  }
  if (fs.existsSync(reportXml)) {
    assert(
      fs.statSync(reportXml).size > 100,
      "test-reports/junit.xml JUnit XML report exists and is non-empty"
    );
  }

  // Test 12: parseEnvContent parser robustness
  const sampleEnv = `
# Comment line
TOOLS_DEST_DIR="/custom/path/to/tools"
DIST_DEST_DIR='/fallback/path'
SIMPLE_KEY=plain_value
SPACED_KEY = spaced value
# ANOTHER_COMMENT=ignored
EMPTY_KEY=
  `;
  const parsed = parseEnvContent(sampleEnv);
  assert(
    parsed.TOOLS_DEST_DIR === "/custom/path/to/tools",
    "parseEnvContent correctly parses double-quoted values and strips quotes"
  );
  assert(
    parsed.DIST_DEST_DIR === "/fallback/path",
    "parseEnvContent correctly parses single-quoted values and strips quotes"
  );
  assert(
    parsed.SIMPLE_KEY === "plain_value",
    "parseEnvContent correctly parses plain unquoted values"
  );
  assert(
    parsed.SPACED_KEY === "spaced value",
    "parseEnvContent correctly parses keys with whitespace around delimiter"
  );
  assert(
    parsed.ANOTHER_COMMENT === undefined,
    "parseEnvContent ignores commented lines"
  );

  // Test 13: loadEnvFiles file loading & .env.local precedence
  const tempEnvDir = path.join(__dirname, "temp_env_test");
  fs.mkdirSync(tempEnvDir, { recursive: true });
  fs.writeFileSync(
    path.join(tempEnvDir, ".env"),
    "TOOLS_DEST_DIR=/base/env/path\nBASE_VAR=base_val",
    "utf8"
  );
  fs.writeFileSync(
    path.join(tempEnvDir, ".env.local"),
    "TOOLS_DEST_DIR=/override/local/path",
    "utf8"
  );

  const loadedEnv = loadEnvFiles(tempEnvDir);
  assert(
    loadedEnv.TOOLS_DEST_DIR === "/override/local/path",
    ".env.local overrides values in .env"
  );
  assert(
    loadedEnv.BASE_VAR === "base_val",
    ".env values are preserved when not overridden in .env.local"
  );

  // Clean up temp env dir
  fs.rmSync(tempEnvDir, { recursive: true, force: true });

  // Test 14: resolveDestDir precedence cascade (CLI > env > fileEnv > null)
  const tempCascadeDir = path.join(__dirname, "temp_cascade_test");
  fs.mkdirSync(tempCascadeDir, { recursive: true });
  fs.writeFileSync(
    path.join(tempCascadeDir, ".env.local"),
    "TOOLS_DEST_DIR=/from/env/local",
    "utf8"
  );

  // Case 14a: CLI flag takes top priority
  const cliResolved = resolveDestDir(
    ["--dest-dir=/cli/target/path"],
    tempCascadeDir
  );
  assert(
    cliResolved === "/cli/target/path",
    "resolveDestDir prioritizes CLI argument (--dest-dir) over env files"
  );

  const exportResolved = resolveDestDir(
    ["--export-dir=/cli/export/path"],
    tempCascadeDir
  );
  assert(
    exportResolved === "/cli/export/path",
    "resolveDestDir prioritizes CLI argument (--export-dir) over env files"
  );

  // Case 14b: process.env takes precedence over fileEnv
  const originalEnv = process.env.TOOLS_DEST_DIR;
  try {
    process.env.TOOLS_DEST_DIR = "/from/process/env";
    const envResolved = resolveDestDir([], tempCascadeDir);
    assert(
      envResolved === "/from/process/env",
      "resolveDestDir prioritizes process.env over local file env"
    );
  } finally {
    if (originalEnv !== undefined) {
      process.env.TOOLS_DEST_DIR = originalEnv;
    } else {
      delete process.env.TOOLS_DEST_DIR;
    }
  }

  // Case 14c: Fallback to .env.local
  const fileResolved = resolveDestDir([], tempCascadeDir);
  assert(
    fileResolved === "/from/env/local",
    "resolveDestDir falls back to .env.local when CLI and process.env are absent"
  );

  // Case 14d: Null when unconfigured
  const emptyDir = path.join(__dirname, "temp_empty_dir");
  fs.mkdirSync(emptyDir, { recursive: true });
  const nullResolved = resolveDestDir([], emptyDir);
  assert(
    nullResolved === null,
    "resolveDestDir returns null when no destination is configured"
  );
  fs.rmSync(emptyDir, { recursive: true, force: true });
  fs.rmSync(tempCascadeDir, { recursive: true, force: true });

  // Test 15: syncToolToExternal directory mirroring & companion asset sync
  const tempSyncDest = path.join(__dirname, "temp_external_sync");
  const trackerTool = tools.find(
    (t) => t.name === "smart-buy-list-price-tracker"
  );
  if (trackerTool) {
    await buildTool(trackerTool);
    const syncRes = syncToolToExternal(trackerTool, tempSyncDest);
    assert(syncRes !== null, "syncToolToExternal returned sync result object");
    assert(
      fs.existsSync(path.join(tempSyncDest, trackerTool.name, "index.html")),
      "Synced deliverable index.html exists in mirrored destination"
    );
    assert(
      fs.existsSync(
        path.join(tempSyncDest, trackerTool.name, "manifest.webmanifest")
      ),
      "Synced companion asset manifest.webmanifest exists in destination"
    );
    assert(
      fs.existsSync(path.join(tempSyncDest, trackerTool.name, "sw.js")),
      "Synced companion asset sw.js exists in destination"
    );
    assert(
      fs.existsSync(path.join(tempSyncDest, trackerTool.name, "icon.svg")),
      "Synced companion asset icon.svg exists in destination"
    );
  }
  fs.rmSync(tempSyncDest, { recursive: true, force: true });

  // Test 16: Companion Asset Minification & Syntax Verification
  const trackerSrcSw = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "sw.js"
  );
  const trackerDistSw = path.join(
    __dirname,
    "..",
    "smart-buy-list-price-tracker",
    "dist",
    "sw.js"
  );
  const rootDistSw = path.join(
    __dirname,
    "..",
    "dist",
    "smart-buy-list-price-tracker",
    "sw.js"
  );

  assert(fs.existsSync(trackerDistSw), "Tool-scoped dist/sw.js exists");
  assert(
    fs.existsSync(rootDistSw),
    "Root dist/smart-buy-list-price-tracker/sw.js exists"
  );

  const srcSwContent = fs.readFileSync(trackerSrcSw, "utf8");
  const distSwContent = fs.readFileSync(trackerDistSw, "utf8");

  assert(
    Buffer.byteLength(distSwContent, "utf8") <
      Buffer.byteLength(srcSwContent, "utf8"),
    `Minified sw.js (${Buffer.byteLength(distSwContent, "utf8")} B) is smaller than source (${Buffer.byteLength(srcSwContent, "utf8")} B)`
  );
  assert(
    !distSwContent.includes("// Network-First strategy") &&
      !distSwContent.includes("/*"),
    "Minified sw.js stripped comments"
  );

  // Validate executable syntax of minified sw.js in mock ServiceWorker sandbox
  let swEvalSuccess = false;
  try {
    const swSandbox = {
      self: {
        addEventListener: () => {},
        skipWaiting: () => {},
        clients: { claim: () => {} },
      },
      caches: {
        open: async () => ({ addAll: async () => {}, put: async () => {} }),
        keys: async () => [],
      },
      fetch: async () => ({ status: 200, clone: () => ({}) }),
      Promise: Promise,
      setTimeout: setTimeout,
      Error: Error,
      console: console,
    };
    swSandbox.self.self = swSandbox.self;
    vm.createContext(swSandbox);
    vm.runInContext(distSwContent, swSandbox);
    swEvalSuccess = true;
  } catch (e) {
    swEvalSuccess = false;
    console.error("Syntax/Execution error in dist/sw.js:", e);
  }
  assert(
    swEvalSuccess,
    "Minified dist/sw.js is syntactically valid and executes without error in ServiceWorker context"
  );

  // Test 17: Single-Source Version Consistency
  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        "..",
        "smart-buy-list-price-tracker",
        "manifest.webmanifest"
      ),
      "utf8"
    )
  );
  const distHtml = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "smart-buy-list-price-tracker",
      "dist",
      "index.html"
    ),
    "utf8"
  );
  assert(
    manifest.version === "3.8.0",
    `manifest.webmanifest defines single-source version 3.8.0 (Got: '${manifest.version}')`
  );
  assert(
    distSwContent.includes(
      `CACHE_NAME="smart-buy-list-v${manifest.version}"`
    ) ||
      distSwContent.includes(
        `CACHE_NAME = "smart-buy-list-v${manifest.version}"`
      ),
    `dist/sw.js CACHE_NAME dynamically injected with version ${manifest.version}`
  );
  assert(
    distHtml.includes(`id="pwaVersionBadge"`) &&
      distHtml.includes(`v${manifest.version}`),
    `dist/index.html statically stamped with version badge v${manifest.version}`
  );

  // Test 18: Service Worker Cache Whitelist Integrity & Tailwind CDN Purging
  assert(
    !distSwContent.includes("https://cdn.tailwindcss.com"),
    "dist/sw.js purges static inlined Tailwind CDN script from ASSETS_TO_CACHE"
  );
  const cacheMatch = distSwContent.match(/ASSETS_TO_CACHE\s*=\s*(\[[^\]]+\])/);
  assert(cacheMatch !== null, "Found ASSETS_TO_CACHE array in minified sw.js");
  if (cacheMatch) {
    const assetsList = JSON.parse(cacheMatch[1]);
    assert(
      Array.isArray(assetsList) && assetsList.length >= 3,
      `ASSETS_TO_CACHE contains ${assetsList.length} items`
    );
    for (const asset of assetsList) {
      if (asset === "./" || asset.startsWith("http")) continue;
      const cleanRel = asset.replace(/^\.\//, "");
      const assetPath = path.join(
        __dirname,
        "..",
        "smart-buy-list-price-tracker",
        "dist",
        cleanRel
      );
      assert(
        fs.existsSync(assetPath),
        `PWA cache entry '${asset}' physically exists at ${cleanRel}`
      );
    }
  }

  // Test 19: Release Packager PWA Archive Verification
  const testPwaReleaseDir = path.join(__dirname, "test_pwa_release_assets");
  const { main: packPwaReleaseMain } = require("../scripts/pack-release");
  process.argv = [
    "node",
    "scripts/pack-release.js",
    `--out-dir=${testPwaReleaseDir}`,
    "--version=v3.6.0",
  ];
  await packPwaReleaseMain();

  const stagedPwaZip = path.join(
    testPwaReleaseDir,
    "smart-buy-list-price-tracker-v3.6.0.zip"
  );
  assert(
    fs.existsSync(stagedPwaZip),
    "Release packager created dedicated PWA tool ZIP bundle"
  );
  assert(
    fs.statSync(stagedPwaZip).size > 1000,
    "Dedicated PWA ZIP bundle is non-empty"
  );

  // Clean up test release dir
  fs.rmSync(testPwaReleaseDir, { recursive: true, force: true });

  console.log(`\n📊 Test Summary: ${passCount} Passed, ${failCount} Failed\n`);
  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
