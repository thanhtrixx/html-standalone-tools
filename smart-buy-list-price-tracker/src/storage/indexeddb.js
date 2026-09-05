/* =========================================================================
       3. STORAGE PROVIDER SEAM & CLOUD SYNC ARCHITECTURE (ADR-0001, ADR-0011)
       ========================================================================= */
const DB_NAME = "SmartBuyListDB";
const DB_VERSION = 3;
let dbInstance = null;

const DEFAULT_STORES = [
  "WinMart",
  "Bách Hoá Xanh",
  "Co.opmart",
  "Big C / GO!",
  "Lotte Mart",
  "Chợ truyền thống",
  "Cửa hàng tiện lợi",
];

const DEFAULT_STORE_ALIASES = {
  WinMart: ["wm", "winmart", "vinmart", "vm"],
  "Bách Hoá Xanh": ["bhx", "bachhoaxanh", "bach hoa xanh"],
  "Co.opmart": ["coop", "coopmart", "co.op", "co.opmart"],
  "Big C / GO!": ["bigc", "go", "big c", "go!"],
  "Lotte Mart": ["lotte", "lottemart"],
  "Chợ truyền thống": ["cho", "chotruyenthong", "cho truyen thong", "market"],
  "Cửa hàng tiện lợi": [
    "chtl",
    "convenience",
    "7eleven",
    "familymart",
    "circlek",
    "gs25",
  ],
  "Trader Joe's": ["tjs", "trader joe", "trader joes", "trader joe's"],
  Costco: ["costco", "costco wholesale"],
};

// In-memory fallback / active working state
let memoryState = {
  activeList: { id: "default", title: "Danh Sách Mua Sắm", items: [] },
  catalog: [],
  purchaseLedger: [],
  stores: [...DEFAULT_STORES],
  storeAliases: { ...DEFAULT_STORE_ALIASES },
  settings: {
    language: "vi",
    currency: "VND",
    theme: "dark",
    tripPhase: "PLANNING",
    grouping: "AISLE",
    unitSystem: "metric",
    density: "comfortable",
    vibrate: true,
  },
  _deleted: {
    items: {},
    ledger: {},
    stores: {},
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DB_NAME,
    DB_VERSION,
    DEFAULT_STORES,
    DEFAULT_STORE_ALIASES,
    memoryState,
  };
}
