# 03. 프론트엔드 기능 구현 지침

> 브라우저에서 돌아가는 기능(입력 → 분석 결과 표시 → 돌림판 → 당첨)을 다룹니다.
> 파일: `public/js/*.js`, 모두 ES Module (`<script type="module" src="js/main.js">`)

---

## 1. 화면 상태(State) 관리

웹페이지는 항상 아래 6가지 상태 중 **하나**에 있습니다. `main.js`에서 `state` 변수 하나로 관리하고, 상태가 바뀔 때마다 `render()` 함수 하나로 화면을 갱신합니다.

| 상태 | 뜻 | 만들기 버튼 | 돌리기 버튼 | 결과 카드 | 입력창 |
|---|---|---|---|---|---|
| `idle` | 처음, 아무것도 없음 | 활성 | 비활성 | 숨김 | 입력 가능 |
| `analyzing` | 서버에 분석 요청 중 | 비활성 + "분석 중…" | 비활성 | 숨김 | 입력 불가(`readonly`) |
| `ready` | 돌림판 준비됨 | 활성 | **활성** | 숨김 | 입력 가능 |
| `spinning` | 돌림판이 도는 중 | 비활성 | 비활성 | 숨김 | 입력 불가 |
| `result` | 당첨 결과 표시 | 활성 | 비활성 (다시 돌리기 사용) | **표시** | 입력 가능 |
| `error` | 오류 발생, 돌림판 없음 | 활성 | 비활성 | 숨김 | 입력 가능 |

### 상태 이동 규칙

```
idle ──만들기──▶ analyzing ──성공──────────▶ ready ──돌리기──▶ spinning ──멈춤──▶ result
                    │       ──AI실패+대체성공─▶ ready(경고 표시)                     │
                    └──실패────▶ error                                              │
result ──다시 돌리기──▶ spinning                                                     │
result ──처음부터──▶ idle (입력창 비우고, 돌림판·분석 카드 초기화)  ◀────────────────┘
ready/result/error ──만들기──▶ analyzing (새로 분석, 이전 결과는 지움)
```

### 앱 데이터 (main.js 안의 객체 하나)

```js
const app = {
  state: 'idle',        // 위 6가지 중 하나
  items: [],            // ['민수', '지영', ...]
  confidence: null,     // 0~100 정수, 대체 동작이면 null
  reason: '',           // 분석 이유
  source: null,         // 'ai' | 'fallback'
  winnerIndex: null,    // 당첨 칸 번호
  rotation: 0,          // 돌림판 현재 회전 각도(도, 누적)
};
```

---

## 2. 입력 (F1)

### 2.1 글자 수 표시
- `betInput`의 `input` 이벤트마다 `charCount`를 `{길이} / 500`으로 갱신
- 길이는 **입력한 그대로**의 `value.length` (공백 포함)
- 색 규칙은 docs/02 §5.5

### 2.2 입력 검사 (`parser.js`의 `validateInput(text)`)

"돌림판 만들기"를 누르면 서버로 보내기 **전에** 검사합니다.

| 순서 | 조건 | 결과 |
|---|---|---|
| 1 | `text.trim().length === 0` | 오류 `EMPTY_INPUT`, 서버 호출 안 함 |
| 2 | `text.trim().length > 500` | 오류 `TEXT_TOO_LONG`, 서버 호출 안 함 |
| 3 | 그 외 | 통과 → `text.trim()`을 서버로 보냄 |

반환 형식: `{ ok: true, text }` 또는 `{ ok: false, code: 'EMPTY_INPUT' }`

- 오류 시 `betInput`에 `aria-invalid="true"`를 넣고 포커스를 입력창으로 옮긴다.
- 사용자가 다시 입력하면 `aria-invalid`를 제거하고 오류 박스를 숨긴다.

### 2.3 단축키
- 입력창에서 `Ctrl + Enter` (Mac은 `Cmd + Enter`) → "돌림판 만들기"와 동일
- 일반 `Enter`는 줄바꿈 (막지 않음)

---

## 3. 분석 결과 표시 (F2, F6, F7)

### 3.1 서버 호출 (`api.js`)

```js
// 반환: { ok: true, data } 또는 { ok: false, code, message }
export async function analyzeText(text) { ... }
```

| 규칙 | 내용 |
|---|---|
| 주소 | `POST /api/analyze` (상대 경로) |
| 헤더 | `Content-Type: application/json` |
| 본문 | `{ "text": "..." }` |
| 시간 제한 | `AbortController`로 **20초** 후 중단 → 코드 `NETWORK_TIMEOUT` |
| 네트워크 실패 | `fetch`가 throw → 코드 `NETWORK_ERROR` |
| 응답이 JSON이 아님 | 코드 `BAD_RESPONSE` |
| 응답 `ok: false` | 서버가 준 `error.code`, `error.message` 그대로 반환 |
| 응답 `ok: true` | `data`에 `{ title, items, confidence, reason }` 반환 |

응답 형식 상세는 docs/04 §3.

### 3.2 화면 채우기
1. `analysisEmpty` 숨기고 `analysisContent` 보이기
2. `confidenceValue` ← `${confidence}%`
3. `confidenceBadge` ← 등급 글자 (80 이상 `높음`, 50~79 `보통`, 49 이하 `낮음`), 등급 색 클래스 추가 (`is-high` / `is-mid` / `is-low`)
4. `confidenceBar.style.width` ← `${confidence}%` (먼저 0%로 두고 다음 프레임에 값 적용해야 애니메이션이 보임: `requestAnimationFrame` 사용)
5. `reasonText.textContent` ← `reason`
6. `itemCount` ← 항목 개수, `itemChips` ← 항목마다 `<li>` 생성 (`textContent`만 사용, 칸 색 원 포함)
7. 돌림판 다시 그리기 (§4), 회전 각도 `rotation`은 0으로 초기화
8. 신뢰도가 49 이하이면 `messageBox`에 **경고** 표시: `LOW_CONFIDENCE` 문구 (docs/05). 돌림판은 그대로 사용 가능.

> **보안:** `reason`, `items`는 AI가 만든 글이므로 반드시 `textContent`로 넣는다. `innerHTML` 금지.

---

## 4. 돌림판 그리기 (F3) — `wheel.js`

### 4.1 내보내는 함수

```js
export function drawWheel(canvas, items, colors)     // 돌림판 그리기 (items가 비면 빈 돌림판)
export function spinTo(canvas, winnerIndex, itemCount, currentRotation, options) // Promise<새 rotation>
export function getSegmentColor(index, itemCount)    // 칸 색 {bg, text}
```

### 4.2 선명하게 그리기 (고해상도 화면 대응)
```js
const size = canvas.clientWidth;            // CSS로 정한 실제 표시 크기
const dpr = window.devicePixelRatio || 1;
canvas.width = size * dpr;
canvas.height = size * dpr;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
```
- 창 크기가 바뀌면(`resize` 이벤트, 150ms 디바운스) 다시 그린다. 회전 각도는 유지.

### 4.3 칸 그리는 규칙 (매우 중요 — 당첨 계산과 맞물림)

- 칸 개수 `n`, 칸 하나의 각도 `seg = 360 / n`
- **칸 0은 12시 방향(화살표 위치)에서 시작해 시계 방향**으로 그린다.
- canvas는 0도가 3시 방향이므로, 칸 `i`의 시작 각도(라디안)는:
  ```
  start = (i * seg - 90) * Math.PI / 180
  end   = ((i + 1) * seg - 90) * Math.PI / 180
  ```
- 각 칸: 중심에서 `start~end` 부채꼴 채우기 → 2px 검정 구분선
- 바깥 테두리: 4px 흰색 원
- 가운데: 지름 56px 검정 원 + 2px 흰 테두리

### 4.4 칸 글자
- 위치: 칸의 가운데 각도 방향, 중심에서 반지름의 **62%** 지점
- 회전: 글자가 중심에서 바깥쪽을 향해 읽히도록 칸의 가운데 각도만큼 회전
- 폰트: `600 {fontSize}px LevelUp, sans-serif`
  - 항목 2~6개: 18px / 7~9개: 16px / 10~12개: 14px
- 글자색: `getSegmentColor(i).text`
- 너무 길면 자르기: 최대 폭 = 반지름 × 0.55. 넘치면 끝을 `…`로 줄인다 (`ctx.measureText`로 반복 확인).
- **폰트 로딩 후 그리기**: 처음 그리기 전에 `await document.fonts.load('600 16px LevelUp')`를 실행한다. 3초 안에 안 되면 그냥 그린다(대체 글꼴).

### 4.5 빈 돌림판 (항목 없음)
- 전체를 `#1f232b` 원으로 채우고, 가운데 원 안에 `?` (24px, 700, `#b2b6bd`)

---

## 5. 돌리기와 당첨 (F4)

### 5.1 공정한 무작위 (`random.js`)

```js
// 0 이상 max 미만의 정수를 균등하게 반환
export function randomInt(max) {
  const limit = Math.floor(0x100000000 / max) * max; // 치우침 제거
  const buf = new Uint32Array(1);
  let x;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

// 0 이상 1 미만 실수
export function randomFloat() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0x100000000;
}
```

- **`Math.random()` 사용 금지.** (더 예측하기 쉬운 난수라서)
- 당첨 칸 = `randomInt(items.length)` — **돌리기 버튼을 누르는 순간 결정**, AI 결과와 무관

### 5.2 멈출 각도 계산

돌림판은 canvas 요소 자체를 CSS `transform: rotate()`로 돌립니다(다시 그리지 않음).

```
seg     = 360 / n
jitter  = (randomFloat() - 0.5) * seg * 0.7        // 칸 안에서 멈추는 위치를 살짝 다르게 (경계선 근처는 피함)
target  = 360 - (winnerIndex + 0.5) * seg + jitter // 당첨 칸 가운데가 12시에 오는 각도 (0~360 범위로 맞춤)
current = app.rotation % 360
delta   = (target - current + 360) % 360            // 지금 위치에서 더 돌아야 하는 각도
newRotation = app.rotation + 360 * 6 + delta        // 최소 6바퀴 + 남은 각도
```

> **쉽게 말하면:** 돌림판을 시계 방향으로 돌리면 칸들이 화살표 아래를 지나가는데, 당첨 칸의 가운데가 화살표 바로 아래에 오도록 마지막 각도를 계산합니다.

### 5.3 애니메이션
- `canvas.style.transition = 'transform 4000ms cubic-bezier(0.17, 0.67, 0.12, 0.99)'`
- `canvas.style.transform = \`rotate(${newRotation}deg)\``
- `transitionend` 이벤트에서 Promise 완료 → `app.rotation = newRotation`
- 안전장치: `transitionend`가 오지 않아도 **4500ms 후 강제로 완료** 처리 (중복 실행 방지 플래그 사용)
- 동작 줄이기 설정 시 시간 600ms, 회전 수 1바퀴

### 5.4 검증용 자가 확인 (반드시 구현)
멈춘 뒤 실제 각도로 화살표 아래 칸을 다시 계산해서 `winnerIndex`와 같은지 확인한다.

```js
const r = ((newRotation % 360) + 360) % 360;
const pointerAngle = (360 - r) % 360;            // 돌림판 기준, 화살표가 가리키는 각도
const landed = Math.floor(pointerAngle / seg);   // 화살표 아래 칸 번호
if (landed !== winnerIndex) console.error('[wheel] mismatch', { landed, winnerIndex });
```
- 정상이라면 이 오류는 **절대** 나오면 안 된다. 나오면 §4.3 / §5.2 계산을 고친다.
- 결과로 표시하는 값은 `items[winnerIndex]`.

---

## 6. 당첨 결과 표시 (F5)

1. 상태를 `result`로 변경
2. `resultDot` 배경색 ← 당첨 칸 색
3. `resultText.textContent` ← `items[winnerIndex]` (aria-live로 화면 읽기 프로그램이 읽어줌)
4. `resultCard`의 `hidden` 제거 → 나타나는 애니메이션
5. `respinBtn`으로 포커스 이동

### 버튼 동작
| 버튼 | 동작 |
|---|---|
| `respinBtn` (다시 돌리기) | 결과 카드 숨김 → 새로 `randomInt` → §5 반복. **AI 다시 호출 안 함** |
| `resetBtn` (처음부터) | 입력창 비움, 글자 수 0, 분석 카드 초기 상태, 빈 돌림판, 회전 0(transition 없이), 메시지 숨김, 상태 `idle`, 입력창에 포커스 |

---

## 7. 완료 기준

- [ ] 6가지 상태와 버튼 활성/비활성이 §1 표와 정확히 같다.
- [ ] `Math.random`이 코드에 없다.
- [ ] `innerHTML`에 사용자 입력·AI 응답이 들어가는 곳이 없다.
- [ ] 돌리기 중에는 어떤 버튼도 눌리지 않는다 (연타해도 한 번만 돈다).
- [ ] §5.4 자가 확인에서 mismatch 오류가 한 번도 나오지 않는다.
- [ ] "다시 돌리기"는 네트워크 요청을 만들지 않는다.

## 8. 검증 방법

| 검증 | 방법 | 기대 결과 |
|---|---|---|
| 일치 검사 | 2개, 3개, 7개, 12개 항목으로 각각 20번 돌리기 | 화살표 아래 칸 = 결과 글자, 콘솔 mismatch 0건 |
| 공정성 | 콘솔에서 `import('/js/random.js').then(m=>{const c=[0,0,0,0];for(let i=0;i<40000;i++)c[m.randomInt(4)]++;console.log(c)})` | 4개 값 모두 9,600~10,400 사이 |
| 연타 | 돌리기 버튼 빠르게 5번 클릭 | 한 번만 돈다 |
| AI 재호출 | Network 탭 열고 다시 돌리기 3번 | `/api/analyze` 요청 추가 0건 |
| 처음부터 | 결과 후 처음부터 클릭 | idle 상태와 똑같은 화면 |
| 고해상도 | 레티나/고배율 화면에서 확인 | 칸 글자가 흐릿하지 않음 |
