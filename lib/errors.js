// 오류 코드 정본 — docs/07-error-handling.md §2와 반드시 일치
export const ERRORS = {
  INVALID_REQUEST: { status: 400, message: "요청 형식이 올바르지 않아요. 페이지를 새로고침한 뒤 다시 시도해 주세요." },
  EMPTY_TEXT: { status: 400, message: "분석할 문장을 입력해 주세요." },
  TEXT_TOO_LONG: { status: 400, message: "문장은 1,000자까지 입력할 수 있어요. 조금 줄여서 다시 시도해 주세요." },
  METHOD_NOT_ALLOWED: { status: 405, message: "허용되지 않은 요청 방식이에요." },
  AI_RATE_LIMITED: { status: 429, message: "지금 요청이 많아 분석할 수 없어요. 잠시 후 다시 시도해 주세요." },
  SERVER_CONFIG_ERROR: { status: 500, message: "서비스 설정에 문제가 있어요. 관리자에게 문의해 주세요." },
  INTERNAL_ERROR: { status: 500, message: "알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해 주세요." },
  AI_RESPONSE_INVALID: { status: 502, message: "분석 결과를 제대로 받지 못했어요. 다시 시도해 주세요." },
  AI_SERVICE_ERROR: { status: 502, message: "AI 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요." },
  AI_TIMEOUT: { status: 504, message: "분석 시간이 너무 오래 걸렸어요. 다시 시도해 주세요." },
};

export class AppError extends Error {
  constructor(code, cause) {
    const def = ERRORS[code] ?? ERRORS.INTERNAL_ERROR;
    super(def.message);
    this.name = "AppError";
    this.code = ERRORS[code] ? code : "INTERNAL_ERROR";
    this.status = def.status;
    this.cause = cause; // 원래 오류 (로그용, 응답에는 포함하지 않음)
  }
}

export function toErrorBody(appError) {
  return { error: { code: appError.code, message: appError.message } };
}
