import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { canonicalUrl, siteRoot } from "./build.mjs";

const output = path.join(siteRoot, "dist");
if (!fs.existsSync(path.join(output, "index.html"))) throw new Error("Build the site before previewing");
const base = new URL(canonicalUrl(process.env.SITE_URL, process.env.SITE_BASE)).pathname;
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json" };
const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Invalid URL");
    return;
  }
  if (!pathname.startsWith(base)) {
    response.writeHead(404).end("Not found");
    return;
  }
  const filename = path.resolve(output, pathname.slice(base.length) || "index.html");
  if (!filename.startsWith(output + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": types[path.extname(filename)] || "application/octet-stream" });
  fs.createReadStream(filename).pipe(response);
});
server.listen(4327, "127.0.0.1", () => console.log(`Preview ready: http://127.0.0.1:4327${base}`));
