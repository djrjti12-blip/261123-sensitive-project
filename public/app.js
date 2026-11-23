const API_URL = "/api/analyze";
const MAX_TEXT_LENGTH = 1000;
const CLIENT_TIMEOUT_MS = 20000;

const SENTIMENT_VIEW = {
  positive: { label: "긍정", className: "result-card--positive" },
  negative: { label: "부정", className: "result-card--negative" },
  neutral:  { label: "중립", className: "result-card--neutral" },
};

// docs/07 §2 표 — 서버 message가 없을 때 사용하는 예비 문구
const ERROR_MESSAGES = {
  EMPTY_TEXT: "분석할 문장을 입력해 주세요.",
  TEXT_TOO_LONG: "문장은 1,000자까지 입력할 수 있어요. 조금 줄여서 다시 시도해 주세요.",
  INVALID_REQUEST: "요청 형식이 올바르지 않아요. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
  METHOD_NOT_ALLOWED: "허용되지 않은 요청 방식이에요.",
  AI_RATE_LIMITED: "지금 요청이 많아 분석할 수 없어요. 잠시 후 다시 시도해 주세요.",
  SERVER_CONFIG_ERROR: "서비스 설정에 문제가 있어요. 관리자에게 문의해 주세요.",
  INTERNAL_ERROR: "알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
  AI_RESPONSE_INVALID: "분석 결과를 제대로 받지 못했어요. 다시 시도해 주세요.",
  AI_SERVICE_ERROR: "AI 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
  AI_TIMEOUT: "분석 시간이 너무 오래 걸렸어요. 다시 시도해 주세요.",
  NETWORK_ERROR: "인터넷 연결을 확인한 뒤 다시 시도해 주세요.",
  CLIENT_TIMEOUT: "응답이 너무 늦어요. 잠시 후 다시 시도해 주세요.",
  UNKNOWN_RESPONSE: "알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
};

let elements = null;
let isLoading = false;

function getElements() {
  const ids = [
    "analyze-form", "text-input", "char-count", "error-alert", "error-message",
    "analyze-button", "clear-button", "result-card", "result-label",
    "result-confidence-text", "result-confidence-bar", "result-confidence-fill",
    "result-reason", "reset-button"
  ];
  const el = {};
  for (const id of ids) {
    const node = document.getElementById(id);
    if (!node) {
      console.error(`필수 엘리먼트를 찾을 수 없습니다: #${id}`);
      return null;
    }
    el[id] = node;
  }
  return el;
}

function updateCharCount() {
  const length = elements["text-input"].value.length;
  elements["char-count"].textContent = `${length.toLocaleString("ko-KR")} / 1,000`;
  if (length >= MAX_TEXT_LENGTH) {
    elements["char-count"].classList.add("char-count--limit");
  } else {
    elements["char-count"].classList.remove("char-count--limit");
  }
}

function renderResult(result) {
  const view = SENTIMENT_VIEW[result.sentiment];
  elements["result-card"].classList.remove(
    "result-card--positive",
    "result-card--negative",
    "result-card--neutral"
  );
  if (view) {
    elements["result-card"].classList.add(view.className);
    elements["result-label"].textContent = view.label;
  }

  const confidence = result.confidence;
  elements["result-confidence-text"].textContent = `${confidence}%`;
  elements["result-confidence-fill"].style.width = `${confidence}%`;
  elements["result-confidence-bar"].setAttribute("aria-valuenow", String(confidence));

  elements["result-reason"].textContent = result.reason;
}

function renderError(code, message) {
  let text = message;
  if (typeof text !== "string" || !text.trim()) {
    text = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN_RESPONSE;
  }
  elements["error-message"].textContent = text;
}

function isValidResult(data) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return false;
  const { sentiment, confidence, reason } = data;
  if (!["positive", "negative", "neutral"].includes(sentiment)) return false;
  if (typeof confidence !== "number" || !Number.isInteger(confidence) || confidence < 0 || confidence > 100) return false;
  if (typeof reason !== "string" || reason.trim().length === 0) return false;
  return true;
}

async function requestAnalysis(text) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
  } catch (err) {
    const code = err.name === "AbortError" ? "CLIENT_TIMEOUT" : "NETWORK_ERROR";
    throw { code, message: ERROR_MESSAGES[code] };
  } finally {
    clearTimeout(timer);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw { code: "UNKNOWN_RESPONSE", message: ERROR_MESSAGES.UNKNOWN_RESPONSE };
  }

  if (!response.ok) {
    const code = typeof data?.error?.code === "string" ? data.error.code : "UNKNOWN_RESPONSE";
    const message = typeof data?.error?.message === "string" && data.error.message.trim()
      ? data.error.message
      : ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN_RESPONSE;
    throw { code, message };
  }

  if (!isValidResult(data)) {
    throw { code: "UNKNOWN_RESPONSE", message: ERROR_MESSAGES.UNKNOWN_RESPONSE };
  }
  return data;
}

function setState(state, payload) {
  if (state === "idle") {
    elements["error-alert"].hidden = true;
    elements["result-card"].hidden = true;
    elements["analyze-button"].disabled = false;
    elements["analyze-button"].textContent = "분석하기";
    elements["clear-button"].disabled = false;
    elements["text-input"].readOnly = false;
    elements["text-input"].removeAttribute("aria-busy");
    elements["text-input"].removeAttribute("aria-invalid");
  } else if (state === "loading") {
    isLoading = true;
    elements["error-alert"].hidden = true;
    elements["result-card"].hidden = true;
    elements["analyze-button"].disabled = true;
    elements["analyze-button"].textContent = "분석 중…";
    elements["clear-button"].disabled = true;
    elements["text-input"].readOnly = true;
    elements["text-input"].setAttribute("aria-busy", "true");
  } else if (state === "success") {
    renderResult(payload);
    elements["result-card"].hidden = false;
    elements["error-alert"].hidden = true;
    elements["analyze-button"].disabled = false;
    elements["analyze-button"].textContent = "분석하기";
    elements["clear-button"].disabled = false;
    elements["text-input"].readOnly = false;
    elements["text-input"].removeAttribute("aria-busy");
    elements["result-card"].setAttribute("tabindex", "-1");
    elements["result-card"].focus();
  } else if (state === "error") {
    renderError(payload?.code, payload?.message);
    elements["error-alert"].hidden = false;
    elements["result-card"].hidden = true;
    elements["analyze-button"].disabled = false;
    elements["analyze-button"].textContent = "분석하기";
    elements["clear-button"].disabled = false;
    elements["text-input"].readOnly = false;
    elements["text-input"].removeAttribute("aria-busy");
    if (payload?.code === "EMPTY_TEXT" || payload?.code === "TEXT_TOO_LONG") {
      elements["text-input"].setAttribute("aria-invalid", "true");
    }
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  if (isLoading) return;

  const text = elements["text-input"].value;
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    setState("error", { code: "EMPTY_TEXT", message: ERROR_MESSAGES.EMPTY_TEXT });
    elements["text-input"].focus();
    return;
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    setState("error", { code: "TEXT_TOO_LONG", message: ERROR_MESSAGES.TEXT_TOO_LONG });
    return;
  }

  setState("loading");
  try {
    const result = await requestAnalysis(text);
    setState("success", result);
  } catch (err) {
    setState("error", err);
  } finally {
    isLoading = false;
  }
}

function handleClear() {
  elements["text-input"].value = "";
  updateCharCount();
  setState("idle");
  elements["text-input"].focus();
}

function init() {
  elements = getElements();
  if (!elements) return;

  elements["analyze-form"].addEventListener("submit", handleSubmit);
  elements["text-input"].addEventListener("input", () => {
    updateCharCount();
    if (!elements["error-alert"].hidden) {
      elements["error-alert"].hidden = true;
      elements["text-input"].removeAttribute("aria-invalid");
    }
  });
  elements["clear-button"].addEventListener("click", handleClear);
  elements["reset-button"].addEventListener("click", handleClear);

  setState("idle");
  updateCharCount();
}

init();
