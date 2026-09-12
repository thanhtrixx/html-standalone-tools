const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT_DIR = path.resolve(__dirname, "../..");
const HABIT_DIR = path.join(ROOT_DIR, "habit-tracker");
const HTML_PATH = path.join(HABIT_DIR, "index.html");
const MANIFEST_PATH = path.join(HABIT_DIR, "manifest.webmanifest");
const SW_PATH = path.join(HABIT_DIR, "sw.js");

let cachedHtml = null;
let cachedScripts = null;

function getHtmlContent() {
  if (!cachedHtml && fs.existsSync(HTML_PATH)) {
    cachedHtml = fs.readFileSync(HTML_PATH, "utf8");
  }
  return cachedHtml || "";
}

function getManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  }
  return {};
}

function getSwContent() {
  if (fs.existsSync(SW_PATH)) {
    return fs.readFileSync(SW_PATH, "utf8");
  }
  return "";
}

const HABIT_BUNDLE_MODULES = [
  "src/domain/engine.js",
  "src/i18n/translations.js",
  "src/storage/indexeddb.js",
  "src/state/store.js",
  "src/sync/export-import.js",
  "src/sync/cloud-backup.js",
  "src/ui/components.js",
  "src/ui/today-view.js",
  "src/ui/insights-view.js",
  "src/ui/manager-view.js",
  "src/ui/detail-sheet.js",
  "src/pwa/notifications.js",
  "src/app.js",
];

function bundleHabitTrackerFromSrc() {
  let combined = "";
  for (const relPath of HABIT_BUNDLE_MODULES) {
    const fullPath = path.join(HABIT_DIR, relPath);
    if (!fs.existsSync(fullPath)) continue;
    let content = fs.readFileSync(fullPath, "utf8");
    content = content.replace(
      /\nif\s*\(typeof module\s*!==\s*["']undefined["'][\s\S]*?\n\}\s*$/g,
      ""
    );
    combined += "\n" + content.trim() + "\n";
  }
  return combined;
}

function getHabitTrackerScripts() {
  const srcDir = path.join(HABIT_DIR, "src");
  if (fs.existsSync(srcDir)) {
    return bundleHabitTrackerFromSrc();
  }
  return "";
}

function createMockStorage(initialData = {}) {
  let store = { ...initialData };
  return {
    getItem: (key) => (key in store ? String(store[key]) : null),
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (i) => Object.keys(store)[i] || null,
    get length() {
      return Object.keys(store).length;
    },
    get _store() {
      return store;
    },
  };
}

class MockDOMElement {
  constructor(id = "", tagName = "div") {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this._className = "";
    this._classList = new Set();
    this.style = {};
    this.dataset = {};
    this.value = "";
    this.checked = false;
    this.type = "";
    this.placeholder = "";
    this.innerHTML = "";
    this.textContent = "";
    this.children = [];
    this.childNodes = [];
    this.parentNode = null;
    this.parentElement = null;
    this.listeners = {};
    this._attributes = {};

    const self = this;
    this.classList = {
      add: (...tokens) => {
        tokens.forEach((t) => {
          if (t) self._classList.add(t);
        });
        self._className = Array.from(self._classList).join(" ");
      },
      remove: (...tokens) => {
        tokens.forEach((t) => self._classList.delete(t));
        self._className = Array.from(self._classList).join(" ");
      },
      contains: (token) => self._classList.has(token),
      toggle: (token, force) => {
        if (typeof force === "boolean") {
          if (force) self.classList.add(token);
          else self.classList.remove(token);
          return force;
        }
        if (self._classList.has(token)) {
          self._classList.delete(token);
          self._className = Array.from(self._classList).join(" ");
          return false;
        } else {
          self._classList.add(token);
          self._className = Array.from(self._classList).join(" ");
          return true;
        }
      },
    };
  }

  get className() {
    return this._className || "";
  }

  set className(val) {
    this._className = String(val || "");
    this._classList = new Set(this._className.split(/\s+/).filter(Boolean));
  }

  setAttribute(name, val) {
    this._attributes[name] = String(val);
    if (name === "id") this.id = String(val);
    if (name === "class") {
      this.className = String(val);
      this._classList = new Set(String(val).split(/\s+/).filter(Boolean));
    }
  }

  getAttribute(name) {
    return name in this._attributes ? this._attributes[name] : null;
  }

  removeAttribute(name) {
    delete this._attributes[name];
    if (name === "class") {
      this.className = "";
      this._classList.clear();
    }
  }

  hasAttribute(name) {
    return name in this._attributes;
  }

  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }

  removeEventListener(type, fn) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter((l) => l !== fn);
  }

  dispatchEvent(event) {
    const list = this.listeners[event.type] || [];
    const ev = {
      target: this,
      currentTarget: this,
      preventDefault: () => {},
      stopPropagation: () => {},
      ...event,
    };
    for (const fn of list) {
      fn.call(this, ev);
    }
    if (event.bubbles) {
      if (this.parentElement && this.parentElement.dispatchEvent) {
        this.parentElement.dispatchEvent(ev);
      } else if (this.ownerDocument && this.ownerDocument.dispatchEvent) {
        this.ownerDocument.dispatchEvent(ev);
      }
    }
    return true;
  }

  click() {
    this.dispatchEvent({ type: "click", bubbles: true });
  }

  focus() {
    this.dispatchEvent({ type: "focus", bubbles: false });
  }

  blur() {
    this.dispatchEvent({ type: "blur", bubbles: false });
  }

  scrollIntoView() {}

  appendChild(child) {
    if (!child) return child;
    child.parentNode = this;
    child.parentElement = this;
    this.children.push(child);
    this.childNodes.push(child);
    return child;
  }

  removeChild(child) {
    this.children = this.children.filter((c) => c !== child);
    this.childNodes = this.childNodes.filter((c) => c !== child);
    if (child) {
      child.parentNode = null;
      child.parentElement = null;
    }
    return child;
  }

  insertBefore(newChild, refChild) {
    const idx = this.children.indexOf(refChild);
    if (idx === -1) {
      return this.appendChild(newChild);
    }
    newChild.parentNode = this;
    newChild.parentElement = this;
    this.children.splice(idx, 0, newChild);
    this.childNodes.splice(idx, 0, newChild);
    return newChild;
  }

  remove() {
    if (this.parentNode && this.parentNode.removeChild) {
      this.parentNode.removeChild(this);
    }
  }

  closest(selector) {
    if (this.matches(selector)) return this;
    if (this.parentElement && this.parentElement.closest) {
      return this.parentElement.closest(selector);
    }
    return null;
  }

  matches(selector) {
    if (selector.startsWith("#")) return this.id === selector.slice(1);
    if (selector.startsWith(".")) {
      const cls = selector.slice(1);
      return (
        this.classList.contains(cls) ||
        (this.className &&
          this.className.split(/\s+/).filter(Boolean).includes(cls))
      );
    }
    if (selector.startsWith("[") && selector.endsWith("]")) {
      const attrName = selector.slice(1, -1);
      return this.hasAttribute(attrName);
    }
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }

  querySelector(selector) {
    const list = this.querySelectorAll(selector);
    return list.length > 0 ? list[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    function search(node) {
      if (!node || !node.children) return;
      for (const child of node.children) {
        if (child.matches && child.matches(selector)) {
          results.push(child);
        }
        search(child);
      }
    }
    search(this);
    return results;
  }

  getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      right: 360,
      bottom: 640,
      width: 360,
      height: 640,
      x: 0,
      y: 0,
    };
  }
}

function createHabitTrackerSandbox(options = {}) {
  const elements = {};
  const globalListeners = {};

  const defaultHiddenElements = new Set([
    "habit-edit-modal-overlay",
    "detail-sheet-overlay",
    "backup-restore-overlay",
    "celebration-confetti-container",
  ]);

  function getOrCreateElement(id) {
    if (!elements[id]) {
      const el = new MockDOMElement(id);
      el.ownerDocument = doc;
      if (defaultHiddenElements.has(id)) {
        el.classList.add("hidden");
      }
      elements[id] = el;
    }
    return elements[id];
  }

  const localStorage = createMockStorage(options.storage || {});
  const sessionStorage = createMockStorage(options.sessionStorage || {});

  const docElement = new MockDOMElement("documentElement", "html");
  docElement.lang = options.lang || "vi";
  if (options.dark) docElement.classList.add("dark");

  const bodyElement = new MockDOMElement("body", "body");

  const doc = {
    getElementById: (id) => getOrCreateElement(id),
    querySelector: (sel) => {
      if (sel.startsWith("#")) return getOrCreateElement(sel.slice(1));
      if (sel === "html") return docElement;
      if (sel === "body") return bodyElement;
      for (const el of Object.values(elements)) {
        if (el.matches && el.matches(sel)) return el;
      }
      return null;
    },
    querySelectorAll: (sel) => {
      const list = [];
      for (const el of Object.values(elements)) {
        if (el.matches && el.matches(sel)) list.push(el);
      }
      return list;
    },
    createElement: (tag) => {
      const el = new MockDOMElement("", tag);
      el.ownerDocument = doc;
      return el;
    },
    addEventListener: (type, fn) => {
      if (!globalListeners[type]) globalListeners[type] = [];
      globalListeners[type].push(fn);
    },
    removeEventListener: (type, fn) => {
      if (!globalListeners[type]) return;
      globalListeners[type] = globalListeners[type].filter((l) => l !== fn);
    },
    dispatchEvent: (ev) => {
      const list = globalListeners[ev.type] || [];
      for (const fn of list) fn(ev);
      return true;
    },
    documentElement: docElement,
    body: bodyElement,
  };

  const sandbox = {
    console,
    Math,
    Date,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    RegExp,
    Promise,
    Intl,
    crypto: {
      randomUUID: () => "habit-" + Math.random().toString(36).slice(2, 9),
      getRandomValues: (buf) => {
        for (let i = 0; i < buf.length; i++) buf[i] = (i * 17) % 256;
        return buf;
      },
    },
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    TextEncoder: typeof TextEncoder !== "undefined" ? TextEncoder : undefined,
    TextDecoder: typeof TextDecoder !== "undefined" ? TextDecoder : undefined,
    Uint8Array,
    Blob: typeof Blob !== "undefined" ? Blob : undefined,
    URL: typeof URL !== "undefined" ? URL : undefined,
    setTimeout: (fn, ms) => (typeof fn === "function" ? fn() : 1),
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    requestAnimationFrame: (fn) => (typeof fn === "function" ? fn() : 1),
    cancelAnimationFrame: () => {},
    location: {
      origin: "http://localhost",
      pathname: "/",
      hash: options.hash || "",
      search: options.search || "",
      href: options.url || "http://localhost/",
    },
    navigator: {
      clipboard: {
        writeText: (text) => {
          sandbox._lastClipboard = text;
          return Promise.resolve();
        },
        readText: () => Promise.resolve(sandbox._lastClipboard || ""),
      },
      vibrate: (pattern) => {
        sandbox._lastVibration = pattern;
        return true;
      },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      onLine: options.onLine !== undefined ? options.onLine : true,
    },
    localStorage,
    sessionStorage,
    document: doc,
    addEventListener: (type, fn) => {
      if (!globalListeners[type]) globalListeners[type] = [];
      globalListeners[type].push(fn);
    },
    removeEventListener: (type, fn) => {
      if (!globalListeners[type]) return;
      globalListeners[type] = globalListeners[type].filter((l) => l !== fn);
    },
    dispatchEvent: (ev) => {
      const list = globalListeners[ev.type] || [];
      for (const fn of list) fn(ev);
      return true;
    },
    Notification: class {
      static permission = "granted";
      static requestPermission() {
        return Promise.resolve("granted");
      }
      constructor(title, options) {
        this.title = title;
        this.options = options;
      }
    },
  };

  sandbox.window = sandbox;

  const scripts = getHabitTrackerScripts();
  vm.createContext(sandbox);

  if (options.autoExecute !== false && scripts) {
    vm.runInContext(scripts, sandbox);
  }

  return {
    sandbox,
    elements,
    getOrCreateElement,
    localStorage,
    sessionStorage,
    runScript: (code) => vm.runInContext(code, sandbox),
  };
}

function createAssertions(suiteName) {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`  ✅ PASS: ${message}`);
    } else {
      failed++;
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  function assertEqual(actual, expected, message) {
    if (actual === expected) {
      passed++;
      console.log(`  ✅ PASS: ${message} (Got: ${actual})`);
    } else {
      failed++;
      console.error(
        `  ❌ FAIL: ${message} - Expected '${expected}', got '${actual}'`
      );
    }
  }

  function assertClose(actual, expected, tolerance = 0.001, message) {
    const diff = Math.abs(actual - expected);
    if (diff <= tolerance) {
      passed++;
      console.log(
        `  ✅ PASS: ${message} (Actual: ${actual.toFixed(4)}, Expected: ${expected.toFixed(4)})`
      );
    } else {
      failed++;
      console.error(
        `  ❌ FAIL: ${message} (Actual: ${actual.toFixed(4)}, Expected: ${expected.toFixed(4)}, Diff: ${diff.toFixed(4)})`
      );
    }
  }

  function printSummary() {
    console.log("\n==================================================");
    console.log(`📊 ${suiteName} Summary: ${passed} Passed, ${failed} Failed`);
    console.log("==================================================\n");
    if (failed > 0) {
      process.exit(1);
    }
  }

  return {
    assert,
    assertEqual,
    assertClose,
    get passed() {
      return passed;
    },
    get failed() {
      return failed;
    },
    printSummary,
  };
}

module.exports = {
  HABIT_DIR,
  HTML_PATH,
  MANIFEST_PATH,
  SW_PATH,
  getHtmlContent,
  getManifest,
  getSwContent,
  getHabitTrackerScripts,
  createMockStorage,
  createHabitTrackerSandbox,
  createAssertions,
};
