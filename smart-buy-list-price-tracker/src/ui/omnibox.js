/* =========================================================================
       6.5. SMART QUICK-ENTRY OMNIBOX & NLP PARSER ENGINE (ADR-0013)
       ========================================================================= */
let lastAddedItemsStack = [];

function toggleAdvancedAddForm() {
  const form = document.getElementById("addItemSection");
  const chevron = document.getElementById("advancedToggleChevron");
  const quickInput = document.getElementById("smartQuickInput");

  if (form) {
    const isHidden = form.classList.contains("hidden");
    if (isHidden) {
      if (
        quickInput &&
        quickInput.value &&
        quickInput.value.trim().length > 0
      ) {
        const rawText = quickInput.value.trim();
        const parsed = parseSmartGroceryInput(rawText);
        if (parsed) {
          const inputItemName = document.getElementById("inputItemName");
          const inputItemPrice = document.getElementById("inputItemPrice");
          const inputItemQty = document.getElementById("inputItemQty");
          const inputItemUnit = document.getElementById("inputItemUnit");
          const inputItemStore = document.getElementById("inputItemStore");
          const inputItemCategory =
            document.getElementById("inputItemCategory");

          if (inputItemName && parsed.name) inputItemName.value = parsed.name;
          if (
            inputItemPrice &&
            parsed.price !== undefined &&
            parsed.price !== null
          )
            inputItemPrice.value = parsed.price;
          if (
            inputItemQty &&
            parsed.quantity !== undefined &&
            parsed.quantity !== null
          )
            inputItemQty.value = parsed.quantity;
          if (inputItemUnit && parsed.unit) inputItemUnit.value = parsed.unit;
          if (inputItemStore && parsed.store)
            inputItemStore.value = parsed.store;
          if (inputItemCategory && parsed.category)
            inputItemCategory.value = parsed.category;

          quickInput.value = "";
          const preview = document.getElementById("smartQuickPreview");
          if (preview) preview.classList.add("hidden");
        }
      }

      form.classList.remove("hidden");
      if (chevron) chevron.textContent = "▴";
      const nameEl = document.getElementById("inputItemName");
      if (nameEl) nameEl.focus();
      if (typeof updateLiveUnitPreview === "function") {
        updateLiveUnitPreview();
      }
    } else {
      form.classList.add("hidden");
      if (chevron) chevron.textContent = "▾";
    }
  }
}

function normalizeUnitCode(raw) {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  if (
    s === "kg" ||
    s === "kí" ||
    s === "ký" ||
    s === "kilogram" ||
    s === "kilogam"
  )
    return "kg";
  if (s === "g" || s === "gr" || s === "gam" || s === "gram") return "g";
  if (s === "lb" || s === "lbs" || s === "pound") return "lb";
  if (s === "oz" || s === "ounce") return "oz";
  if (s === "l" || s === "lit" || s === "lít" || s === "litre" || s === "liter")
    return "L";
  if (s === "ml" || s === "mililit" || s === "mililít" || s === "millilitre")
    return "ml";
  if (s === "gal" || s === "gallon") return "gal";
  if (s === "fl oz" || s === "fl_oz" || s === "floz") return "fl oz";
  if (s === "loc" || s === "lốc") return "loc";
  if (s === "thung" || s === "thùng" || s === "ket" || s === "két")
    return "thung";
  if (s === "khay") return "khay";
  if (s === "tui" || s === "túi" || s === "bich" || s === "bịch") return "tui";
  if (s === "hu" || s === "hũ" || s === "lo" || s === "lọ") return "hu";
  if (s === "bunch" || s === "bo" || s === "bó" || s === "nai" || s === "nải")
    return "bunch";
  if (
    s === "can" ||
    s === "lon" ||
    s === "chai" ||
    s === "btl" ||
    s === "bottle"
  )
    return "can";
  if (s === "box" || s === "hop" || s === "hộp") return "box";
  if (s === "pk" || s === "pack" || s === "goi" || s === "gói") return "pk";
  if (
    s === "ea" ||
    s === "cai" ||
    s === "cái" ||
    s === "qua" ||
    s === "quả" ||
    s === "trai" ||
    s === "trái" ||
    s === "unit" ||
    s === "trung" ||
    s === "trứng"
  )
    return "ea";
  return null;
}

function classifyGroceryCategory(name) {
  if (!name) return "other";
  const n = name.toLowerCase();

  // Household & Cleaning (Specific compound rules first)
  if (
    /nước rửa chén|bột giặt|nước giặt|nước xả|nước lau nhà|khăn giấy|giấy vệ sinh|túi rác|xà bông|xà phòng|sunlight|omo|comfort|downy|vim|detergent|cleaner|paper/i.test(
      n
    )
  ) {
    return "household";
  }

  // Pantry, Rice & Grains (Specific compound rules first)
  if (
    /gạo|dầu ăn|nước mắm|nước tương|xì dầu|tương ớt|gia vị|muối|đường|mì|hảo hảo|hạt nêm|tiêu|bột ngọt|ngũ cốc|st25|simply|nam ngư|chinsu|cholimex|maggi|ketchup|oil|rice|spice|flour|sugar|salt/i.test(
      n
    )
  ) {
    return "pantry";
  }

  // Produce & Fruits
  if (
    /rau|củ|quả|trái|cà chua|dưa|khoai|cà rốt|táo|chuối|cam|xà lách|hành|tỏi|ớt|nấm|xoài|thanh long|bưởi|chanh|bắp|ngô|nho|dâu|súp lơ|bông cải|mướp|bầu|bí|gừng|sả/i.test(
      n
    ) ||
    /produce|fruit|vegetable|apple|banana|orange|potato|tomato|onion|garlic/i.test(
      n
    )
  ) {
    return "produce";
  }

  // Dairy & Eggs
  if (
    /sữa|trứng|bơ|phô mai|phô-mai|sữa chua|yaourt|vinamilk|th true milk|ba huân|cheese|milk|egg|butter|yogurt/i.test(
      n
    )
  ) {
    return "dairy_eggs";
  }

  // Meat & Seafood
  if (
    /thịt|bò|heo|lợn|gà|vịt|cá|tôm|mực|cua|nghêu|sò|ốc|sườn|ba chỉ|nạc|bắp bò|ức gà|giò sống|chả|xúc xích|pork|beef|chicken|fish|seafood|shrimp|meat/i.test(
      n
    )
  ) {
    return "meat_seafood";
  }

  // Bakery & Bread
  if (
    /bánh mì|sandwich|bánh ngọt|toast|bread|croissant|hamburger|bánh bao|bông lan/i.test(
      n
    )
  ) {
    return "bakery";
  }

  // Beverages & Coffee (Broad beverage patterns including standalone "nước")
  if (
    /\bnước\b|nước ngọt|nước suối|nước khoáng|nước ép|nước lọc|nước dừa|nước giải khát|nước tăng lực|nước mát|sinh tố|bia|trà|cà phê|cafe|pepsi|coca|coke|sting|heineken|tiger|lavie|aquafina|7up|mirinda|redbull|coffee|tea|beer|beverage|water|juice|wine|drink|soda/i.test(
      n
    )
  ) {
    return "beverages";
  }

  // Frozen
  if (
    /đông lạnh|kem|chả giò đông lạnh|cá viên|bò viên|frozen|ice cream|dumpling/i.test(
      n
    )
  ) {
    return "frozen";
  }

  // Personal Care
  if (
    /dầu gội|sữa tắm|kem đánh răng|bàn chải|dao cạo|lăn khử mùi|băng vệ sinh|ps|colgate|clear|dove|head & shoulders|shampoo|soap|toothpaste|toothbrush/i.test(
      n
    )
  ) {
    return "personal_care";
  }

  return "other";
}

function stripVnDiacritics(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function getQuickAddDefaultStore() {
  if (
    typeof currentStoreFilter !== "undefined" &&
    currentStoreFilter &&
    currentStoreFilter !== "ALL" &&
    currentStoreFilter !== "MANAGE_STORES"
  ) {
    return currentStoreFilter;
  }
  return (
    (memoryState && memoryState.stores && memoryState.stores[0]) || "WinMart"
  );
}

function parseMultiplierNumber(numStr, mult) {
  numStr = (numStr || "").trim();
  let numVal = 0;
  if (/^\d{1,3}(?:,\d{3})+$/.test(numStr)) {
    numVal = parseFloat(numStr.replace(/,/g, ""));
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(numStr)) {
    numVal = parseFloat(numStr.replace(/\./g, ""));
  } else {
    numVal = parseFloat(numStr.replace(/,/g, "."));
  }

  if (isNaN(numVal)) return 0;
  const m = (mult || "").toLowerCase();
  if (m === "k" || m === "nghìn" || m === "ngàn") {
    return numVal * 1000;
  } else if (m === "tr" || m === "triệu") {
    return numVal * 1000000;
  } else {
    return numVal;
  }
}

function resolveStoreFromTag(tagText, knownStores) {
  if (!tagText) return null;
  const rawTag = tagText.trim();
  const cleanTag = stripVnDiacritics(rawTag)
    .replace(/[\s\/\-\.]/g, "")
    .toLowerCase();
  if (!cleanTag) return null;

  // 1. Check user-defined and default store aliases
  const allAliases = {
    ...DEFAULT_STORE_ALIASES,
    ...(memoryState?.storeAliases || {}),
  };
  for (const [storeName, aliases] of Object.entries(allAliases)) {
    if (Array.isArray(aliases)) {
      for (const alias of aliases) {
        const cleanAlias = stripVnDiacritics(alias)
          .replace(/[\s\/\-\.]/g, "")
          .toLowerCase();
        if (
          cleanAlias === cleanTag ||
          alias.toLowerCase() === rawTag.toLowerCase()
        ) {
          return storeName;
        }
      }
    }
  }

  // 2. Check direct store names in known stores
  for (const s of knownStores) {
    const cleanS = stripVnDiacritics(s)
      .replace(/[\s\/\-\.]/g, "")
      .toLowerCase();
    if (cleanS === cleanTag || s.toLowerCase() === rawTag.toLowerCase()) {
      return s;
    }
  }

  // 3. Substring match
  for (const s of knownStores) {
    const cleanS = stripVnDiacritics(s)
      .replace(/[\s\/\-\.]/g, "")
      .toLowerCase();
    if (cleanS.includes(cleanTag) || cleanTag.includes(cleanS)) {
      return s;
    }
  }

  return rawTag;
}

function parseSmartGroceryInput(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return {
      name: "",
      price: 0,
      quantity: 1,
      unit: "ea",
      store: getQuickAddDefaultStore(),
      category: "other",
    };
  }
  let text = rawText.trim();
  if (!text) {
    return {
      name: "",
      price: 0,
      quantity: 1,
      unit: "ea",
      store: getQuickAddDefaultStore(),
      category: "other",
    };
  }

  let store = "";
  let price = 0;
  let quantity = 1;
  let unit = "";
  let category = "";
  let parsedPrice = false;
  let parsedQty = false;

  const knownStores = (memoryState && memoryState.stores) ||
    DEFAULT_STORES || [
      "WinMart",
      "Bách Hoá Xanh",
      "Co.opmart",
      "Big C / GO!",
      "Lotte Mart",
      "Chợ truyền thống",
      "Cửa hàng tiện lợi",
    ];

  // 1. Extract Store Tag (@store anywhere: leading, inline, trailing)
  const atRegex = /(?:^|\s)@([a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9\.\-]+)/i;
  const atMatch = text.match(atRegex);
  if (atMatch) {
    const matchedStore = resolveStoreFromTag(atMatch[1], knownStores);
    if (matchedStore) {
      store = matchedStore;
    }
    text = text.replace(atMatch[0], " ").replace(/\s+/g, " ").trim();
  } else {
    // Trailing store without @
    for (const s of knownStores) {
      const regex = new RegExp(
        `(?:\\s|^)${s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`,
        "i"
      );
      if (regex.test(text)) {
        store = s;
        text = text.replace(regex, " ").replace(/\s+/g, " ").trim();
        break;
      }
    }
  }

  if (!store) {
    store = getQuickAddDefaultStore();
  }

  // 2. Extract Price with fraction (e.g. "35k/l", "35000/kg", "1,234k/kg", "120k/500g", "-35k/l")
  const fracRegex =
    /(?:^|\s)-?(\d{1,3}(?:[,\.]\d{3})+|\d+(?:[,\.]\d+)?)\s*(k|nghìn|ngàn|tr|triệu|đ|vnd)?\s*\/\s*(\d+(?:[\.,]\d+)?)?\s*([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]+)/i;
  const fracMatch = text.match(fracRegex);
  if (fracMatch) {
    price = parseMultiplierNumber(fracMatch[1], fracMatch[2]);
    if (
      !fracMatch[2] &&
      price < 1000 &&
      (currentCurrency === "VND" || price >= 10)
    ) {
      price = price * 1000;
    }
    parsedPrice = true;

    if (fracMatch[3]) {
      quantity = parseFloat(fracMatch[3].replace(/,/g, ".")) || 1;
      parsedQty = true;
    }
    if (fracMatch[4]) {
      unit = normalizeUnitCode(fracMatch[4]) || "ea";
    }
    text = text.replace(fracMatch[0], " ").trim();
  }

  // 3. Extract Quantity and Unit FIRST before standalone numbers
  // Matches e.g. "1 lốc", "2 chai", "1 thùng", "500g", "10 quả", "1 bó", "2l", "1.5kg", "10 cái"
  const qtyUnitRegex =
    /(?:^|\s)(\d+(?:[\.,]\d+)?)\s*(kg|g|gr|gam|gram|lb|lbs|pound|oz|ounce|l|lit|lít|litre|liter|ml|mililit|mililít|millilitre|gal|gallon|fl\s*oz|loc|lốc|thung|thùng|ket|két|khay|tui|túi|bich|bịch|hu|hũ|lo|lọ|bunch|bo|bó|nai|nải|can|lon|chai|btl|bottle|box|hop|hộp|pk|pack|goi|gói|ea|cai|cái|qua|quả|trai|trái|unit|trung|trứng)(?:\s|$|(?=[^a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]))/i;
  let qMatch = text.match(qtyUnitRegex);
  if (qMatch) {
    const rawQty = parseFloat(qMatch[1].replace(/,/g, "."));
    const rawUnit = qMatch[2];
    const recognizedUnit = normalizeUnitCode(rawUnit);
    if (recognizedUnit) {
      quantity = rawQty;
      unit = recognizedUnit;
      parsedQty = true;
      text = text.replace(qMatch[0], " ").trim();
    }
  }

  // 4. Extract Price with explicit multiplier (e.g. "28k", "1,234k", "90k", "1.5tr", "35 ngàn", "-35k")
  if (!parsedPrice) {
    const explicitPriceRegex =
      /(?:^|\s)-?(\d{1,3}(?:[,\.]\d{3})+|\d+(?:[,\.]\d+)?)\s*(k|nghìn|ngàn|tr|triệu|đ|vnd)(?:\s|$|(?=[^a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]))/i;
    const epMatch = text.match(explicitPriceRegex);
    if (epMatch) {
      price = parseMultiplierNumber(epMatch[1], epMatch[2]);
      parsedPrice = true;
      text = text.replace(epMatch[0], " ").trim();
    }
  }

  // 5. Extract Standard Large/Formatted Price (e.g. "30.000", "120.000", "35000", "1,234,000", "-50000")
  if (!parsedPrice) {
    const numPriceRegex =
      /(?:^|\s)-?(\d{1,3}(?:[\.,]\d{3})+|\d{4,})(?:\s|$|(?=[^a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]))/i;
    const npMatch = text.match(numPriceRegex);
    if (npMatch) {
      let strVal = npMatch[1];
      if (
        (strVal.includes(".") &&
          strVal
            .split(".")
            .every((part, idx) => idx === 0 || part.length === 3)) ||
        (strVal.includes(",") &&
          strVal
            .split(",")
            .every((part, idx) => idx === 0 || part.length === 3))
      ) {
        price = parseFloat(strVal.replace(/[\.,]/g, ""));
      } else {
        price = parseFloat(strVal.replace(/,/g, "."));
      }
      parsedPrice = true;
      text = text.replace(npMatch[0], " ").trim();
    }
  }

  // 6. Standalone unit without explicit number
  if (!unit) {
    const standaloneUnitRegex =
      /(?:^|\s)(kg|g|l|ml|ea|pk|box|can|bunch|loc|thung|khay|tui|hu|lít|gam|kí|ký|quả|trái|hộp|gói|bó|nải|lốc|thùng|khay|túi|hũ|lọ|chai|lon)(?:\s|$)/i;
    const sMatch = text.match(standaloneUnitRegex);
    if (sMatch) {
      const recognized = normalizeUnitCode(sMatch[1]);
      if (recognized) {
        unit = recognized;
        text = text.replace(sMatch[0], " ").trim();
      }
    }
  }

  if (!unit) unit = "ea";

  // 7. Clean up item name
  let itemName = text;

  // Strip emojis from item name (e.g. Milk 🥛 -> Milk)
  itemName = itemName.replace(/\p{Extended_Pictographic}/gu, "");

  // If we already parsed price or quantity, drop trailing unmatched numbers (e.g. "Thức ăn 100k 10 cái 5" -> "Thức ăn")
  if (parsedPrice || parsedQty) {
    itemName = itemName.replace(/\s+\d+(?:[\.,]\d+)?$/g, "");
  }

  // Strip leading/trailing punctuation & multiple spaces
  itemName = itemName.replace(/\s+/g, " ").trim();
  itemName = itemName
    .replace(/^[\s\-_–—:,.\/•*~+]+|[\s\-_–—:,.\/•*~+]+$/g, "")
    .trim();

  if (itemName.length > 0) {
    itemName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
  }

  category = classifyGroceryCategory(itemName);

  return {
    name:
      itemName ||
      rawText
        .replace(/@\S+/g, "")
        .replace(/\p{Extended_Pictographic}/gu, "")
        .trim() ||
      "Item",
    price: Math.max(0, price),
    quantity: quantity > 0 ? quantity : 1,
    unit: unit || "ea",
    store: store || getQuickAddDefaultStore(),
    category: category || "other",
  };
}

function undoLastAction() {
  if (!lastAddedItemsStack || lastAddedItemsStack.length === 0) return;
  const lastAction = lastAddedItemsStack.pop();
  if (
    lastAction &&
    lastAction.type === "ADD_ITEMS" &&
    Array.isArray(lastAction.items)
  ) {
    const idsToRemove = new Set(lastAction.items.map((i) => i.id));
    memoryState.activeList.items = memoryState.activeList.items.filter(
      (i) => !idsToRemove.has(i.id)
    );
    saveToLocalStorage();
    renderApp();
    const t = TRANSLATIONS[currentLanguage];
    const raw = t.toast_item_undone || "Removed '{item}' from Buy List";
    showToast(
      raw.replace("{item}", lastAction.items.map((i) => i.name).join(", "))
    );
  }
}

function processBatchQuickInput(text) {
  if (!text || typeof text !== "string") return false;
  const lines = text
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return false;

  const newItems = [];
  lines.forEach((line) => {
    const parsed = parseSmartGroceryInput(line);
    if (parsed && parsed.name) {
      const item = {
        id: generateItemId("item"),
        name: parsed.name,
        category: parsed.category || "other",
        store: parsed.store || getQuickAddDefaultStore(),
        quantity: parsed.quantity || 1,
        unit: parsed.unit || "ea",
        price: parsed.price || 0,
        checked: false,
        updatedAt: Date.now(),
      };
      newItems.push(item);
      memoryState.activeList.items.push(item);
    }
  });

  if (newItems.length > 0) {
    lastAddedItemsStack.push({ type: "ADD_ITEMS", items: newItems });
    saveToLocalStorage();
    renderApp();
    const t = TRANSLATIONS[currentLanguage];
    if (newItems.length === 1) {
      const item = newItems[0];
      const msg = (t.toast_smart_item_added || "Added '{item}'!")
        .replace("{item}", item.name)
        .replace("{qty}", item.quantity)
        .replace("{unit}", item.unit)
        .replace("{price}", formatCurrency(item.price));
      showToast(msg, t.toast_action_undo || "Undo", () => undoLastAction());
    } else {
      const msg = (t.toast_batch_items_added || "Added {count} items!").replace(
        "{count}",
        newItems.length
      );
      showToast(msg, t.toast_action_undo || "Undo", () => undoLastAction());
    }
    return true;
  }
  return false;
}

function handleSmartQuickInputSubmit() {
  const input = document.getElementById("smartQuickInput");
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  const success = processBatchQuickInput(val);
  if (success) {
    input.value = "";
    handleSmartQuickInputChange("");
    input.focus();
  }
}

function handleSmartQuickInputChange(val) {
  const preview = document.getElementById("smartQuickPreview");
  if (!preview) return;
  const text = (val || "").trim();
  if (!text) {
    preview.classList.add("hidden");
    return;
  }

  const parsed = parseSmartGroceryInput(text);
  const nameEl = document.getElementById("smartPreviewName");
  const qtyUnitEl = document.getElementById("smartPreviewQtyUnit");
  const priceEl = document.getElementById("smartPreviewPrice");
  const storeEl = document.getElementById("smartPreviewStore");
  const catEl = document.getElementById("smartPreviewCategory");
  const unitPriceEl = document.getElementById("smartPreviewUnitPrice");

  const catNames = {
    produce: currentLanguage === "vi" ? "🥦 Rau Củ & Trái Cây" : "🥦 Produce",
    dairy_eggs: currentLanguage === "vi" ? "🥛 Sữa & Trứng" : "🥛 Dairy & Eggs",
    meat_seafood:
      currentLanguage === "vi" ? "🥩 Thịt & Hải Sản" : "🥩 Meat & Seafood",
    bakery: currentLanguage === "vi" ? "🍞 Bánh Mì" : "🍞 Bakery",
    pantry: currentLanguage === "vi" ? "🍚 Gia Vị & Gạo" : "🍚 Pantry",
    beverages: currentLanguage === "vi" ? "☕ Đồ Uống" : "☕ Beverages",
    frozen: currentLanguage === "vi" ? "🧊 Đông Lạnh" : "🧊 Frozen",
    household: currentLanguage === "vi" ? "🧹 Gia Dụng" : "🧹 Household",
    personal_care: currentLanguage === "vi" ? "🧴 Cá Nhân" : "🧴 Personal Care",
    other: currentLanguage === "vi" ? "📦 Khác" : "📦 Other",
  };

  if (nameEl) nameEl.textContent = parsed.name || text;
  if (qtyUnitEl) qtyUnitEl.textContent = `• ${parsed.quantity} ${parsed.unit}`;
  if (priceEl)
    priceEl.textContent =
      parsed.price > 0 ? `• ${formatCurrency(parsed.price)}` : "";
  if (storeEl) storeEl.textContent = parsed.store || "";
  if (catEl) catEl.textContent = catNames[parsed.category] || catNames.other;

  if (unitPriceEl) {
    if (parsed.price > 0 && parsed.quantity > 0) {
      const unitPrice = normalizeUnitPrice(
        parsed.price,
        parsed.quantity,
        parsed.unit
      );
      const { baseUnit } = normalizeQuantity(parsed.quantity, parsed.unit);
      unitPriceEl.textContent = `(${formatCurrency(unitPrice)}/${baseUnit})`;
    } else {
      unitPriceEl.textContent = "";
    }
  }

  preview.classList.remove("hidden");
}

function handleSmartQuickPaste(e) {
  const pasteData = (e.clipboardData || window.clipboardData)?.getData("text");
  if (pasteData && pasteData.includes("\n")) {
    e.preventDefault();
    processBatchQuickInput(pasteData);
    const input = document.getElementById("smartQuickInput");
    if (input) {
      input.value = "";
      handleSmartQuickInputChange("");
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    parseSmartGroceryInput,
    handleSmartQuickInputChange,
    submitSmartQuickInput,
    expandDetailedOptions,
  };
}
