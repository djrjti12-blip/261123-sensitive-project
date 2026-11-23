# 06. 프론트엔드 기능 구현 지침 (`public/app.js`)

> 브라우저에서 실행되는 JS가 하는 일: **글자 수 세기 → 입력 검사 → 서버에 요청 → 결과 또는 오류 표시.**
> 라이브러리 없이 순수 JavaScript(ES Modules)로 작성한다.

---

## 1. 고정 설정값

```js
const API_URL = "/api/analyze";          // 같은 도메인의 상대 경로. 전체 URL(http://...) 금지
const MAX_TEXT_LENGTH = 1000;            // 서버 lib/validation.js와 같은 값 유지
const CLIENT_TIMEOUT_MS = 20000;         // 서버 타임아웃(15초)보다 길게

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
```

## 2. 코드 구성 (함수 목록)

`app.js` 안에 아래 함수만 만든다. 이름을 그대로 쓴다.

| 함수 | 하는 일 |
|---|---|
| `getElements()` | `docs/03` §7의 id로 요소를 찾아 객체로 반환. 하나라도 없으면 `console.error` 후 중단 |
| `setState(state, payload)` | `"idle" \| "loading" \| "success" \| "error"` 중 하나로 화면 전환 (docs/03 §4 표 그대로) |
| `updateCharCount()` | `N / 1,000` 표시. 숫자는 `toLocaleString("ko-KR")` 사용. 1,000자면 `.char-count--limit` 클래스 추가 |
| `renderResult(result)` | 결과 카드 채우기 (라벨, 신뢰도 글자·막대·aria, 이유, 배경 클래스) |
| `renderError(code, message)` | 오류 알림 채우기. `message`가 유효한 문자열이 아니면 `ERROR_MESSAGES[code]`, 그것도 없으면 `UNKNOWN_RESPONSE` 문구 |
| `requestAnalysis(text)` | `fetch`로 서버 호출. 성공 시 결과 객체 반환, 실패 시 `{ code, message }`를 가진 오류를 throw |
| `isValidResult(data)` | 응답이 docs/04 §3 형식인지 검사 (sentiment가 3개 중 하나, confidence가 0~100 정수, reason이 비지 않은 문자열) |
| `handleSubmit(event)` | 폼 제출 처리 (§3 흐름) |
| `handleClear()` | 지우기 / 새 문장 분석 처리 |
| `init()` | 이벤트 연결, 초기 상태 `idle`, 글자 수 초기화 |

파일 맨 끝에서 `init()`을 한 번 호출한다. 전역 변수는 `elements`, `isLoading` 두 개만 허용한다.

## 3. 분석 흐름 (`handleSubmit`)

```
1. event.preventDefault()
2. isLoading이 true면 아무것도 하지 않고 종료 (중복 요청 방지)
3. text = 입력창 값 (원본 그대로)
4. text.trim()이 비어 있으면 → renderError("EMPTY_TEXT") + 입력창 aria-invalid="true" + 입력창 포커스 → 종료 (서버 요청 X)
5. text.trim().length > 1000 이면 → renderError("TEXT_TOO_LONG") → 종료
6. setState("loading")
7. try:
     result = await requestAnalysis(text)
     setState("success", result)   ← 내부에서 renderResult 호출
   catch (err):
     setState("error", err)        ← 내부에서 renderError(err.code, err.message) 호출
   finally:
     isLoading = false
```

## 4. 서버 요청 (`requestAnalysis`)

```js
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
```

## 5. 화면 갱신 규칙

- 사용자 입력, AI 이유, 오류 문구는 **모두 `textContent`** 로 넣는다. `innerHTML` 사용 금지.
- 상태 전환 시 처리 (`setState`):

| 상태 | 처리 내용 |
|---|---|
| `idle` | 오류 알림 `hidden`, 결과 카드 `hidden`, 버튼 활성 + "분석하기", 입력창 `readonly` 해제·`aria-busy` 제거·`aria-invalid` 제거 |
| `loading` | `isLoading = true`, 오류 알림·결과 카드 `hidden`, 분석하기·지우기 `disabled`, 분석하기 글자 "분석 중…", 입력창 `readonly` + `aria-busy="true"` |
| `success` | `renderResult` → 결과 카드 `hidden` 해제 → 버튼 원래대로 → 입력창 `readonly`·`aria-busy` 해제 → `#result-card` 포커스 (`tabindex="-1"`) |
| `error` | `renderError` → 오류 알림 `hidden` 해제 → 결과 카드 `hidden` → 버튼 원래대로 → 입력창 `readonly`·`aria-busy` 해제. `EMPTY_TEXT`·`TEXT_TOO_LONG`일 때만 입력창 `aria-invalid="true"` |

## 6. 이벤트

| 대상 | 이벤트 | 처리 |
|---|---|---|
| `#analyze-form` | `submit` | `handleSubmit` |
| `#text-input` | `input` | `updateCharCount()` + 오류 알림이 보이면 숨기고 `aria-invalid` 제거 |
| `#clear-button` | `click` | `handleClear` |
| `#reset-button` | `click` | `handleClear` |

- `handleClear`: 입력창 값 `""` → `updateCharCount()` → `setState("idle")` → 입력창 `focus()`.
- 로딩 중에는 지우기 버튼이 `disabled`이므로 별도 처리 불필요.
- 키보드 단축키(Ctrl+Enter 등)는 만들지 않는다.

## 7. 하지 말 것

- `localStorage`/`sessionStorage`/쿠키에 아무것도 저장하지 않는다.
- 타이핑할 때 자동으로 분석하지 않는다 (디바운스 자동 분석 금지).
- `alert()`, `confirm()`, `prompt()`를 쓰지 않는다.
- 자동 재시도하지 않는다. (재시도는 사용자가 버튼을 다시 눌러서)
- `console.log`에 입력 문장이나 응답 내용을 출력하지 않는다.

## 8. 완료 기준 (프론트)

- [ ] `app.js`에 `innerHTML`, `insertAdjacentHTML`, `localStorage`, `alert(` 문자열이 없다
- [ ] 공백만 입력 후 분석하기 → 개발자 도구 Network 탭에 요청이 **생기지 않고** 오류 문구가 표시된다
- [ ] 분석하기를 빠르게 여러 번 눌러도 Network 탭에 요청이 **1개만** 생긴다
- [ ] 성공 시 결과 카드의 배경색이 감성에 맞게 바뀌고, 다른 감성 클래스가 남아있지 않다
- [ ] 신뢰도 87이면 글자 `87%`, 막대 너비 87%, `aria-valuenow="87"`
- [ ] 오류 후에도 입력 문장이 그대로 남아있다
- [ ] 글자를 입력하면 오류 알림이 사라진다
