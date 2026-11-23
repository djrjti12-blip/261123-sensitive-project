import test from "node:test";
import assert from "node:assert/strict";
import { validateInput, normalizeResult, MAX_TEXT_LENGTH } from "../lib/validation.js";
import { AppError, toErrorBody } from "../lib/errors.js";

test("validateInput", async (t) => {
  await t.test("V1: 정상 텍스트", () => {
    assert.equal(validateInput({ text: "좋아요" }), "좋아요");
  });

  await t.test("V2: 앞뒤 공백 제거", () => {
    assert.equal(validateInput({ text: "  좋아요  " }), "좋아요");
  });

  await t.test("V3: 빈 문자열 -> EMPTY_TEXT", () => {
    assert.throws(() => validateInput({ text: "" }), (err) => err instanceof AppError && err.code === "EMPTY_TEXT");
  });

  await t.test("V4: 공백만 있는 문자열 -> EMPTY_TEXT", () => {
    assert.throws(() => validateInput({ text: "   \n\t " }), (err) => err instanceof AppError && err.code === "EMPTY_TEXT");
  });

  await t.test("V5: 1000자 정확히 -> 통과", () => {
    const text = "가".repeat(1000);
    assert.equal(validateInput({ text }), text);
  });

  await t.test("V6: 1001자 -> TEXT_TOO_LONG", () => {
    const text = "가".repeat(1001);
    assert.throws(() => validateInput({ text }), (err) => err instanceof AppError && err.code === "TEXT_TOO_LONG");
  });

  await t.test("V7: text가 숫자 -> INVALID_REQUEST", () => {
    assert.throws(() => validateInput({ text: 123 }), (err) => err instanceof AppError && err.code === "INVALID_REQUEST");
  });

  await t.test("V8: 빈 객체 -> INVALID_REQUEST", () => {
    assert.throws(() => validateInput({}), (err) => err instanceof AppError && err.code === "INVALID_REQUEST");
  });

  await t.test("V9: null -> INVALID_REQUEST", () => {
    assert.throws(() => validateInput(null), (err) => err instanceof AppError && err.code === "INVALID_REQUEST");
  });

  await t.test("V10: 배열 -> INVALID_REQUEST", () => {
    assert.throws(() => validateInput([]), (err) => err instanceof AppError && err.code === "INVALID_REQUEST");
  });

  await t.test("V11: 문자열 직접 전달 -> INVALID_REQUEST", () => {
    assert.throws(() => validateInput("문자열"), (err) => err instanceof AppError && err.code === "INVALID_REQUEST");
  });
});

test("normalizeResult", async (t) => {
  await t.test("N1: 정상 객체", () => {
    const input = { sentiment: "positive", confidence: 87, reason: "만족 표현" };
    assert.deepEqual(normalizeResult(input), input);
  });

  await t.test("N2: confidence 소수점 반올림", () => {
    const input = { sentiment: "positive", confidence: 87.6, reason: "이유" };
    assert.equal(normalizeResult(input).confidence, 88);
  });

  await t.test("N3: confidence 100 초과 시 100", () => {
    const input = { sentiment: "positive", confidence: 150, reason: "이유" };
    assert.equal(normalizeResult(input).confidence, 100);
  });

  await t.test("N4: confidence 음수 시 0", () => {
    const input = { sentiment: "positive", confidence: -5, reason: "이유" };
    assert.equal(normalizeResult(input).confidence, 0);
  });

  await t.test("N5: confidence 문자열 -> AI_RESPONSE_INVALID", () => {
    const input = { sentiment: "positive", confidence: "87", reason: "이유" };
    assert.throws(() => normalizeResult(input), (err) => err instanceof AppError && err.code === "AI_RESPONSE_INVALID");
  });

  await t.test("N6: 유효하지 않은 sentiment -> AI_RESPONSE_INVALID", () => {
    const input = { sentiment: "happy", confidence: 80, reason: "이유" };
    assert.throws(() => normalizeResult(input), (err) => err instanceof AppError && err.code === "AI_RESPONSE_INVALID");
  });

  await t.test("N7: 빈 reason -> AI_RESPONSE_INVALID", () => {
    const input = { sentiment: "positive", confidence: 80, reason: "" };
    assert.throws(() => normalizeResult(input), (err) => err instanceof AppError && err.code === "AI_RESPONSE_INVALID");
  });

  await t.test("N8: reason 200자 초과 시 200자로 자르고 … 추가", () => {
    const input = { sentiment: "positive", confidence: 80, reason: "가".repeat(250) };
    const res = normalizeResult(input);
    assert.equal(res.reason.length, 200);
    assert.ok(res.reason.endsWith("…"));
  });

  await t.test("N9: reason 앞뒤 공백 제거", () => {
    const input = { sentiment: "positive", confidence: 80, reason: "  이유  " };
    assert.equal(normalizeResult(input).reason, "이유");
  });

  await t.test("N10: extra 필드 제외", () => {
    const input = { sentiment: "positive", confidence: 80, reason: "이유", extra: 1 };
    assert.deepEqual(normalizeResult(input), { sentiment: "positive", confidence: 80, reason: "이유" });
  });

  await t.test("N11: null -> AI_RESPONSE_INVALID", () => {
    assert.throws(() => normalizeResult(null), (err) => err instanceof AppError && err.code === "AI_RESPONSE_INVALID");
  });
});

test("errors.js", async (t) => {
  await t.test("E1: AppError(EMPTY_TEXT)", () => {
    const err = new AppError("EMPTY_TEXT");
    assert.equal(err.status, 400);
    assert.equal(err.message, "분석할 문장을 입력해 주세요.");
  });

  await t.test("E2: AppError(없는코드) -> INTERNAL_ERROR", () => {
    const err = new AppError("없는코드");
    assert.equal(err.code, "INTERNAL_ERROR");
    assert.equal(err.status, 500);
  });

  await t.test("E3: toErrorBody(AppError(AI_TIMEOUT))", () => {
    const body = toErrorBody(new AppError("AI_TIMEOUT"));
    assert.deepEqual(body, {
      error: {
        code: "AI_TIMEOUT",
        message: "분석 시간이 너무 오래 걸렸어요. 다시 시도해 주세요.",
      },
    });
  });
});
