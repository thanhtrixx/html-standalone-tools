const fs = require("fs");
const path = require("path");
const vm = require("vm");

let testCount = 0;
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failCount++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log(
  "\n🧪 Running Smart Buy-List Stores, Grouping, Gestures & Option Hub Test Suite...\n"
);

const indexPath = path.join(
  __dirname,
  "../smart-buy-list-price-tracker/index.html"
);
const htmlContent = fs.readFileSync(indexPath, "utf-8");

// Mock DOM & sandbox
function createMockSandbox() {
  const elements = {};
  function getOrCreateElement(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        tagName: "DIV",
        value: "",
        textContent: "",
        innerHTML: "",
        className: "",
        classList: {
          contains: (cls) => (elements[id].className || "").includes(cls),
          add: (cls) => {
            if (!elements[id].className) elements[id].className = "";
            if (!elements[id].className.includes(cls)) {
              elements[id].className =
                `${elements[id].className} ${cls}`.trim();
            }
          },
          remove: (cls) => {
            if (elements[id].className) {
              elements[id].className = elements[id].className
                .replace(new RegExp(`\\b${cls}\\b`, "g"), "")
                .trim();
            }
          },
        },
        style: {},
        focus: () => {},
        scrollIntoView: () => {},
        appendChild: (child) => {
          if (child && child.textContent) {
            elements[id].textContent += child.textContent;
          }
        },
        setAttribute: () => {},
        removeAttribute: () => {},
        remove: () => {},
      };
    }
    return elements[id];
  }

  let vibrateCalls = [];
  const mockNavigator = {
    clipboard: { writeText: async () => {} },
    share: async () => {},
    vibrate: (pattern) => {
      vibrateCalls.push(pattern);
      return true;
    },
  };

  const sandbox = {
    console,
    Math,
    Date,
    parseFloat,
    parseInt,
    isNaN,
    isFinite,
    Intl,
    Array,
    Object,
    Set,
    String,
    RegExp,
    JSON,
    encodeURIComponent,
    decodeURIComponent,
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    escape: encodeURI,
    unescape: decodeURI,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    tailwind: {},
    location: { origin: "http://localhost:8080", pathname: "/" },
    document: {
      documentElement: {
        classList: {
          contains: () => false,
          add: () => {},
          remove: () => {},
        },
      },
      getElementById: (id) => getOrCreateElement(id),
      querySelector: (sel) => getOrCreateElement(sel.replace("#", "")),
      querySelectorAll: () => [],
      createElement: (tag) => {
        const el = getOrCreateElement(`dyn_${Date.now()}_${Math.random()}`);
        el.tagName = tag.toUpperCase();
        return el;
      },
      body: {
        style: {},
        appendChild: () => {},
      },
      addEventListener: () => {},
    },
    navigator: mockNavigator,
    localStorage: {
      store: {},
      getItem: function (key) {
        return this.store[key] || null;
      },
      setItem: function (key, val) {
        this.store[key] = String(val);
      },
      removeItem: function (key) {
        delete this.store[key];
      },
      clear: function () {
        this.store = {};
      },
    },
    vibrateCalls,
  };
  sandbox.window = sandbox;

  // Extract <script> tag contents
  const scriptRegex = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let jsCode = "";
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    if (!match[1].includes("tailwind.config")) {
      jsCode += match[1] + "\n";
    }
  }

  const context = vm.createContext(sandbox);
  vm.runInContext(jsCode, context);
  return { sandbox, context };
}

// ----------------------------------------------------
// Section 1: Navigation Streamlining & Redundancy Removal
// ----------------------------------------------------
console.log("--- Section 1: Navigation Streamlining & Redundancy Removal ---");
{
  assert(
    !htmlContent.includes('id="tabPlanning"'),
    "NAV-CLEAN-01: Redundant tabPlanning button removed from top trip card in HTML"
  );
  assert(
    !htmlContent.includes('id="tabInStore"'),
    "NAV-CLEAN-02: Redundant tabInStore button removed from top trip card in HTML"
  );
  assert(
    !htmlContent.includes('id="btnOpenComparatorHint"'),
    "NAV-CLEAN-03: Redundant Compare Package Sizes button removed from Add Item section header"
  );
  assert(
    htmlContent.includes('id="navPlanningBtn"'),
    "NAV-CLEAN-04: MD3 Bottom navigation Planning button retained as primary control"
  );
  assert(
    htmlContent.includes('id="navBuyModeBtn"'),
    "NAV-CLEAN-05: MD3 Bottom navigation Buy Mode button retained as primary control"
  );
}

// ----------------------------------------------------
// Section 2: Store Management & Custom Store Persistence
// ----------------------------------------------------
console.log("--- Section 2: Store Management & Custom Store Persistence ---");
{
  const { sandbox } = createMockSandbox();

  assert(
    Array.isArray(sandbox.memoryState.stores),
    "STORE-01: memoryState.stores is initialized as an Array"
  );
  assert(
    sandbox.memoryState.stores.length >= 5,
    `STORE-02: Initialized with default retail stores (Count: ${sandbox.memoryState.stores ? sandbox.memoryState.stores.length : 0})`
  );

  // Test Adding Store
  const initialCount = sandbox.memoryState.stores.length;
  if (typeof sandbox.addStore === "function") {
    sandbox.addStore("Sprouts Farmers Market");
    assert(
      sandbox.memoryState.stores.includes("Sprouts Farmers Market"),
      "STORE-03: addStore successfully adds 'Sprouts Farmers Market'"
    );
    assert(
      sandbox.memoryState.stores.length === initialCount + 1,
      "STORE-04: Stores array count incremented by 1"
    );

    // Test Duplicate prevention
    sandbox.addStore("Sprouts Farmers Market");
    assert(
      sandbox.memoryState.stores.length === initialCount + 1,
      "STORE-05: Duplicate store addition is safely prevented"
    );
  } else {
    assert(false, "STORE-03: addStore function is defined globally");
  }

  // Test Renaming Store Cascade
  if (typeof sandbox.renameStore === "function") {
    sandbox.memoryState.activeList.items = [
      {
        id: "item-1",
        name: "Organic Apples",
        store: "Target",
        price: 4.99,
        quantity: 1,
        unit: "kg",
      },
      {
        id: "item-2",
        name: "Almond Milk",
        store: "Costco",
        price: 8.99,
        quantity: 2,
        unit: "l",
      },
    ];
    sandbox.memoryState.purchaseLedger = [
      {
        id: "l-1",
        itemName: "Organic Apples",
        store: "Target",
        packagePrice: 4.99,
      },
    ];

    sandbox.renameStore("Target", "Super Target");
    assert(
      sandbox.memoryState.stores.includes("Super Target") &&
        !sandbox.memoryState.stores.includes("Target"),
      "STORE-06: renameStore updates stores list"
    );
    assert(
      sandbox.memoryState.activeList.items[0].store === "Super Target",
      "STORE-07: renameStore cascades to activeList items store field"
    );
    assert(
      sandbox.memoryState.purchaseLedger[0].store === "Super Target",
      "STORE-08: renameStore cascades to purchaseLedger records store field"
    );
  } else {
    assert(false, "STORE-06: renameStore function is defined globally");
  }

  // Test Deleting Store
  if (typeof sandbox.deleteStore === "function") {
    sandbox.memoryState.stores = [
      "Costco",
      "Trader Joe's",
      "Super Target",
      "Other",
    ];
    sandbox.memoryState.activeList.items = [
      { id: "item-1", name: "Organic Apples", store: "Super Target" },
    ];
    sandbox.deleteStore("Super Target");
    assert(
      !sandbox.memoryState.stores.includes("Super Target"),
      "STORE-09: deleteStore removes store from stores list"
    );
    assert(
      sandbox.memoryState.activeList.items[0].store === "Other" ||
        sandbox.memoryState.activeList.items[0].store === "Costco",
      "STORE-10: deleteStore safely reassigns active items away from deleted store"
    );

    // Test Quote-Safe Store Dispatch (Trader Joe's)
    sandbox.memoryState.stores = ["Costco", "Trader Joe's", "Other"];
    assert(
      typeof sandbox.promptRenameStoreByIndex === "function",
      "STORE-11a: promptRenameStoreByIndex function is exported globally"
    );
    assert(
      typeof sandbox.deleteStoreByIndex === "function",
      "STORE-11b: deleteStoreByIndex function is exported globally"
    );
    sandbox.deleteStoreByIndex(1); // Delete "Trader Joe's"
    assert(
      !sandbox.memoryState.stores.includes("Trader Joe's"),
      "STORE-11c: deleteStoreByIndex safely removes 'Trader Joe\\'s' with apostrophe without throwing"
    );

    assert(
      htmlContent.includes("z-[60]") &&
        htmlContent.includes("storeManagerModal"),
      "STORE-12: storeManagerModal markup uses elevated z-[60] for stacked modal layering"
    );
  } else {
    assert(false, "STORE-09: deleteStore function is defined globally");
  }
}

// ----------------------------------------------------
// Section 3: Active List Grouping (By Aisle & By Store)
// ----------------------------------------------------
console.log("--- Section 3: Active List Grouping (By Aisle & By Store) ---");
{
  const { sandbox } = createMockSandbox();

  assert(
    typeof sandbox.setGrouping === "function",
    "GROUP-01: setGrouping function is defined"
  );

  sandbox.memoryState.activeList.items = [
    {
      id: "1",
      name: "Bananas",
      category: "produce",
      store: "Costco",
      price: 2.5,
      quantity: 1,
      unit: "kg",
      checked: false,
    },
    {
      id: "2",
      name: "Whole Milk",
      category: "dairy_eggs",
      store: "Target",
      price: 3.5,
      quantity: 1,
      unit: "l",
      checked: false,
    },
    {
      id: "3",
      name: "Jasmine Rice",
      category: "pantry",
      store: "Costco",
      price: 12.0,
      quantity: 5,
      unit: "kg",
      checked: false,
    },
  ];

  // Test Aisle Grouping
  sandbox.setGrouping("AISLE");
  assert(
    sandbox.currentGrouping === "AISLE",
    "GROUP-02: currentGrouping is set to 'AISLE'"
  );
  sandbox.renderItemList();
  const activeContainer = sandbox.document.getElementById("activeItemsList");
  assert(
    activeContainer.innerHTML.includes("Produce") ||
      activeContainer.innerHTML.includes("produce"),
    "GROUP-03: By Aisle rendering includes Produce department section header"
  );
  assert(
    activeContainer.innerHTML.includes("Dairy") ||
      activeContainer.innerHTML.includes("dairy"),
    "GROUP-04: By Aisle rendering includes Dairy department section header"
  );

  // Test Store Grouping
  sandbox.setGrouping("STORE");
  assert(
    sandbox.currentGrouping === "STORE",
    "GROUP-05: currentGrouping is set to 'STORE'"
  );
  sandbox.renderItemList();
  assert(
    activeContainer.innerHTML.includes("Costco"),
    "GROUP-06: By Store rendering includes Costco store section header"
  );
  assert(
    activeContainer.innerHTML.includes("Target"),
    "GROUP-07: By Store rendering includes Target store section header"
  );
  assert(
    activeContainer.innerHTML.includes("$14.50") ||
      activeContainer.innerHTML.includes("14.50"),
    "GROUP-08: By Store rendering computes store subtotal for Costco ($2.50 + $12.00 = $14.50)"
  );
}

// ----------------------------------------------------
// Section 4: Mobile Touch Swipe Gestures
// ----------------------------------------------------
console.log("--- Section 4: Mobile Touch Swipe Gestures ---");
{
  const { sandbox } = createMockSandbox();

  sandbox.memoryState.activeList.items = [
    {
      id: "item-swipe",
      name: "Greek Yogurt",
      price: 4.5,
      quantity: 1,
      unit: "kg",
      checked: false,
    },
  ];

  assert(
    typeof sandbox.handleTouchStart === "function" ||
      typeof sandbox.initItemSwipeGestures === "function",
    "SWIPE-01: Swipe touch handlers are defined"
  );

  // Test Swipe Right (Mark Done)
  if (typeof sandbox.handleItemSwipeAction === "function") {
    sandbox.handleItemSwipeAction("item-swipe", "RIGHT");
    assert(
      sandbox.memoryState.activeList.items[0].checked === true,
      "SWIPE-02: Swiping right marks item as checked (Done)"
    );
    assert(
      sandbox.vibrateCalls.length > 0,
      "SWIPE-03: Swiping right triggers tactile haptic vibration"
    );

    // Test Swipe Left (Open Comparator)
    let openedComparatorId = null;
    sandbox.openItemComparator = (id) => {
      openedComparatorId = id;
    };
    sandbox.handleItemSwipeAction("item-swipe", "LEFT");
    assert(
      openedComparatorId === "item-swipe",
      "SWIPE-04: Swiping left invokes openItemComparator for that item"
    );

    // Test Card Opaque Styling for Checked vs Unchecked
    sandbox.memoryState.activeList.items[0].checked = true;
    const itemCheckedHtml = sandbox.renderItemCard(
      sandbox.memoryState.activeList.items[0]
    );
    assert(
      !itemCheckedHtml.includes("bg-slate-950/40") &&
        (itemCheckedHtml.includes("bg-slate-950") ||
          itemCheckedHtml.includes("bg-slate-900")),
      "SWIPE-05: Checked cards use solid opaque surface to prevent swipe under-text bleed"
    );
  } else {
    // If handled via DOM simulation or direct gesture dispatch
    assert(
      htmlContent.includes("ontouchstart") ||
        htmlContent.includes("touchmove") ||
        htmlContent.includes("handleTouch"),
      "SWIPE-02: Touch swipe gesture listeners integrated into list item rendering"
    );
  }
}

// ----------------------------------------------------
// Section 5: Option Hub (Settings Modal)
// ----------------------------------------------------
console.log("--- Section 5: Option Hub (Settings Modal) ---");
{
  const { sandbox } = createMockSandbox();

  assert(
    typeof sandbox.openSettingsModal === "function",
    "SETTINGS-01: openSettingsModal function is exported globally"
  );
  assert(
    typeof sandbox.closeSettingsModal === "function",
    "SETTINGS-02: closeSettingsModal function is exported globally"
  );

  sandbox.openSettingsModal();
  const modal = sandbox.document.getElementById("settingsModal");
  assert(
    !modal.classList.contains("hidden"),
    "SETTINGS-03: openSettingsModal removes 'hidden' class from settingsModal"
  );

  sandbox.closeSettingsModal();
  assert(
    modal.classList.contains("hidden"),
    "SETTINGS-04: closeSettingsModal restores 'hidden' class to settingsModal"
  );

  assert(
    htmlContent.includes('id="settingsModal"'),
    "SETTINGS-05: settingsModal markup exists in HTML"
  );
  assert(
    htmlContent.includes('id="btnOpenSettings"') ||
      htmlContent.includes("openSettingsModal()"),
    "SETTINGS-06: Settings gear button integrated into Top App Bar"
  );

  assert(
    htmlContent.includes('id="settingsLanguageSelect"'),
    "SETTINGS-07: Settings modal contains language selector #settingsLanguageSelect"
  );

  assert(
    typeof sandbox.setLanguage === "function",
    "SETTINGS-08: setLanguage function is exported globally"
  );

  sandbox.setLanguage("vi");
  assert(
    sandbox.currentLanguage === "vi",
    "SETTINGS-09: setLanguage('vi') updates currentLanguage to Vietnamese"
  );

  sandbox.setLanguage("en");
  assert(
    sandbox.currentLanguage === "en",
    "SETTINGS-10: setLanguage('en') updates currentLanguage to English"
  );
}

// ----------------------------------------------------
// Section 6: Bilingual Translation Key Parity
// ----------------------------------------------------
console.log("--- Section 6: Bilingual Translation Key Parity ---");
{
  const { sandbox } = createMockSandbox();

  const enKeys = Object.keys(sandbox.TRANSLATIONS.en);
  const viKeys = Object.keys(sandbox.TRANSLATIONS.vi);

  const missingInVi = enKeys.filter((k) => !(k in sandbox.TRANSLATIONS.vi));
  const missingInEn = viKeys.filter((k) => !(k in sandbox.TRANSLATIONS.en));

  assert(
    missingInVi.length === 0,
    `I18N-PARITY-01: 100% English keys exist in Vietnamese (Missing: ${missingInVi.join(", ") || "none"})`
  );
  assert(
    missingInEn.length === 0,
    `I18N-PARITY-02: 100% Vietnamese keys exist in English (Missing: ${missingInEn.join(", ") || "none"})`
  );

  const keysToCheck = [
    "settings_title",
    "settings_subtitle",
    "settings_language_label",
    "manage_stores_title",
    "add_store_btn",
    "swipe_done_cue",
    "swipe_compare_cue",
  ];
  keysToCheck.forEach((k) => {
    assert(
      k in sandbox.TRANSLATIONS.en && k in sandbox.TRANSLATIONS.vi,
      `I18N-KEY-EXISTS: Key '${k}' is defined in both language dictionaries`
    );
  });
}

console.log("\n==================================================");
console.log(
  `📊 Stores, Grouping & Settings Test Summary: ${passCount} Passed, ${failCount} Failed`
);
console.log("==================================================\n");

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
