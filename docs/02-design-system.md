# 02. 디자인 시스템 (디자인 토큰)

> 기준: 첨부된 Airtable 디자인 분석 문서(`DESIGN-airtable.md`).
> 이 서비스에 맞게 **필요한 토큰만 골라** 정리했다. 여기에 없는 값은 사용하지 않는다.

---

## 1. 디자인 방향 (한 문단 요약)

**흰 바탕 + 짙은 잉크색 글자 + 넉넉한 여백**이 기본이다. 화면은 잡지처럼 차분하고, 장식(그라데이션, 그림자, 배경 무늬)이 없다.
브랜드의 "강한 순간"은 **꽉 찬 색면 카드(시그니처 카드)** 에서만 나온다. 이 서비스에서는 **분석 결과 카드**가 그 역할을 한다.
강조는 글자를 굵게 하는 대신 **크기와 색 대비**로 한다.

---

## 2. Airtable 원본 대비 바뀐 점 (의도적 변경)

| 항목 | Airtable 원본 | 이 프로젝트 | 이유 |
|---|---|---|---|
| 글꼴 | Haas Grotesk / Haas Groot Disp | **Pretendard** | 사용자 지정 웹폰트, 한글 지원 |
| 본문 줄 간격 | 1.25 | **1.6** | 한글은 줄 간격이 좁으면 읽기 어려움 |
| 제목 줄 간격 | 1.1~1.2 | **1.3** | 한글 받침 공간 확보 |
| 입력창 글자 크기 | 14px | **16px** | iOS Safari에서 16px 미만이면 입력 시 화면이 자동 확대됨 |
| 시그니처 카드 용도 | 마케팅 콜아웃 | **결과 카드 (긍정/부정/중립)** | 서비스의 핵심 순간에 브랜드 색 사용 |
| 가격 페이지 하위 시스템 (Inter Display, pill 버튼) | 있음 | **사용 안 함** | 가격 페이지 없음 |

---

## 3. CSS 변수 (styles.css 맨 위에 그대로 선언)

```css
:root {
  /* ── 색상: 기본 ── */
  --color-primary: #181d26;          /* 주 버튼 배경, 제목 글자 */
  --color-primary-active: #0d1218;   /* 주 버튼 눌림 */
  --color-ink: #181d26;              /* 가장 진한 글자 */
  --color-body: #333840;             /* 본문 글자 */
  --color-muted: #41454d;            /* 보조 글자 (글자 수, 캡션, 푸터) */
  --color-hairline: #dddddd;         /* 1px 테두리 */
  --color-border-strong: #9297a0;    /* 비활성 버튼 테두리 */

  /* ── 색상: 면(배경) ── */
  --color-canvas: #ffffff;           /* 페이지 기본 배경 */
  --color-surface-soft: #f8fafc;     /* 입력 패널 배경 */
  --color-surface-strong: #e0e2e6;   /* 비활성 주 버튼 배경 */
  --color-surface-dark: #181d26;     /* 중립 결과 카드 */
  --color-on-dark: #ffffff;          /* 어두운 면 위 글자 */

  /* ── 색상: 시그니처 (결과 카드 + 작동 방식 섹션) ── */
  --color-signature-forest: #0a2e0e; /* 긍정 결과 카드 */
  --color-signature-coral: #aa2d00;  /* 부정 결과 카드 */
  --color-signature-cream: #f5e9d4;  /* 작동 방식 섹션 배경 */

  /* ── 색상: 의미 ── */
  --color-link: #1b61c9;             /* 링크 글자 */
  --color-info-border: #458fff;      /* 포커스 링, 입력창 포커스 테두리 */
  --color-error: #aa2d00;            /* 오류 글자·테두리 (= coral 재사용) */
  --color-error-surface: #fbf1ee;    /* 오류 알림 배경 (아래 주석 참고) */

  /* ── 글꼴 ── */
  --font-sans: "Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo",
    "Malgun Gothic", "Segoe UI", Roboto, "Helvetica Neue", sans-serif;

  /* ── 모서리 ── */
  --radius-sm: 6px;     /* 입력창, 오류 알림 */
  --radius-md: 10px;    /* 작동 방식 카드 */
  --radius-lg: 12px;    /* 버튼, 입력 패널, 결과 카드 */
  --radius-full: 9999px;/* 진행 바 끝 처리에만 사용 */

  /* ── 간격 (4px 단위) ── */
  --space-xxs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;
  --space-section: 96px;

  /* ── 레이아웃 ── */
  --container-max: 1280px;
  --content-max: 760px;  /* 입력 패널·결과 카드 최대 폭 */
  --nav-height: 64px;
}
```

> `--color-error-surface`(#fbf1ee)는 원본 문서에 없는 **유일한 추가 색**이다. 오류 알림을 coral 꽉 찬 카드로 만들면 "부정 결과"와 헷갈리므로, coral을 아주 옅게 만든 배경을 쓴다. 이 외의 색 추가는 금지.

---

## 4. 글꼴 크기 체계 (Typography)

| 토큰 이름 (CSS 클래스) | 크기 | 굵기 | 줄 간격 | 자간 | 사용처 |
|---|---|---|---|---|---|
| `.t-display-lg` | 40px | 400 | 1.3 | -0.01em | 히어로 제목 (h1), 결과 감성 라벨 ("긍정") |
| `.t-display-md` | 32px | 400 | 1.3 | -0.01em | 섹션 제목 (h2) |
| `.t-title-md` | 20px | 400 | 1.5 | 0 | 히어로 부제목 |
| `.t-title-sm` | 18px | 500 | 1.4 | 0 | 작동 방식 카드 제목 (h3) |
| `.t-label-md` | 16px | 500 | 1.4 | 0 | 입력창 라벨, 신뢰도 숫자 |
| `.t-button` | 16px | 500 | 1.4 | 0 | 버튼 글자 |
| `.t-body-lg` | 16px | 400 | 1.6 | 0 | 입력창 글자, 결과 이유 |
| `.t-body-md` | 14px | 400 | 1.6 | 0 | 본문, 작동 방식 설명, 푸터 |
| `.t-caption` | 14px | 500 | 1.4 | 0.01em | 글자 수, "분석 결과" 라벨, 안내 문구 |

**규칙**
- 굵기는 **400, 500, 600만** 사용. 600은 오류 알림 제목에만 사용. **700 이상 금지.**
- 제목(h1~h3)도 400~500. 강조는 크기로 한다.
- 모바일(768px 미만)에서는 `.t-display-lg` → 32px, `.t-display-md` → 26px.
- `body`에 `font-family: var(--font-sans); color: var(--color-body); -webkit-font-smoothing: antialiased;` 지정.

---

## 5. 컴포넌트 토큰

### 5-1. 버튼

| 이름 | 배경 | 글자 | 테두리 | 모서리 | 안쪽 여백 | 용도 |
|---|---|---|---|---|---|---|
| `.btn-primary` | `--color-primary` | `--color-on-dark` | 없음 | `--radius-lg` | 16px 24px | "분석하기" (화면에 1개만) |
| `.btn-secondary` | `--color-canvas` | `--color-ink` | 1px `--color-hairline` | `--radius-lg` | 16px 24px | "지우기" |
| `.btn-secondary-on-dark` | `--color-canvas` | `--color-ink` | 없음 | `--radius-lg` | 12px 20px | 결과 카드 안 "새 문장 분석" |

**버튼 상태** (hover는 만들지 않는다)

| 상태 | 처리 |
|---|---|
| 기본 (Default) | 위 표 그대로 |
| 눌림 (`:active`) | `.btn-primary` → 배경 `--color-primary-active`. 보조 버튼 → 배경 `--color-surface-soft` |
| 포커스 (`:focus-visible`) | `outline: 2px solid var(--color-info-border); outline-offset: 2px;` |
| 비활성 (`:disabled`) | `.btn-primary` → 배경 `--color-surface-strong`, 글자 `--color-muted`, `cursor: not-allowed`. 보조 버튼 → 테두리 `--color-border-strong`, 글자 `--color-muted` |

- 버튼 최소 높이 48px (터치 영역 확보).
- `cursor: pointer`는 허용 (hover 스타일이 아님).
- `transition`은 사용하지 않는다.

### 5-2. 입력창 (`.text-input`, textarea)

| 속성 | 값 |
|---|---|
| 배경 | `--color-canvas` |
| 글자 | `--color-ink`, `.t-body-lg` (16px / 1.6) |
| 테두리 | 1px solid `--color-hairline` |
| 모서리 | `--radius-sm` |
| 안쪽 여백 | 12px 16px |
| 높이 | 최소 160px, `resize: vertical` |
| placeholder 글자 | `--color-muted` |
| 포커스 | 테두리 `--color-info-border`, `outline: none`, `box-shadow: 0 0 0 1px var(--color-info-border)` |
| 오류 상태 (`[aria-invalid="true"]`) | 테두리 `--color-error` |

### 5-3. 입력 패널 (`.input-panel`)
배경 `--color-surface-soft`, 모서리 `--radius-lg`, 안쪽 여백 `--space-xl`(32px), 테두리 없음, 그림자 없음, 최대 폭 `--content-max`.

### 5-4. 결과 카드 (`.result-card`) — 시그니처 카드

| 감성 | 클래스 | 배경 | 글자 |
|---|---|---|---|
| 긍정 | `.result-card--positive` | `--color-signature-forest` | `--color-on-dark` |
| 부정 | `.result-card--negative` | `--color-signature-coral` | `--color-on-dark` |
| 중립 | `.result-card--neutral` | `--color-surface-dark` | `--color-on-dark` |

공통: 모서리 `--radius-lg`, 안쪽 여백 `--space-xxl`(48px, 모바일 `--space-lg` 24px), 그림자 없음, 최대 폭 `--content-max`.

**진행 바 (신뢰도)**
- 바탕(track): 높이 8px, 배경 `rgba(255, 255, 255, 0.24)`, 모서리 `--radius-full`
- 채움(fill): 배경 `--color-on-dark`, 너비 = 신뢰도 %, 모서리 `--radius-full`
- 애니메이션 없음

> 대비 확인: 흰 글자 대비 coral #aa2d00 ≈ 6.8:1, forest #0a2e0e·dark #181d26은 15:1 이상 → 모두 WCAG AA 통과.

### 5-5. 오류 알림 (`.alert-error`)
배경 `--color-error-surface`, 왼쪽 테두리 4px solid `--color-error`, 모서리 `--radius-sm`, 안쪽 여백 `--space-md`, 제목 글자 `--color-error` 14px/600, 내용 글자 `--color-ink` `.t-body-md`.

### 5-6. 작동 방식 카드 (`.step-card`)
배경 `--color-canvas`, 모서리 `--radius-md`, 안쪽 여백 `--space-lg`(24px), 테두리·그림자 없음. 단계 번호("01")는 `.t-caption` + `--color-muted`.

---

## 6. 레이아웃 규칙

- 페이지 컨테이너: `max-width: var(--container-max)`, 가운데 정렬, 좌우 여백 `--space-xxl`(48px), 모바일 `--space-md`(16px).
- 큰 섹션의 위아래 여백: `--space-section`(96px), 모바일 `--space-xxl`(48px).
- **같은 배경의 섹션이 연속되지 않게** 한다: 흰색(히어로) → 크림(작동 방식) → 흰색(푸터).
- 장식 금지: 그라데이션, `box-shadow` 장식(포커스 링 제외), 배경 이미지, 일러스트, 이모지.

## 7. 반응형 구간

| 이름 | 폭 | 변화 |
|---|---|---|
| 모바일 | ~767px | 1단, 제목 축소, 버튼 가로 꽉 채움(세로로 쌓임), 작동 방식 카드 1열, 결과 카드 여백 24px |
| 태블릿 | 768~1023px | 작동 방식 카드 3열 유지 가능하면 3열, 좁으면 1열 (`grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`) |
| 데스크톱 | 1024px~ | 기본값 |

## 8. 하지 말 것 (Don't)

- `--color-link`(파란색)를 주 버튼 색으로 쓰지 않는다. 주 버튼은 항상 거의 검정(`--color-primary`).
- 히어로에 그라데이션·배경 무늬를 넣지 않는다.
- pill(완전 둥근) 버튼을 만들지 않는다.
- hover 스타일을 만들지 않는다.
- 문서에 없는 색을 만들지 않는다 (`--color-error-surface` 하나만 예외).
- 글자 굵기 700 이상을 쓰지 않는다.
