const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {
  discoverTools,
  buildTool,
  inlineLocalAssets,
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
  assert(tools.length >= 1, `Found ${tools.length} tool(s) in repository`);
  assert(
    tools.some((t) => t.name === "personal-finance-savings-predictor"),
    'Discovered "personal-finance-savings-predictor" tool'
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
      Chart: { getChart: () => null, register: () => {} },
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

  console.log(`\n📊 Test Summary: ${passCount} Passed, ${failCount} Failed\n`);
  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
