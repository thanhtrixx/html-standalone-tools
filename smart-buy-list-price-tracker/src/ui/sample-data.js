/* =========================================================================
       5. STATE & SAMPLE DATA INITIALIZER
       ========================================================================= */
const SAMPLE_ITEMS = [
  {
    id: "1",
    name: "Sữa tươi tiệt trùng Vinamilk",
    category: "dairy_eggs",
    store: "WinMart",
    quantity: 1,
    unit: "L",
    price: 36000,
    checked: false,
  },
  {
    id: "2",
    name: "Trứng gà tươi Ba Huân",
    category: "dairy_eggs",
    store: "Bách Hoá Xanh",
    quantity: 10,
    unit: "ea",
    price: 32000,
    checked: false,
  },
  {
    id: "3",
    name: "Gạo thơm ST25",
    category: "pantry",
    store: "Co.opmart",
    quantity: 5,
    unit: "kg",
    price: 185000,
    checked: false,
  },
  {
    id: "4",
    name: "Dầu ăn thực vật Simply",
    category: "pantry",
    store: "Big C / GO!",
    quantity: 1,
    unit: "L",
    price: 58000,
    checked: false,
  },
  {
    id: "5",
    name: "Thịt heo ba chỉ tươi",
    category: "meat_seafood",
    store: "Chợ truyền thống",
    quantity: 500,
    unit: "g",
    price: 75000,
    checked: false,
  },
  {
    id: "6",
    name: "Rau muống xanh",
    category: "produce",
    store: "Chợ truyền thống",
    quantity: 1,
    unit: "bunch",
    price: 12000,
    checked: false,
  },
];

const SAMPLE_LEDGER = [
  {
    id: 1,
    itemId: "1",
    itemName: "Sữa tươi tiệt trùng Vinamilk",
    store: "WinMart",
    date: "2026-07-15",
    quantity: 1,
    unit: "L",
    price: 35000,
    unitPrice: 35000,
  },
  {
    id: 2,
    itemId: "1",
    itemName: "Sữa tươi tiệt trùng Vinamilk",
    store: "Bách Hoá Xanh",
    date: "2026-08-01",
    quantity: 1,
    unit: "L",
    price: 36000,
    unitPrice: 36000,
  },
  {
    id: 3,
    itemId: "3",
    itemName: "Gạo thơm ST25",
    store: "Co.opmart",
    date: "2026-06-20",
    quantity: 5,
    unit: "kg",
    price: 180000,
    unitPrice: 36000,
  },
  {
    id: 4,
    itemId: "4",
    itemName: "Dầu ăn thực vật Simply",
    store: "Big C / GO!",
    date: "2026-07-10",
    quantity: 1,
    unit: "L",
    price: 56000,
    unitPrice: 56000,
  },
  {
    id: 5,
    itemId: "5",
    itemName: "Thịt heo ba chỉ tươi",
    store: "Chợ truyền thống",
    date: "2026-08-10",
    quantity: 500,
    unit: "g",
    price: 70000,
    unitPrice: 140000,
  },
];

function loadSampleData() {
  memoryState.activeList.items = JSON.parse(JSON.stringify(SAMPLE_ITEMS));
  memoryState.purchaseLedger = JSON.parse(JSON.stringify(SAMPLE_LEDGER));
  saveToLocalStorage();
  renderApp();
  showToast(
    TRANSLATIONS[currentLanguage].toast_sample_loaded ||
      "Sample grocery list loaded!"
  );
  const banner = document.getElementById("sampleDataBanner");
  if (banner) banner.classList.remove("hidden");
}

function dismissSampleBanner() {
  const banner = document.getElementById("sampleDataBanner");
  if (banner) banner.classList.add("hidden");
}

function clearAllData(silent = false) {
  memoryState.activeList.items = [];
  memoryState.purchaseLedger = [];
  saveToLocalStorage();
  renderApp();
  dismissSampleBanner();
  if (!silent)
    showToast(
      TRANSLATIONS[currentLanguage].toast_data_cleared || "All data cleared"
    );
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SAMPLE_ITEMS,
    SAMPLE_LEDGER,
    loadSampleData,
    dismissSampleBanner,
    clearAllData,
  };
}
