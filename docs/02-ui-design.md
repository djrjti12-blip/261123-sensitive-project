# 02. UI 구현 지침

> 첨부된 디자인 분석 문서(`DESIGN-hashicorp.md`)의 **스타일 규칙**(검은 배경, 숯색 카드, 얇은 테두리, 8px 둥근 버튼, 대문자 눈썹 제목 등)을 이 프로젝트에 맞게 옮긴 문서입니다.
> 해당 회사의 로고·이름·제품명·일러스트는 사용하지 않습니다. 폰트는 `hashicorpSans` 대신 **LevelUp** 웹폰트를 씁니다.

---

## 1. 디자인 한 줄 요약

**"검은 캔버스 위에 숯색 카드가 살짝 떠 있고, 화면에서 유일하게 화려한 것은 돌림판이다."**

- 바탕: 순수 검정 `#000000`
- 카드: 숯색 `#15181e` + 아주 옅은 회색 1px 테두리
- 그림자 없음 → 높이는 "배경색이 한 단계 밝아지는 것"으로 표현
- 버튼 모서리: 8px (알약 모양 아님)
- 제목은 촘촘하게(줄간격 1.17~1.21), 본문은 여유 있게(줄간격 1.5~1.71)

---

## 2. 웹폰트

`public/css/tokens.css` 맨 위에 아래 코드를 **그대로** 넣는다.

```css
@font-face {
  font-family: 'LevelUp';
  src: url('https://cdn.jsdelivr.net/gh/Project-Noonnu/2610132210@levelup-regular/levelup-regular/LevelUp-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'LevelUp';
  src: url('https://cdn.jsdelivr.net/gh/Project-Noonnu/2610132210@levelup-regular/levelup-regular/LevelUp-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-display: swap;
}
@font-face {
  font-family: 'LevelUp';
  src: url('https://cdn.jsdelivr.net/gh/Project-Noonnu/2610132210@levelup-regular/levelup-regular/LevelUp-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: 'LevelUp';
  src: url('https://cdn.jsdelivr.net/gh/Project-Noonnu/2610132210@levelup-italic/levelup-italic/LevelUp-Italic.woff2') format('woff2');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: 'LevelUp';
  src: url('https://cdn.jsdelivr.net/gh/Project-Noonnu/2610132210@levelup-italic/levelup-italic/LevelUp-SemiBoldItalic.woff2') format('woff2');
  font-weight: 600;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: 'LevelUp';
  src: url('https://cdn.jsdelivr.net/gh/Project-Noonnu/2610132210@levelup-italic/levelup-italic/LevelUp-BoldItalic.woff2') format('woff2');
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}
```

### 폰트 사용 규칙

| 규칙 | 내용 |
|---|---|
| 글꼴 이름 | `font-family: var(--font-sans);` 만 사용 |
| 대체 글꼴 | `'LevelUp', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif` |
| 사용 굵기 | 400(본문), 600(강조·버튼), 700(큰 제목)만. 다른 굵기 금지 |
| 기울임꼴 | **당첨 결과 텍스트에만** `font-style: italic` (700) 사용. 그 외 사용 금지 |
| canvas 글자 | 돌림판 칸 글자도 `600 16px LevelUp, sans-serif`처럼 지정. 폰트 로딩 후 그리기 (docs/03 §4.4) |

> 원본 디자인 문서는 본문 굵기 500을 썼지만, LevelUp에는 500이 없으므로 **본문은 400**으로 바꿉니다.

---

## 3. 디자인 토큰 (CSS 변수)

`public/css/tokens.css`의 `:root`에 정의한다. **style.css에서는 색·크기 값을 직접 쓰지 말고 반드시 이 변수만 사용한다.** (돌림판 칸 색은 예외로 JS에 정의, §3.5)

### 3.1 색상

```css
:root {
  /* 바탕·표면 */
  --color-canvas: #000000;        /* 페이지 바탕 */
  --color-surface-1: #15181e;     /* 기본 카드 */
  --color-surface-2: #1f232b;     /* 강조 카드, 보조 버튼, 마우스 올림 */
  --color-surface-3: #3b3d45;     /* 칩, 작은 배지 */
  --color-hairline: rgba(178, 182, 189, 0.1); /* 카드 테두리 */
  --color-hairline-strong: #3b3d45;           /* 강조 테두리 */

  /* 글자 */
  --color-ink: #ffffff;           /* 제목, 중요한 글 */
  --color-ink-muted: #b2b6bd;     /* 설명, 보조 글 */
  --color-ink-subtle: #656a76;    /* 도움말, 글자 수 */

  /* 반전 (주 버튼) */
  --color-inverse-canvas: #ffffff;
  --color-inverse-ink: #000000;

  /* 포인트 */
  --color-accent: #2b89ff;        /* 포커스 테두리, 링크 */

  /* 의미 색 */
  --color-success: #00ca8e;       /* 신뢰도 높음 */
  --color-warning: #ffcf25;       /* 신뢰도 보통, 경고 */
  --color-error: #e62b1e;         /* 신뢰도 낮음, 오류 */
  --color-error-bg: rgba(230, 43, 30, 0.12);
  --color-warning-bg: rgba(255, 207, 37, 0.12);
}
```

### 3.2 글자 크기 (타이포그래피)

| 변수 이름 접두사 | 크기 | 굵기 | 줄간격 | 자간 | 쓰는 곳 |
|---|---|---|---|---|---|
| `--type-display` | 56px | 700 | 1.18 | -1.6px | 페이지 큰 제목 (h1) |
| `--type-headline` | 28px | 600 | 1.21 | -0.6px | 당첨 결과 텍스트 |
| `--type-card-title` | 22px | 600 | 1.18 | -0.4px | 카드 제목 (h2) |
| `--type-body-lg` | 18px | 400 | 1.69 | 0 | 제목 아래 설명 |
| `--type-body` | 16px | 400 | 1.50 | 0 | 입력창, 분석 이유 |
| `--type-body-sm` | 14px | 400 | 1.71 | 0 | 카드 안 보조 설명 |
| `--type-caption` | 13px | 400 | 1.38 | 0.2px | 글자 수, 안내문, 푸터 |
| `--type-button` | 14px | 600 | 1.29 | 0 | 버튼 |
| `--type-eyebrow` | 12px | 600 | 1.23 | 0.6px | 카드 위 대문자 라벨 |

각 항목은 `--type-display-size`, `--type-display-weight`, `--type-display-lh`, `--type-display-ls` 처럼 4개 변수로 나눠 정의한다.

**휴대폰(폭 767px 이하)**에서는 `--type-display-size: 36px; --type-display-ls: -1px;`, `--type-headline-size: 24px;`로 덮어쓴다.

### 3.3 간격·모서리

```css
:root {
  --space-xxs: 4px;  --space-xs: 8px;   --space-sm: 12px;
  --space-md: 16px;  --space-lg: 24px;  --space-xl: 32px;
  --space-xxl: 48px; --space-section: 96px;

  --radius-xs: 4px;  --radius-sm: 6px;  --radius-md: 8px;
  --radius-lg: 12px; --radius-xl: 16px; --radius-xxl: 24px;
  --radius-pill: 9999px;

  --font-sans: 'LevelUp', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif;
  --container-max: 1200px;
  --nav-height: 64px;
}
```

### 3.4 높이(깊이) 표현

| 단계 | 표현 | 쓰는 곳 |
|---|---|---|
| 0 | 바탕 그대로, 테두리 없음 | 상단바, 제목 영역, 푸터 |
| 1 | `surface-1` + 1px `hairline` 테두리 | 입력 카드, 분석 카드, 돌림판 카드 |
| 2 | `surface-2` + 1px `hairline-strong` 테두리 | 당첨 결과 카드, 카드 마우스 올림 |

- **그림자(`box-shadow`) 사용 금지.** (포커스 테두리 표시용 `outline`은 허용)

### 3.5 돌림판 칸 색상 (예외 규칙)

원본 디자인 문서는 "한 화면에 여러 포인트 색을 섞지 말라"고 하지만, **돌림판만은 예외로 여러 색을 씁니다.** 돌림판이 이 화면의 유일한 주인공이기 때문입니다. 돌림판 밖에서는 이 색들을 쓰지 않습니다.

`public/js/wheel.js`에 아래 배열을 **이 순서 그대로** 정의한다.

| 순서 | 칸 배경색 | 칸 글자색 |
|---|---|---|
| 0 | `#7b42bc` (보라) | `#ffffff` |
| 1 | `#ffcf25` (노랑) | `#000000` |
| 2 | `#1868f2` (파랑) | `#ffffff` |
| 3 | `#00ca8e` (초록) | `#000000` |
| 4 | `#e62b1e` (빨강) | `#ffffff` |
| 5 | `#14c6cb` (청록) | `#000000` |
| 6 | `#911ced` (밝은 보라) | `#ffffff` |
| 7 | `#f24c53` (산호) | `#ffffff` |

- 칸 `i`의 색 = `palette[i % 8]`
- **단, 항목 개수 `n`이 `n % 8 === 1`인 경우(9개)** 마지막 칸이 첫 칸과 같은 색이 되어 붙어 보이므로, 마지막 칸만 `palette[2]`를 쓴다.
- 칸과 칸 사이 구분선: `#000000`, 두께 2px

---

## 4. 페이지 레이아웃

### 4.1 전체 구조

```
┌─────────────────────────────────────────────────────┐
│ [상단바 64px]  ● 내기 돌림판                          │
├─────────────────────────────────────────────────────┤
│  BET ROULETTE                         (눈썹 라벨)     │
│  오늘의 내기, 돌려서 정하자              (h1)          │
│  내기 내용을 문장으로 적으면 AI가 ...    (설명)         │
├────────────────────────┬────────────────────────────┤
│ ┌ 입력 카드 ──────────┐ │ ┌ 돌림판 카드 ────────────┐ │
│ │ STEP 1              │ │ │ STEP 3                  │ │
│ │ 내기 내용 입력       │ │ │ 돌림판                   │ │
│ │ [textarea]          │ │ │        ▼                │ │
│ │ 0 / 500             │ │ │     ( 돌림판 )           │ │
│ │ [오류 박스]          │ │ │                         │ │
│ │ [돌림판 만들기]      │ │ │ [돌리기]                 │ │
│ └─────────────────────┘ │ └─────────────────────────┘ │
│ ┌ 분석 카드 ──────────┐ │ ┌ 결과 카드 ──────────────┐ │
│ │ STEP 2              │ │ │ RESULT                  │ │
│ │ AI 분석 결과         │ │ │ 🎯 지영                  │ │
│ │ 신뢰도 92% ████▒    │ │ │ [다시 돌리기] [처음부터]  │ │
│ │ 분석 이유 ...        │ │ └─────────────────────────┘ │
│ │ [칩][칩][칩]         │ │                             │
│ └─────────────────────┘ │                             │
├────────────────────────┴────────────────────────────┤
│ [푸터] 당첨은 무작위로 결정됩니다 · 재미로 만든 프로젝트 │
└─────────────────────────────────────────────────────┘
```

### 4.2 크기 규칙

| 요소 | 규칙 |
|---|---|
| 콘텐츠 최대 폭 | `--container-max` (1200px), 가운데 정렬 |
| 좌우 여백 | 데스크톱 `--space-xxl`(48px), 휴대폰 `--space-md`(16px) |
| 제목 영역 위아래 | 위 `--space-xxl`, 아래 `--space-xl` |
| 두 열 사이 간격 | `--space-xl` (32px) |
| 카드끼리 세로 간격 | `--space-lg` (24px) |
| 카드 안쪽 여백 | `--space-lg` (24px) |
| 푸터 | 위 여백 `--space-section`(96px), 안쪽 `--space-xl` |

### 4.3 반응형 (화면 폭에 따라)

| 화면 폭 | 배치 |
|---|---|
| 1024px 이상 | 두 열: 왼쪽 45% (입력+분석), 오른쪽 55% (돌림판+결과) — `grid-template-columns: 9fr 11fr` |
| 768px ~ 1023px | 한 열, 순서: 입력 → 분석 → 돌림판 → 결과 |
| 767px 이하 | 한 열 + 큰 제목 36px + 좌우 여백 16px + 버튼 폭 100% |

- 가로 스크롤이 생기면 안 된다.
- 돌림판 크기: 카드 안쪽 폭에 맞추되 **최대 440px, 최소 260px**, 정사각형.

---

## 5. 컴포넌트

### 5.1 상단바
- 높이 64px, 배경 `--color-canvas`, 아래 1px `--color-hairline` 테두리, 화면 위에 고정(`position: sticky; top: 0; z-index: 10`)
- 왼쪽: 지름 10px 흰 원 + `내기 돌림판` (14px, 600)
- 오른쪽: 없음

### 5.2 눈썹 라벨 (eyebrow)
- 12px, 600, 자간 0.6px, `text-transform: uppercase`, 색 `--color-ink-muted`
- **모든 카드 제목 위에 반드시** 하나씩 둔다: `STEP 1`, `STEP 2`, `STEP 3`, `RESULT`
- 페이지 제목 위: `BET ROULETTE`

### 5.3 카드
```
background: var(--color-surface-1);
border: 1px solid var(--color-hairline);
border-radius: var(--radius-lg);   /* 12px */
padding: var(--space-lg);          /* 24px */
```
- 카드 제목(h2): `--type-card-title`, 눈썹 라벨과 간격 8px, 제목 아래 간격 16px

### 5.4 버튼

| 종류 | 배경 | 글자 | 테두리 | 쓰는 곳 |
|---|---|---|---|---|
| 주 버튼 (`.btn-primary`) | `#ffffff` | `#000000` | 없음 | 돌림판 만들기, 돌리기 |
| 보조 버튼 (`.btn-secondary`) | `--color-surface-2` | `#ffffff` | 1px `hairline-strong` | 다시 돌리기 |
| 텍스트 버튼 (`.btn-tertiary`) | 투명 | `#ffffff` | 없음 | 처음부터 |

공통: 글자 `--type-button`, 안쪽 여백 `10px 18px`, 모서리 `8px`, **최소 높이 44px**, `cursor: pointer`

상태:
| 상태 | 표현 |
|---|---|
| 마우스 올림 | 주 버튼 `opacity: 0.88`, 보조 버튼 배경 `--color-surface-3` |
| 누름 | `transform: translateY(1px)` |
| 키보드 포커스 | `outline: 2px solid var(--color-accent); outline-offset: 2px` |
| 비활성(`disabled`) | `opacity: 0.4; cursor: not-allowed;` 마우스 올림 효과 없음 |
| 로딩 | 버튼 글자를 `분석 중…`으로 바꾸고 왼쪽에 14px 회전 원(CSS 애니메이션 0.8초 무한) |

### 5.5 입력창 (textarea)
- 배경 `--color-canvas`, 글자 `#ffffff`, 1px `--color-hairline-strong` 테두리, 모서리 8px, 안쪽 여백 `12px 14px`
- 높이 5줄 (`rows="5"`), `resize: vertical`, 최소 높이 120px
- placeholder 색 `--color-ink-subtle`
- 포커스: 테두리 색 `--color-accent`, 바깥 테두리(outline) 없음 대신 `border-color` 변경
- 오류 상태(`aria-invalid="true"`): 테두리 색 `--color-error`
- 아래 줄: 왼쪽 도움말 `예: 민수, 지영, 철수 중 커피 쏠 사람` / 오른쪽 글자 수 `0 / 500` (13px, `--color-ink-subtle`). 450자 이상이면 글자 수 색 `--color-warning`, 500자 초과면 `--color-error`

### 5.6 오류·경고 박스
- 기본은 숨김(`hidden` 속성)
- 오류: 배경 `--color-error-bg`, 왼쪽 3px `--color-error` 세로선, 모서리 8px, 안쪽 `12px 14px`, 글자 14px `#ffffff`
- 경고(대체 동작 안내): 배경 `--color-warning-bg`, 왼쪽 세로선 `--color-warning`
- 맨 앞에 굵은 제목(600) + 줄바꿈 + 설명 (예: **분석에 실패했어요** / 잠시 후 다시 시도해 주세요.)

### 5.7 분석 결과 카드 (신뢰도·이유·항목)
- 분석 전에는 카드 안에 `문장을 입력하고 돌림판을 만들어 보세요.` (14px, `--color-ink-subtle`)만 표시
- 분석 후:
  1. **신뢰도 줄**: 왼쪽 `신뢰도`(14px muted), 오른쪽 숫자 `92%`(28px, 700) + 등급 배지(`높음`/`보통`/`낮음`)
  2. **막대**: 높이 8px, 배경 `--color-surface-3`, 채움 색은 등급 색, 모서리 pill, 폭은 신뢰도 % 만큼. 채워질 때 `width` 0.6초 transition
  3. **등급 색**: 80~100 → `--color-success` / 50~79 → `--color-warning` / 0~49 → `--color-error`
  4. **안내문**: `신뢰도는 항목 분석의 정확도이며, 당첨 확률과 무관합니다.` (13px, subtle)
  5. **분석 이유**: 작은 제목 `분석 이유`(12px eyebrow 스타일) + 본문(16px, `#ffffff`)
  6. **항목 칩**: 작은 제목 `항목 (N개)` + 칩 목록. 칩: 배경 `--color-surface-3`, 글자 13px `--color-ink-muted`, 모서리 pill, 안쪽 `4px 10px`, 칩 간격 8px, 줄바꿈 허용. 칩 앞에 해당 돌림판 칸 색의 8px 원을 둔다.
- 대체 동작일 때: 숫자 자리에 `—`, 배지 `AI 미사용`(surface-3 배경), 막대는 숨김

### 5.8 돌림판 카드
- 돌림판 위 가운데 **화살표(포인터)**: CSS로 만든 아래 방향 삼각형, 폭 24px 높이 28px, 색 `#ffffff`, 돌림판 위에 겹쳐 놓음 (`position: absolute`)
- 돌림판 가장자리: 4px `#ffffff` 원형 테두리 (canvas에서 그림)
- 가운데: 지름 56px 원, 배경 `#000000`, 2px `#ffffff` 테두리 (canvas에서 그림)
- 분석 전: 회색(`--color-surface-2`) 빈 원 + 가운데 글자 `?` (canvas에서 그림)
- 아래 `돌리기` 주 버튼 (가운데 정렬, 폭 200px, 휴대폰 100%)

### 5.9 결과 카드
- 당첨 전에는 숨김(`hidden`)
- 배경 `--color-surface-2`, 테두리 1px `--color-hairline-strong`
- 당첨 텍스트: `--type-headline`, 700, **italic**, 앞에 당첨 칸 색의 16px 원
- 그 위 작은 글: `당첨!` (14px muted)
- 아래 버튼 2개 가로 배치(간격 12px): `다시 돌리기`(보조), `처음부터`(텍스트)
- 나타날 때: `opacity 0→1`, `translateY(8px→0)` 0.3초

### 5.10 푸터
- 배경 `--color-canvas`, 위 1px hairline, 가운데 정렬
- 글: `당첨은 브라우저의 무작위 함수로 공정하게 결정됩니다 · 재미로 만든 프로젝트` (13px, muted)

---

## 6. HTML 요소 ID (반드시 이 이름 사용)

| id | 요소 | 설명 |
|---|---|---|
| `betInput` | `<textarea>` | 내기 내용 입력 (`maxlength` 속성은 넣지 않음 — 초과 오류를 보여주기 위해) |
| `charCount` | `<span>` | `0 / 500` |
| `analyzeBtn` | `<button>` | 돌림판 만들기 |
| `messageBox` | `<div role="alert">` | 오류/경고 박스 |
| `analysisEmpty` | `<p>` | 분석 전 안내문 |
| `analysisContent` | `<div>` | 분석 결과 묶음 (처음엔 `hidden`) |
| `confidenceValue` | `<span>` | `92%` 또는 `—` |
| `confidenceBadge` | `<span>` | 높음/보통/낮음/AI 미사용 |
| `confidenceBar` | `<div>` | 막대 채움 부분 |
| `confidenceTrack` | `<div>` | 막대 바탕 (대체 동작 시 숨김) |
| `reasonText` | `<p>` | 분석 이유 |
| `itemCount` | `<span>` | 항목 개수 숫자 |
| `itemChips` | `<ul>` | 항목 칩 목록 |
| `wheelCanvas` | `<canvas>` | 돌림판 |
| `spinBtn` | `<button>` | 돌리기 |
| `resultCard` | `<section>` | 결과 카드 (처음엔 `hidden`) |
| `resultText` | `<p aria-live="polite">` | 당첨 항목 |
| `resultDot` | `<span>` | 당첨 칸 색 원 |
| `respinBtn` | `<button>` | 다시 돌리기 |
| `resetBtn` | `<button>` | 처음부터 |

---

## 7. 접근성

- `<html lang="ko">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`
- `<textarea>`에 연결된 `<label for="betInput">` (눈에 보이게, 카드 제목 h2를 label로 써도 됨)
- `wheelCanvas`에 `role="img"`와 `aria-label` — 항목이 바뀔 때마다 `돌림판: 민수, 지영, 철수, 나`로 갱신
- 모든 기능은 키보드(Tab, Enter, Space)만으로 사용 가능해야 한다.
- 글자와 배경 대비: 본문은 `#ffffff` 또는 `#b2b6bd` on `#15181e` 이상 (`#656a76`은 13px 보조 정보에만)
- 사용자가 "동작 줄이기"를 설정한 경우(`prefers-reduced-motion: reduce`): 돌림판 회전 시간 4초 → 0.6초, 막대·결과 카드 transition 제거

---

## 8. 완료 기준

- [ ] style.css에 색상 hex 값이 직접 쓰인 곳이 없다 (모두 `var(--...)`).
- [ ] `box-shadow`가 어디에도 없다.
- [ ] 모든 카드 위에 눈썹 라벨이 있다.
- [ ] 6장의 id가 모두 존재하고 이름이 정확하다.
- [ ] LevelUp 폰트가 적용된다 (개발자도구 > 요소 > Computed > Rendered Fonts에서 확인).
- [ ] HashiCorp 관련 이름·로고가 화면에 없다.

## 9. 검증 방법

| 검증 | 방법 | 기대 결과 |
|---|---|---|
| 폰트 | 개발자도구 Network 탭에서 `woff2` 필터 | LevelUp 파일 3개 이상 200 응답 |
| 반응형 | 개발자도구 기기 모드에서 375 / 768 / 1280px | 4.3의 배치대로 보이고 가로 스크롤 없음 |
| 색 변수 | style.css에서 `#` 검색 | 결과 0건 (주석 제외) |
| 키보드 | 마우스 없이 Tab으로 이동 | 입력창 → 만들기 → 돌리기 → 다시 돌리기 → 처음부터 순서로 파란 포커스 테두리가 보임 |
| 동작 줄이기 | 개발자도구 Rendering > Emulate `prefers-reduced-motion: reduce` | 돌림판이 1초 안에 멈춤 |
