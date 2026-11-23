# 01. 프로젝트 생성 지침

> 목표: 누구나 같은 폴더 구조와 같은 실행 방법으로 프로젝트를 시작할 수 있게 한다.

---

## 1. 준비물 (사람이 미리 해야 할 일)

| 준비물 | 확인 방법 | 비고 |
|---|---|---|
| Node.js **24 LTS** (22 이상이면 동작) | 터미널에서 `node -v` → `v24.x.x` 또는 `v22.x.x` | https://nodejs.org 에서 LTS 설치 |
| npm | `npm -v` | Node.js 설치 시 함께 설치됨 |
| OpenAI API 키 | https://platform.openai.com → API keys | `sk-`로 시작. 결제 수단 등록 필요 |
| GitHub 계정 | — | Vercel 배포용 |
| Vercel 계정 | — | GitHub 계정으로 가입 가능 |

> ⚠️ Node 20은 Vercel에서 지원 종료 예정이므로 사용하지 않는다.

---

## 2. 폴더 구조 (이 구조 그대로 만든다)

```
sentiment-analyzer/
├── AGENTS.md                 # 에이전트 작업 규칙
├── PRD.md                    # 제품 요구사항
├── docs/                     # 세부 구현 문서
│
├── public/                   # 브라우저에 전달되는 파일 (= 프론트엔드)
│   ├── index.html            # 화면 구조
│   ├── fonts.css             # Pretendard @font-face 선언 (§5)
│   ├── styles.css            # 디자인 토큰 + 화면 스타일
│   └── app.js                # 입력 → 요청 → 결과/오류 표시
│
├── api/
│   └── analyze.js            # Vercel 서버리스 함수: POST /api/analyze
│
├── lib/                      # 서버 전용 공용 코드 (브라우저로 전달되지 않음)
│   ├── errors.js             # 오류 코드·상태·문구 표
│   ├── validation.js         # 입력 검증, AI 응답 정리 (openai 패키지 사용 안 함)
│   └── sentiment.js          # OpenAI 호출
│
├── tests/
│   └── validation.test.js    # node:test 단위 테스트
│
├── dev-server.js             # 로컬 개발 서버 (Vercel 배포에는 사용 안 됨)
├── package.json
├── package-lock.json         # npm install 시 자동 생성 — 커밋한다
├── .env.example              # 환경 변수 예시 (커밋함)
├── .env                      # 실제 키 (커밋 금지)
└── .gitignore
```

**규칙**
- 위에 없는 파일·폴더는 만들지 않는다. (예: `src/`, `vercel.json`, `server.js`, `index.js`)
  - ⚠️ 특히 루트나 `src/`에 `server.js`라는 이름의 파일을 만들지 않는다. Vercel이 이를 서버 진입점으로 인식할 수 있다. 로컬 서버 파일 이름은 반드시 `dev-server.js`.
- `public/` 안의 파일은 `lib/`나 `api/`의 코드를 `import` 하지 않는다.
- `lib/`과 `api/`의 코드는 `public/`의 파일을 `import` 하지 않는다.

---

## 3. 설치 순서

```bash
# 1) 프로젝트 폴더로 이동
cd sentiment-analyzer

# 2) package.json 생성 (§4 내용으로 직접 작성해도 됨)
# 3) OpenAI 공식 SDK 설치 — 이 패키지 하나만 설치한다
npm install openai

# 4) 환경 변수 파일 만들기
cp .env.example .env
# .env 파일을 열어 OPENAI_API_KEY 값을 실제 키로 바꾼다

# 5) 로컬 실행
npm run dev
# → 브라우저에서 http://localhost:3000 접속

# 6) 테스트
npm test
```

> `npm install openai`가 설치하는 최신 버전을 그대로 사용한다. 버전을 임의로 낮추거나 고정하지 않는다.

---

## 4. 파일 내용 (그대로 작성)

### 4-1. `package.json`

```json
{
  "name": "sentiment-analyzer",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "OpenAI 기반 감성 분석 웹 서비스",
  "scripts": {
    "dev": "node --env-file=.env dev-server.js",
    "test": "node --test"
  },
  "engines": {
    "node": "24.x"
  },
  "dependencies": {
    "openai": "(npm install 시 자동 기록되는 버전)"
  }
}
```

- `"type": "module"` → `import`/`export` 문법 사용.
- `--env-file=.env` → Node.js 내장 기능으로 `.env`를 읽는다. **dotenv 패키지 설치 금지.**
- `engines.node`는 Vercel이 사용할 Node 버전을 정한다.
- `devDependencies`는 만들지 않는다.

### 4-2. `.env.example`

```bash
# OpenAI API 키 (필수) — https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-여기에-실제-키를-넣으세요

# 사용할 모델 (선택) — 비워두면 gpt-5.4-mini 사용
OPENAI_MODEL=

# 로컬 개발 서버 포트 (선택) — 비워두면 3000
PORT=
```

### 4-3. `.gitignore`

```gitignore
node_modules/
.env
.env.local
.env.*.local
.vercel/
.DS_Store
*.log
```

---

## 5. 웹폰트 (`public/fonts.css`)

사용자가 지정한 Pretendard 선언을 **수정 없이 그대로** `public/fonts.css`에 넣는다.

```css
@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Thin.woff2') format('woff2');
    font-weight: 100;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-ExtraLight.woff2') format('woff2');
    font-weight: 200;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Light.woff2') format('woff2');
    font-weight: 300;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Regular.woff2') format('woff2');
    font-weight: 400;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Medium.woff2') format('woff2');
    font-weight: 500;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-SemiBold.woff2') format('woff2');
    font-weight: 600;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Bold.woff2') format('woff2');
    font-weight: 700;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-ExtraBold.woff2') format('woff2');
    font-weight: 800;
    font-display: swap;
}

@font-face {
    font-family: 'Pretendard';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Black.woff2') format('woff2');
    font-weight: 900;
    font-display: swap;
}

@font-face {
    font-family: 'PretendardVariable';
    src: url('https://cdn.jsdelivr.net/gh/Project-Noonnu/2611030106@font-variable-694/variable-694/PretendardVariable.woff2') format('woff2');
    font-weight: 45 930;
    font-display: swap;
}

/* 가변: font-family: 'PretendardVariable'; font-variation-settings: "wght" 400; */
```

**사용 규칙**
- 실제 화면에서는 고정 굵기 패밀리 **`'Pretendard'`만** 사용한다. `PretendardVariable`은 선언만 두고 쓰지 않는다. (가변 폰트는 다음 버전에서 검토)
- 실제로 사용하는 굵기는 **400, 500, 600** 세 가지뿐이다. 브라우저는 사용된 굵기의 파일만 내려받으므로 선언이 많아도 속도에 문제없다.
- `index.html`의 `<head>`에서 `fonts.css`를 `styles.css`보다 **먼저** 불러온다.

---

## 6. 완료 기준

- [ ] §2의 폴더 구조와 실제 폴더가 일치한다 (`node_modules/`, `.env`, `package-lock.json` 제외 시 정확히 일치)
- [ ] `npm install` 후 `package.json`의 `dependencies`에 `openai`만 있다
- [ ] `git status`에 `.env`가 나타나지 않는다
- [ ] `public/fonts.css` 내용이 §5와 글자 하나까지 같다
