#!/usr/bin/env node

/**
 * Build Script for HTML Standalone Tools
 *
 * Scans tool directories, processes source HTML, inlines local resources (if any),
 * compiles Tailwind CSS (replacing the CDN play script with a static purged stylesheet),
 * minifies HTML, CSS, and JS using html-minifier-terser, and outputs compacted
 * standalone single-file HTML applications ready for web delivery.
 *
 * Optionally mirrors/syncs built deliverables and companion assets into a configurable
 * external distribution directory (e.g., TOOLS_DEST_DIR in .env.local or --dest-dir CLI flag).
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const { minify } = require("html-minifier-terser");
const terser = require("terser");

const ROOT_DIR = path.resolve(__dirname, "..");
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".agents",
  ".husky",
  "docs",
  "scripts",
  "dist",
  "tests",
  "coverage",
  "test-reports",
  "release-assets",
]);

const COMPANION_ASSETS = [
  "_headers",
  "manifest.webmanifest",
  "manifest.json",
  "site.webmanifest",
  "sw.js",
  "service-worker.js",
  "icon.svg",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png",
  "favicon.ico",
  "favicon.png",
  "apple-touch-icon.png",
  "og-image.png",
];

const MINIFY_OPTIONS = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true,
  minifyJS: {
    compress: {
      dead_code: true,
      drop_debugger: true,
    },
    mangle: false, // Keep variable names intact for debugging & stability with dynamic DOM eval
  },
};

// Regex to match the Tailwind CDN <script> tag
const TAILWIND_CDN_RE =
  /<script\s+src=["']https:\/\/cdn\.tailwindcss\.com["']\s*><\/script>/gi;

// Regex to match the inline tailwind.config assignment script block.
// Captures the full <script>...</script> containing "tailwind.config ="
// (possibly wrapped in if (typeof tailwind !== "undefined") { ... } guard).
const TAILWIND_CONFIG_SCRIPT_RE =
  /<script>[\s\S]*?tailwind\.config\s*=[\s\S]*?<\/script>/gi;

/**
 * Extract the raw JS object literal string assigned to tailwind.config from the HTML.
 * Returns the object literal string (e.g. "{ darkMode: \"class\", ... }") or null.
 */
function extractTailwindConfigObject(htmlContent) {
  // Match: tailwind.config = { ... }; — may be inside an if-guard block
  const match = htmlContent.match(/tailwind\.config\s*=\s*(\{[\s\S]*?\})\s*;/);
  return match ? match[1] : null;
}

/**
 * Compile Tailwind CSS for a tool at build time using the Tailwind v3 CLI.
 *
 * Strategy:
 *  1. Extract the inline tailwind.config object from the source HTML.
 *  2. Write a temporary tailwind.config.js and @tailwind input.css to a temp dir.
 *  3. Run `npx tailwindcss` to generate a purged CSS file using the HTML as content source.
 *  4. Return the compiled CSS string (minified by the Tailwind CLI --minify flag).
 *
 * Falls back to returning null if compilation fails so the build can skip inlining
 * and leave the CDN script in place (warning printed to stderr).
 *
 * @param {string} htmlContent - Raw source HTML content.
 * @param {string} toolDir - Absolute path to the tool's source directory.
 * @returns {string|null} Compiled CSS string, or null on failure.
 */
function compileTailwindCSS(htmlContent, toolDir) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tw-build-"));

  try {
    // Extract the config object literal (or use empty extend if not found)
    const configObj = extractTailwindConfigObject(htmlContent) || "{}";

    // Build a temporary tailwind.config.js using the extracted config, pointing
    // content scanning at the source HTML file.
    const srcHtmlPath = path.join(toolDir, "index.html").replace(/\\/g, "/");
    const configJs = `module.exports = ${configObj.replace(
      /^(\s*\{)/,
      `$1\n  content: [${JSON.stringify(srcHtmlPath)}],`
    )};`;

    const configPath = path.join(tmpDir, "tailwind.config.js");
    const inputPath = path.join(tmpDir, "input.css");
    const outputPath = path.join(tmpDir, "output.css");

    fs.writeFileSync(configPath, configJs, "utf8");
    // Minimal @tailwind directives — all three layers
    fs.writeFileSync(
      inputPath,
      "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n",
      "utf8"
    );

    // Resolve the local tailwindcss binary from node_modules
    const twBin = path.join(ROOT_DIR, "node_modules", ".bin", "tailwindcss");

    execSync(
      `"${twBin}" --config "${configPath}" -i "${inputPath}" -o "${outputPath}" --minify`,
      { stdio: "pipe", cwd: tmpDir }
    );

    return fs.readFileSync(outputPath, "utf8");
  } catch (err) {
    process.stderr.write(
      `⚠️  Tailwind CSS compilation failed for ${toolDir}: ${err.message}\n` +
        `   CDN script will be preserved in output.\n`
    );
    return null;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Strip the Tailwind CDN <script> tag and the inline tailwind.config <script> block
 * from HTML content, replacing them with a compiled <style> tag.
 *
 * If compiledCSS is null (compilation failed), the original HTML is returned unchanged.
 *
 * @param {string} htmlContent - Raw source HTML content.
 * @param {string|null} compiledCSS - Compiled CSS string from compileTailwindCSS().
 * @returns {string} Processed HTML.
 */
function inlineTailwindCSS(htmlContent, compiledCSS) {
  if (!compiledCSS) return htmlContent;

  let result = htmlContent;

  // Remove the CDN <script> tag; capture its position to insert compiled CSS there
  let cdnPos = -1;
  result = result.replace(TAILWIND_CDN_RE, (match, offset) => {
    cdnPos = offset;
    return `<style>${compiledCSS}</style>`;
  });

  // Remove the inline tailwind.config <script> block (it's no longer needed)
  result = result.replace(TAILWIND_CONFIG_SCRIPT_RE, "");

  return result;
}

/**
 * Parse .env file string content into key-value map
 */
function parseEnvContent(content) {
  const env = {};
  if (!content) return env;

  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    // Strip surrounding quotes
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }

    if (key) {
      env[key] = val;
    }
  }

  return env;
}

/**
 * Load .env and .env.local files from directory with .env.local precedence
 */
function loadEnvFiles(rootDir = ROOT_DIR) {
  const envVars = {};

  const envPath = path.join(rootDir, ".env");
  if (fs.existsSync(envPath)) {
    try {
      Object.assign(envVars, parseEnvContent(fs.readFileSync(envPath, "utf8")));
    } catch (_) {}
  }

  const envLocalPath = path.join(rootDir, ".env.local");
  if (fs.existsSync(envLocalPath)) {
    try {
      Object.assign(
        envVars,
        parseEnvContent(fs.readFileSync(envLocalPath, "utf8"))
      );
    } catch (_) {}
  }

  return envVars;
}

/**
 * Resolve external destination directory using priority cascade:
 * Tier 1: CLI flags (--dest-dir, --export-dir, --sync-dir)
 * Tier 2: process.env (TOOLS_DEST_DIR, DIST_DEST_DIR)
 * Tier 3: Local env files (.env.local, .env)
 * Tier 4: null (unconfigured, skip external copy)
 */
function resolveDestDir(args = process.argv.slice(2), rootDir = ROOT_DIR) {
  let cliDest = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--dest-dir=")) {
      cliDest = args[i].split("=")[1];
    } else if (args[i] === "--dest-dir" && args[i + 1]) {
      cliDest = args[i + 1];
      i++;
    } else if (args[i].startsWith("--export-dir=")) {
      cliDest = args[i].split("=")[1];
    } else if (args[i] === "--export-dir" && args[i + 1]) {
      cliDest = args[i + 1];
      i++;
    } else if (args[i].startsWith("--sync-dir=")) {
      cliDest = args[i].split("=")[1];
    } else if (args[i] === "--sync-dir" && args[i + 1]) {
      cliDest = args[i + 1];
      i++;
    }
  }

  // Tier 1: CLI
  if (cliDest && cliDest.trim()) {
    return path.resolve(rootDir, cliDest.trim());
  }

  // Tier 2: process.env
  if (process.env.TOOLS_DEST_DIR && process.env.TOOLS_DEST_DIR.trim()) {
    return path.resolve(rootDir, process.env.TOOLS_DEST_DIR.trim());
  }
  if (process.env.DIST_DEST_DIR && process.env.DIST_DEST_DIR.trim()) {
    return path.resolve(rootDir, process.env.DIST_DEST_DIR.trim());
  }

  // Tier 3: Local environment files (.env.local, .env)
  const fileEnv = loadEnvFiles(rootDir);
  if (fileEnv.TOOLS_DEST_DIR && fileEnv.TOOLS_DEST_DIR.trim()) {
    return path.resolve(rootDir, fileEnv.TOOLS_DEST_DIR.trim());
  }
  if (fileEnv.DIST_DEST_DIR && fileEnv.DIST_DEST_DIR.trim()) {
    return path.resolve(rootDir, fileEnv.DIST_DEST_DIR.trim());
  }

  return null;
}

/**
 * Discover tool directories in workspace
 */
function discoverTools() {
  const entries = fs.readdirSync(ROOT_DIR, { withFileTypes: true });
  const tools = [];

  for (const entry of entries) {
    if (
      !entry.isDirectory() ||
      IGNORED_DIRS.has(entry.name) ||
      entry.name.startsWith(".")
    ) {
      continue;
    }

    const toolDir = path.join(ROOT_DIR, entry.name);
    const indexPath = path.join(toolDir, "index.html");
    const srcIndexPath = path.join(toolDir, "src", "index.html");

    if (fs.existsSync(indexPath)) {
      tools.push({ name: entry.name, dir: toolDir, entryFile: indexPath });
    } else if (fs.existsSync(srcIndexPath)) {
      tools.push({ name: entry.name, dir: toolDir, entryFile: srcIndexPath });
    }
  }

  return tools;
}

/**
 * Inline local scripts and stylesheets if present
 */
function inlineLocalAssets(htmlContent, toolDir) {
  let content = htmlContent;

  // Inline local CSS: <link rel="stylesheet" href="./style.css">
  content = content.replace(
    /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi,
    (match, href) => {
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//") ||
        href.startsWith("data:")
      ) {
        return match;
      }
      const cssPath = path.resolve(toolDir, href);
      if (fs.existsSync(cssPath)) {
        const cssContent = fs.readFileSync(cssPath, "utf8");
        return `<style>\n${cssContent}\n</style>`;
      }
      return match;
    }
  );

  // Inline local JS: <script src="./app.js"></script>
  content = content.replace(
    /<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi,
    (match, src) => {
      if (
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("//") ||
        src.startsWith("data:")
      ) {
        return match;
      }
      const jsPath = path.resolve(toolDir, src);
      if (fs.existsSync(jsPath)) {
        const jsContent = fs.readFileSync(jsPath, "utf8");
        return `<script>\n${jsContent}\n</script>`;
      }
      return match;
    }
  );

  return content;
}

/**
 * Extract version from manifest if present in tool directory
 */
function extractToolVersion(toolDir) {
  const manifestNames = [
    "manifest.webmanifest",
    "manifest.json",
    "site.webmanifest",
  ];
  for (const name of manifestNames) {
    const manifestPath = path.join(toolDir, name);
    if (fs.existsSync(manifestPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        if (data && data.version) {
          return String(data.version).trim();
        }
      } catch (_) {}
    }
  }
  return null;
}

/**
 * Process and compact companion assets (service workers, web manifests, icons)
 */
async function buildCompanionAssets(
  tool,
  toolDistDir,
  rootDistDir,
  toolVersion = null
) {
  const processedFiles = [];
  const version = toolVersion || extractToolVersion(tool.dir);

  for (const assetName of COMPANION_ASSETS) {
    const srcAsset = path.join(tool.dir, assetName);
    if (!fs.existsSync(srcAsset)) continue;

    const toolDistAsset = path.join(toolDistDir, assetName);
    const rootDistAsset = path.join(rootDistDir, assetName);

    if (assetName === "sw.js" || assetName === "service-worker.js") {
      let swContent = fs.readFileSync(srcAsset, "utf8");

      // Inject version into CACHE_NAME if version discovered
      if (version) {
        swContent = swContent.replace(
          /const\s+CACHE_NAME\s*=\s*["'][^"']+["'];?/,
          `const CACHE_NAME = "smart-buy-list-v${version}";`
        );
        // Synchronize source file if needed
        try {
          const currentSrc = fs.readFileSync(srcAsset, "utf8");
          if (currentSrc !== swContent) {
            fs.writeFileSync(srcAsset, swContent, "utf8");
          }
        } catch (_) {}
      }

      // Purge Tailwind CDN from ASSETS_TO_CACHE because Tailwind CSS is statically compiled and inlined
      swContent = swContent
        .replace(/,\s*["']https:\/\/cdn\.tailwindcss\.com["']/g, "")
        .replace(/["']https:\/\/cdn\.tailwindcss\.com["'],?\s*/g, "");

      // Minify using terser
      try {
        const minified = await terser.minify(swContent, {
          compress: {
            dead_code: true,
            drop_debugger: true,
          },
          mangle: false,
        });
        if (minified && minified.code) {
          swContent = minified.code;
        }
      } catch (err) {
        process.stderr.write(
          `⚠️  Terser minification failed for ${assetName} in ${tool.name}: ${err.message}\n`
        );
      }

      fs.writeFileSync(toolDistAsset, swContent, "utf8");
      fs.writeFileSync(rootDistAsset, swContent, "utf8");
      processedFiles.push(toolDistAsset, rootDistAsset);
    } else if (
      assetName === "manifest.webmanifest" ||
      assetName === "manifest.json" ||
      assetName === "site.webmanifest"
    ) {
      try {
        const rawJson = fs.readFileSync(srcAsset, "utf8");
        const parsed = JSON.parse(rawJson);
        const compactedJson = JSON.stringify(parsed);
        fs.writeFileSync(toolDistAsset, compactedJson, "utf8");
        fs.writeFileSync(rootDistAsset, compactedJson, "utf8");
        processedFiles.push(toolDistAsset, rootDistAsset);
      } catch (_) {
        fs.copyFileSync(srcAsset, toolDistAsset);
        fs.copyFileSync(srcAsset, rootDistAsset);
        processedFiles.push(toolDistAsset, rootDistAsset);
      }
    } else if (assetName.endsWith(".svg")) {
      const svgContent = fs.readFileSync(srcAsset, "utf8").trim();
      fs.writeFileSync(toolDistAsset, svgContent, "utf8");
      fs.writeFileSync(rootDistAsset, svgContent, "utf8");
      processedFiles.push(toolDistAsset, rootDistAsset);
    } else {
      fs.copyFileSync(srcAsset, toolDistAsset);
      fs.copyFileSync(srcAsset, rootDistAsset);
      processedFiles.push(toolDistAsset, rootDistAsset);
    }
  }

  return processedFiles;
}

/**
 * Build a single tool
 */
async function buildTool(tool) {
  const startTime = Date.now();
  const rawHtml = fs.readFileSync(tool.entryFile, "utf8");
  const originalSize = Buffer.byteLength(rawHtml, "utf8");

  // Extract version from manifest if present
  const toolVersion = extractToolVersion(tool.dir);

  // Compile Tailwind CSS from the source HTML (extracts inline tailwind.config,
  // scans HTML for used utility classes, returns minified purged CSS string).
  const compiledCSS = compileTailwindCSS(rawHtml, tool.dir);

  // Replace the Tailwind CDN <script> + tailwind.config <script> with compiled <style>
  const twInlinedHtml = inlineTailwindCSS(rawHtml, compiledCSS);

  // Inline local assets if any
  let inlinedHtml = inlineLocalAssets(
    twInlinedHtml,
    path.dirname(tool.entryFile)
  );

  // Statically stamp version badge if toolVersion is present
  if (toolVersion) {
    inlinedHtml = inlinedHtml.replace(
      /(<span[^>]*id=["']pwaVersionBadge["'][^>]*>)([^<]*)(<\/span>)/i,
      `$1v${toolVersion}$3`
    );
  }

  // Minify HTML + inline CSS + inline JS
  const minifiedHtml = await minify(inlinedHtml, MINIFY_OPTIONS);
  const minifiedSize = Buffer.byteLength(minifiedHtml, "utf8");
  const savings =
    originalSize > 0
      ? ((1 - minifiedSize / originalSize) * 100).toFixed(1)
      : "0.0";

  // Write outputs:
  // 1. In tool's dist folder: <tool>/dist/index.html
  const toolDistDir = path.join(tool.dir, "dist");
  fs.mkdirSync(toolDistDir, { recursive: true });
  const toolDistFile = path.join(toolDistDir, "index.html");
  fs.writeFileSync(toolDistFile, minifiedHtml, "utf8");

  // 2. In root dist folder: dist/<tool>/index.html
  const rootDistDir = path.join(ROOT_DIR, "dist", tool.name);
  fs.mkdirSync(rootDistDir, { recursive: true });
  const rootDistFile = path.join(rootDistDir, "index.html");
  fs.writeFileSync(rootDistFile, minifiedHtml, "utf8");

  const outputFiles = [toolDistFile, rootDistFile];

  // Process and compact companion assets into dist folders
  const companionFiles = await buildCompanionAssets(
    tool,
    toolDistDir,
    rootDistDir,
    toolVersion
  );
  outputFiles.push(...companionFiles);

  const elapsed = Date.now() - startTime;

  return {
    name: tool.name,
    originalSize,
    minifiedSize,
    savings,
    elapsed,
    outputFiles,
  };
}

/**
 * Synchronize a built tool deliverable and companion assets to an external destination directory
 */
function syncToolToExternal(tool, destDir) {
  if (!destDir) return null;

  const targetDir = path.join(destDir, tool.name);
  fs.mkdirSync(targetDir, { recursive: true });

  const rootDistIndex = path.join(ROOT_DIR, "dist", tool.name, "index.html");
  const toolDistIndex = path.join(tool.dir, "dist", "index.html");
  const sourceIndex = fs.existsSync(rootDistIndex)
    ? rootDistIndex
    : toolDistIndex;

  if (!fs.existsSync(sourceIndex)) {
    throw new Error(
      `Cannot sync tool "${tool.name}": compiled deliverable not found at ${sourceIndex}`
    );
  }

  const targetIndex = path.join(targetDir, "index.html");
  fs.copyFileSync(sourceIndex, targetIndex);
  const syncedFiles = [targetIndex];

  // Sync companion assets from tool's dist directory (or source as fallback)
  for (const assetName of COMPANION_ASSETS) {
    const distAsset = path.join(tool.dir, "dist", assetName);
    const srcAsset = path.join(tool.dir, assetName);
    const assetToCopy = fs.existsSync(distAsset) ? distAsset : srcAsset;
    if (fs.existsSync(assetToCopy)) {
      const destAsset = path.join(targetDir, assetName);
      fs.copyFileSync(assetToCopy, destAsset);
      syncedFiles.push(destAsset);
    }
  }

  return {
    name: tool.name,
    targetDir,
    syncedFiles,
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  let targetToolName = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--tool=")) {
      targetToolName = args[i].split("=")[1];
    } else if (args[i] === "--tool" && args[i + 1]) {
      targetToolName = args[i + 1];
      i++;
    }
  }

  const destDir = resolveDestDir(args, ROOT_DIR);
  const allTools = discoverTools();

  if (allTools.length === 0) {
    console.error("❌ No standalone tools found.");
    process.exit(1);
  }

  const toolsToBuild = targetToolName
    ? allTools.filter(
        (t) => t.name.toLowerCase() === targetToolName.toLowerCase()
      )
    : allTools;

  if (toolsToBuild.length === 0) {
    console.error(
      `❌ Tool "${targetToolName}" not found. Available tools: ${allTools.map((t) => t.name).join(", ")}`
    );
    process.exit(1);
  }

  console.log(
    `\n📦 Building Compacted Standalone HTML Tools (${toolsToBuild.length} tool${toolsToBuild.length > 1 ? "s" : ""})...`
  );
  if (destDir) {
    console.log(`📁 External Distribution Target: ${destDir}\n`);
  } else {
    console.log(`\n`);
  }

  const results = [];
  const syncResults = [];

  for (const tool of toolsToBuild) {
    try {
      const res = await buildTool(tool);
      results.push(res);
      console.log(`✅ [${res.name}]`);
      console.log(`   Source:   ${formatBytes(res.originalSize)}`);
      console.log(
        `   Compact:  ${formatBytes(res.minifiedSize)} (${res.savings}% reduction)`
      );
      console.log(
        `   Outputs:  ${path.relative(ROOT_DIR, res.outputFiles[0])}`
      );
      console.log(
        `             ${path.relative(ROOT_DIR, res.outputFiles[1])}`
      );

      // Perform external sync if configured
      if (destDir) {
        const syncRes = syncToolToExternal(tool, destDir);
        syncResults.push(syncRes);
        console.log(
          `   Synced:   ${path.relative(ROOT_DIR, syncRes.targetDir)} (${syncRes.syncedFiles.length} file${syncRes.syncedFiles.length > 1 ? "s" : ""})`
        );
      }

      console.log(`   Duration: ${res.elapsed}ms\n`);
    } catch (err) {
      console.error(`❌ Failed to build [${tool.name}]:`, err);
      process.exit(1);
    }
  }

  if (destDir) {
    console.log(
      `✨ Build & external sync completed successfully! (${results.reduce((acc, r) => acc + r.elapsed, 0)}ms total)`
    );
    console.log(`🚀 All deliverables mirrored to: ${destDir}\n`);
  } else {
    console.log(
      `✨ Build completed successfully! (${results.reduce((acc, r) => acc + r.elapsed, 0)}ms total)\n`
    );
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Unexpected build error:", err);
    process.exit(1);
  });
}

module.exports = {
  discoverTools,
  buildTool,
  buildCompanionAssets,
  extractToolVersion,
  inlineLocalAssets,
  compileTailwindCSS,
  inlineTailwindCSS,
  extractTailwindConfigObject,
  parseEnvContent,
  loadEnvFiles,
  resolveDestDir,
  syncToolToExternal,
  MINIFY_OPTIONS,
  COMPANION_ASSETS,
};
