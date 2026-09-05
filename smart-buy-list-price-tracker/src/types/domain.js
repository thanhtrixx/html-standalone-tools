/**
 * Domain Type Definitions for Smart Buy-List & Unit Price Tracker
 * @module types/domain
 * @see ADR-0031: Modular Source Architecture, JSDoc Domain Contracts & Observable State Container
 */

/**
 * Physical measurement dimension for price comparison.
 * @typedef {"MASS" | "VOLUME" | "COUNT"} Dimension
 */

/**
 * Supported unit identifier across mass, volume, and discrete count.
 * @typedef {
 *   | "kg" | "g" | "oz" | "lb"
 *   | "L" | "ml" | "fl oz" | "gal"
 *   | "ea" | "pk" | "box" | "can" | "loc" | "thung" | "khay" | "tui" | "hu" | "bunch"
 * } UnitIdentifier
 */

/**
 * Metadata definition for a unit of measurement.
 * @typedef {Object} UnitDefinition
 * @property {UnitIdentifier} id - Standard unit symbol
 * @property {Dimension} dimension - Physical dimension
 * @property {number} toBaseRatio - Multiplier to convert to base unit
 * @property {string} baseUnit - Base unit symbol (kg, L, ea)
 * @property {string} [nameKey] - Translation key for unit display name
 * @property {string} [symbol] - Display symbol
 */

/**
 * Dimension conversion rule dictionary.
 * @typedef {Object} ConversionRule
 * @property {Dimension} dimension - Physical dimension
 * @property {string} baseUnit - Canonical base unit
 * @property {Record<string, number>} units - Map of unit identifiers to base ratios
 */

/**
 * Canonical master catalog item definition.
 * @typedef {Object} MasterItem
 * @property {string} id - Unique monotonic identifier
 * @property {string} name - Product display name
 * @property {string} category - Aisle / Department category
 * @property {UnitIdentifier|string} defaultUnit - Preferred unit
 * @property {Dimension} dimension - Physical dimension
 * @property {string} [notes] - Optional user description
 * @property {string} [createdAt] - ISO-8601 creation timestamp
 * @property {string} [updatedAt] - ISO-8601 update timestamp
 */

/**
 * Active shopping list item.
 * @typedef {Object} ListItem
 * @property {string} id - Unique monotonic identifier (e.g. item_1740000000_abcd1234)
 * @property {string} name - Product display name
 * @property {string} category - Aisle / Department category
 * @property {string} store - Assigned store name or ID
 * @property {number} quantity - Target purchase quantity
 * @property {UnitIdentifier|string} unit - Measurement unit
 * @property {number} estimatedPrice - Shelf price for this item
 * @property {boolean} checked - Whether marked as bought in Buy Mode
 * @property {number|string} [packageSize] - Package size number
 * @property {UnitIdentifier|string} [packageUnit] - Unit of the package size
 * @property {string} [notes] - Optional aisle or package notes
 * @property {string} [createdAt] - ISO-8601 creation timestamp
 * @property {string} [updatedAt] - ISO-8601 update timestamp
 * @property {boolean} [deleted] - Soft-delete flag
 */

/**
 * Deal rating score categories.
 * @typedef {"GREAT" | "FAIR" | "SPIKE" | "NEW"} DealRatingScore
 */

/**
 * Deal rating evaluation result for a shelf or ledger unit price.
 * @typedef {Object} DealEvaluation
 * @property {DealRatingScore} rating - Evaluated deal category
 * @property {number} currentUnitPrice - Evaluated unit price
 * @property {number|null} atlPrice - All-Time Low unit price
 * @property {number|null} avgPrice - Historical average unit price
 * @property {number|null} lastPrice - Most recent purchase unit price
 * @property {number|null} percentVsAvg - Percentage variance vs historical average
 * @property {number|null} percentVsAtl - Percentage variance vs all-time low
 * @property {string} label - Localized deal badge label
 * @property {string} badgeClass - Tailwind badge styling classes
 */

/**
 * Historical purchase ledger transaction record.
 * @typedef {Object} LedgerEntry
 * @property {string} id - Unique transaction identifier (e.g. led_1740000000_abcd1234)
 * @property {string} [itemId] - Associated master item ID
 * @property {string} itemName - Product name
 * @property {string} category - Aisle / Department category
 * @property {string} store - Store where purchased
 * @property {string} date - ISO-8601 or YYYY-MM-DD purchase date
 * @property {number} packagePrice - Sticker shelf price paid
 * @property {number} packageQuantity - Physical package quantity
 * @property {UnitIdentifier|string} packageUnit - Package measurement unit
 * @property {number} normalizedUnitPrice - Computed unit price per base unit
 * @property {string} baseUnit - Standardized base unit (kg, L, ea)
 * @property {string} [tripId] - ID of the completed shopping trip
 * @property {string} [notes] - Notes recorded during purchase
 * @property {string} [createdAt] - ISO-8601 timestamp
 * @property {string} [updatedAt] - ISO-8601 timestamp
 * @property {boolean} [deleted] - Soft-delete flag
 */

/**
 * Retail store profile.
 * @typedef {Object} StoreProfile
 * @property {string} [id] - Unique store ID
 * @property {string} name - Retail venue name
 * @property {string} [color] - Hex or Tailwind accent color
 * @property {string} [createdAt] - ISO-8601 timestamp
 * @property {string} [updatedAt] - ISO-8601 timestamp
 * @property {boolean} [deleted] - Soft-delete flag
 */

/**
 * Map of canonical store names to recognized alias patterns.
 * @typedef {Record<string, Array<string>>} StoreAliasesMap
 */

/**
 * Cloud storage synchronization configuration.
 * @typedef {Object} CloudSyncConfig
 * @property {"google-drive" | "github-gist" | "none"} provider - Active cloud provider
 * @property {boolean} autoSyncEnabled - Whether ambient auto-sync is enabled
 * @property {string} [githubGistToken] - GitHub Personal Access Token (PAT)
 * @property {string} [githubGistId] - Target private Gist ID
 * @property {string} [googleDriveToken] - Google OAuth access token
 * @property {string} [googleDriveFileId] - Target Google Drive appData file ID
 * @property {string} [lastSyncTime] - ISO-8601 timestamp of last sync
 */

/**
 * Three-way cloud merge conflict and resolution summary.
 * @typedef {Object} ThreeWayMergeResult
 * @property {AppState} mergedState - Resulting consolidated state
 * @property {boolean} hasConflicts - Whether manual conflict resolution was required
 * @property {Array<any>} conflicts - Array of detected conflicts
 * @property {Object} stats - Modification statistics
 * @property {number} [stats.itemsAdded] - Count of items added
 * @property {number} [stats.itemsUpdated] - Count of items updated
 * @property {number} [stats.itemsDeleted] - Count of items deleted
 * @property {number} [stats.ledgerAdded] - Count of ledger entries added
 * @property {number} [stats.storesAdded] - Count of stores added
 */

/**
 * IndexedDB rolling database snapshot record.
 * @typedef {Object} SnapshotRecord
 * @property {string} id - Monotonic snapshot ID
 * @property {"trip_completion" | "pre_restore" | "manual"} type - Trigger type
 * @property {string} timestamp - ISO-8601 snapshot creation time
 * @property {string} description - Human-readable label
 * @property {number} itemCount - Active list items count
 * @property {number} ledgerCount - Purchase ledger count
 * @property {AppState} state - Cloned state payload
 */

/**
 * Compressed share URL and JSON interchange payload.
 * @typedef {Object} SharePayload
 * @property {number} v - Payload schema version (e.g. 1, 2)
 * @property {string|number} timestamp - Sharing timestamp
 * @property {string} [title] - Optional list title
 * @property {Array<ListItem>} items - Array of active items
 * @property {Array<string>} [stores] - Included store names
 */

/**
 * Active shopping list container.
 * @typedef {Object} ActiveList
 * @property {string} id - List identifier
 * @property {string} title - List title
 * @property {Array<ListItem>} items - List items
 */

/**
 * Application preferences and runtime settings.
 * @typedef {Object} AppSettings
 * @property {"vi" | "en"} language - UI language
 * @property {"VND" | "USD"} currency - Active currency code
 * @property {"dark" | "light" | "system"} theme - Display theme
 * @property {"PLANNING" | "BUY"} tripPhase - Current shopping trip stage
 * @property {"AISLE" | "STORE"} grouping - Active list grouping strategy
 * @property {"metric" | "imperial"} unitSystem - Unit measurement preference
 * @property {"comfortable" | "compact"} density - UI density preference
 * @property {boolean} vibrate - Enable haptic vibration feedback
 * @property {string} [cloudProvider] - Active cloud sync provider
 * @property {string} [githubToken] - Encrypted or masked PAT
 * @property {string} [githubGistId] - Cloud sync Gist ID
 * @property {string} [lastCloudSync] - ISO-8601 last cloud sync
 */

/**
 * Deletion tombstone map for distributed sync pruning.
 * @typedef {Object} DeletedTombstones
 * @property {Record<string, string>} items - Deleted item IDs mapped to ISO-8601 timestamps
 * @property {Record<string, string>} ledger - Deleted ledger entry IDs mapped to ISO-8601 timestamps
 * @property {Record<string, string>} stores - Deleted store names mapped to ISO-8601 timestamps
 */

/**
 * Complete root state tree for Smart Buy-List.
 * @typedef {Object} AppState
 * @property {ActiveList} activeList - Active shopping list
 * @property {Array<MasterItem>} catalog - Persistent master catalog
 * @property {Array<LedgerEntry>} purchaseLedger - Historical purchase ledger
 * @property {Array<string>} stores - Available store names
 * @property {StoreAliasesMap} storeAliases - Store alias dictionary
 * @property {AppSettings} settings - User settings and preferences
 * @property {DeletedTombstones} _deleted - Deletion tombstones for 30-day sync
 * @property {Array<SnapshotRecord>} [snapshots] - Rolling database snapshots
 */

/**
 * Dispatched state action container.
 * @typedef {Object} Action
 * @property {string} type - Action type discriminator
 * @property {any} [payload] - Optional action payload
 */

/**
 * State subscriber callback.
 * @typedef {(state: AppState, action: Action) => void} StoreListener
 */

/**
 * Observable state store contract.
 * @typedef {Object} Store
 * @property {() => AppState} getState - Retrieve current state snapshot
 * @property {(action: Action) => Action} dispatch - Dispatch action transition
 * @property {(listener: StoreListener) => () => void} subscribe - Subscribe to state changes
 * @property {(nextState: AppState) => Action} replaceState - Overwrite state snapshot
 * @property {(item: ListItem) => ListItem} addItem - Add new item to shopping list
 * @property {(id: string, patch: Object) => ListItem|null} updateItem - Update item by ID
 * @property {(id: string) => boolean} deleteItem - Delete item by ID
 * @property {(id: string) => ListItem|null} toggleItemCheck - Toggle item checked state
 * @property {(phase: string) => void} setTripPhase - Set active trip phase
 * @property {(grouping: string) => void} setGrouping - Set active grouping
 * @property {(storeName: string) => void} setStoreFilter - Set store filter
 * @property {(payload: Object) => void} completeTrip - Finalize shopping trip
 * @property {(diff: Object) => void} applyMerge - Apply merge diff
 * @property {(snapshotId: string) => boolean} restoreSnapshot - Restore snapshot by ID
 */

// Export constants for runtime usage across modules
export const DIMENSIONS = Object.freeze({
  MASS: "MASS",
  VOLUME: "VOLUME",
  COUNT: "COUNT",
});

export const DEAL_RATINGS = Object.freeze({
  GREAT: "GREAT",
  FAIR: "FAIR",
  SPIKE: "SPIKE",
  NEW: "NEW",
});

export const TRIP_PHASES = Object.freeze({
  PLANNING: "PLANNING",
  BUY: "BUY",
});

export const LIST_GROUPINGS = Object.freeze({
  AISLE: "AISLE",
  STORE: "STORE",
});

export const SNAPSHOT_TYPES = Object.freeze({
  TRIP_COMPLETION: "trip_completion",
  PRE_RESTORE: "pre_restore",
  MANUAL: "manual",
});
