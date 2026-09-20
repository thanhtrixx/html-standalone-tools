const fs = require("fs");
const path = require("path");
const vm = require("vm");

async function runTests() {
  console.log(
    "🌐 Running English Shadowing Monolingual UI & Bilingual Assets Verification Tests...\n"
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
    "english-shadowing",
    "index.html"
  );
  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  // 1. Complete Excising of Legacy UI Translation Engine (ADR-0010 / Issue #699)
  const dictMatch = htmlContent.match(
    /const\s+TRANSLATIONS\s*=\s*(\{[\s\S]*?\n\s*\});/
  );
  assert(
    dictMatch === null,
    "Legacy TRANSLATIONS dictionary is completely excised from index.html"
  );

  const dataI18nMatches = [
    ...htmlContent.matchAll(/data-i18n(-placeholder)?=["']([^"']+)["']/g),
  ];
  assert(
    dataI18nMatches.length === 0,
    `Zero data-i18n or data-i18n-placeholder attributes in index.html (found ${dataI18nMatches.length})`
  );

  assert(
    !htmlContent.includes("function setLanguage"),
    "setLanguage function is removed from index.html"
  );
  assert(
    !htmlContent.includes("function applyI18n"),
    "applyI18n function is removed from index.html"
  );
  assert(
    !htmlContent.includes('id="langBtnEn"') &&
      !htmlContent.includes('id="langBtnVi"'),
    "Language switcher buttons (#langBtnEn, #langBtnVi) are excised from index.html"
  );

  // 2. Permanent High-Contrast Dark Mode (ADR-0010 / Issue #699)
  assert(
    htmlContent.includes('<html lang="en" class="dark">'),
    "html root element has permanent class='dark' and lang='en'"
  );
  assert(
    !htmlContent.includes('id="themeToggleBtn"'),
    "Theme toggle button (#themeToggleBtn) is excised from index.html"
  );
  assert(
    !htmlContent.includes("function toggleTheme"),
    "toggleTheme function is removed from index.html"
  );
  assert(
    !htmlContent.includes("function setTheme"),
    "setTheme function is removed from index.html"
  );
  assert(
    htmlContent.includes("bg-slate-950"),
    "Body uses high-contrast dark theme background bg-slate-950"
  );

  // 3. Bilingual Learning Assets Retention (Invariants 3 & 7)
  const vocabDbMatch = htmlContent.match(
    /const\s+BUILTIN_VOCAB_DB\s*=\s*(\{[\s\S]*?\n\s*\});/
  );
  assert(
    vocabDbMatch !== null,
    "BUILTIN_VOCAB_DB dictionary is preserved in index.html"
  );

  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`var db = ${vocabDbMatch[1]};`, sandbox);
  const vocabDb = sandbox.db;

  const vocabWords = Object.keys(vocabDb);
  assert(
    vocabWords.length >= 10,
    `BUILTIN_VOCAB_DB contains at least 10 entries (found ${vocabWords.length})`
  );

  let missingViDefinitions = [];
  vocabWords.forEach((word) => {
    const entry = vocabDb[word];
    if (
      !entry ||
      typeof entry.vi !== "string" ||
      entry.vi.trim().length === 0
    ) {
      missingViDefinitions.push(word);
    }
  });
  assert(
    missingViDefinitions.length === 0,
    `All BUILTIN_VOCAB_DB entries contain Vietnamese definitions for learner reference (missing: ${missingViDefinitions.join(", ")})`
  );

  // Subtitle Masking preserves Vietnamese support
  assert(
    htmlContent.includes('id="subMaskDual"') &&
      htmlContent.includes('id="subMaskPrimary"') &&
      htmlContent.includes('id="subMaskSecondary"') &&
      htmlContent.includes('id="subMaskBlur"'),
    "Subtitle mask buttons (Dual, English-only, Vietnamese-only, Blur) are preserved"
  );

  // 4. Monolingual English UI Copy Integrity
  assert(
    htmlContent.includes(
      'placeholder="Search scenarios, keywords, or topics..."'
    ),
    "Catalog search input placeholder is English"
  );
  assert(
    htmlContent.includes("How Shadowing Works (3 Steps)"),
    "FTUX onboarding title is English"
  );
  assert(
    htmlContent.includes("No scenarios match the selected filters."),
    "Catalog empty state copy is English"
  );
  assert(
    htmlContent.includes("No saved words yet."),
    "Vocabulary drawer empty state copy is English"
  );
  assert(
    htmlContent.includes("Practice Insights & Analytics"),
    "Insights modal title is English"
  );

  console.log(`\n==================================================`);
  console.log(
    `📊 Monolingual UI & Assets Tests: ${passCount} Passed, ${failCount} Failed`
  );
  console.log(`==================================================\n`);

  if (failCount > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
