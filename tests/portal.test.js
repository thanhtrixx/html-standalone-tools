const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT_DIR = path.resolve(__dirname, "..");
const PORTAL_SRC = path.join(ROOT_DIR, "portal", "index.html");
const PORTAL_DIST = path.join(ROOT_DIR, "dist", "index.html");

async function runTests() {
  console.log("🧪 Running Portal Hub Tests...\n");
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

  // Test 1: Source file presence
  assert(fs.existsSync(PORTAL_SRC), "portal/index.html exists");
  const htmlContent = fs.readFileSync(PORTAL_SRC, "utf8");

  // Test 2: HTML structure & meta
  assert(
    htmlContent.includes('class="dark"'),
    'Root HTML element specifies "dark" theme class'
  );
  assert(
    htmlContent.includes('<meta name="viewport"'),
    "Includes responsive viewport meta tag"
  );
  assert(
    htmlContent.includes('<meta charset="UTF-8"'),
    "Includes UTF-8 charset declaration"
  );

  // Test 3: Standalone Tool Links
  assert(
    htmlContent.includes("./smart-buy-list-price-tracker/") ||
      htmlContent.includes("./smart-buy-list-price-tracker/index.html"),
    "Contains relative link to smart-buy-list-price-tracker"
  );
  assert(
    htmlContent.includes("./buy-vs-rent-home-comparison/") ||
      htmlContent.includes("./buy-vs-rent-home-comparison/index.html"),
    "Contains relative link to buy-vs-rent-home-comparison"
  );
  assert(
    htmlContent.includes("./personal-finance-savings-predictor/") ||
      htmlContent.includes("./personal-finance-savings-predictor/index.html"),
    "Contains relative link to personal-finance-savings-predictor"
  );

  // Test 4: Repository and Release Links
  assert(
    htmlContent.includes("https://github.com/thanhtrixx/html-standalone-tools"),
    "Contains link to GitHub source repository"
  );
  assert(
    htmlContent.includes(
      "https://github.com/thanhtrixx/html-standalone-tools/releases"
    ),
    "Contains link to GitHub Releases"
  );

  // Test 5: Extract and verify bilingual dictionaries (EN and VI parity)
  const dictMatch = htmlContent.match(
    /const\s+TRANSLATIONS\s*=\s*(\{[\s\S]*?\n\s*\});/
  );
  assert(dictMatch !== null, "Found TRANSLATIONS dictionary in portal script");

  if (dictMatch) {
    let translations = null;
    try {
      const sandbox = {};
      vm.createContext(sandbox);
      vm.runInContext(`var dict = ${dictMatch[1]};`, sandbox);
      translations = sandbox.dict;
    } catch (e) {
      assert(false, `Failed to parse TRANSLATIONS dictionary: ${e.message}`);
    }

    if (translations) {
      assert(
        translations.en && typeof translations.en === "object",
        "Translations contain 'en' dictionary"
      );
      assert(
        translations.vi && typeof translations.vi === "object",
        "Translations contain 'vi' dictionary"
      );

      const enKeys = Object.keys(translations.en || {}).sort();
      const viKeys = Object.keys(translations.vi || {}).sort();

      assert(enKeys.length > 0, `English dictionary has ${enKeys.length} keys`);
      assert(
        viKeys.length > 0,
        `Vietnamese dictionary has ${viKeys.length} keys`
      );

      const missingInVi = enKeys.filter((k) => !(k in translations.vi));
      const missingInEn = viKeys.filter((k) => !(k in translations.en));

      assert(
        missingInVi.length === 0,
        `100% Vietnamese parity: missing ${missingInVi.length} keys (${missingInVi.join(", ")})`
      );
      assert(
        missingInEn.length === 0,
        `100% English parity: missing ${missingInEn.length} keys (${missingInEn.join(", ")})`
      );

      // Check non-empty values
      const emptyEn = enKeys.filter(
        (k) => !translations.en[k] || translations.en[k].trim() === ""
      );
      const emptyVi = viKeys.filter(
        (k) => !translations.vi[k] || translations.vi[k].trim() === ""
      );
      assert(
        emptyEn.length === 0,
        `No empty English strings (found ${emptyEn.length})`
      );
      assert(
        emptyVi.length === 0,
        `No empty Vietnamese strings (found ${emptyVi.length})`
      );
    }
  }

  // Test 6: Compaction output check (if built)
  if (fs.existsSync(PORTAL_DIST)) {
    const distHtml = fs.readFileSync(PORTAL_DIST, "utf8");
    const distSize = Buffer.byteLength(distHtml, "utf8");
    assert(
      distSize < 50 * 1024,
      `dist/index.html is under 50 KB budget (${(distSize / 1024).toFixed(1)} KB)`
    );
    assert(
      !distHtml.includes("https://cdn.tailwindcss.com"),
      "dist/index.html has zero Tailwind CDN script tags (purged & inlined)"
    );
  }

  console.log(`\n==================================================`);
  console.log(`Portal Tests Summary: ${passCount} Passed, ${failCount} Failed`);
  console.log(`==================================================\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}

module.exports = { runTests };
