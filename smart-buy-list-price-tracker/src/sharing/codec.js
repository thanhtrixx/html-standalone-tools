if (typeof generateItemId === "undefined" && typeof require !== "undefined") {
  try {
    const _domain = require("../domain/index.js");
    if (typeof globalThis !== "undefined" && !globalThis.generateItemId) {
      globalThis.generateItemId = _domain.generateItemId;
    }
  } catch (_) {}
}

function uint8ArrayToUrlBase64(bytes) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function urlBase64ToUint8Array(base64) {
  let standard = base64.replace(/-/g, "+").replace(/_/g, "/");
  while (standard.length % 4 !== 0) {
    standard += "=";
  }
  const binary = atob(standard);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function encodeSharePayload(list) {
  try {
    const compact = {
      t: list.title,
      i: (list.items || []).map((it) => [
        it.name,
        it.category,
        it.store,
        it.quantity,
        it.unit,
        it.price,
      ]),
    };
    const jsonStr = JSON.stringify(compact);
    const rawBytes = new TextEncoder().encode(jsonStr);
    if (typeof CompressionStream !== "undefined") {
      const cs = new CompressionStream("deflate");
      const writer = cs.writable.getWriter();
      writer.write(rawBytes);
      writer.close();
      const buffer = await new Response(cs.readable).arrayBuffer();
      return "cz:" + uint8ArrayToUrlBase64(new Uint8Array(buffer));
    }
    return "b64:" + uint8ArrayToUrlBase64(rawBytes);
  } catch (e) {
    return "";
  }
}

async function decodeSharePayload(encoded) {
  if (!encoded || typeof encoded !== "string") return null;
  const trimmed = encoded.trim();
  try {
    let jsonStr = "";
    if (trimmed.startsWith("cz:")) {
      const rawBase64 = trimmed.slice(3);
      const bytes = urlBase64ToUint8Array(rawBase64);
      if (typeof DecompressionStream !== "undefined") {
        const ds = new DecompressionStream("deflate");
        const writer = ds.writable.getWriter();
        writer.write(bytes);
        writer.close();
        const buffer = await new Response(ds.readable).arrayBuffer();
        jsonStr = new TextDecoder().decode(buffer);
      } else {
        return null;
      }
    } else if (trimmed.startsWith("b64:")) {
      const rawBase64 = trimmed.slice(4);
      const bytes = urlBase64ToUint8Array(rawBase64);
      jsonStr = new TextDecoder().decode(bytes);
    } else {
      // Legacy uncompressed Base64 decoding (backward compatibility)
      try {
        const bytes = urlBase64ToUint8Array(trimmed);
        jsonStr = new TextDecoder().decode(bytes);
      } catch (e) {
        try {
          const raw = atob(trimmed);
          jsonStr = decodeURIComponent(
            raw
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
        } catch (e2) {
          jsonStr = atob(trimmed);
        }
      }
    }

    const data = JSON.parse(jsonStr);
    return {
      title: data.t || data.title || "Shared List",
      items: (data.i || data.items || []).map((arr) => {
        if (Array.isArray(arr)) {
          return {
            id: generateItemId("shared"),
            name: arr[0],
            category: arr[1],
            store: arr[2],
            quantity: arr[3],
            unit: arr[4],
            price: arr[5],
            checked: false,
          };
        }
        return {
          id: arr.id || generateItemId("shared"),
          name: arr.name,
          category: arr.category || "other",
          store: arr.store || "Supermarket",
          quantity: parseFloat(arr.quantity) || 1,
          unit: arr.unit || "unit",
          price: parseFloat(arr.price) || 0,
          checked: !!arr.checked,
        };
      }),
    };
  } catch (e) {
    return null;
  }
}

async function generateBuyListTextChecklist(list) {
  const target = list ||
    (memoryState && memoryState.activeList) || {
      title: "Shopping List",
      items: [],
    };
  const title = target.title || "Shopping List";
  const items = Array.isArray(target.items) ? target.items : [];
  const lines = [`🛒 ${title} (${items.length} items):`];

  let totalEst = 0;
  items.forEach((it) => {
    const priceVal = parseFloat(it.price) || 0;
    totalEst += priceVal;
    const storeTag = it.store ? ` [${it.store}]` : "";
    const qtyTag = `${it.quantity || 1} ${it.unit || "unit"}`;
    const priceTag = priceVal > 0 ? ` ~ ${formatCurrency(priceVal)}` : "";
    lines.push(`- [ ] ${it.name} (${qtyTag}${storeTag})${priceTag}`);
  });

  if (totalEst > 0) {
    const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
    const estLabel = t.kpi_estimated || "Total Estimated";
    lines.push(`\n💰 ${estLabel}: ${formatCurrency(totalEst)}`);
  }

  const payload = await encodeSharePayload(target);
  if (payload && typeof window !== "undefined" && window.location) {
    const shareUrl = `${window.location.origin}${window.location.pathname}#share=${payload}`;
    lines.push(`\n🔗 Import List: ${shareUrl}`);
  }

  return lines.join("\n");
}

async function copyBuyListTextChecklist() {
  const activeShare = getActiveShareList();
  const text = await generateBuyListTextChecklist(activeShare);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => {
      showToast(
        TRANSLATIONS[currentLanguage].toast_text_checklist_copied ||
          "Text checklist copied to clipboard!"
      );
    });
  }
}

async function copyShareUrl() {
  const activeShare = getActiveShareList();
  const payload = await encodeSharePayload(activeShare);
  const url = `${window.location.origin}${window.location.pathname}#share=${payload}`;
  if (url.length > 2048) {
    const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
    showToast(
      t.toast_share_url_too_long ||
        "Warning: Share URL exceeds 2,048 characters. Consider exporting a JSON file instead."
    );
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(url).then(() => {
      showToast(
        TRANSLATIONS[currentLanguage].toast_share_copied ||
          "Share link copied to clipboard!"
      );
    });
  }
}

async function invokeNativeShare() {
  const activeShare = getActiveShareList();
  const payload = await encodeSharePayload(activeShare);
  const url = `${window.location.origin}${window.location.pathname}#share=${payload}`;
  if (url.length > 2048) {
    const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.vi;
    showToast(
      t.toast_share_url_too_long ||
        "Warning: Share URL exceeds 2,048 characters. Consider exporting a JSON file instead."
    );
  }
  const text = await generateBuyListTextChecklist(activeShare);
  if (navigator.share) {
    navigator
      .share({
        title: activeShare.title || "Smart Buy-List",
        text: text,
        url: url,
      })
      .catch(() => {});
  } else {
    copyShareUrl();
  }
}

function exportBuyListJsonFile() {
  const activeShare = getActiveShareList();
  const payload = {
    title: activeShare.title || "Shopping List",
    items: activeShare.items || [],
  };
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute(
    "download",
    `smart-buy-list-${new Date().toISOString().slice(0, 10)}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast(
    TRANSLATIONS[currentLanguage].toast_list_file_exported ||
      "Buy-List file (.json) exported!"
  );
}

function exportJsonBackup() {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(memoryState, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute(
    "download",
    `smart-buy-list-backup-${new Date().toISOString().slice(0, 10)}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast(
    TRANSLATIONS[currentLanguage].toast_backup_exported ||
      "JSON backup exported!"
  );
}

function copyBuyListJson() {
  const activeShare = getActiveShareList();
  const payload = {
    title: activeShare.title || "Shopping List",
    items: activeShare.items || [],
  };
  const str = JSON.stringify(payload, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(str).then(() => {
      showToast(
        TRANSLATIONS[currentLanguage].toast_list_json_copied ||
          "Buy-List JSON copied to clipboard!"
      );
    });
  }
}

function copyBackupJson() {
  const str = JSON.stringify(memoryState, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(str).then(() => {
      showToast(
        TRANSLATIONS[currentLanguage].toast_backup_json_copied ||
          "Full backup JSON copied to clipboard!"
      );
    });
  }
}

function pasteJsonFromClipboard() {
  if (navigator.clipboard && navigator.clipboard.readText) {
    return navigator.clipboard
      .readText()
      .then((text) => {
        if (text && text.trim()) {
          return processImportData(text.trim());
        } else {
          openPasteJsonModal();
        }
      })
      .catch(() => {
        openPasteJsonModal();
      });
  } else {
    openPasteJsonModal();
  }
}

function openPasteJsonModal() {
  const textarea = document.getElementById("pasteJsonTextarea");
  if (textarea) textarea.value = "";
  openModal("pasteJsonModal");
  if (textarea) textarea.focus();
}

async function submitPasteJson() {
  const textarea = document.getElementById("pasteJsonTextarea");
  const val = textarea && textarea.value ? textarea.value.trim() : "";
  if (!val) {
    showToast(
      TRANSLATIONS[currentLanguage].toast_invalid_clipboard_data ||
        "Invalid clipboard data. Expected JSON or share link."
    );
    return;
  }
  await processImportData(val);
}

async function processImportData(rawText) {
  if (!rawText || typeof rawText !== "string") {
    showToast(
      TRANSLATIONS[currentLanguage].toast_invalid_clipboard_data ||
        "Invalid clipboard data. Expected JSON or share link."
    );
    return false;
  }

  const trimmed = rawText.trim();

  // 1. URL / Hash detection: #share=<payload>
  if (trimmed.includes("#share=")) {
    const hashPart = trimmed.split("#share=")[1];
    const payload = hashPart ? hashPart.split("&")[0] : "";
    const decoded = await decodeSharePayload(payload);
    if (decoded && Array.isArray(decoded.items)) {
      window.pendingSharedList = decoded;
      closeModal("pasteJsonModal");
      closeModal("settingsModal");
      openMergeReviewModal(decoded);
      applyTranslations();
      return true;
    }
  }

  // 2. Direct Base64 Share Payload string (e.g. from decodeSharePayload)
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    const decoded = await decodeSharePayload(trimmed);
    if (decoded && Array.isArray(decoded.items) && decoded.items.length > 0) {
      window.pendingSharedList = decoded;
      closeModal("pasteJsonModal");
      closeModal("settingsModal");
      openMergeReviewModal(decoded);
      applyTranslations();
      return true;
    }
  }

  // 3. JSON parsing
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") {
      // 3A. Full Database Backup
      if (
        parsed.activeList ||
        Array.isArray(parsed.purchaseLedger) ||
        Array.isArray(parsed.stores)
      ) {
        closeModal("pasteJsonModal");
        openBackupPreviewModal(parsed);
        return true;
      }

      // 3B. Active Buy-List JSON ({ title, items } or { t, i })
      if (Array.isArray(parsed.items) || Array.isArray(parsed.i)) {
        let title = parsed.title || parsed.t || "Shared List";
        let items = [];
        if (Array.isArray(parsed.items)) {
          items = parsed.items.map((it) => ({
            id: it.id && isValidId(it.id) ? it.id : generateItemId("shared"),
            name: it.name || "Item",
            category: it.category || "other",
            store: it.store || "Supermarket",
            quantity: parseFloat(it.quantity) || 1,
            unit: it.unit || "unit",
            price: parseFloat(it.price) || 0,
            checked: !!it.checked,
          }));
        } else if (Array.isArray(parsed.i)) {
          items = parsed.i.map((arr) => ({
            id: generateItemId("shared"),
            name: arr[0] || "Item",
            category: arr[1] || "other",
            store: arr[2] || "Supermarket",
            quantity: parseFloat(arr[3]) || 1,
            unit: arr[4] || "unit",
            price: parseFloat(arr[5]) || 0,
            checked: false,
          }));
        }
        window.pendingSharedList = { title, items };
        closeModal("pasteJsonModal");
        closeModal("settingsModal");
        openMergeReviewModal(window.pendingSharedList);
        applyTranslations();
        return true;
      }
    }
  } catch (e) {
    // not valid JSON
  }

  showToast(
    TRANSLATIONS[currentLanguage].toast_invalid_clipboard_data ||
      "Invalid clipboard data. Expected JSON or share link."
  );
  return false;
}

function resolveStoreAlias(inputStore) {
  if (!inputStore || typeof inputStore !== "string") return inputStore;
  const knownStores = (memoryState && memoryState.stores) || DEFAULT_STORES;
  return resolveStoreFromTag(inputStore, knownStores) || inputStore;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    uint8ArrayToUrlBase64,
    urlBase64ToUint8Array,
    encodeSharePayload,
    decodeSharePayload,
    generateBuyListTextChecklist,
    copyBuyListTextChecklist,
    resolveStoreAlias,
  };
}
