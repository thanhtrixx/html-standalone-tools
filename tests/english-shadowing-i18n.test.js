const fs = require("fs");
const path = require("path");
const vm = require("vm");

async function runTests() {
  console.log("🌐 Running English Shadowing i18n Verification Tests...\n");
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
    "english-shadowing",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  // Extract TRANSLATIONS dictionary
  const dictMatch = htmlContent.match(
    /const\s+TRANSLATIONS\s*=\s*(\{[\s\S]*?\n\s*\});/
  );
  assert(dictMatch !== null, "Found TRANSLATIONS dictionary in index.html");

  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`var dict = ${dictMatch[1]};`, sandbox);
  const translations = sandbox.dict;

  assert(Boolean(translations.en), "TRANSLATIONS contains 'en' language key");
  assert(Boolean(translations.vi), "TRANSLATIONS contains 'vi' language key");

  const enKeys = Object.keys(translations.en);
  const viKeys = Object.keys(translations.vi);

  assert(
    enKeys.length >= 25,
    `English dictionary has at least 25 keys (found ${enKeys.length})`
  );
  assert(
    viKeys.length >= 25,
    `Vietnamese dictionary has at least 25 keys (found ${viKeys.length})`
  );

  // Check 100% parity: every en key must exist in vi
  let missingInVi = [];
  enKeys.forEach((k) => {
    if (!translations.vi[k]) {
      missingInVi.push(k);
    } else {
      assert(
        typeof translations.vi[k] === "string" &&
          translations.vi[k].trim().length > 0,
        `VI key '${k}' is non-empty string`
      );
    }
  });

  assert(
    missingInVi.length === 0,
    `No keys missing in Vietnamese (missing: ${missingInVi.join(", ")})`
  );

  // Check every vi key exists in en
  let missingInEn = [];
  viKeys.forEach((k) => {
    if (!translations.en[k]) {
      missingInEn.push(k);
    }
  });
  assert(
    missingInEn.length === 0,
    `No keys missing in English (missing: ${missingInEn.join(", ")})`
  );

  // Check that all data-i18n attributes in HTML exist in TRANSLATIONS
  const dataI18nMatches = [
    ...htmlContent.matchAll(/data-i18n=["']([^"']+)["']/g),
  ];
  assert(
    dataI18nMatches.length > 0,
    `Found ${dataI18nMatches.length} data-i18n attributes in HTML`
  );

  let undefinedDomKeys = [];
  dataI18nMatches.forEach((m) => {
    const key = m[1];
    if (!translations.en[key]) {
      undefinedDomKeys.push(key);
    }
  });
  assert(
    undefinedDomKeys.length === 0,
    `All data-i18n tags have defined translations (undefined: ${undefinedDomKeys.join(", ")})`
  );

  console.log(`\n==================================================`);
  console.log(
    `📊 i18n Tests Completed: ${passCount} Passed, ${failCount} Failed`
  );
  console.log(`==================================================\n`);

  if (failCount > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
