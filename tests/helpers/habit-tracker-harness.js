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

function parseHtmlToElements(html, parentNode, ownerDocument) {
  if (!html || typeof html !== "string") return;
  const tokenRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9\-]+)([^>]*)>|([^<]+)/g;
  const stack = [parentNode];
  const VOID_TAGS = new Set([
    "input",
    "img",
    "br",
    "hr",
    "meta",
    "link",
    "circle",
    "path",
  ]);

  let match;
  while ((match = tokenRegex.exec(html)) !== null) {
    if (match[0].startsWith("<!--")) {
      continue;
    }
    const isClosing = match[1] === "/";
    const tagName = match[2];
    const attrStr = match[3] || "";
    const isSelfClosing =
      attrStr.trim().endsWith("/") ||
      (tagName && VOID_TAGS.has(tagName.toLowerCase()));
    const textContent = match[4];

    if (textContent) {
      const top = stack[stack.length - 1];
      if (top) {
        top._textContent = (top._textContent || "") + textContent;
      }
      continue;
    }

    if (isClosing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tagName.toLowerCase() === tagName.toLowerCase()) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    if (tagName) {
      const el = new MockDOMElement("", tagName);
      el.ownerDocument = ownerDocument;

      const attrRegex =
        /([a-zA-Z0-9\-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
        const key = attrMatch[1];
        if (!key || key.startsWith("/")) continue;
        const val =
          attrMatch[2] !== undefined
            ? attrMatch[2]
            : attrMatch[3] !== undefined
              ? attrMatch[3]
              : attrMatch[4] !== undefined
                ? attrMatch[4]
                : "";
        el.setAttribute(key, val);
      }

      const currentParent = stack[stack.length - 1];
      if (currentParent) {
        currentParent.appendChild(el);
      }

      if (!isSelfClosing) {
        stack.push(el);
      }
    }
  }
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
    this._innerHTML = "";
    this._textContent = undefined;
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
          self.classList.add(token);
          self._className = Array.from(self._classList).join(" ");
          return true;
        }
      },
    };
  }

  get innerHTML() {
    if (this._innerHTML) return this._innerHTML;
    let html = "";
    for (const child of this.children) {
      html += child.innerHTML;
    }
    return html;
  }

  set innerHTML(html) {
    this._innerHTML = String(html || "");
    this._textContent = undefined;
    this.children = [];
    this.childNodes = [];
    if (!this._innerHTML) return;
    parseHtmlToElements(this._innerHTML, this, this.ownerDocument);
  }

  get textContent() {
    let text = this._textContent !== undefined ? this._textContent : "";
    for (const child of this.children) {
      text += child.textContent;
    }
    return text;
  }

  set textContent(val) {
    this._textContent = String(val);
    this.children = [];
    this.childNodes = [];
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
    if (name.startsWith("data-")) {
      const prop = name
        .slice(5)
        .replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
      this.dataset[prop] = String(val);
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
    if (name.startsWith("data-")) {
      const prop = name
        .slice(5)
        .replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
      delete this.dataset[prop];
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
    if (!selector) return false;
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
      const inside = selector.slice(1, -1);
      if (inside.includes("=")) {
        const eqIdx = inside.indexOf("=");
        const attr = inside.slice(0, eqIdx).trim();
        const rawVal = inside.slice(eqIdx + 1).trim();
        const val = rawVal.replace(/^["']|["']$/g, "");
        return this.getAttribute(attr) === val;
      }
      return this.hasAttribute(inside.trim());
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
    "delete-confirm-modal-overlay",
    "header-active-timer-pill",
    "dock-active-timer-pill",
  ]);

  function getOrCreateElement(id) {
    if (!elements[id]) {
      const tagName =
        id === "main-content"
          ? "main"
          : id.endsWith("-form")
            ? "form"
            : id.endsWith("-btn")
              ? "button"
              : "div";
      const el = new MockDOMElement(id, tagName);
      el.ownerDocument = doc;
      if (id === "delete-confirm-modal-overlay") {
        el.setAttribute("role", "alertdialog");
        el.setAttribute("aria-modal", "true");
        el.setAttribute("aria-labelledby", "delete-dialog-title");
        el.setAttribute("aria-describedby", "delete-dialog-desc");
      }
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
      if (sel.startsWith("#") && !sel.includes(" ") && !sel.includes("[")) {
        return getOrCreateElement(sel.slice(1));
      }
      if (sel === "html") return docElement;
      if (sel === "body") return bodyElement;
      for (const el of Object.values(elements)) {
        if (el.matches && el.matches(sel)) return el;
        if (el.querySelector) {
          const found = el.querySelector(sel);
          if (found) return found;
        }
      }
      return null;
    },
    querySelectorAll: (sel) => {
      const list = [];
      const visited = new Set();
      function search(node) {
        if (!node || visited.has(node)) return;
        visited.add(node);
        if (node.matches && node.matches(sel)) list.push(node);
        if (node.children) {
          for (const child of node.children) {
            search(child);
          }
        }
      }
      for (const el of Object.values(elements)) {
        search(el);
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
