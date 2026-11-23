import { AppError } from "./errors.js";

export const MAX_TEXT_LENGTH = 1000;
export const MAX_REASON_LENGTH = 200;
export const SENTIMENTS = ["positive", "negative", "neutral"];

// 요청 본문을 검사하고, 공백을 제거한 문장을 돌려준다
export function validateInput(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("INVALID_REQUEST");
  }
  if (typeof body.text !== "string") {
    throw new AppError("INVALID_REQUEST");
  }
  const text = body.text.trim();
  if (text.length === 0) throw new AppError("EMPTY_TEXT");
  if (text.length > MAX_TEXT_LENGTH) throw new AppError("TEXT_TOO_LONG");
  return text;
}

// AI가 돌려준 객체를 API 명세(docs/04 §3) 모양으로 정리한다
export function normalizeResult(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new AppError("AI_RESPONSE_INVALID");
  }

  const { sentiment, confidence, reason } = raw;

  if (!SENTIMENTS.includes(sentiment)) {
    throw new AppError("AI_RESPONSE_INVALID");
  }

  if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
    throw new AppError("AI_RESPONSE_INVALID");
  }
  const safeConfidence = Math.min(100, Math.max(0, Math.round(confidence)));

  if (typeof reason !== "string" || reason.trim().length === 0) {
    throw new AppError("AI_RESPONSE_INVALID");
  }
  let safeReason = reason.trim();
  if (safeReason.length > MAX_REASON_LENGTH) {
    safeReason = safeReason.slice(0, MAX_REASON_LENGTH - 1) + "…";
  }

  return { sentiment, confidence: safeConfidence, reason: safeReason };
}
