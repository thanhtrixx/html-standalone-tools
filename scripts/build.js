#!/usr/bin/env node

/**
 * Build Script for HTML Standalone Tools
 *
 * Scans tool directories, processes source HTML, inlines local resources (if any),
 * minifies HTML, CSS, and JS using html-minifier-terser, and outputs compacted
 * standalone single-file HTML applications ready for web delivery.
 */

const fs = require("fs");
const path = require("path");
const { minify } = require("html-minifier-terser");

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
]);

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
 * Build a single tool
 */
async function buildTool(tool) {
  const startTime = Date.now();
  const rawHtml = fs.readFileSync(tool.entryFile, "utf8");
  const originalSize = Buffer.byteLength(rawHtml, "utf8");

  // Inline local assets if any
  const inlinedHtml = inlineLocalAssets(rawHtml, path.dirname(tool.entryFile));

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

  const elapsed = Date.now() - startTime;

  return {
    name: tool.name,
    originalSize,
    minifiedSize,
    savings,
    elapsed,
    outputFiles: [toolDistFile, rootDistFile],
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
    `\n📦 Building Compacted Standalone HTML Tools (${toolsToBuild.length} tool${toolsToBuild.length > 1 ? "s" : ""})...\n`
  );

  const results = [];
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
      console.log(`   Duration: ${res.elapsed}ms\n`);
    } catch (err) {
      console.error(`❌ Failed to build [${tool.name}]:`, err);
      process.exit(1);
    }
  }

  console.log(
    `✨ Build completed successfully! (${results.reduce((acc, r) => acc + r.elapsed, 0)}ms total)\n`
  );
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
  inlineLocalAssets,
  MINIFY_OPTIONS,
};
