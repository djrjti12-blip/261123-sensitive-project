# 04. API 명세 (프론트 ↔ 백엔드 계약)

> 이 문서는 화면(브라우저)과 서버가 주고받는 데이터의 **약속**이다.
> 에이전트는 이 문서의 필드 이름, 값, 상태 코드를 **절대 바꾸거나 추가하지 않는다.**

---

## 1. 엔드포인트 개요

| 항목 | 값 |
|---|---|
| 주소 | `/api/analyze` |
| 방법 | `POST` 만 허용 |
| 요청 형식 | `Content-Type: application/json` |
| 응답 형식 | `Content-Type: application/json; charset=utf-8` |
| 캐시 | 응답 헤더 `Cache-Control: no-store` |
| 인증 | 없음 |

같은 도메인에서만 호출하므로 **CORS 설정을 하지 않는다.**

---

## 2. 요청 (Request)

```http
POST /api/analyze
Content-Type: application/json

{
  "text": "배송은 늦었지만 제품 품질은 정말 만족스러워요."
}
```

| 필드 | 타입 | 필수 | 규칙 |
|---|---|---|---|
| `text` | string | ✅ | 앞뒤 공백 제거(`trim`) 후 1자 이상, 1,000자 이하. 글자 수는 JavaScript `String.length` 기준 |

- `text` 외의 필드가 있어도 **무시**한다 (오류 아님).
- 프론트는 `text`를 `trim()` 하지 않고 그대로 보낸다. 검증·정리는 서버가 한다. (단, 공백뿐인 입력은 프론트에서도 막는다 — PRD F2-2)

---

## 3. 성공 응답 (200 OK)

```json
{
  "sentiment": "positive",
  "confidence": 82,
  "reason": "배송 지연에 대한 아쉬움이 있지만 \"정말 만족스러워요\"라는 표현으로 제품에 대한 만족이 더 크게 드러납니다."
}
```

| 필드 | 타입 | 값의 범위 | 설명 |
|---|---|---|---|
| `sentiment` | string | `"positive"` \| `"negative"` \| `"neutral"` 중 하나 | 감성 판정 |
| `confidence` | integer | 0 ~ 100 | AI가 추정한 확신 정도(%) |
| `reason` | string | 1 ~ 200자, 한국어 | 판단 이유 (200자 초과 시 서버가 잘라서 끝에 `…` 추가) |

- 위 3개 필드 **외에는 아무것도 포함하지 않는다.** (모델 이름, 토큰 수, 원문 등 금지)

---

## 4. 오류 응답 (공통 형식)

모든 오류는 아래 형식 **하나**로 통일한다.

```json
{
  "error": {
    "code": "EMPTY_TEXT",
    "message": "분석할 문장을 입력해 주세요."
  }
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `error.code` | string | 오류 코드 (아래 표의 값만 사용) |
| `error.message` | string | 사용자에게 그대로 보여줄 한국어 문장 |

### 오류 코드 목록 (서버가 반환하는 것)

| HTTP 상태 | `code` | 언제 |
|---|---|---|
| 400 | `INVALID_REQUEST` | 본문이 JSON이 아님, 객체가 아님, `text`가 없거나 문자열이 아님 |
| 400 | `EMPTY_TEXT` | `text`가 공백 제거 후 0자 |
| 400 | `TEXT_TOO_LONG` | `text`가 공백 제거 후 1,000자 초과 |
| 405 | `METHOD_NOT_ALLOWED` | POST가 아닌 요청 (응답 헤더 `Allow: POST` 포함) |
| 429 | `AI_RATE_LIMITED` | OpenAI가 429 반환 (요청 과다 또는 사용 한도 초과) |
| 500 | `SERVER_CONFIG_ERROR` | `OPENAI_API_KEY` 없음, 또는 OpenAI가 401/403 반환 (키 오류) |
| 500 | `INTERNAL_ERROR` | 위에 해당하지 않는 예상치 못한 서버 오류 |
| 502 | `AI_RESPONSE_INVALID` | OpenAI 응답이 비었거나, JSON이 아니거나, 값이 규칙에 맞지 않음 |
| 502 | `AI_SERVICE_ERROR` | OpenAI 연결 실패 또는 그 밖의 OpenAI 오류 (5xx, 404 모델 없음 등) |
| 504 | `AI_TIMEOUT` | OpenAI 응답이 15초 안에 오지 않음 |

각 코드의 사용자 문구는 `docs/07-error-handling.md` §2를 따른다.

### 프론트 전용 오류 코드 (서버는 반환하지 않음)

| `code` | 언제 |
|---|---|
| `NETWORK_ERROR` | `fetch` 자체가 실패 (인터넷 끊김 등) |
| `CLIENT_TIMEOUT` | 브라우저에서 20초 안에 응답 없음 |
| `UNKNOWN_RESPONSE` | 응답이 JSON이 아니거나 위 형식과 다름 |

---

## 5. 예시 모음

| 요청 `text` | 기대 상태 | 기대 응답 (요약) |
|---|---|---|
| `"이 영화 정말 최고였어요! 또 보고 싶어요."` | 200 | `sentiment: "positive"` |
| `"서비스가 너무 불친절해서 다시는 안 갈 거예요."` | 200 | `sentiment: "negative"` |
| `"회의는 오후 3시에 2층 회의실에서 진행됩니다."` | 200 | `sentiment: "neutral"` |
| `"   "` | 400 | `code: "EMPTY_TEXT"` |
| 1,001자 문자열 | 400 | `code: "TEXT_TOO_LONG"` |
| `{"message": "hi"}` (text 없음) | 400 | `code: "INVALID_REQUEST"` |
| `GET /api/analyze` | 405 | `code: "METHOD_NOT_ALLOWED"` |

> AI 결과는 같은 문장이라도 실행마다 `confidence`, `reason`이 조금 다를 수 있다. 위 3개의 명확한 예시는 `sentiment`가 항상 같아야 한다.
