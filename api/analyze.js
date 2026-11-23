import { AppError, toErrorBody } from "../lib/errors.js";
import { validateInput } from "../lib/validation.js";
import { analyzeSentiment } from "../lib/sentiment.js";

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

// 요청 본문 읽기: Vercel은 req.body를 미리 해석해 주지만, 잘못된 JSON이면 접근 시 오류가 날 수 있다
function readBody(req) {
  let body;
  try {
    body = req.body;
  } catch {
    throw new AppError("INVALID_REQUEST");
  }
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      throw new AppError("INVALID_REQUEST");
    }
  }
  return body;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, toErrorBody(new AppError("METHOD_NOT_ALLOWED")));
  }

  try {
    const body = readBody(req);
    const text = validateInput(body);
    const result = await analyzeSentiment(text);
    return sendJson(res, 200, result);
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("INTERNAL_ERROR", err);
    if (appError.status >= 500 || appError.status === 429) {
      const cause = appError.cause;
      console.error("[analyze]", appError.code, cause?.status ?? "-", cause?.message ?? err.message);
    }
    return sendJson(res, appError.status, toErrorBody(appError));
  }
}
