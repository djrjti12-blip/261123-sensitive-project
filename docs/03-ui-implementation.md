# 03. UI 구현 지침

> 화면은 **1개 페이지**다. 이 문서는 "어떤 요소가 어떤 순서로, 어떤 상태일 때 어떻게 보이는지"를 정한다.
> 색·크기 값은 모두 `docs/02-design-system.md`의 토큰을 사용한다.

---

## 1. 화면 구성 (위에서 아래로)

```
┌──────────────────────────────────────────────────────────┐
│ [상단 바] 감성 분석기                       (64px, 흰색)   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [히어로]  (흰색, 위아래 96px)                              │
│   문장 속 감정을 한눈에                    ← h1 40px/400   │
│   긍정·부정·중립과 그 이유를 AI가 알려드려요.  ← 20px      │
│                                                          │
│   ┌─ 입력 패널 (surface-soft) ──────────────────────┐    │
│   │ 분석할 문장                          ← 라벨       │    │
│   │ ┌──────────────────────────────────────────┐   │    │
│   │ │ 예) 배송은 늦었지만 제품 품질은…           │   │    │
│   │ └──────────────────────────────────────────┘   │    │
│   │                                    0 / 1,000   │    │
│   │ [오류 알림 — 오류일 때만]                        │    │
│   │ [ 분석하기 ]  [ 지우기 ]                         │    │
│   └────────────────────────────────────────────────┘    │
│                                                          │
│   ┌─ 결과 카드 (성공일 때만, 시그니처 색) ──────────┐    │
│   │ 분석 결과                                      │    │
│   │ 긍정                               ← 40px/400  │    │
│   │ 신뢰도 87%                                     │    │
│   │ ████████████████████░░░░                       │    │
│   │ 판단 이유                                      │    │
│   │ "정말 만족스러워요"라는 표현에서…                 │    │
│   │ ─────────────────────────────                  │    │
│   │ 신뢰도는 AI가 스스로 추정한 값으로…  [새 문장 분석]│    │
│   └────────────────────────────────────────────────┘    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ [작동 방식] (크림색 배경, 위아래 96px)                     │
│   어떻게 분석하나요?                       ← h2 32px     │
│   ┌ 01 ──────┐ ┌ 02 ──────┐ ┌ 03 ──────┐                │
│   │문장 입력  │ │AI 분석    │ │결과 확인  │                │
│   └──────────┘ └──────────┘ └──────────┘                │
├──────────────────────────────────────────────────────────┤
│ [푸터] (흰색)  개인정보 안내 · © 2026 감성 분석기          │
└──────────────────────────────────────────────────────────┘
```

---

## 2. HTML 구조 (`public/index.html`)

아래 구조와 **id / class 이름을 그대로** 사용한다. (`app.js`가 이 id로 요소를 찾는다)

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>감성 분석기 — 문장 속 감정을 한눈에</title>
  <meta name="description" content="문장을 입력하면 AI가 긍정·부정·중립과 신뢰도, 판단 이유를 알려드립니다." />
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link rel="stylesheet" href="fonts.css" />
  <link rel="stylesheet" href="styles.css" />
  <script src="app.js" type="module"></script>
</head>
<body>
  <header class="top-nav">
    <div class="container top-nav__inner">
      <a class="top-nav__brand" href="/">감성 분석기</a>
    </div>
  </header>

  <main>
    <section class="hero" aria-labelledby="hero-title">
      <div class="container">
        <h1 id="hero-title" class="t-display-lg">문장 속 감정을 한눈에</h1>
        <p class="hero__sub t-title-md">긍정·부정·중립과 그 이유를 AI가 알려드려요.</p>

        <form id="analyze-form" class="input-panel" novalidate>
          <label for="text-input" class="t-label-md">분석할 문장</label>
          <textarea
            id="text-input"
            class="text-input"
            name="text"
            maxlength="1000"
            rows="6"
            placeholder="예) 배송은 늦었지만 제품 품질은 정말 만족스러워요."
            aria-describedby="char-count"
          ></textarea>
          <p id="char-count" class="char-count t-caption" aria-live="polite">0 / 1,000</p>

          <div id="error-alert" class="alert-error" role="alert" hidden>
            <p class="alert-error__title">분석하지 못했어요</p>
            <p id="error-message" class="alert-error__message"></p>
          </div>

          <div class="button-row">
            <button id="analyze-button" type="submit" class="btn btn-primary">분석하기</button>
            <button id="clear-button" type="button" class="btn btn-secondary">지우기</button>
          </div>
        </form>

        <section id="result-card" class="result-card" aria-live="polite" aria-labelledby="result-label" hidden>
          <p class="result-card__eyebrow t-caption">분석 결과</p>
          <p id="result-label" class="result-card__label t-display-lg"></p>

          <div class="result-card__confidence">
            <p class="t-label-md">신뢰도 <span id="result-confidence-text"></span></p>
            <div id="result-confidence-bar" class="progress" role="progressbar"
                 aria-label="신뢰도" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
              <div id="result-confidence-fill" class="progress__fill"></div>
            </div>
          </div>

          <div class="result-card__reason">
            <p class="t-caption">판단 이유</p>
            <p id="result-reason" class="t-body-lg"></p>
          </div>

          <div class="result-card__footer">
            <p class="t-caption">신뢰도는 AI가 스스로 추정한 값으로, 통계적 확률이 아닙니다.</p>
            <button id="reset-button" type="button" class="btn btn-secondary-on-dark">새 문장 분석</button>
          </div>
        </section>
      </div>
    </section>

    <section class="how-it-works" aria-labelledby="how-title">
      <div class="container">
        <h2 id="how-title" class="t-display-md">어떻게 분석하나요?</h2>
        <ol class="step-grid">
          <li class="step-card">
            <p class="step-card__num t-caption">01</p>
            <h3 class="t-title-sm">문장 입력</h3>
            <p class="t-body-md">리뷰, 댓글, 메시지 등 분석하고 싶은 문장을 1,000자 이내로 입력하세요.</p>
          </li>
          <li class="step-card">
            <p class="step-card__num t-caption">02</p>
            <h3 class="t-title-sm">AI 분석</h3>
            <p class="t-body-md">AI가 문장 전체의 분위기와 표현을 읽고 감성을 판단합니다.</p>
          </li>
          <li class="step-card">
            <p class="step-card__num t-caption">03</p>
            <h3 class="t-title-sm">결과 확인</h3>
            <p class="t-body-md">긍정·부정·중립 결과와 신뢰도, 판단 이유를 함께 확인하세요.</p>
          </li>
        </ol>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <p class="t-body-md">입력한 문장은 저장되지 않으며, 분석을 위해 OpenAI로 전송됩니다.</p>
      <p class="t-caption footer__copy">© 2026 감성 분석기</p>
    </div>
  </footer>
</body>
</html>
```

**규칙**
- 위 문구(제목, 설명, 버튼 글자, 안내 문구)는 **글자 그대로** 사용한다.
- CSS·JS 경로는 `/`로 시작하지 않는 **상대 경로**(`styles.css`)로 쓴다. 2단계에서 `index.html`을 파일로 바로 열어도 스타일이 보이게 하기 위함이다. (파일로 열면 `app.js`는 브라우저 보안 정책으로 실행되지 않는데, 2단계에서는 정상이다)
- `hidden` 속성으로 보이기/숨기기를 제어한다. CSS에서 `[hidden] { display: none !important; }`를 선언한다.
- 결과 카드의 배경 클래스(`result-card--positive` 등)는 JS가 붙인다. HTML에는 쓰지 않는다.

---

## 3. 섹션별 스타일 지침

| 요소 | 지침 |
|---|---|
| `.container` | `max-width: var(--container-max)`, `margin: 0 auto`, 좌우 `padding: 0 var(--space-xxl)` (모바일 `--space-md`) |
| `.top-nav` | 높이 `--nav-height`, 배경 `--color-canvas`, 아래 1px `--color-hairline`. 고정(sticky) 하지 않음 |
| `.top-nav__brand` | 18px / 500, `--color-ink`, 밑줄 없음 |
| `.hero` | 배경 `--color-canvas`, `padding: var(--space-section) 0` |
| `h1` | `--color-ink`, 아래 여백 `--space-sm` |
| `.hero__sub` | `--color-body`, 아래 여백 `--space-xxl` |
| `.input-panel` | docs/02 §5-3. `display: flex; flex-direction: column; gap: var(--space-sm)` |
| `.char-count` | 오른쪽 정렬, `--color-muted`. 1,000자 도달 시 JS가 `.char-count--limit` 클래스를 붙이고, 이 클래스는 글자색 `--color-error` |
| `.button-row` | `display: flex; gap: var(--space-sm)`, 모바일에서 세로 쌓기 + 버튼 너비 100% |
| `.result-card` | 입력 패널 아래 `margin-top: var(--space-lg)`. 내부 블록 간격 `--space-lg` |
| `.result-card__label` | 아래에 작은 영문 표기 없음. 한국어 라벨만 |
| `.result-card__footer` | 위에 1px `rgba(255,255,255,0.24)` 구분선, `padding-top: var(--space-lg)`, 데스크톱에서 좌우 배치, 모바일에서 세로 쌓기 |
| `.how-it-works` | 배경 `--color-signature-cream`, `padding: var(--space-section) 0` |
| `.step-grid` | `list-style: none; padding: 0; display: grid; gap: var(--space-lg); grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-top: var(--space-xl)` |
| `.footer` | 배경 `--color-canvas`, `padding: var(--space-xxl) 0`, 글자 `--color-muted` |

---

## 4. 화면 상태 (UI State)

화면은 아래 4가지 상태 중 **항상 하나**에만 있다.

| 상태 | 언제 | 입력창 | 분석하기 버튼 | 지우기 버튼 | 오류 알림 | 결과 카드 |
|---|---|---|---|---|---|---|
| `idle` (대기) | 처음 접속, 지우기 후 | 편집 가능 | 활성, "분석하기" | 활성 | 숨김 | 숨김 |
| `loading` (분석 중) | 요청을 보낸 뒤 | `readonly`, `aria-busy="true"` | **비활성**, "분석 중…" | **비활성** | 숨김 | 숨김 (이전 결과도 숨김) |
| `success` (성공) | 정상 응답 | 편집 가능 (입력 유지) | 활성, "분석하기" | 활성 | 숨김 | **표시** |
| `error` (오류) | 실패 | 편집 가능 (입력 유지) | 활성, "분석하기" | 활성 | **표시** | 숨김 |

- "분석 중…"의 `…`은 말줄임표 한 글자(U+2026)다.
- 스피너·스켈레톤·애니메이션은 넣지 않는다. 버튼 문구 변경만으로 로딩을 표시한다.
- 입력값 관련 오류(`EMPTY_TEXT`, `TEXT_TOO_LONG`)일 때만 입력창에 `aria-invalid="true"`를 붙이고, 사용자가 다시 입력하면 제거한다.

## 5. 결과 카드 표시 규칙

| 서버 값 `sentiment` | 화면 라벨 | 카드 클래스 |
|---|---|---|
| `positive` | 긍정 | `result-card--positive` |
| `negative` | 부정 | `result-card--negative` |
| `neutral` | 중립 | `result-card--neutral` |

- 신뢰도 글자: `87%` (정수 + `%`, 공백 없음)
- 진행 바: `#result-confidence-fill`의 `style.width = "87%"`, `#result-confidence-bar`의 `aria-valuenow="87"`
- 결과가 표시되면 결과 카드로 화면을 부드럽게 스크롤하지 **않는다**. 대신 `#result-card`에 `tabindex="-1"`을 주고 `focus()` 한다. (화면 낭독기 사용자에게 결과를 알림)
- 다른 감성 클래스가 남아있지 않도록, 클래스를 붙이기 전에 세 가지 감성 클래스를 모두 제거한다.

## 6. 버튼 동작

| 버튼 | 동작 |
|---|---|
| 분석하기 | 폼 제출 → `docs/06`의 분석 흐름 실행 |
| 지우기 | 입력창 비우기 → 글자 수 `0 / 1,000` → 상태 `idle` → 입력창 포커스 |
| 새 문장 분석 | "지우기"와 동일 |

---

## 7. 완료 기준 (UI)

- [ ] §2의 모든 id가 HTML에 존재한다: `analyze-form`, `text-input`, `char-count`, `error-alert`, `error-message`, `analyze-button`, `clear-button`, `result-card`, `result-label`, `result-confidence-text`, `result-confidence-bar`, `result-confidence-fill`, `result-reason`, `reset-button`
- [ ] 처음 접속 시 오류 알림과 결과 카드가 보이지 않는다
- [ ] 375px 폭에서 버튼이 세로로 쌓이고 가로 스크롤이 없다
- [ ] Tab 키로 입력창 → 분석하기 → 지우기 순서로 이동하며 파란 포커스 링이 보인다
- [ ] 마우스를 버튼 위에 올려도 색이 바뀌지 않는다 (hover 없음)
- [ ] 페이지에 그라데이션, 그림자 장식, 이모지가 없다
- [ ] `styles.css`에서 `#` HEX 색상은 `:root` 안에만 존재한다 (`rgba(255,255,255,0.24)` 제외)
