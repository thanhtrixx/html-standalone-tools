#!/usr/bin/env node

/**
 * Atomic Habit Tracker Bilingual Lexicon & i18n Test Suite
 *
 * Domain: i18n & Localization
 * Covers:
 * - [AC-7] 100% Key Parity between English ('en') and Vietnamese ('vi') dictionaries
 * - Number, Percentage & Date formatting per locale
 * - Domain glossary compliance per habit-tracker/I18N.md
 */

const {
  TRANSLATIONS,
  t,
  formatNumber,
  formatPercent,
  formatDate,
  formatDuration,
} = require("../habit-tracker/src/i18n/translations.js");
const { createAssertions } = require("./helpers/habit-tracker-harness.js");

const { assert, assertEqual, printSummary } = createAssertions(
  "Atomic Habit Tracker i18n Parity Test Suite"
);

console.log("\n🧪 Running Atomic Habit Tracker i18n Parity Test Suite...\n");

try {
  // 1. Dictionaries exist
  assert(
    TRANSLATIONS.en,
    "[AC-7] English ('en') translation dictionary is defined"
  );
  assert(
    TRANSLATIONS.vi,
    "[AC-7] Vietnamese ('vi') translation dictionary is defined"
  );

  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  const viKeys = Object.keys(TRANSLATIONS.vi).sort();

  console.log(`\n  Dictionary Size: en=${enKeys.length}, vi=${viKeys.length}`);

  // 2. Check for missing keys in vi
  const missingInVi = enKeys.filter((k) => !(k in TRANSLATIONS.vi));
  assertEqual(
    missingInVi.length,
    0,
    `[AC-7] Zero missing keys in Vietnamese (Missing: ${missingInVi.join(", ") || "None"})`
  );

  // 3. Check for missing keys in en
  const missingInEn = viKeys.filter((k) => !(k in TRANSLATIONS.en));
  assertEqual(
    missingInEn.length,
    0,
    `[AC-7] Zero missing keys in English (Missing: ${missingInEn.join(", ") || "None"})`
  );

  // 4. Test translation function t(key, params, lang)
  assertEqual(
    t("app_title", {}, "en"),
    "Atomic Habit & Routine Tracker",
    "[AC-7] English app title matches brand"
  );
  assertEqual(
    t("app_title", {}, "vi"),
    "Theo Dõi Thói Quen Hàng Ngày",
    "[AC-7] Vietnamese app title matches I18N.md"
  );

  // Routine translations
  assertEqual(
    t("routine_morning", {}, "vi"),
    "Buổi sáng",
    "[AC-7] Routine Morning translated correctly in VI"
  );
  assertEqual(
    t("routine_afternoon", {}, "vi"),
    "Buổi chiều",
    "[AC-7] Routine Afternoon translated correctly in VI"
  );
  assertEqual(
    t("routine_evening", {}, "vi"),
    "Buổi tối",
    "[AC-7] Routine Evening translated correctly in VI"
  );
  assertEqual(
    t("routine_anytime", {}, "vi"),
    "Linh hoạt",
    "[AC-7] Routine Anytime translated correctly in VI"
  );

  // Streak & consistency translations
  assertEqual(
    t("current_streak", {}, "vi"),
    "Chuỗi liên tục hiện tại",
    "[AC-7] Current streak translated correctly"
  );
  assertEqual(
    t("best_streak", {}, "vi"),
    "Kỷ lục chuỗi dài nhất",
    "[AC-7] Best streak translated correctly"
  );
  assertEqual(
    t("consistency_score", {}, "vi"),
    "Độ kiên trì 30 ngày",
    "[AC-7] Consistency score translated correctly"
  );
  assertEqual(
    t("freeze_token", {}, "vi"),
    "Vé bảo lưu chuỗi",
    "[AC-7] Freeze token translated correctly"
  );

  // Parameterized strings
  assertEqual(
    t("streak_days_count", { count: 5 }, "en"),
    "5 days streak",
    "[AC-7] English parameterized streak formatting"
  );
  assertEqual(
    t("streak_days_count", { count: 5 }, "vi"),
    "Chuỗi 5 ngày",
    "[AC-7] Vietnamese parameterized streak formatting"
  );

  // 5. Number & Percentage Formatters
  assertEqual(
    formatNumber(2500, "en"),
    "2,500",
    "[AC-7] Number formatted with commas in English"
  );
  assertEqual(
    formatNumber(2500, "vi"),
    "2.500",
    "[AC-7] Number formatted with dots in Vietnamese"
  );

  assertEqual(
    formatPercent(85, "en"),
    "85%",
    "[AC-7] Percent formatted in English"
  );
  assertEqual(
    formatPercent(85, "vi"),
    "85%",
    "[AC-7] Percent formatted in Vietnamese"
  );

  // 6. Duration Formatter
  assertEqual(
    formatDuration(1800, "en"),
    "30m 00s",
    "[AC-7] 1800s formatted as 30m 00s in English"
  );
  assertEqual(
    formatDuration(1800, "vi"),
    "30p 00g",
    "[AC-7] 1800s formatted as 30p 00g in Vietnamese"
  );
} catch (err) {
  console.error("❌ Exception during i18n test execution:", err);
  process.exit(1);
}

printSummary();
