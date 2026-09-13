/**
 * Atomic Habit Tracker Identity & Life Domains Lens View
 *
 * Implements:
 * - Life Domain Alignment Cards (Health, Mind, Craft, Discipline) with Neon Glow
 * - Curated 1-Click Starter Kits (Morning Mastery, Deep Focus, Health, Zen)
 * - Comprehensive Habit Catalog Management (Add, Edit, Reorder, Archive, Delete)
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
          <div class="life-domain-card bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 shadow-md flex items-center justify-between transition-all hover:scale-[1.02]" style="border-left: 4px solid ${meta.hex};">
            <div class="flex items-center gap-3">
              <span class="text-2xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80">${meta.icon}</span>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-white text-sm leading-tight">${title}</h4>
                <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">${domainHabits.length} ${i18n.t("habits_count", { count: domainHabits.length }, lang) || (lang === "vi" ? "thói quen" : "habits")}</span>
              </div>
            </div>

            <div class="relative flex items-center justify-center">
              ${ringHtml}
              <span class="absolute text-[10px] font-bold tabular-nums font-mono text-slate-900 dark:text-white">${rate}%</span>
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <div class="life-domains-hub mb-6">
        <div class="flex items-center justify-between mb-3 px-1">
          <h3 class="text-base font-black text-slate-900 dark:text-white tracking-tight">${i18n.t("domain_all", {}, lang)}</h3>
          <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Identity System</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renders Curated 1-Click Starter Kits Section
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
            return `<span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700/40">${h.icon || "🎯"} ${hName}</span>`;
          })
          .join("");

        return `
          <div class="starter-kit-card bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 border border-slate-200 dark:border-slate-800/80 shadow-lg flex flex-col justify-between transition-all hover:border-emerald-500/50">
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${kit.icon}</span>
                  <div>
                    <h4 class="font-black text-slate-900 dark:text-white text-base leading-tight">${title}</h4>
                    <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider font-mono">${kit.habits.length} Habits Pack</span>
                  </div>
                </div>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">${desc}</p>
              <div class="flex flex-wrap gap-1.5 mb-4">
                ${habitPills}
              </div>
            </div>

            <button
              type="button"
              data-action="apply-starter-kit"
              data-kit-id="${kit.id}"
              class="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
        <div class="mb-3 px-1">
          <h3 class="text-base font-black text-slate-900 dark:text-white tracking-tight">${i18n.t("starter_kits_title", {}, lang)}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${i18n.t("starter_kits_subtitle", {}, lang)}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renders the complete Identity & Life Domains Lens View
   */
  function renderIdentityView(store, containerElement, lang = "vi") {
    if (!store) return "";
    const habits = store.getHabits(true);
    const logs = store.state.logs;

    const domainsHtml = renderLifeDomainsSection(habits, logs, lang);
    const starterKitsHtml = renderStarterKitsSection(lang);

    // Reuse manager catalog for habit CRUD & reordering
    let managerHtml = "";
    if (managerView && typeof managerView.renderManagerView === "function") {
      managerHtml = managerView.renderManagerView(store, null, lang);
    }

    const html = `
      <div class="identity-view max-w-lg mx-auto pb-24">
        <!-- Identity Header -->
        <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 mb-5 border border-slate-200 dark:border-slate-800/80 shadow-md flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">${i18n.t("app_title", {}, lang)}</span>
            <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">${i18n.t("lens_identity", {}, lang)}</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${i18n.t("app_tagline", {}, lang)}</p>
          </div>
          <button
            type="button"
            data-action="open-add-habit"
            class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            + ${i18n.t("add_habit", {}, lang)}
          </button>
        </div>

        <!-- Life Domains Hub -->
        ${domainsHtml}

        <!-- Curated 1-Click Starter Kits -->
        ${starterKitsHtml}

        <!-- Habit Catalog & Reordering Management -->
        <div class="habit-catalog-section mt-6">
          <div class="mb-3 px-1 flex items-center justify-between">
            <h3 class="text-base font-black text-slate-900 dark:text-white tracking-tight">${i18n.t("manage_habits_tab", {}, lang)}</h3>
          </div>
          ${managerHtml}
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
    renderIdentityView,
    renderManagerView: renderIdentityView,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = identityExports;
  } else {
    global.HabitIdentityView = identityExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
