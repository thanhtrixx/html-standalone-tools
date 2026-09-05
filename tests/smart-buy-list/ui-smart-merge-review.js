#!/usr/bin/env node

/**
 * Smart Buy-List Interactive Smart Merge & Store-Scoped Sharing Test Suite
 * Slice 2 (Issue #306 / CAP-35 / ADR-0030)
 */

const fs = require("fs");
const path = require("path");
const {
  getHtmlContent,
  createTrackerSandbox,
} = require("../helpers/smart-buy-list-harness");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log(
    "\n🧪 Running Smart Buy-List Interactive Smart Merge Test Suite (Issue #306)...\n"
  );

  const rawHtml = getHtmlContent();
  const { sandbox } = createTrackerSandbox();

  // SECTION 1: DOM Elements Verification
  console.log("--- Section 1: DOM Elements Verification ---");

  assert(
    rawHtml.includes('id="mergeReviewModal"'),
    "MERGE-DOM-01: #mergeReviewModal dialog element exists in HTML"
  );
  assert(
    rawHtml.includes('id="mergeStatsSummary"'),
    "MERGE-DOM-02: #mergeStatsSummary stats bar exists"
  );
  assert(
    rawHtml.includes('id="mergeGlobalQtyStrategy"'),
    "MERGE-DOM-03: #mergeGlobalQtyStrategy batch quantity selector exists"
  );
  assert(
    rawHtml.includes('id="mergeUpdatePriceCatalog"'),
    "MERGE-DOM-04: #mergeUpdatePriceCatalog checkbox exists"
  );
  assert(
    rawHtml.includes('id="mergeDiffList"'),
    "MERGE-DOM-05: #mergeDiffList scrollable diff container exists"
  );
  assert(
    rawHtml.includes('id="btnApplyMerge"'),
    "MERGE-DOM-06: #btnApplyMerge action button exists"
  );
  assert(
    rawHtml.includes('id="btnImportAsNewList"'),
    "MERGE-DOM-07: #btnImportAsNewList action button exists"
  );
  assert(
    rawHtml.includes('id="shareScopeContainer"'),
    "SHARE-DOM-05: #shareScopeContainer element exists in share modal"
  );
  assert(
    rawHtml.includes('id="btnShareScopeAll"') &&
      rawHtml.includes('id="btnShareScopeFiltered"'),
    "SHARE-DOM-06: All stores and filtered store scope buttons exist"
  );

  // SECTION 2: Item Diff Categorization & Store Alias Resolution
  console.log(
    "\n--- Section 2: Item Diff Categorization & Store Alias Normalization ---"
  );

  assert(
    typeof sandbox.computeMergeDiff === "function",
    "MERGE-FUNC-01: computeMergeDiff is exported globally"
  );
  assert(
    typeof sandbox.resolveStoreAlias === "function",
    "MERGE-FUNC-02: resolveStoreAlias is exported globally"
  );

  // Test Store Alias normalization
  const resolvedTjs = sandbox.resolveStoreAlias("tjs");
  assert(
    resolvedTjs === "Trader Joe's",
    `MERGE-ALIAS-01: 'tjs' resolves to 'Trader Joe\\'s' (Got: '${resolvedTjs}')`
  );
  const resolvedCostco = sandbox.resolveStoreAlias("costco wholesale");
  assert(
    resolvedCostco === "Costco",
    `MERGE-ALIAS-02: 'costco wholesale' resolves to 'Costco' (Got: '${resolvedCostco}')`
  );

  // Active items setup
  const activeItems = [
    {
      id: "a1",
      name: "Organic Milk",
      store: "Costco",
      quantity: 1,
      unit: "gal",
      price: 4.5,
    },
    {
      id: "a2",
      name: "Sourdough Loaf",
      store: "Bakery",
      quantity: 2,
      unit: "ea",
      price: 6.0,
    },
    {
      id: "a3",
      name: "Avocados",
      store: "Local Market",
      quantity: 4,
      unit: "ea",
      price: 5.0,
    },
    {
      id: "a4",
      name: "Ground Beef",
      store: "Costco",
      quantity: 1,
      unit: "kg",
      price: 12.0,
    },
  ];

  // Incoming items
  const incomingItems = [
    {
      name: "Organic Milk",
      store: "costco wholesale",
      quantity: 2, // Qty Diff: 1 -> 2
      unit: "gal",
      price: 4.5, // Same price
    },
    {
      name: "Sourdough Loaf",
      store: "Bakery",
      quantity: 2, // Same qty: 2
      unit: "ea",
      price: 7.5, // Price Diff: 6.0 -> 7.5
    },
    {
      name: "Avocados",
      store: "Local Market",
      quantity: 6, // Qty Diff: 4 -> 6
      unit: "ea",
      price: 6.5, // Price Diff: 5.0 -> 6.5
    },
    {
      name: "Ground Beef",
      store: "Costco",
      quantity: 1, // Same qty: 1
      unit: "kg",
      price: 12.0, // Same price: 12.0 -> Match!
    },
    {
      name: "Fresh Strawberries",
      store: "tjs",
      quantity: 1,
      unit: "pk",
      price: 3.99, // New item!
    },
  ];

  const diffResult = sandbox.computeMergeDiff(incomingItems, activeItems);
  assert(
    diffResult.counts.newCount === 1,
    `MERGE-DIFF-01: Correctly identified 1 NEW item (Got: ${diffResult.counts.newCount})`
  );
  assert(
    diffResult.counts.qtyDiffCount === 2, // Organic Milk + Avocados
    `MERGE-DIFF-02: Correctly identified 2 items with Qty differences (Got: ${diffResult.counts.qtyDiffCount})`
  );
  assert(
    diffResult.counts.priceDiffCount === 2, // Sourdough Loaf + Avocados
    `MERGE-DIFF-03: Correctly identified 2 items with Price differences (Got: ${diffResult.counts.priceDiffCount})`
  );
  assert(
    diffResult.counts.matchCount === 1, // Ground Beef
    `MERGE-DIFF-04: Correctly identified 1 MATCH item (Got: ${diffResult.counts.matchCount})`
  );

  const newDiff = diffResult.diffItems.find(
    (d) => d.incoming.name === "Fresh Strawberries"
  );
  assert(
    newDiff &&
      newDiff.status === "NEW" &&
      newDiff.incoming.store === "Trader Joe's",
    "MERGE-DIFF-05: New item has store alias normalized to 'Trader Joe\\'s'"
  );

  // SECTION 3: Interactive Quantity Strategies
  console.log("\n--- Section 3: Interactive Quantity Strategies ---");

  // Setup memoryState for merge test
  sandbox.memoryState.activeList = {
    title: "Household Groceries",
    items: JSON.parse(JSON.stringify(activeItems)),
  };
  sandbox.memoryState.purchaseLedger = [];

  // Test 3A: Apply Merge with SUM strategy
  sandbox.pendingSharedList = {
    title: "Incoming List",
    items: JSON.parse(JSON.stringify(incomingItems)),
  };

  sandbox.renderMergeReviewModal(sandbox.pendingSharedList);
  assert(
    sandbox.currentMergeDiff !== null,
    "MERGE-STATE-01: currentMergeDiff populated upon rendering review modal"
  );

  // Set global qty strategy to SUM
  sandbox.onMergeGlobalQtyStrategyChange("SUM");
  sandbox.applySmartMerge();

  const milkItem = sandbox.memoryState.activeList.items.find(
    (i) => i.name === "Organic Milk"
  );
  assert(
    milkItem && milkItem.quantity === 3, // 1 + 2 = 3
    `MERGE-QTY-01: SUM strategy resulted in quantity 3 (Got: ${milkItem?.quantity})`
  );

  const strawItem = sandbox.memoryState.activeList.items.find(
    (i) => i.name === "Fresh Strawberries"
  );
  assert(
    strawItem !== undefined && strawItem.store === "Trader Joe's",
    "MERGE-NEW-01: New item successfully appended to active list with normalized store"
  );

  // Test 3B: Test REMOTE override quantity strategy
  sandbox.memoryState.activeList.items = JSON.parse(
    JSON.stringify(activeItems)
  );
  sandbox.renderMergeReviewModal(sandbox.pendingSharedList);
  sandbox.onMergeGlobalQtyStrategyChange("REMOTE");
  sandbox.applySmartMerge();

  const milkRemote = sandbox.memoryState.activeList.items.find(
    (i) => i.name === "Organic Milk"
  );
  assert(
    milkRemote && milkRemote.quantity === 2, // Taken from incoming: 2
    `MERGE-QTY-02: REMOTE strategy took remote quantity 2 (Got: ${milkRemote?.quantity})`
  );

  // SECTION 4: Price Strategy & Store Price Catalog Sync
  console.log("\n--- Section 4: Price Strategy & Price Catalog Sync ---");

  sandbox.memoryState.activeList.items = JSON.parse(
    JSON.stringify(activeItems)
  );
  sandbox.memoryState.purchaseLedger = [];
  sandbox.renderMergeReviewModal(sandbox.pendingSharedList);

  // Ensure price update is accepted and catalog sync is enabled
  const sourdoughDiff = sandbox.currentMergeDiff.diffItems.find(
    (d) => d.incoming.name === "Sourdough Loaf"
  );
  assert(
    sourdoughDiff && sourdoughDiff.useRemotePrice === true,
    "MERGE-PRICE-01: Sourdough Loaf defaults to using remote updated price"
  );

  sandbox.applySmartMerge();

  const sourdoughUpdated = sandbox.memoryState.activeList.items.find(
    (i) => i.name === "Sourdough Loaf"
  );
  assert(
    sourdoughUpdated && sourdoughUpdated.price === 7.5,
    `MERGE-PRICE-02: Active item price updated to 7.5 (Got: ${sourdoughUpdated?.price})`
  );
  assert(
    sandbox.memoryState.purchaseLedger.length > 0,
    `MERGE-CATALOG-01: Price catalog synchronized into purchaseLedger (Count: ${sandbox.memoryState.purchaseLedger.length})`
  );

  // SECTION 5: Rollback Snapshot on Replace
  console.log("\n--- Section 5: Rollback Snapshot on Replace ---");

  sandbox.memoryState.activeList = {
    title: "Important Active List",
    items: [{ id: "keep1", name: "Do Not Lose Me", price: 10, quantity: 1 }],
  };
  sandbox.memoryState.snapshots = [];

  sandbox.pendingSharedList = {
    title: "New Incoming Haul",
    items: [
      { id: "in1", name: "Completely New Haul Item", price: 25, quantity: 2 },
    ],
  };

  sandbox.importAsNewListWithSnapshot();

  assert(
    sandbox.memoryState.activeList.title === "New Incoming Haul",
    "MERGE-REPLACE-01: Active list title replaced with new list title"
  );
  assert(
    sandbox.memoryState.activeList.items.length === 1 &&
      sandbox.memoryState.activeList.items[0].name ===
        "Completely New Haul Item",
    "MERGE-REPLACE-02: Active items replaced with incoming items"
  );
  assert(
    Array.isArray(sandbox.memoryState.snapshots) &&
      sandbox.memoryState.snapshots.length === 1,
    "MERGE-SNAP-01: Rollback snapshot was automatically recorded before overwrite"
  );
  assert(
    sandbox.memoryState.snapshots[0].activeList.items[0].name ===
      "Do Not Lose Me",
    "MERGE-SNAP-02: Rollback snapshot preserved previous active list items"
  );

  // SECTION 6: Store-Scoped Sharing
  console.log("\n--- Section 6: Store-Scoped Sharing ---");

  sandbox.memoryState.activeList = {
    title: "Multi-Store Trip",
    items: [
      {
        id: "s1",
        name: "Costco Item 1",
        store: "Costco",
        price: 10,
        quantity: 1,
      },
      {
        id: "s2",
        name: "Costco Item 2",
        store: "Costco",
        price: 20,
        quantity: 2,
      },
      {
        id: "s3",
        name: "TJ Item",
        store: "Trader Joe's",
        price: 5,
        quantity: 1,
      },
    ],
  };

  // When currentStoreFilter is "ALL"
  sandbox.currentStoreFilter = "ALL";
  sandbox.setShareScope("ALL");
  const allList = sandbox.getActiveShareList();
  assert(
    allList.items.length === 3,
    `SHARE-SCOPE-01: 'ALL' scope returns all 3 items (Got: ${allList.items.length})`
  );

  // When currentStoreFilter is "Costco" and scope is "FILTERED"
  sandbox.currentStoreFilter = "Costco";
  sandbox.setShareScope("FILTERED");
  const costcoList = sandbox.getActiveShareList();
  assert(
    costcoList.items.length === 2,
    `SHARE-SCOPE-02: 'FILTERED' scope returns 2 Costco items (Got: ${costcoList.items.length})`
  );
  assert(
    costcoList.title.includes("Costco"),
    `SHARE-SCOPE-03: Filtered share list title contains store name (Got: '${costcoList.title}')`
  );

  // SECTION 7: Bilingual Translation Parity
  console.log("\n--- Section 7: Bilingual Translation Parity ---");

  const requiredKeys = [
    "merge_modal_title",
    "merge_modal_subtitle",
    "merge_stat_new",
    "merge_stat_price",
    "merge_stat_qty",
    "merge_stat_match",
    "merge_global_qty_strategy",
    "merge_qty_sum",
    "merge_qty_remote",
    "merge_qty_local",
    "merge_update_price_catalog",
    "btn_apply_merge",
    "btn_import_new_list_snapshot",
    "toast_smart_merge_success",
    "toast_snapshot_created",
    "badge_new_item",
    "badge_price_diff",
    "badge_qty_diff",
    "badge_matched",
    "lbl_share_scope",
  ];

  requiredKeys.forEach((key) => {
    assert(
      sandbox.TRANSLATIONS.en[key] !== undefined,
      `I18N-EN: English translation exists for '${key}'`
    );
    assert(
      sandbox.TRANSLATIONS.vi[key] !== undefined,
      `I18N-VI: Vietnamese translation exists for '${key}'`
    );
  });

  console.log(
    `\n==================================================\n📊 Smart Merge Test Summary: ${passed} Passed, ${failed} Failed\n==================================================\n`
  );

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
