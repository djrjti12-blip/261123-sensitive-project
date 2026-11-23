import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./api/analyze.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY_BYTES = 100 * 1024;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("BODY_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const relative = urlPath === "/" ? "index.html" : urlPath.slice(1);
  const filePath = path.normalize(path.join(PUBLIC_DIR, relative));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Forbidden");
  }
  try {
    const data = await readFile(filePath);
    const type = MIME[path.extname(filePath)] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  if (pathname === "/api/analyze") {
    try {
      const raw = await readRawBody(req);
      try { req.body = raw ? JSON.parse(raw) : undefined; } catch { req.body = raw; }
    } catch {
      res.writeHead(413, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Payload Too Large");
    }
    return handler(req, res);
  }
  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8", Allow: "GET" });
    return res.end("Method Not Allowed");
  }
  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`감성 분석기 개발 서버: http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.");
  }
});
