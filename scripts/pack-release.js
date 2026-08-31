#!/usr/bin/env node

/**
 * Release Asset Packaging Script
 *
 * Prepares production release assets for GitHub Releases:
 * 1. Copies standalone compacted HTML for each tool to: release-assets/<tool-name>.html
 * 2. Creates a unified ZIP archive: release-assets/html-standalone-tools-<tag>.zip
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { discoverTools, buildTool } = require("./build");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_OUT_DIR = path.join(ROOT_DIR, "release-assets");

function parseArgs() {
  const args = process.argv.slice(2);
  let outDir = DEFAULT_OUT_DIR;
  let version =
    process.env.RELEASE_VERSION ||
    process.env.RELEASE_TAG ||
    require("../package.json").version ||
    "latest";

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--out-dir=")) {
      outDir = path.resolve(ROOT_DIR, args[i].split("=")[1]);
    } else if (args[i] === "--out-dir" && args[i + 1]) {
      outDir = path.resolve(ROOT_DIR, args[i + 1]);
      i++;
    } else if (args[i].startsWith("--version=")) {
      version = args[i].split("=")[1];
    } else if (args[i] === "--version" && args[i + 1]) {
      version = args[i + 1];
      i++;
    }
  }

  // Normalize version string (e.g. ensure clean v-prefix or clean tag)
  const cleanVersion = version.startsWith("v") ? version : `v${version}`;

  return { outDir, version: cleanVersion };
}

async function main() {
  const { outDir, version } = parseArgs();

  console.log(`\n📦 Packaging Release Assets [${version}]...`);
  console.log(`📁 Destination: ${outDir}\n`);

  fs.mkdirSync(outDir, { recursive: true });

  const tools = discoverTools();
  if (tools.length === 0) {
    console.error("❌ No standalone tools found to package.");
    process.exit(1);
  }

  const stagedHtmlFiles = [];
  const stagedArchives = [];

  for (const tool of tools) {
    const distDir = path.join(ROOT_DIR, "dist", tool.name);
    const distHtmlPath = path.join(distDir, "index.html");

    // Ensure build output exists
    if (!fs.existsSync(distHtmlPath)) {
      console.log(`⚙️  Building ${tool.name}...`);
      await buildTool(tool);
    }

    // Copy to named HTML file in release-assets: <tool-name>.html
    const targetHtmlFile = path.join(outDir, `${tool.name}.html`);
    fs.copyFileSync(distHtmlPath, targetHtmlFile);
    stagedHtmlFiles.push(targetHtmlFile);

    const size = (fs.statSync(targetHtmlFile).size / 1024).toFixed(1);
    console.log(`✅ Staged HTML: ${tool.name}.html (${size} KB)`);

    // Check for companion assets (PWA tools)
    const distFiles = fs.readdirSync(distDir);
    const hasCompanionAssets = distFiles.some(
      (f) => f !== "index.html" && !f.startsWith(".")
    );

    if (hasCompanionAssets) {
      // Create dedicated standalone PWA zip bundle: <tool-name>-<version>.zip
      const toolZipName = `${tool.name}-${version}.zip`;
      const toolZipPath = path.join(outDir, toolZipName);

      if (fs.existsSync(toolZipPath)) {
        fs.unlinkSync(toolZipPath);
      }

      try {
        execFileSync("zip", ["-r", toolZipPath, "."], {
          cwd: distDir,
          stdio: "pipe",
        });
        const toolZipSize = (fs.statSync(toolZipPath).size / 1024).toFixed(1);
        console.log(
          `✅ Staged PWA Bundle: ${toolZipName} (${toolZipSize} KB - ${distFiles.length} files)`
        );
        stagedArchives.push(toolZipPath);
      } catch (err) {
        console.warn(
          `⚠️ Warning: Could not create tool ZIP archive for ${tool.name} (${err.message}).`
        );
      }
    }
  }

  // Create unified ZIP archive of all dist tools
  const zipFileName = `html-standalone-tools-${version}.zip`;
  const zipFilePath = path.join(outDir, zipFileName);

  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }

  try {
    const rootDist = path.join(ROOT_DIR, "dist");
    execFileSync("zip", ["-r", zipFilePath, "."], {
      cwd: rootDist,
      stdio: "pipe",
    });

    const zipSize = (fs.statSync(zipFilePath).size / 1024).toFixed(1);
    console.log(
      `✅ Staged Unified Master Bundle: ${zipFileName} (${zipSize} KB)`
    );
  } catch (err) {
    console.warn(
      `⚠️ Warning: Could not create master ZIP archive (${err.message}).`
    );
  }

  console.log(
    `\n✨ Release assets successfully packaged in ${path.relative(ROOT_DIR, outDir)}/\n`
  );
}

if (require.main === module) {
  main().catch((err) => {
    console.error("❌ Packaging error:", err);
    process.exit(1);
  });
}

module.exports = { main };
