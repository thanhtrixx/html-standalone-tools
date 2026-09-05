const fs = require("fs");
const path = require("path");

// Issue #275 — Full iOS PWA support: viewport-fit=cover, safe-area insets,
// single manifest / apple-mobile-web-app-capable, v4.3.0 sync & SW cache integrity.
//
// Note (adapted AC): the issue referenced a `pwa/apple-icon-180.png` asset that was
// never committed to git; this repo's real icon is `./icon-180.png`, so the SW cache
// must keep referencing the EXISTING asset instead of a dangling path.

const toolDir = path.join(__dirname, "..", "smart-buy-list-price-tracker");
const htmlPath = path.join(toolDir, "index.html");
const swPath = path.join(toolDir, "sw.js");
const manifestPath = path.join(toolDir, "manifest.webmanifest");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`   ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`   ❌ FAIL: ${message}`);
    failed++;
  }
}

function runTests() {
  console.log(
    "\n🧪 Running Smart Buy-List iOS PWA / Safe-Area & v4.3.0 Test Suite...\n"
  );

  try {
    const rawHtml = fs.readFileSync(htmlPath, "utf8");
    const swContent = fs.readFileSync(swPath, "utf8");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    // 1. Viewport
    console.log("--- Section 1: viewport-fit=cover ---");
    assert(
      /<meta[^>]*name=["']viewport["'][^>]*content=["'][^"']*viewport-fit=cover/i.test(
        rawHtml
      ),
      "IOS-01: viewport meta includes viewport-fit=cover"
    );

    // 2. Safe-area insets
    console.log("--- Section 2: safe-area insets (notch / home indicator) ---");
    assert(
      rawHtml.includes("env(safe-area-inset-top)"),
      "IOS-02: env(safe-area-inset-top) is present in the stylesheet"
    );
    assert(
      rawHtml.includes("env(safe-area-inset-bottom)"),
      "IOS-03: env(safe-area-inset-bottom) is present in the stylesheet"
    );
    assert(
      /header\s*\{[^}]*env\(safe-area-inset-top\)/.test(rawHtml),
      "IOS-04: header rule applies env(safe-area-inset-top)"
    );
    assert(
      /#?bottomNavBar\s*\{[^}]*env\(safe-area-inset-bottom\)/.test(rawHtml),
      "IOS-05: bottom nav applies env(safe-area-inset-bottom)"
    );
    assert(
      /#toastContainer\s*\{[^}]*env\(safe-area-inset-top\)/.test(rawHtml),
      "IOS-06: toast container respects safe-area top inset"
    );
    assert(
      /#pwaUpdateToast\s*\{[^}]*env\(safe-area-inset-bottom\)/.test(rawHtml),
      "IOS-07: PWA update toast respects safe-area bottom inset"
    );

    // 3. Single manifest + single apple-mobile-web-app-capable
    console.log(
      "--- Section 3: single manifest / apple-mobile-web-app-capable ---"
    );
    const manifestLinks = [
      ...rawHtml.matchAll(/<link[^>]*rel=["']manifest["'][^>]*>/gi),
    ];
    assert(
      manifestLinks.length === 1,
      `IOS-08: exactly one <link rel="manifest"> (found ${manifestLinks.length})`
    );
    const appleCapable = [
      ...rawHtml.matchAll(/apple-mobile-web-app-capable/gi),
    ];
    assert(
      appleCapable.length === 1,
      `IOS-09: exactly one apple-mobile-web-app-capable meta (found ${appleCapable.length})`
    );

    // 4. Version bump to 4.3.0
    console.log("--- Section 4: version sync to 4.3.0 ---");
    assert(
      manifest.version === "4.3.0",
      `IOS-10: manifest.webmanifest version is 4.3.0 (got ${manifest.version})`
    );
    assert(
      swContent.includes('CACHE_NAME = "smart-buy-list-v4.3.0"'),
      "IOS-11: sw.js CACHE_NAME is smart-buy-list-v4.3.0"
    );
    assert(
      rawHtml.includes('id="pwaVersionBadge"') &&
        /id="pwaVersionBadge"[^>]*>\s*v4\.3\.0\s*<\/span/i.test(rawHtml),
      "IOS-12: #pwaVersionBadge displays v4.3.0"
    );

    // 5. SW cache integrity (use existing asset, no dangling path)
    console.log("--- Section 5: SW cache integrity ---");
    assert(
      swContent.includes('"./icon-180.png"'),
      "IOS-13: sw.js ASSETS_TO_CACHE pre-caches the existing ./icon-180.png"
    );
    assert(
      !swContent.includes("pwa/apple-icon-180.png"),
      "IOS-14: sw.js does NOT reference the non-existent pwa/apple-icon-180.png"
    );
  } catch (err) {
    console.error("❌ Test Execution Exception:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(
    `📊 iOS PWA / Safe-Area & v4.3.0 Test Summary: ${passed} Passed, ${failed} Failed`
  );
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
