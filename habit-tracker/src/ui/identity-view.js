/**
 * Atomic Habit Tracker Identity & Life Domains Lens View
 *
 * Implements:
 * - Segmented Sub-View Switcher (My Habits Catalog vs Identity Pillars & Starter Kits)
 * - Life Domain Alignment Cards (Health, Mind, Craft, Discipline) with Neon Glow
 * - Curated 1-Click Starter Kits Horizontal Carousel (Morning Mastery, Deep Focus, Health, Zen)
 * - Comprehensive Habit Catalog Management (Add, Edit, Reorder, Archive, Delete)
 * - 3-Step First-Run Identity Setup Wizard
 */

(function (global) {
  "use strict";

  const engine =
    typeof require !== "undefined"
      ? require("../domain/engine.js")
      : global.HabitEngine;

  const i18n =
    typeof require !== "undefined"
      ? require("../i18n/translations.js")
      : global.Habiti18n;

  const components =
    typeof require !== "undefined"
      ? require("./components.js")
      : global.HabitComponents;

  const managerView =
    typeof require !== "undefined"
      ? require("./manager-view.js")
      : global.HabitManagerView;

  /**
   * Renders Life Domain Hub Cards
   */
  function renderLifeDomainsSection(habits = [], logs = {}, lang = "vi") {
    const domainKeys = ["health", "mind", "craft", "discipline"];
    const domainMeta = {
      health: {
        titleKey: "domain_health",
        icon: "🌿",
        color: "emerald",
        hex: "#10b981",
        glow: "rgba(16, 185, 129, 0.25)",
      },
      mind: {
        titleKey: "domain_mind",
        icon: "🧠",
        color: "violet",
        hex: "#8b5cf6",
        glow: "rgba(139, 92, 246, 0.25)",
      },
      craft: {
        titleKey: "domain_craft",
        icon: "💻",
        color: "cyan",
        hex: "#06b6d4",
        glow: "rgba(6, 182, 212, 0.25)",
      },
      discipline: {
        titleKey: "domain_discipline",
        icon: "⚡",
        color: "amber",
        hex: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.25)",
      },
    };

    const cardsHtml = domainKeys
      .map((dKey) => {
        const meta = domainMeta[dKey];
        const domainHabits = habits.filter(
          (h) => (h.domain || "health") === dKey && !h.archived
        );
        const title = i18n.t(meta.titleKey, {}, lang);

        let totalCompletions = 0;
        let totalScheduled = 0;
        domainHabits.forEach((h) => {
          for (const k in logs) {
            if (logs[k].habitId === h.id) {
              totalScheduled++;
              if (logs[k].completed) totalCompletions++;
            }
          }
        });

        const rate =
          totalScheduled > 0
            ? Math.round((totalCompletions / totalScheduled) * 100)
            : 0;

        const ringHtml = components.renderSvgProgressRing(
          22,
          3.5,
          rate,
          meta.hex
        );

        return `
          <div class="life-domain-card domain-card bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800/80 shadow-md flex items-center justify-between transition-all hover:border-emerald-500/40" style="box-shadow: 0 4px 20px -2px ${meta.glow};">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                ${meta.icon}
              </div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white text-base leading-snug">${title}</h4>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">${domainHabits.length} thói quen</span>
                  <span class="text-slate-300 dark:text-slate-700">&bull;</span>
                  <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">${rate}%</span>
                </div>
              </div>
            </div>
            <div class="shrink-0 flex items-center justify-center">
              ${ringHtml}
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <div class="life-domains-section mb-6">
        <div class="mb-3 px-1 flex items-center justify-between">
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white tracking-tight">4 Trụ Cột Bản Sắc</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cân bằng phát triển bản thân theo phương pháp Atomic Habits</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renders Curated 1-Click Starter Kits Section with Horizontal Scroll Carousel
   */
  function renderStarterKitsSection(lang = "vi") {
    const kits = engine.STARTER_KITS || [];
    if (kits.length === 0) return "";

    const cardsHtml = kits
      .map((kit) => {
        const title = i18n.t(kit.titleKey, {}, lang);
        const desc = i18n.t(kit.descKey, {}, lang);
        const habitPills = kit.habits
          .map((h) => {
            const hName =
              lang === "vi" && h.nameVi ? h.nameVi : h.nameEn || h.name;
            return `<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700/40">${h.icon || "🎯"} ${hName}</span>`;
          })
          .join("");

        return `
          <div class="starter-kit-card min-w-[260px] sm:min-w-[280px] max-w-[300px] shrink-0 snap-start bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-4.5 border border-slate-200 dark:border-slate-800/80 shadow-lg flex flex-col justify-between transition-all hover:border-emerald-500/50">
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">${kit.icon}</span>
                  <div>
                    <h4 class="font-black text-slate-900 dark:text-white text-sm leading-tight">${title}</h4>
                    <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider font-mono">${kit.habits.length} Habits</span>
                  </div>
                </div>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-400 mb-2.5 leading-relaxed line-clamp-2">${desc}</p>
              <div class="flex flex-wrap gap-1 mb-3">
                ${habitPills}
              </div>
            </div>

            <button
              type="button"
              data-action="apply-starter-kit"
              data-kit-id="${kit.id}"
              class="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-emerald-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>⚡</span>
              <span>${i18n.t("apply_starter_kit", {}, lang)}</span>
            </button>
          </div>
        `;
      })
      .join("");

    return `
      <div class="starter-kits-section mb-6">
        <div class="mb-3 px-1 flex items-center justify-between">
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white tracking-tight">${i18n.t("starter_kits_title", {}, lang)}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${i18n.t("starter_kits_subtitle", {}, lang)}</p>
          </div>
        </div>
        <div class="flex gap-3 overflow-x-auto pb-2.5 snap-x no-scrollbar">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renders the 3-step First-Run Identity Setup Wizard modal HTML
   */
  function renderIdentityWizardModal(
    step = 1,
    selectedKitId = ["morning-mastery"],
    lang = "vi"
  ) {
    const kitIds = Array.isArray(selectedKitId)
      ? selectedKitId
      : [selectedKitId || "morning-mastery"];

    const domainMeta = [
      {
        key: "health",
        titleKey: "domain_health",
        descKey: "wizard_domain_health_desc",
        icon: "🌿",
        hex: "#10b981",
      },
      {
        key: "mind",
        titleKey: "domain_mind",
        descKey: "wizard_domain_mind_desc",
        icon: "🧠",
        hex: "#8b5cf6",
      },
      {
        key: "craft",
        titleKey: "domain_craft",
        descKey: "wizard_domain_craft_desc",
        icon: "💻",
        hex: "#06b6d4",
      },
      {
        key: "discipline",
        titleKey: "domain_discipline",
        descKey: "wizard_domain_discipline_desc",
        icon: "⚡",
        hex: "#f59e0b",
      },
    ];

    const kits = engine.STARTER_KITS || [];

    // Progress Dots (4 Steps)
    const stepIndicators = [1, 2, 3, 4]
      .map((s) => {
        const isActive = s === step;
        const isDone = s < step;
        return `
          <div class="flex items-center gap-1.5">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              isActive
                ? "bg-emerald-500 text-emerald-950 font-black ring-4 ring-emerald-500/20 scale-110"
                : isDone
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
            }">
              ${isDone ? "✓" : s}
            </div>
            ${
              s < 4
                ? `<div class="w-6 sm:w-10 h-0.5 rounded-full ${
                    s < step
                      ? "bg-emerald-500"
                      : "bg-slate-200 dark:bg-slate-800"
                  }"></div>`
                : ""
            }
          </div>
        `;
      })
      .join("");

    let stepContentHtml = "";

    if (step === 1) {
      // Step 1: Language Selection
      const isVi = lang === "vi";
      stepContentHtml = `
        <div class="space-y-4">
          <div class="text-center sm:text-left mb-2">
            <h3 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">${i18n.t("wizard_step_lang_title", {}, lang)}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${i18n.t("wizard_step_lang_desc", {}, lang)}</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <!-- Vietnamese option -->
            <div
              data-action="wizard-select-lang"
              data-lang="vi"
              class="wizard-lang-option p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                isVi
                  ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600"
              }"
            >
              <div class="flex items-center gap-3.5">
                <span class="text-3xl select-none">🇻🇳</span>
                <div>
                  <h4 class="font-bold text-slate-900 dark:text-white text-sm">${i18n.t("wizard_lang_vi_title", {}, lang)}</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${i18n.t("wizard_lang_vi_desc", {}, lang)}</p>
                </div>
              </div>
              <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                isVi
                  ? "border-emerald-500 bg-emerald-500 text-emerald-950 font-black text-xs"
                  : "border-slate-400"
              }">
                ${isVi ? "✓" : ""}
              </div>
            </div>

            <!-- English option -->
            <div
              data-action="wizard-select-lang"
              data-lang="en"
              class="wizard-lang-option p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                !isVi
                  ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600"
              }"
            >
              <div class="flex items-center gap-3.5">
                <span class="text-3xl select-none">🇺🇸</span>
                <div>
                  <h4 class="font-bold text-slate-900 dark:text-white text-sm">${i18n.t("wizard_lang_en_title", {}, lang)}</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${i18n.t("wizard_lang_en_desc", {}, lang)}</p>
                </div>
              </div>
              <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                !isVi
                  ? "border-emerald-500 bg-emerald-500 text-emerald-950 font-black text-xs"
                  : "border-slate-400"
              }">
                ${!isVi ? "✓" : ""}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (step === 2) {
      // Step 2: 4 Life Pillars
      const domainCards = domainMeta
        .map((dm) => {
          return `
            <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3 transition-all hover:border-emerald-500/40">
              <span class="text-2xl p-2 rounded-xl bg-white dark:bg-slate-800 shrink-0 shadow-sm">${dm.icon}</span>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white text-sm leading-tight">${i18n.t(dm.titleKey, {}, lang)}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">${i18n.t(dm.descKey, {}, lang)}</p>
              </div>
            </div>
          `;
        })
        .join("");

      stepContentHtml = `
        <div class="space-y-4">
          <div class="text-center sm:text-left mb-2">
            <h3 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">${i18n.t("wizard_step_1_title", {}, lang)}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${i18n.t("wizard_step_1_desc", {}, lang)}</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${domainCards}
          </div>
        </div>
      `;
    } else if (step === 3) {
      // Step 3: Starter Kits Multi-Select
      const kitCards = kits
        .map((kit) => {
          const isSelected =
            kitIds.includes(kit.id) ||
            kitIds.includes(kit.id.replace(/-/g, "_")) ||
            kitIds.includes(kit.id.replace(/_/g, "-"));
          const title = i18n.t(kit.titleKey, {}, lang);
          const desc = i18n.t(kit.descKey, {}, lang);
          const habitPills = kit.habits
            .map((h) => {
              const hName =
                lang === "vi" && h.nameVi ? h.nameVi : h.nameEn || h.name;
              return `<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">${h.icon || "🎯"} ${hName}</span>`;
            })
            .join("");

          return `
            <div
              data-action="wizard-select-kit"
              data-kit-id="${kit.id}"
              class="starter-kit-option block p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600"
              }"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">${kit.icon}</span>
                  <div>
                    <h4 class="font-bold text-slate-900 dark:text-white text-sm">${title}</h4>
                    <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase">${kit.habits.length} Habits</span>
                  </div>
                </div>
                <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500 text-emerald-950 font-bold text-xs"
                    : "border-slate-400"
                }">
                  ${isSelected ? "✓" : ""}
                </div>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">${desc}</p>
              <div class="flex flex-wrap gap-1">
                ${habitPills}
              </div>
            </div>
          `;
        })
        .join("");

      stepContentHtml = `
        <div class="space-y-3">
          <div class="text-center sm:text-left mb-2">
            <h3 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">${i18n.t("wizard_step_2_title", {}, lang)}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${i18n.t("wizard_step_2_desc", {}, lang)}</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
            ${kitCards}
          </div>
        </div>
      `;
    } else {
      // Step 4: Ready to Build Atomic Habits (Multi-Kit aggregation with numbered disambiguation)
      const selectedKits = kits.filter(
        (k) =>
          kitIds.includes(k.id) ||
          kitIds.includes(k.id.replace(/-/g, "_")) ||
          kitIds.includes(k.id.replace(/_/g, "-"))
      );
      const chosenKits = selectedKits.length > 0 ? selectedKits : [kits[0]];
      const kitTitles = chosenKits
        .map((k) => i18n.t(k.titleKey, {}, lang))
        .join(", ");

      const nameCounts = {};
      const aggregatedHabits = [];
      for (const k of chosenKits) {
        for (const h of k.habits) {
          let baseName =
            lang === "vi" && h.nameVi ? h.nameVi : h.nameEn || h.name;
          nameCounts[baseName] = (nameCounts[baseName] || 0) + 1;
          const disambiguatedName =
            nameCounts[baseName] > 1
              ? `${baseName} (${nameCounts[baseName]})`
              : baseName;
          aggregatedHabits.push({
            ...h,
            displayName: disambiguatedName,
          });
        }
      }

      const habitItems = aggregatedHabits
        .map((h) => {
          return `
            <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span class="text-2xl">${h.icon || "🎯"}</span>
              <div class="flex-1 min-w-0">
                <h5 class="font-bold text-slate-900 dark:text-white text-sm truncate">${h.displayName}</h5>
                <span class="text-xs text-slate-500 dark:text-slate-400">${i18n.t(`routine_${h.routine || "morning"}`, {}, lang)} &bull; ${i18n.t(`domain_${h.domain || "health"}`, {}, lang)}</span>
              </div>
              <span class="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Ready</span>
            </div>
          `;
        })
        .join("");

      stepContentHtml = `
        <div class="space-y-4">
          <div class="text-center mb-2">
            <div class="text-4xl mb-2">🚀</div>
            <h3 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">${i18n.t("wizard_step_3_title", {}, lang)}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">${i18n.t("wizard_step_3_desc", {}, lang)}</p>
          </div>

          <div class="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Selected Starter Pack${chosenKits.length > 1 ? "s" : ""}:</span>
              <span class="text-xs font-bold text-slate-900 dark:text-white">${kitTitles}</span>
            </div>
            <div class="space-y-2 mt-3 max-h-[36vh] overflow-y-auto pr-1">
              ${habitItems}
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div id="identity-wizard-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity" role="dialog" aria-modal="true" aria-labelledby="wizard-modal-title">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 w-full max-w-xl shadow-2xl transition-transform text-slate-900 dark:text-white">
          <!-- Wizard Header -->
          <div class="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">Atomic System</span>
              <h2 id="wizard-modal-title" class="text-lg font-black text-slate-900 dark:text-white tracking-tight">${i18n.t("wizard_title", {}, lang)}</h2>
            </div>
            <button
              type="button"
              data-action="wizard-skip"
              class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 transition cursor-pointer"
            >
              ${i18n.t("wizard_btn_skip", {}, lang)} ✕
            </button>
          </div>

          <!-- Progress Stepper -->
          <div class="flex items-center justify-center mb-6">
            ${stepIndicators}
          </div>

          <!-- Dynamic Step Content -->
          <div id="wizard-step-container" class="min-h-[260px]">
            ${stepContentHtml}
          </div>

          <!-- Wizard Footer Controls -->
          <div class="flex items-center justify-between gap-3 pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
            <div>
              ${
                step > 1
                  ? `<button
                      type="button"
                      data-action="wizard-prev-step"
                      class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      ◀ ${i18n.t("wizard_btn_back", {}, lang)}
                    </button>`
                  : ""
              }
            </div>

            <div class="flex items-center gap-2">
              ${
                step < 4
                  ? `<button
                      type="button"
                      data-action="wizard-next-step"
                      class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-emerald-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>${i18n.t("wizard_btn_next", {}, lang)}</span>
                    </button>`
                  : `<button
                      type="button"
                      data-action="wizard-finish"
                      data-kit-ids='${JSON.stringify(kitIds)}'
                      data-kit-id="${kitIds[0] || "morning-mastery"}"
                      class="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-emerald-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>${i18n.t("wizard_btn_finish", {}, lang)}</span>
                    </button>`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renders the complete Identity & Life Domains View inside Habits Catalog
   */
  function renderIdentityView(
    store,
    containerElement,
    lang = "vi",
    activeSubView = "catalog"
  ) {
    if (!store) return "";
    const habits = store.getHabits(true);
    const logs = store.state.logs;

    const domainsHtml = renderLifeDomainsSection(habits, logs, lang);
    const starterKitsHtml = renderStarterKitsSection(lang);

    // Reuse manager catalog for habit CRUD & reordering
    let managerHtml = "";
    const mgr =
      (typeof managerView !== "undefined" && managerView) ||
      (typeof global !== "undefined" && global.HabitManagerView) ||
      (typeof window !== "undefined" && window.HabitManagerView) ||
      (typeof require !== "undefined" ? require("./manager-view.js") : null);

    if (mgr && typeof mgr.renderManagerView === "function") {
      managerHtml = mgr.renderManagerView(store, null, lang, false);
    }

    const isCatalog = activeSubView === "catalog";

    const html = `
      <div class="identity-view max-w-lg mx-auto pb-24">
        <!-- Habits Catalog Header -->
        <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 mb-4 border border-slate-200 dark:border-slate-800/80 shadow-md flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">${i18n.t("app_title", {}, lang)}</span>
            <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">${i18n.t("habits_tab", {}, lang)}</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${i18n.t("app_tagline", {}, lang)}</p>
          </div>
          <button
            type="button"
            data-action="open-add-habit"
            class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            + ${i18n.t("add_habit", {}, lang)}
          </button>
        </div>

        <!-- Habits Sub-View Segmented Switcher -->
        <div class="flex p-1 mb-5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80" id="habits-subview-switcher">
          <button
            type="button"
            data-action="switch-habits-subview"
            data-subview="catalog"
            id="subview-btn-catalog"
            class="flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              isCatalog
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-600"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }"
          >
            <span>📋</span>
            <span>${i18n.t("habits_subview_catalog", {}, lang)}</span>
          </button>
          <button
            type="button"
            data-action="switch-habits-subview"
            data-subview="identity"
            id="subview-btn-identity"
            class="flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              !isCatalog
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-600"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }"
          >
            <span>🏛️</span>
            <span>${i18n.t("habits_subview_identity", {}, lang)}</span>
          </button>
        </div>

        <!-- SUBVIEW 1: Habits Catalog & Routine Management -->
        <div id="habits-catalog-subview" class="${isCatalog ? "" : "hidden"}">
          ${managerHtml}
        </div>

        <!-- SUBVIEW 2: Identity Pillars & Starter Kits -->
        <div id="habits-identity-subview" class="${!isCatalog ? "" : "hidden"}">
          <!-- Launch Setup Wizard Quick Banner -->
          <button
            type="button"
            data-action="open-identity-wizard"
            class="w-full mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-between text-left transition-all hover:border-emerald-500/60 shadow-sm cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl p-2 rounded-xl bg-emerald-500/20 text-emerald-500">✨</span>
              <div>
                <span class="font-bold text-slate-900 dark:text-white text-sm block">${i18n.t("wizard_title", {}, lang)}</span>
                <span class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">${i18n.t("wizard_subtitle", {}, lang)}</span>
              </div>
            </div>
            <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-500/10 dark:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30">➔</span>
          </button>

          <!-- Life Domains Hub -->
          ${domainsHtml}

          <!-- Curated 1-Click Starter Kits Carousel -->
          ${starterKitsHtml}
        </div>
      </div>
    `;

    if (containerElement) {
      containerElement.innerHTML = html;
    }

    return html;
  }

  const identityExports = {
    renderLifeDomainsSection,
    renderStarterKitsSection,
    renderIdentityWizardModal,
    renderIdentityView,
    renderManagerView: renderIdentityView,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = identityExports;
  } else {
    global.HabitIdentityView = identityExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
