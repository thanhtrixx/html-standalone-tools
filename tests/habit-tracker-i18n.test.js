#!/usr/bin/env node

/**
 * Atomic Habit Tracker Bilingual Lexicon & i18n Test Suite
 *
 * Domain: i18n & Localization
 * Covers:
 * - [AC-7] 100% Key Parity between English ('en') and Vietnamese ('vi') dictionaries
 * - [Issue #428 AC-1] All raw keys in Settings mapped to proper localized strings in both VI and EN dictionaries
 * - [Issue #428 AC-2] Bottom navigation bar tab titles dynamically update when switching between VI and EN
 * - [Issue #428 AC-3] System toast notifications, cloud sync messages, and confirmation dialogs full localization
 * - [Issue #428 AC-4] Zero unmapped / fallback keys across all views, and 100% dictionary parity between EN and VI
 */

const {
  TRANSLATIONS,
  t,
  formatNumber,
  formatPercent,
  formatDate,
  formatDuration,
} = require("../habit-tracker/src/i18n/translations.js");
const {
  createMockStorage,
  createHabitTrackerSandbox,
  createAssertions,
} = require("./helpers/habit-tracker-harness.js");

const { assert, assertEqual, printSummary } = createAssertions(
  "Atomic Habit Tracker i18n Parity Test Suite"
);

console.log("\n🧪 Running Atomic Habit Tracker i18n Parity Test Suite...\n");

async function runI18nTests() {
  // ==========================================
  // [AC-7] Baseline Dictionary Parity & Formatters
  // ==========================================
  console.log("--- [AC-7] Baseline Dictionary Parity & Lexicon ---");

  // 1. Dictionaries exist
  assert(
    TRANSLATIONS && TRANSLATIONS.en,
    "[AC-7] English ('en') translation dictionary is defined"
  );
  assert(
    TRANSLATIONS && TRANSLATIONS.vi,
    "[AC-7] Vietnamese ('vi') translation dictionary is defined"
  );

  const enKeys = Object.keys(TRANSLATIONS.en || {}).sort();
  const viKeys = Object.keys(TRANSLATIONS.vi || {}).sort();

  console.log(`  Dictionary Size: en=${enKeys.length}, vi=${viKeys.length}`);

  // 2. Check for missing keys in vi
  const missingInVi = enKeys.filter((k) => !(k in (TRANSLATIONS.vi || {})));
  assertEqual(
    missingInVi.length,
    0,
    `[AC-7] Zero missing keys in Vietnamese (Missing: ${missingInVi.join(", ") || "None"})`
  );

  // 3. Check for missing keys in en
  const missingInEn = viKeys.filter((k) => !(k in (TRANSLATIONS.en || {})));
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

  // ==========================================
  // [Issue #428 AC-1] Settings Raw Keys Localization
  // ==========================================
  console.log(
    "\n--- [Issue #428 AC-1] Settings Raw Keys Mapping & Localization ---"
  );

  const REQUIRED_SETTINGS_KEYS = [
    "settings_tab",
    "theme_select",
    "cloud_backup_title",
    "export_import_title",
    "export_json_btn",
    "import_json_btn",
    "check_updates_btn",
    "purge_cache_btn",
    "pwa_version",
    "theme_dark",
    "theme_light",
    "theme_system",
  ];

  for (const rawKey of REQUIRED_SETTINGS_KEYS) {
    assert(
      TRANSLATIONS.en &&
        typeof TRANSLATIONS.en[rawKey] === "string" &&
        TRANSLATIONS.en[rawKey].trim().length > 0,
      `[Issue #428 AC-1] Key '${rawKey}' is defined in English dictionary`
    );
    assert(
      TRANSLATIONS.vi &&
        typeof TRANSLATIONS.vi[rawKey] === "string" &&
        TRANSLATIONS.vi[rawKey].trim().length > 0,
      `[Issue #428 AC-1] Key '${rawKey}' is defined in Vietnamese dictionary`
    );
    assert(
      t(rawKey, {}, "en") !== rawKey,
      `[Issue #428 AC-1] English translation for '${rawKey}' is not the raw key identifier`
    );
    assert(
      t(rawKey, {}, "vi") !== rawKey,
      `[Issue #428 AC-1] Vietnamese translation for '${rawKey}' is not the raw key identifier`
    );
  }

  // Domain Glossary checks for Settings keys per CONTEXT.md & I18N.md
  assertEqual(
    t("settings_tab", {}, "vi"),
    "Cài đặt",
    "[Issue #428 AC-1] settings_tab translated to 'Cài đặt' in Vietnamese"
  );
  assertEqual(
    t("settings_tab", {}, "en"),
    "Settings",
    "[Issue #428 AC-1] settings_tab translated to 'Settings' in English"
  );

  assert(
    t("theme_select", {}, "vi").includes("Giao diện"),
    "[Issue #428 AC-1] theme_select translates to 'Giao diện' in Vietnamese"
  );
  assert(
    t("theme_select", {}, "en").includes("Theme") ||
      t("theme_select", {}, "en").includes("Appearance"),
    "[Issue #428 AC-1] theme_select translates to 'Theme' or 'Appearance' in English"
  );

  assert(
    t("cloud_backup_title", {}, "vi").includes("Sao lưu"),
    "[Issue #428 AC-1] cloud_backup_title matches I18N.md ('Sao lưu') in Vietnamese"
  );
  assert(
    t("cloud_backup_title", {}, "en").includes("Cloud Backup") ||
      t("cloud_backup_title", {}, "en").includes("Backup"),
    "[Issue #428 AC-1] cloud_backup_title contains 'Backup' in English"
  );

  assert(
    t("export_import_title", {}, "vi").includes("Xuất") &&
      t("export_import_title", {}, "vi").includes("Nhập"),
    "[Issue #428 AC-1] export_import_title contains 'Xuất' and 'Nhập' in Vietnamese"
  );
  assert(
    t("export_import_title", {}, "en").includes("Export") &&
      t("export_import_title", {}, "en").includes("Import"),
    "[Issue #428 AC-1] export_import_title contains 'Export' and 'Import' in English"
  );

  assert(
    t("export_json_btn", {}, "vi").includes("Xuất"),
    "[Issue #428 AC-1] export_json_btn contains 'Xuất' in Vietnamese"
  );
  assert(
    t("export_json_btn", {}, "en").includes("Export"),
    "[Issue #428 AC-1] export_json_btn contains 'Export' in English"
  );

  assert(
    t("import_json_btn", {}, "vi").includes("Nhập"),
    "[Issue #428 AC-1] import_json_btn contains 'Nhập' in Vietnamese"
  );
  assert(
    t("import_json_btn", {}, "en").includes("Import"),
    "[Issue #428 AC-1] import_json_btn contains 'Import' in English"
  );

  assert(
    t("check_updates_btn", {}, "vi").toLowerCase().includes("cập nhật"),
    "[Issue #428 AC-1] check_updates_btn contains 'cập nhật' in Vietnamese"
  );
  assert(
    t("check_updates_btn", {}, "en").toLowerCase().includes("update"),
    "[Issue #428 AC-1] check_updates_btn contains 'update' in English"
  );

  assert(
    t("purge_cache_btn", {}, "vi").toLowerCase().includes("đệm") ||
      t("purge_cache_btn", {}, "vi").toLowerCase().includes("cache") ||
      t("purge_cache_btn", {}, "vi").toLowerCase().includes("xóa") ||
      t("purge_cache_btn", {}, "vi").toLowerCase().includes("xoá"),
    "[Issue #428 AC-1] purge_cache_btn localized in Vietnamese"
  );
  assert(
    t("purge_cache_btn", {}, "en").toLowerCase().includes("cache") ||
      t("purge_cache_btn", {}, "en").toLowerCase().includes("purge") ||
      t("purge_cache_btn", {}, "en").toLowerCase().includes("clear"),
    "[Issue #428 AC-1] purge_cache_btn localized in English"
  );

  assert(
    t("pwa_version", {}, "vi").toLowerCase().includes("phiên bản") ||
      t("pwa_version", {}, "vi").includes("PWA"),
    "[Issue #428 AC-1] pwa_version contains 'Phiên bản' or 'PWA' in Vietnamese"
  );
  assert(
    t("pwa_version", {}, "en").toLowerCase().includes("version") ||
      t("pwa_version", {}, "en").includes("PWA"),
    "[Issue #428 AC-1] pwa_version contains 'Version' or 'PWA' in English"
  );

  assert(
    t("theme_dark", {}, "vi").includes("Tối"),
    "[Issue #428 AC-1] theme_dark contains 'Tối' in Vietnamese"
  );
  assert(
    t("theme_light", {}, "vi").includes("Sáng"),
    "[Issue #428 AC-1] theme_light contains 'Sáng' in Vietnamese"
  );
  assert(
    t("theme_system", {}, "vi").includes("Hệ thống"),
    "[Issue #428 AC-1] theme_system contains 'Hệ thống' in Vietnamese"
  );
  assert(
    t("theme_system", {}, "en").includes("System"),
    "[Issue #428 AC-1] theme_system contains 'System' in English"
  );

  // Integrated Settings Tab Render Verification
  const { sandbox: settingsSandbox, getOrCreateElement: getSettingsEl } =
    createHabitTrackerSandbox({
      lang: "vi",
    });
  await settingsSandbox.HabitApp.init();
  settingsSandbox.HabitApp.switchTab("settings");
  const mainContentVi = getSettingsEl("main-content").innerHTML || "";

  for (const rawKey of REQUIRED_SETTINGS_KEYS) {
    assert(
      !mainContentVi.includes(`\${i18n.t("${rawKey}"`) &&
        !mainContentVi.includes(`>${rawKey}<`),
      `[Issue #428 AC-1] Settings VI view does not leak unmapped key '${rawKey}' into HTML output`
    );
  }

  settingsSandbox.HabitApp.switchLanguage("en");
  settingsSandbox.HabitApp.switchTab("settings");
  const mainContentEn = getSettingsEl("main-content").innerHTML || "";

  for (const rawKey of REQUIRED_SETTINGS_KEYS) {
    assert(
      !mainContentEn.includes(`\${i18n.t("${rawKey}"`) &&
        !mainContentEn.includes(`>${rawKey}<`),
      `[Issue #428 AC-1] Settings EN view does not leak unmapped key '${rawKey}' into HTML output`
    );
  }

  // ==========================================
  // [Issue #428 AC-2] Dynamic Bottom Navigation Bar Tab Titles
  // ==========================================
  console.log(
    "\n--- [Issue #428 AC-2] Dynamic Bottom Navigation Tab Titles on Language Switch ---"
  );

  // Verify Tab Keys in Dictionary
  assertEqual(
    t("today_tab", {}, "vi"),
    "Hôm nay",
    "[Issue #428 AC-2] today_tab translation is 'Hôm nay' in VI"
  );
  assertEqual(
    t("today_tab", {}, "en"),
    "Today",
    "[Issue #428 AC-2] today_tab translation is 'Today' in EN"
  );
  assertEqual(
    t("insights_tab", {}, "vi"),
    "Thống kê",
    "[Issue #428 AC-2] insights_tab translation is 'Thống kê' in VI"
  );
  assertEqual(
    t("insights_tab", {}, "en"),
    "Insights",
    "[Issue #428 AC-2] insights_tab translation is 'Insights' in EN"
  );
  assertEqual(
    t("manager_tab", {}, "vi"),
    "Thói quen",
    "[Issue #428 AC-2] manager_tab translation is 'Thói quen' in VI per I18N.md"
  );
  assert(
    t("manager_tab", {}, "en") === "Habits" ||
      t("manager_tab", {}, "en") === "Manager",
    "[Issue #428 AC-2] manager_tab translation is 'Habits' or 'Manager' in EN"
  );
  assertEqual(
    t("settings_tab", {}, "vi"),
    "Cài đặt",
    "[Issue #428 AC-2] settings_tab translation is 'Cài đặt' in VI"
  );
  assertEqual(
    t("settings_tab", {}, "en"),
    "Settings",
    "[Issue #428 AC-2] settings_tab translation is 'Settings' in EN"
  );

  // Dynamic Navigation Dock Reactivity Test in Sandbox
  const { sandbox: navSandbox, getOrCreateElement: getNavEl } =
    createHabitTrackerSandbox({
      lang: "vi",
    });

  // Set up mock DOM dock buttons mirroring index.html
  const btnToday = getNavEl("nav-tab-today");
  btnToday.className = "nav-tab-btn";
  btnToday.setAttribute("data-tab", "today");
  btnToday.innerHTML = '<span>🔥</span><span class="nav-label">Hôm nay</span>';

  const btnInsights = getNavEl("nav-tab-insights");
  btnInsights.className = "nav-tab-btn";
  btnInsights.setAttribute("data-tab", "insights");
  btnInsights.innerHTML =
    '<span>📊</span><span class="nav-label">Thống kê</span>';

  const btnManager = getNavEl("nav-tab-manager");
  btnManager.className = "nav-tab-btn";
  btnManager.setAttribute("data-tab", "manager");
  btnManager.innerHTML =
    '<span>📋</span><span class="nav-label">Thói quen</span>';

  const btnSettings = getNavEl("nav-tab-settings");
  btnSettings.className = "nav-tab-btn";
  btnSettings.setAttribute("data-tab", "settings");
  btnSettings.innerHTML =
    '<span>⚙️</span><span class="nav-label">Cài đặt</span>';

  const langToggleBtn = getNavEl("lang-toggle-btn");
  langToggleBtn.textContent = "VI";

  await navSandbox.HabitApp.init();

  // 1. Check initial Vietnamese dock state
  assert(
    btnToday.textContent.includes("Hôm nay") ||
      btnToday.innerHTML.includes("Hôm nay"),
    "[Issue #428 AC-2] Today nav button displays 'Hôm nay' in Vietnamese mode"
  );
  assert(
    btnInsights.textContent.includes("Thống kê") ||
      btnInsights.innerHTML.includes("Thống kê"),
    "[Issue #428 AC-2] Insights nav button displays 'Thống kê' in Vietnamese mode"
  );
  assert(
    btnManager.textContent.includes("Thói quen") ||
      btnManager.innerHTML.includes("Thói quen"),
    "[Issue #428 AC-2] Manager nav button displays 'Thói quen' in Vietnamese mode"
  );
  assert(
    btnSettings.textContent.includes("Cài đặt") ||
      btnSettings.innerHTML.includes("Cài đặt"),
    "[Issue #428 AC-2] Settings nav button displays 'Cài đặt' in Vietnamese mode"
  );

  // 2. Switch language to English
  navSandbox.HabitApp.switchLanguage("en");

  assert(
    btnToday.textContent.includes("Today") ||
      btnToday.innerHTML.includes("Today"),
    "[Issue #428 AC-2] Today nav button updates dynamically to 'Today' in English mode"
  );
  assert(
    btnInsights.textContent.includes("Insights") ||
      btnInsights.innerHTML.includes("Insights"),
    "[Issue #428 AC-2] Insights nav button updates dynamically to 'Insights' in English mode"
  );
  assert(
    btnManager.textContent.includes("Habits") ||
      btnManager.textContent.includes("Manager") ||
      btnManager.innerHTML.includes("Habits") ||
      btnManager.innerHTML.includes("Manager"),
    "[Issue #428 AC-2] Manager nav button updates dynamically to 'Habits'/'Manager' in English mode"
  );
  assert(
    btnSettings.textContent.includes("Settings") ||
      btnSettings.innerHTML.includes("Settings"),
    "[Issue #428 AC-2] Settings nav button updates dynamically to 'Settings' in English mode"
  );

  // 3. Switch back to Vietnamese
  navSandbox.HabitApp.switchLanguage("vi");

  assert(
    btnToday.textContent.includes("Hôm nay") ||
      btnToday.innerHTML.includes("Hôm nay"),
    "[Issue #428 AC-2] Today nav button reverts dynamically to 'Hôm nay' on switching back to VI"
  );
  assert(
    btnInsights.textContent.includes("Thống kê") ||
      btnInsights.innerHTML.includes("Thống kê"),
    "[Issue #428 AC-2] Insights nav button reverts dynamically to 'Thống kê' on switching back to VI"
  );
  assert(
    btnManager.textContent.includes("Thói quen") ||
      btnManager.innerHTML.includes("Thói quen"),
    "[Issue #428 AC-2] Manager nav button reverts dynamically to 'Thói quen' on switching back to VI"
  );
  assert(
    btnSettings.textContent.includes("Cài đặt") ||
      btnSettings.innerHTML.includes("Cài đặt"),
    "[Issue #428 AC-2] Settings nav button reverts dynamically to 'Cài đặt' on switching back to VI"
  );

  // ==========================================
  // [Issue #428 AC-3] Toast Notifications, Sync Messages & Confirmation Localization
  // ==========================================
  console.log(
    "\n--- [Issue #428 AC-3] Toast Notifications & Confirmation Dialogs Localization ---"
  );

  const REQUIRED_TOAST_KEYS = [
    "toast_backup_exported",
    "toast_habit_deleted",
    "toast_notes_saved",
    "toast_habit_archived",
    "toast_habit_restored",
    "toast_gist_pat_required",
    "toast_update_checked",
    "delete_confirm_msg",
    "toast_habit_saved",
    "toast_habit_updated",
    "toast_freeze_token_added",
    "toast_vacation_enabled",
    "toast_vacation_disabled",
    "toast_import_success",
    "toast_drive_auth_required",
  ];

  for (const toastKey of REQUIRED_TOAST_KEYS) {
    assert(
      TRANSLATIONS.en &&
        typeof TRANSLATIONS.en[toastKey] === "string" &&
        TRANSLATIONS.en[toastKey].trim().length > 0,
      `[Issue #428 AC-3] Toast key '${toastKey}' is defined in English dictionary`
    );
    assert(
      TRANSLATIONS.vi &&
        typeof TRANSLATIONS.vi[toastKey] === "string" &&
        TRANSLATIONS.vi[toastKey].trim().length > 0,
      `[Issue #428 AC-3] Toast key '${toastKey}' is defined in Vietnamese dictionary`
    );
    assert(
      t(toastKey, {}, "en") !== toastKey,
      `[Issue #428 AC-3] English toast translation for '${toastKey}' is not raw key identifier`
    );
    assert(
      t(toastKey, {}, "vi") !== toastKey,
      `[Issue #428 AC-3] Vietnamese toast translation for '${toastKey}' is not raw key identifier`
    );
  }

  // Semantic assertions for Toast keys per AC-3 and domain requirements
  assert(
    t("toast_backup_exported", {}, "en").toLowerCase().includes("backup") ||
      t("toast_backup_exported", {}, "en").toLowerCase().includes("export") ||
      t("toast_backup_exported", {}, "en").includes("JSON"),
    "[Issue #428 AC-3] toast_backup_exported contains 'backup' or 'export' or 'JSON' in English"
  );
  assert(
    t("toast_backup_exported", {}, "vi").toLowerCase().includes("sao lưu") ||
      t("toast_backup_exported", {}, "vi").toLowerCase().includes("xuất") ||
      t("toast_backup_exported", {}, "vi").includes("JSON"),
    "[Issue #428 AC-3] toast_backup_exported contains 'sao lưu' or 'xuất' in Vietnamese"
  );

  assert(
    t("toast_habit_deleted", {}, "en").toLowerCase().includes("deleted"),
    "[Issue #428 AC-3] toast_habit_deleted contains 'deleted' in English"
  );
  assert(
    t("toast_habit_deleted", {}, "vi").toLowerCase().includes("xóa") ||
      t("toast_habit_deleted", {}, "vi").toLowerCase().includes("xoá"),
    "[Issue #428 AC-3] toast_habit_deleted contains 'xóa' in Vietnamese"
  );

  assert(
    t("toast_notes_saved", {}, "en").toLowerCase().includes("note") &&
      t("toast_notes_saved", {}, "en").toLowerCase().includes("saved"),
    "[Issue #428 AC-3] toast_notes_saved contains 'note' and 'saved' in English"
  );
  assert(
    t("toast_notes_saved", {}, "vi").toLowerCase().includes("ghi chú"),
    "[Issue #428 AC-3] toast_notes_saved contains 'ghi chú' in Vietnamese"
  );

  assert(
    t("toast_habit_archived", {}, "en").toLowerCase().includes("archived"),
    "[Issue #428 AC-3] toast_habit_archived contains 'archived' in English"
  );
  assert(
    t("toast_habit_archived", {}, "vi").toLowerCase().includes("lưu trữ"),
    "[Issue #428 AC-3] toast_habit_archived contains 'lưu trữ' in Vietnamese"
  );

  assert(
    t("toast_habit_restored", {}, "en").toLowerCase().includes("restored"),
    "[Issue #428 AC-3] toast_habit_restored contains 'restored' in English"
  );
  assert(
    t("toast_habit_restored", {}, "vi").toLowerCase().includes("khôi phục"),
    "[Issue #428 AC-3] toast_habit_restored contains 'khôi phục' in Vietnamese"
  );

  assert(
    t("toast_gist_pat_required", {}, "en").includes("PAT") ||
      t("toast_gist_pat_required", {}, "en").includes("Token") ||
      t("toast_gist_pat_required", {}, "en").includes("Gist"),
    "[Issue #428 AC-3] toast_gist_pat_required contains 'PAT' or 'Token' or 'Gist' in English"
  );
  assert(
    t("toast_gist_pat_required", {}, "vi").includes("PAT") ||
      t("toast_gist_pat_required", {}, "vi").includes("Token") ||
      t("toast_gist_pat_required", {}, "vi").includes("Gist"),
    "[Issue #428 AC-3] toast_gist_pat_required contains 'PAT' or 'Token' or 'Gist' in Vietnamese"
  );

  assert(
    t("toast_update_checked", {}, "en").toLowerCase().includes("update") ||
      t("toast_update_checked", {}, "en").toLowerCase().includes("version") ||
      t("toast_update_checked", {}, "en").toLowerCase().includes("latest"),
    "[Issue #428 AC-3] toast_update_checked contains update verification in English"
  );
  assert(
    t("toast_update_checked", {}, "vi").toLowerCase().includes("cập nhật") ||
      t("toast_update_checked", {}, "vi").toLowerCase().includes("phiên bản"),
    "[Issue #428 AC-3] toast_update_checked contains update verification in Vietnamese"
  );

  assert(
    t("delete_confirm_msg", {}, "en").toLowerCase().includes("delete") ||
      t("delete_confirm_msg", {}, "en").toLowerCase().includes("permanently"),
    "[Issue #428 AC-3] delete_confirm_msg contains deletion confirmation in English"
  );
  assert(
    t("delete_confirm_msg", {}, "vi").toLowerCase().includes("xóa") ||
      t("delete_confirm_msg", {}, "vi").toLowerCase().includes("xoá"),
    "[Issue #428 AC-3] delete_confirm_msg contains deletion confirmation in Vietnamese"
  );

  // Parameterized toast formatting
  assertEqual(
    t("toast_freeze_token_added", { count: 3 }, "en"),
    "Added 3 streak freeze tokens!",
    "[Issue #428 AC-3] toast_freeze_token_added interpolates count in English"
  );
  assert(
    t("toast_freeze_token_added", { count: 3 }, "vi").includes("3"),
    "[Issue #428 AC-3] toast_freeze_token_added interpolates count in Vietnamese"
  );

  // Integrated Toast Trigger Localization in Sandbox
  const { sandbox: toastSandbox, getOrCreateElement: getToastEl } =
    createHabitTrackerSandbox({
      lang: "en",
    });
  // Prevent immediate auto-dismissal in synchronous test environment
  toastSandbox.setTimeout = (fn, ms) => 1;

  await toastSandbox.HabitApp.init();
  toastSandbox.HabitApp.switchLanguage("en");

  const toastContainer = getToastEl("toast-container");

  // 1. Test Archive Habit Toast in English
  await toastSandbox.HabitApp.handleArchiveHabit("h-read");
  let lastToast =
    toastContainer.children &&
    toastContainer.children[toastContainer.children.length - 1];
  assert(
    Boolean(
      lastToast && lastToast.textContent.toLowerCase().includes("archived")
    ),
    "[Issue #428 AC-3] Habit archive action triggers localized English toast"
  );
  assert(
    Boolean(!lastToast || !lastToast.textContent.includes("Đã lưu trữ")),
    "[Issue #428 AC-3] Habit archive action does not use hardcoded Vietnamese string in English mode"
  );

  // 2. Test Restore Habit Toast in English
  await toastSandbox.HabitApp.handleRestoreHabit("h-read");
  lastToast =
    toastContainer.children &&
    toastContainer.children[toastContainer.children.length - 1];
  assert(
    Boolean(
      lastToast && lastToast.textContent.toLowerCase().includes("restored")
    ),
    "[Issue #428 AC-3] Habit restore action triggers localized English toast"
  );
  assert(
    Boolean(!lastToast || !lastToast.textContent.includes("Đã khôi phục")),
    "[Issue #428 AC-3] Habit restore action does not use hardcoded Vietnamese string in English mode"
  );

  // 3. Test Delete Habit Confirmation & Toast in English
  let confirmPromptMessage = null;
  toastSandbox.confirm = (msg) => {
    confirmPromptMessage = msg;
    return false; // User cancels deletion
  };

  const initialHabitCount = toastSandbox.HabitApp.store.getHabits(false).length;
  await toastSandbox.HabitApp.handleDeleteHabit("h-read");
  assertEqual(
    confirmPromptMessage,
    t("delete_confirm_msg", {}, "en"),
    "[Issue #428 AC-3] Habit delete triggers confirmation dialog with localized English message"
  );
  assertEqual(
    toastSandbox.HabitApp.store.getHabits(false).length,
    initialHabitCount,
    "[Issue #428 AC-3] Habit is not deleted when user cancels confirmation dialog"
  );

  // Confirm deletion
  toastSandbox.confirm = (msg) => true;
  await toastSandbox.HabitApp.handleDeleteHabit("h-read");
  lastToast =
    toastContainer.children &&
    toastContainer.children[toastContainer.children.length - 1];
  assert(
    Boolean(
      lastToast && lastToast.textContent.toLowerCase().includes("deleted")
    ),
    "[Issue #428 AC-3] Habit delete action triggers localized English toast after confirmation"
  );
  assert(
    Boolean(
      !lastToast ||
      (!lastToast.textContent.includes("Đã xoá") &&
        !lastToast.textContent.includes("Đã xóa"))
    ),
    "[Issue #428 AC-3] Habit delete action does not use hardcoded Vietnamese string in English mode"
  );

  // 4. Test Save Notes Toast in English
  await toastSandbox.HabitApp.handleSaveNotes(
    "h-water",
    "2026-09-12",
    "Drink 2.5L completed"
  );
  lastToast =
    toastContainer.children &&
    toastContainer.children[toastContainer.children.length - 1];
  assert(
    Boolean(
      lastToast &&
      (lastToast.textContent.toLowerCase().includes("note") ||
        lastToast.textContent.toLowerCase().includes("saved"))
    ),
    "[Issue #428 AC-3] Save notes action triggers localized English toast"
  );

  // 5. Test Cloud Gist / Drive Toast prompts in English
  toastSandbox.HabitApp.promptGistBackup();
  lastToast =
    toastContainer.children &&
    toastContainer.children[toastContainer.children.length - 1];
  assert(
    Boolean(
      lastToast &&
      (lastToast.textContent.includes("PAT") ||
        lastToast.textContent.includes("Token") ||
        lastToast.textContent.includes("Gist") ||
        lastToast.textContent.toLowerCase().includes("settings"))
    ),
    "[Issue #428 AC-3] Gist cloud backup prompt triggers localized English toast"
  );
  assert(
    Boolean(
      !lastToast || !lastToast.textContent.includes("Vui lòng thiết lập")
    ),
    "[Issue #428 AC-3] Gist prompt does not use hardcoded Vietnamese text in English mode"
  );

  toastSandbox.HabitApp.promptDriveBackup();
  lastToast =
    toastContainer.children &&
    toastContainer.children[toastContainer.children.length - 1];
  assert(
    Boolean(
      lastToast &&
      (lastToast.textContent.includes("Drive") ||
        lastToast.textContent.includes("Client ID") ||
        lastToast.textContent.toLowerCase().includes("settings"))
    ),
    "[Issue #428 AC-3] Google Drive backup prompt triggers localized English toast"
  );

  // 6. Test JSON Export Toast in English
  toastSandbox.HabitApp.exportDataJSON();
  lastToast =
    toastContainer.children &&
    toastContainer.children[toastContainer.children.length - 1];
  assert(
    Boolean(
      lastToast &&
      (lastToast.textContent.toLowerCase().includes("backup") ||
        lastToast.textContent.toLowerCase().includes("exported") ||
        lastToast.textContent.toLowerCase().includes("downloaded") ||
        lastToast.textContent.includes("JSON"))
    ),
    "[Issue #428 AC-3] Export JSON action triggers localized English toast"
  );

  // ==========================================
  // [Issue #428 AC-4] Zero Unmapped / Fallback Keys & 100% Dictionary Parity
  // ==========================================
  console.log(
    "\n--- [Issue #428 AC-4] Zero Unmapped Keys & 100% Dictionary Parity ---"
  );

  // 1. Strict Bi-directional Key Parity
  const allEnKeys = Object.keys(TRANSLATIONS.en || {}).sort();
  const allViKeys = Object.keys(TRANSLATIONS.vi || {}).sort();

  const missingInViStrict = allEnKeys.filter(
    (k) => !(k in (TRANSLATIONS.vi || {}))
  );
  const missingInEnStrict = allViKeys.filter(
    (k) => !(k in (TRANSLATIONS.en || {}))
  );

  assertEqual(
    missingInViStrict.length,
    0,
    `[Issue #428 AC-4] 100% Key Parity: Zero missing keys in Vietnamese dictionary (Missing: ${missingInViStrict.join(", ") || "None"})`
  );
  assertEqual(
    missingInEnStrict.length,
    0,
    `[Issue #428 AC-4] 100% Key Parity: Zero missing keys in English dictionary (Missing: ${missingInEnStrict.join(", ") || "None"})`
  );

  // 2. Dictionary Health & Non-empty Values
  for (const k of allEnKeys) {
    const val = TRANSLATIONS.en[k];
    assert(
      typeof val === "string" && val.trim().length > 0,
      `[Issue #428 AC-4] English key '${k}' has non-empty string value`
    );
    assert(
      typeof val === "string" &&
        !val.includes("{undefined}") &&
        !val.includes("[object Object]"),
      `[Issue #428 AC-4] English key '${k}' has no corrupt interpolation tags`
    );
    assert(
      /^[a-z0-9_]+$/.test(k),
      `[Issue #428 AC-4] English key '${k}' adheres to snake_case naming convention`
    );
  }

  for (const k of allViKeys) {
    const val = TRANSLATIONS.vi[k];
    assert(
      typeof val === "string" && val.trim().length > 0,
      `[Issue #428 AC-4] Vietnamese key '${k}' has non-empty string value`
    );
    assert(
      typeof val === "string" &&
        !val.includes("{undefined}") &&
        !val.includes("[object Object]"),
      `[Issue #428 AC-4] Vietnamese key '${k}' has no corrupt interpolation tags`
    );
    assert(
      /^[a-z0-9_]+$/.test(k),
      `[Issue #428 AC-4] Vietnamese key '${k}' adheres to snake_case naming convention`
    );
  }

  // 3. Automated View Template Scan for Zero Unmapped / Leaked Keys
  const storageModule = require("../habit-tracker/src/storage/indexeddb.js");
  const { HabitStore } = require("../habit-tracker/src/state/store.js");
  const todayView = require("../habit-tracker/src/ui/today-view.js");
  const managerView = require("../habit-tracker/src/ui/manager-view.js");
  const detailSheet = require("../habit-tracker/src/ui/detail-sheet.js");
  const insightsView = require("../habit-tracker/src/ui/insights-view.js");

  const storage = storageModule.createStorageAdapter({ forceFallback: true });
  const testStore = new HabitStore({ storage });
  await testStore.init();

  const sampleHabit = {
    id: "h-test-parity",
    name: "Parity Test Habit",
    type: "numeric",
    targetValue: 2000,
    unit: "steps",
    step: 500,
    routine: "morning",
    scheduleType: "daily",
    color: "emerald",
    icon: "🚶",
  };
  await testStore.addHabit(sampleHabit);

  const rawKeyLeakRegex =
    /\b(app_title|settings_tab|theme_select|cloud_backup_title|export_import_title|export_json_btn|import_json_btn|check_updates_btn|purge_cache_btn|pwa_version|theme_dark|theme_light|theme_system|routine_[a-z]+|type_[a-z]+|milestone_[0-9a-z]+|freq_[a-z]+|toast_[a-z_]+|delete_confirm_msg)\b/;

  for (const lang of ["en", "vi"]) {
    const mockContainer = { innerHTML: "", className: "", style: {} };

    // Today Dashboard
    todayView.renderTodayDashboard(testStore, mockContainer, lang);
    assert(
      !mockContainer.innerHTML.includes("undefined") &&
        !mockContainer.innerHTML.includes("NaN"),
      `[Issue #428 AC-4] Today View (${lang}) contains no 'undefined' or 'NaN'`
    );
    assert(
      !rawKeyLeakRegex.test(mockContainer.innerHTML),
      `[Issue #428 AC-4] Today View (${lang}) has zero leaked unmapped translation keys`
    );

    // Insights View
    insightsView.renderInsightsView(testStore, mockContainer, lang);
    assert(
      !mockContainer.innerHTML.includes("undefined") &&
        !mockContainer.innerHTML.includes("NaN"),
      `[Issue #428 AC-4] Insights View (${lang}) contains no 'undefined' or 'NaN'`
    );
    assert(
      !rawKeyLeakRegex.test(mockContainer.innerHTML),
      `[Issue #428 AC-4] Insights View (${lang}) has zero leaked unmapped translation keys`
    );

    // Manager View
    managerView.renderManagerView(testStore, mockContainer, lang);
    assert(
      !mockContainer.innerHTML.includes("undefined") &&
        !mockContainer.innerHTML.includes("NaN"),
      `[Issue #428 AC-4] Manager View (${lang}) contains no 'undefined' or 'NaN'`
    );
    assert(
      !rawKeyLeakRegex.test(mockContainer.innerHTML),
      `[Issue #428 AC-4] Manager View (${lang}) has zero leaked unmapped translation keys`
    );

    // Habit Edit Modal
    const modalHtml = managerView.renderHabitEditModal(sampleHabit, lang);
    assert(
      !modalHtml.includes("undefined") && !modalHtml.includes("NaN"),
      `[Issue #428 AC-4] Habit Edit Modal (${lang}) contains no 'undefined' or 'NaN'`
    );
    assert(
      !rawKeyLeakRegex.test(modalHtml),
      `[Issue #428 AC-4] Habit Edit Modal (${lang}) has zero leaked unmapped translation keys`
    );

    // Habit Detail Sheet
    const sheetContainer = { innerHTML: "" };
    detailSheet.renderDetailSheet(
      sampleHabit,
      testStore,
      sheetContainer,
      lang,
      "2026-09-12"
    );
    assert(
      !sheetContainer.innerHTML.includes("undefined") &&
        !sheetContainer.innerHTML.includes("NaN"),
      `[Issue #428 AC-4] Detail Sheet (${lang}) contains no 'undefined' or 'NaN'`
    );
    assert(
      !rawKeyLeakRegex.test(sheetContainer.innerHTML),
      `[Issue #428 AC-4] Detail Sheet (${lang}) has zero leaked unmapped translation keys`
    );
  }

  // 4. Adversarial Edge Cases in t() & Formatters
  assertEqual(
    t("unknown_nonexistent_key_xyz", {}, "vi"),
    "unknown_nonexistent_key_xyz",
    "[Issue #428 AC-4] Non-existent key gracefully returns key fallback without throwing"
  );
  assertEqual(
    t("app_title", {}, "unsupported_locale_xyz"),
    "Theo Dõi Thói Quen Hàng Ngày",
    "[Issue #428 AC-4] Unsupported locale code gracefully falls back to default Vietnamese translation"
  );
  assertEqual(
    t("app_title", null, "en"),
    "Atomic Habit & Routine Tracker",
    "[Issue #428 AC-4] null params object handled safely in t()"
  );
  assertEqual(
    t("streak_days_count", { count: 10, unusedExtra: "foo" }, "en"),
    "10 days streak",
    "[Issue #428 AC-4] Extra unused params in t() do not cause corrupt string formatting"
  );

  assertEqual(
    formatNumber(0, "vi"),
    "0",
    "[Issue #428 AC-4] formatNumber(0, 'vi') returns '0'"
  );
  assertEqual(
    formatNumber(NaN, "vi"),
    "0",
    "[Issue #428 AC-4] formatNumber(NaN, 'vi') handles invalid input gracefully"
  );
  assertEqual(
    formatNumber(null, "en"),
    "0",
    "[Issue #428 AC-4] formatNumber(null, 'en') handles null input gracefully"
  );

  assertEqual(
    formatPercent(0, "vi"),
    "0%",
    "[Issue #428 AC-4] formatPercent(0, 'vi') returns '0%'"
  );
  assertEqual(
    formatPercent(NaN, "en"),
    "0%",
    "[Issue #428 AC-4] formatPercent(NaN, 'en') handles NaN gracefully"
  );

  assertEqual(
    formatDate("invalid-date-string-xyz", "vi"),
    "",
    "[Issue #428 AC-4] formatDate with invalid date string returns empty string without crashing"
  );

  assertEqual(
    formatDuration(-10, "vi"),
    "00p 00g",
    "[Issue #428 AC-4] formatDuration handles negative seconds gracefully"
  );
  assertEqual(
    formatDuration(0, "en"),
    "00m 00s",
    "[Issue #428 AC-4] formatDuration(0, 'en') returns '00m 00s'"
  );
  assertEqual(
    formatDuration(NaN, "vi"),
    "00p 00g",
    "[Issue #428 AC-4] formatDuration(NaN, 'vi') returns '00p 00g'"
  );
}

runI18nTests()
  .then(() => {
    printSummary();
  })
  .catch((err) => {
    console.error("❌ Exception during i18n test execution:", err);
    process.exit(1);
  });
