const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT_DIR = path.resolve(__dirname, "../..");
const TRACKER_DIR = path.join(ROOT_DIR, "smart-buy-list-price-tracker");
const HTML_PATH = path.join(TRACKER_DIR, "index.html");
const MANIFEST_PATH = path.join(TRACKER_DIR, "manifest.webmanifest");
const SW_PATH = path.join(TRACKER_DIR, "sw.js");

let cachedScripts = null;
let cachedHtml = null;

function getHtmlContent() {
  if (!cachedHtml) {
    cachedHtml = fs.readFileSync(HTML_PATH, "utf8");
  }
  return cachedHtml;
}

function getManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

function getSwContent() {
  return fs.readFileSync(SW_PATH, "utf8");
}

function getTrackerScripts() {
  if (cachedScripts) return cachedScripts;

  const html = getHtmlContent();
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let combined = "";
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    // Exclude third-party external CDN scripts like Tailwind and Html5Qrcode
    if (
      !match[0].includes("tailwindcss") &&
      !match[0].includes("html5-qrcode")
    ) {
      combined += match[1] + "\n";
    }
  }

  cachedScripts = combined;
  return cachedScripts;
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
    this.className = "";
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
        self.className = Array.from(self._classList).join(" ");
      },
      remove: (...tokens) => {
        tokens.forEach((t) => self._classList.delete(t));
        self.className = Array.from(self._classList).join(" ");
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
          self.className = Array.from(self._classList).join(" ");
          return false;
        } else {
          self._classList.add(token);
          self.className = Array.from(self._classList).join(" ");
          return true;
        }
      },
    };
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
    // Bubble up to parent if bubbles is true
    if (
      event.bubbles &&
      this.parentElement &&
      this.parentElement.dispatchEvent
    ) {
      this.parentElement.dispatchEvent(event);
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
    if (selector.startsWith("#") && this.id === selector.slice(1)) return this;
    if (selector.startsWith(".") && this.classList.contains(selector.slice(1)))
      return this;
    if (this.tagName && this.tagName.toLowerCase() === selector.toLowerCase())
      return this;
    if (this.parentElement && this.parentElement.closest) {
      return this.parentElement.closest(selector);
    }
    return null;
  }

  matches(selector) {
    if (selector.startsWith("#")) return this.id === selector.slice(1);
    if (selector.startsWith("."))
      return this.classList.contains(selector.slice(1));
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

function createTrackerSandbox(options = {}) {
  const elements = {};
  const globalListeners = {};

  function getOrCreateElement(id) {
    if (!elements[id]) {
      elements[id] = new MockDOMElement(id);
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
    createElement: (tag) => new MockDOMElement("", tag),
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

  const historyState = {
    stack: [{ url: options.url || "/", state: options.initialState || null }],
    index: 0,
  };

  const history = {
    pushState: (state, title, url) => {
      historyState.stack.push({ url, state });
      historyState.index = historyState.stack.length - 1;
      if (url) sandbox.location.href = url;
    },
    replaceState: (state, title, url) => {
      historyState.stack[historyState.index] = { url, state };
      if (url) sandbox.location.href = url;
    },
    back: () => {
      if (historyState.index > 0) {
        historyState.index--;
        const cur = historyState.stack[historyState.index];
        sandbox.location.href = cur.url;
        doc.dispatchEvent({ type: "popstate", state: cur.state });
        if (sandbox.onpopstate) sandbox.onpopstate({ state: cur.state });
      }
    },
    get state() {
      return historyState.stack[historyState.index]?.state || null;
    },
    get length() {
      return historyState.stack.length;
    },
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
      randomUUID: () => "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      getRandomValues: (buf) => {
        for (let i = 0; i < buf.length; i++) buf[i] = (i * 17) % 256;
        return buf;
      },
    },
    btoa: (str) => Buffer.from(str, "binary").toString("base64"),
    atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
    encodeURIComponent,
    decodeURIComponent,
    escape,
    unescape,
    setTimeout: (fn, ms) => {
      if (options.syncTimeouts !== false) {
        return typeof fn === "function" ? fn() : 1;
      }
      return setTimeout(fn, ms);
    },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    scrollTo: () => {},
    location: {
      origin: "http://localhost",
      pathname: "/",
      hash: options.hash || "",
      search: options.search || "",
      href: options.url || "http://localhost/",
    },
    history,
    navigator: {
      clipboard: {
        writeText: (text) => {
          sandbox._lastClipboard = text;
          return Promise.resolve();
        },
        readText: () => Promise.resolve(sandbox._lastClipboard || ""),
      },
      share: (payload) => {
        sandbox._lastShare = payload;
        return Promise.resolve();
      },
      vibrate: (pattern) => {
        sandbox._lastVibration = pattern;
        return true;
      },
      userAgent:
        options.userAgent ||
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
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
    fetch:
      options.mockFetch ||
      (() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
          text: () => Promise.resolve(""),
        })),
    tailwind: {},
    Html5Qrcode: class {
      start() {
        return Promise.resolve();
      }
      stop() {
        return Promise.resolve();
      }
      clear() {
        return Promise.resolve();
      }
    },
  };

  // Circular window reference
  sandbox.window = sandbox;

  // Execute tracker application scripts inside VM context
  const scripts = getTrackerScripts();
  vm.createContext(sandbox);

  if (options.autoExecute !== false) {
    vm.runInContext(scripts, sandbox);
  }

  function simulateSwipe(element, { startX, endX, startY = 100, endY = 100 }) {
    const touchStart = {
      type: "touchstart",
      touches: [{ clientX: startX, clientY: startY }],
      targetTouches: [{ clientX: startX, clientY: startY }],
      preventDefault: () => {},
      stopPropagation: () => {},
    };
    const touchEnd = {
      type: "touchend",
      changedTouches: [{ clientX: endX, clientY: endY }],
      preventDefault: () => {},
      stopPropagation: () => {},
    };

    element.dispatchEvent(touchStart);
    element.dispatchEvent(touchEnd);
  }

  return {
    sandbox,
    elements,
    getOrCreateElement,
    localStorage,
    sessionStorage,
    history,
    simulateSwipe,
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
  TRACKER_DIR,
  HTML_PATH,
  MANIFEST_PATH,
  SW_PATH,
  getHtmlContent,
  getManifest,
  getSwContent,
  getTrackerScripts,
  createMockStorage,
  createTrackerSandbox,
  createAssertions,
};
