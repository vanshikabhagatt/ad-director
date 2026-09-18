// Local dev server (also works as the start command on Render/Railway).
// Serves /public and routes /api/chat to the same handler Vercel uses. No dependencies.
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const port = Number(process.env.PORT) || 3000;

// Load .env if present (simple KEY=VALUE lines).
try {
  const env = await readFile(new URL(".env", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* no .env file */ }

const { handle } = await import("./api/chat.js");

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".png": "image/png" };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/chat") {
    let raw = "";
    for await (const chunk of req) { raw += chunk; if (raw.length > 64_000) break; }
    let body = null;
    try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }
    const { status, json } = await handle(req.method, body, { ip: req.socket.remoteAddress });
    res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    return res.end(JSON.stringify(json));
  }
  let pathname = decodeURIComponent(url.pathname);
   if (pathname.endsWith("/")) pathname += "index.html";
   let path = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
   let file = join(root, path);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end("Forbidden"); }
  try {
    const s = await stat(file).catch(() => null);
    if (!s) file = join(root, "index.html");
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404); res.end("Not found");
  }
});

server.listen(port, () => {
  const ai = process.env.GROQ_API_KEY || process.env.LLM_API_KEY ? "AI on" : "AI off (built-in engine)";
  console.log(`Director running at http://localhost:${port}  ·  ${ai}`);
});
