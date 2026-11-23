// Vercel 서버 함수: POST /api/analyze
import { analyze } from '../lib/analyze-core.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, {
      ok: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: '페이지를 새로고침한 뒤 다시 시도해 주세요.'
      }
    });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = null;
      }
    }

    const text = body?.text;
    const result = await analyze(text, process.env);
    sendJson(res, result.status, result.body);
  } catch (err) {
    console.error('[analyze]', 500, 'Unexpected handler error');
    sendJson(res, 500, {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '대신 쉼표·줄바꿈 기준으로 직접 나눴어요.'
      }
    });
  }
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
