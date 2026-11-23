# 07. 오류 처리 지침

> 원칙: **사용자는 "무엇이 잘못됐고, 무엇을 하면 되는지"만 알면 된다.**
> 기술적인 내용(영어 오류, 상태 코드, 스택)은 화면에 보이지 않는다. 개발자용 정보는 서버 로그에만 남긴다.

---

## 1. 오류가 처리되는 흐름

```
[브라우저]                         [서버 api/analyze.js]                [OpenAI]
  입력 검사 ──(실패)──▶ 화면에 오류
     │(통과)
  fetch ─────────────────────▶ 요청 형식 검사 ──(실패)──▶ 400 오류 JSON
     │                              │(통과)
     │                         API 키 확인 ──(없음)──▶ 500 오류 JSON
     │                              │
     │                         OpenAI 호출 ─────────────────────▶ 응답/실패
     │                              │◀────────────────────────────────┘
     │                         오류 변환 (429/401/타임아웃/기타)
     │                         응답 검증 ──(이상)──▶ 502 오류 JSON
     │◀──────────────────────── 200 결과 JSON
  응답 해석 ──(이상)──▶ UNKNOWN_RESPONSE
  화면 표시
```

---

## 2. 오류 코드와 사용자 문구 (정본)

이 표가 **유일한 기준**이다. 서버의 `lib/errors.js`와 프론트의 `public/app.js`는 이 표를 그대로 옮긴다.

| `code` | HTTP | 사용자에게 보여줄 문구 (글자 그대로) |
|---|---|---|
| `EMPTY_TEXT` | 400 | 분석할 문장을 입력해 주세요. |
| `TEXT_TOO_LONG` | 400 | 문장은 1,000자까지 입력할 수 있어요. 조금 줄여서 다시 시도해 주세요. |
| `INVALID_REQUEST` | 400 | 요청 형식이 올바르지 않아요. 페이지를 새로고침한 뒤 다시 시도해 주세요. |
| `METHOD_NOT_ALLOWED` | 405 | 허용되지 않은 요청 방식이에요. |
| `AI_RATE_LIMITED` | 429 | 지금 요청이 많아 분석할 수 없어요. 잠시 후 다시 시도해 주세요. |
| `SERVER_CONFIG_ERROR` | 500 | 서비스 설정에 문제가 있어요. 관리자에게 문의해 주세요. |
| `INTERNAL_ERROR` | 500 | 알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해 주세요. |
| `AI_RESPONSE_INVALID` | 502 | 분석 결과를 제대로 받지 못했어요. 다시 시도해 주세요. |
| `AI_SERVICE_ERROR` | 502 | AI 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요. |
| `AI_TIMEOUT` | 504 | 분석 시간이 너무 오래 걸렸어요. 다시 시도해 주세요. |
| `NETWORK_ERROR` | — (프론트) | 인터넷 연결을 확인한 뒤 다시 시도해 주세요. |
| `CLIENT_TIMEOUT` | — (프론트) | 응답이 너무 늦어요. 잠시 후 다시 시도해 주세요. |
| `UNKNOWN_RESPONSE` | — (프론트) | 알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해 주세요. |

---

## 3. 서버 쪽 규칙

1. 모든 오류는 `lib/errors.js`의 `AppError`로 만든다: `new AppError("EMPTY_TEXT")` → 상태 코드와 문구는 표에서 자동으로 채운다.
2. `AppError`가 아닌 오류(예상 못한 오류)는 모두 `INTERNAL_ERROR`로 바꿔 응답한다.
3. OpenAI SDK 오류 변환 규칙 (위에서부터 먼저 맞는 것 적용):

| OpenAI SDK 오류 | 변환할 `code` |
|---|---|
| `OpenAI.APIConnectionTimeoutError` | `AI_TIMEOUT` |
| `OpenAI.APIConnectionError` | `AI_SERVICE_ERROR` |
| `OpenAI.APIError` 이면서 `status === 401` 또는 `403` | `SERVER_CONFIG_ERROR` |
| `OpenAI.APIError` 이면서 `status === 429` | `AI_RATE_LIMITED` |
| 그 밖의 `OpenAI.APIError` | `AI_SERVICE_ERROR` |
| 그 밖의 모든 오류 | `AI_SERVICE_ERROR` |

4. **로그 규칙**: 오류가 나면 `console.error("[analyze]", code, status, err.message)` 형식으로 한 줄만 남긴다.
   - ❌ 사용자 입력 문장, API 키, 요청 본문 전체, OpenAI 응답 전체를 로그에 남기지 않는다.
   - 400번대(사용자 입력 오류)는 로그를 남기지 않는다.

## 4. 프론트 쪽 규칙

1. 서버 응답이 오류 형식(`{ error: { code, message } }`)이면 **`error.message`를 그대로** 화면에 표시한다.
   - 단, `message`가 비어 있거나 문자열이 아니면 §2 표에서 `code`로 문구를 찾는다. 그것도 없으면 `UNKNOWN_RESPONSE` 문구.
2. 응답을 JSON으로 읽을 수 없으면 `UNKNOWN_RESPONSE`.
3. 오류가 나도 입력창의 문장은 **지우지 않는다**.
4. 오류 알림은 다음 중 하나가 일어나면 숨긴다: 새 분석 시작, 지우기, 입력창에 글자 입력.
5. 오류 문구는 `textContent`로 넣는다.

## 5. 오류 상황 재현 방법 (검증용)

| 오류 | 재현 방법 |
|---|---|
| `EMPTY_TEXT` | 입력창을 비우거나 공백만 넣고 분석하기 (프론트에서 즉시 표시) |
| `TEXT_TOO_LONG` | curl로 1,001자 전송 (`docs/09` §3) — 화면에서는 `maxlength`로 막힘 |
| `INVALID_REQUEST` | curl로 `{"message":"hi"}` 전송 |
| `METHOD_NOT_ALLOWED` | 브라우저 주소창에 `/api/analyze` 입력 (GET) |
| `SERVER_CONFIG_ERROR` | `.env`의 `OPENAI_API_KEY`를 `sk-wrong`으로 바꾸고 서버 재시작 |
| `AI_SERVICE_ERROR` | `.env`에 `OPENAI_MODEL=not-a-real-model` 넣고 서버 재시작 |
| `NETWORK_ERROR` | 페이지를 연 뒤 `npm run dev` 서버를 종료하고 분석하기 |
| `AI_TIMEOUT` / `CLIENT_TIMEOUT` | 개발자 도구 > Network > Throttling을 "Offline"이 아닌 매우 느린 사용자 지정 속도로 설정 (재현이 어려우면 코드 검토로 대체 가능) |

> 각 재현이 끝나면 `.env`를 원래대로 돌려놓고 서버를 재시작한다.
