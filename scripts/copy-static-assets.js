const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const keep = new Set(["dist", "node_modules", "supabase", "src", "scripts", ".git", ".vscode"]);
const assetExt = new Set([".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".json", ".webmanifest", ".woff", ".woff2"]);

function copyFile(name) {
  const from = path.join(root, name);
  const to = path.join(dist, name);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

fs.mkdirSync(dist, { recursive: true });

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isDirectory() || keep.has(entry.name)) continue;
  const ext = path.extname(entry.name).toLowerCase();
  if (assetExt.has(ext)) copyFile(entry.name);
}

console.log("[build] static assets copied to dist");
