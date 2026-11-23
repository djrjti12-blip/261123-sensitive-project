// 로컬 개발용 간이 HTTP 서버
// Node.js 20.6 이상 내장 모듈만 사용합니다.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const PORT = parseInt(process.env.PORT || '3000', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = reqUrl.pathname;

    // API 라우팅
    if (pathname === '/api/analyze') {
      let bodyData = '';
      for await (const chunk of req) {
        bodyData += chunk;
      }

      let parsedBody = null;
      if (bodyData) {
        try {
          parsedBody = JSON.parse(bodyData);
        } catch {
          parsedBody = null;
        }
      }

      req.body = parsedBody;

      try {
        const analyzeModule = await import('../api/analyze.js');
        const handler = analyzeModule.default;
        await handler(req, res);
      } catch (err) {
        console.error('[dev-server] Handler error:', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            ok: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: '서버에 문제가 생겼어요.'
            }
          }));
        }
      }
      return;
    }

    // 정적 파일 제공
    if (req.url.includes('..')) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not Found');
      return;
    }

    let filePath = pathname === '/' ? '/index.html' : pathname;
    const resolvedPath = path.normalize(path.join(PUBLIC_DIR, filePath));

    if (!resolvedPath.startsWith(PUBLIC_DIR)) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not Found');
      return;
    }

    try {
      const stats = await fs.stat(resolvedPath);
      if (stats.isDirectory()) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Not Found');
        return;
      }

      const ext = path.extname(resolvedPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const fileData = await fs.readFile(resolvedPath);

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(fileData);
    } catch {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not Found');
    }
  } catch (err) {
    console.error('[dev-server] Request error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Internal Server Error');
    }
  }
});

server.listen(PORT, () => {
  console.log(`▶ 내기 돌림판: http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠ OPENAI_API_KEY가 없습니다. AI 분석 대신 직접 나누기로 동작합니다.');
  }
});
