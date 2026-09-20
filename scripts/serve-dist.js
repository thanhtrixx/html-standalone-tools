const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.PORT, 10) || 4173;
const DIST = path.join(__dirname, "..", "dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".lrc": "text/plain; charset=utf-8",
  ".srt": "text/plain; charset=utf-8",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
};

const server = http.createServer((req, res) => {
  const urlParts = (req.url || "/").split("?");
  const urlPath = urlParts[0];
  const queryString =
    urlParts.length > 1 ? `?${urlParts.slice(1).join("?")}` : "";
  const ROOT_DIR = path.join(__dirname, "..");
  let filePath = path.join(DIST, urlPath);
  const sourcePath = path.join(ROOT_DIR, urlPath);

  const isDistDir =
    fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();
  const isSourceDir =
    fs.existsSync(sourcePath) && fs.statSync(sourcePath).isDirectory();

  // Redirect directories without trailing slash to maintain standard relative URL resolution
  if ((isDistDir || isSourceDir) && !urlPath.endsWith("/")) {
    res.writeHead(301, {
      Location: `${urlPath}/${queryString}`,
    });
    res.end();
    return;
  }

  if (isDistDir) {
    filePath = path.join(filePath, "index.html");
  }

  // Fallback to source root if not in dist or if source is fresher
  let resolvedSource = sourcePath;
  if (isSourceDir) {
    resolvedSource = path.join(resolvedSource, "index.html");
  }

  if (
    fs.existsSync(resolvedSource) &&
    !fs.statSync(resolvedSource).isDirectory()
  ) {
    if (
      !fs.existsSync(filePath) ||
      fs.statSync(resolvedSource).mtimeMs > fs.statSync(filePath).mtimeMs
    ) {
      filePath = resolvedSource;
    }
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*",
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, "localhost", () => {
  console.log(`Static server running at http://localhost:${PORT}`);
});
