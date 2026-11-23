# 01. 프로젝트 생성 지침

> 이 문서는 프로젝트 폴더를 만들고, 내 컴퓨터에서 실행해 보는 방법까지 다룹니다.

---

## 1. 준비물 (사람이 미리 설치)

| 준비물 | 버전 | 확인 방법 (터미널에 입력) |
|---|---|---|
| Node.js | **20.6 이상** (권장: 22 LTS) | `node -v` → `v20.6.0` 이상이면 OK |
| Git | 아무 버전 | `git --version` |
| OpenAI API 키 | — | https://platform.openai.com 에서 발급 |
| Vercel 계정 | — | 배포 단계에서만 필요 (docs/06) |

> **Node.js가 20.6 이상이어야 하는 이유:** `.env` 파일을 별도 패키지 없이 읽는 기능(`--env-file`)이 20.6부터 들어있기 때문입니다.

---

## 2. 폴더 구조 (이 구조 그대로, 이 파일들만 만든다)

```
bet-roulette/
├── AGENTS.md                  # 작업 규칙 (이미 있음)
├── PRD.md                     # 제품 요구사항 (이미 있음)
├── docs/                      # 세부 구현 문서 (이미 있음)
├── public/                    # ── 브라우저가 받는 파일들 ──
│   ├── index.html             # 화면 뼈대 (한 페이지)
│   ├── css/
│   │   ├── tokens.css         # 디자인 토큰 (색·글자·간격 CSS 변수) + 웹폰트
│   │   └── style.css          # 레이아웃·컴포넌트 스타일
│   └── js/
│       ├── main.js            # 시작점: 버튼 연결, 화면 상태 관리
│       ├── api.js             # 서버 /api/analyze 호출
│       ├── parser.js          # AI 실패 시 직접 나누기(대체 동작) + 입력 검사
│       ├── wheel.js           # 돌림판 그리기(canvas) + 돌리기 애니메이션
│       ├── random.js          # 공정한 무작위 숫자 만들기
│       └── messages.js        # 화면에 보여줄 오류·안내 문구 모음
├── api/
│   └── analyze.js             # ── 서버 ── OpenAI 호출하는 Vercel 함수
├── lib/
│   └── analyze-core.js        # 서버 핵심 로직 (입력 검사, 프롬프트, 응답 정리)
├── scripts/
│   └── dev-server.js          # 내 컴퓨터에서 실행용 간이 서버
├── .env.example               # 환경변수 이름 예시 (값 없음)
├── .gitignore
├── package.json
├── vercel.json
└── README.md                  # 실행·배포 방법 요약 (사람용)
```

> **왜 `api/`와 `lib/`를 나누나요?** `api/` 폴더 안의 모든 파일은 Vercel이 "인터넷 주소"로 만들어 버립니다. 그래서 주소가 되면 안 되는 내부 코드는 `lib/`에 둡니다.

---

## 3. 파일별 초기 내용

### 3.1 `package.json`

```json
{
  "name": "bet-roulette",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "AI가 항목을 나눠주는 내기 돌림판",
  "scripts": {
    "dev": "node --env-file=.env scripts/dev-server.js"
  },
  "engines": {
    "node": ">=20.6"
  }
}
```

- `dependencies`, `devDependencies`를 **추가하지 않는다.**
- `"type": "module"` → 모든 JS 파일에서 `import` / `export` 문법을 쓴다.

### 3.2 `.env.example`

```
# OpenAI API 키 (https://platform.openai.com/api-keys)
OPENAI_API_KEY=

# 사용할 모델 이름. 비워두면 gpt-4o-mini 사용
OPENAI_MODEL=
```

사람은 이 파일을 복사해 `.env`를 만들고 실제 키를 넣는다:
```bash
cp .env.example .env
```

### 3.3 `.gitignore`

```
node_modules/
.env
.env.local
.vercel/
.DS_Store
```

### 3.4 `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "outputDirectory": "public",
  "functions": {
    "api/analyze.js": {
      "maxDuration": 20
    }
  }
}
```

- `outputDirectory: "public"` → `public/` 폴더가 웹사이트로 공개됨
- `maxDuration: 20` → 서버 함수가 최대 20초까지 실행 가능 (OpenAI 대기 15초 + 여유)

### 3.5 환경변수 정리

| 이름 | 필수 | 기본값 | 설명 |
|---|---|---|---|
| `OPENAI_API_KEY` | 예 | 없음 | 없으면 서버가 `SERVER_CONFIG` 오류를 돌려줌 |
| `OPENAI_MODEL` | 아니오 | `gpt-4o-mini` | JSON Schema 구조화 출력(Structured Outputs)을 지원하는 모델이어야 함 |
| `PORT` | 아니오 | `3000` | 로컬 실행 포트 (dev-server.js에서만 사용) |

---

## 4. 로컬 개발 서버 (`scripts/dev-server.js`) 명세

Vercel 계정 없이 내 컴퓨터에서 바로 실행하기 위한 간이 서버입니다. **Node.js 내장 모듈만** 사용합니다 (`node:http`, `node:fs/promises`, `node:path`, `node:url`).

### 동작 규칙

1. `PORT` 환경변수(없으면 3000)에서 서버를 연다.
2. 요청 경로가 `/api/analyze`이면:
   - 요청 본문(body)을 끝까지 읽어 `JSON.parse` 한다. 실패하면 `req.body = null`.
   - `req.body`에 결과를 넣고 `api/analyze.js`의 `default` 함수(handler)에 `req`, `res`를 넘긴다.
   - 이렇게 하면 Vercel과 로컬에서 **같은 handler 코드**가 동작한다.
3. 그 외 경로는 `public/` 폴더의 파일을 돌려준다.
   - `/` → `public/index.html`
   - 파일이 없으면 404, 본문 `Not Found`
   - `..`이 포함된 경로는 404 (상위 폴더 접근 차단)
4. 확장자별 Content-Type:

| 확장자 | Content-Type |
|---|---|
| `.html` | `text/html; charset=utf-8` |
| `.css` | `text/css; charset=utf-8` |
| `.js` | `text/javascript; charset=utf-8` |
| `.json` | `application/json; charset=utf-8` |
| `.svg` | `image/svg+xml` |
| 그 외 | `application/octet-stream` |

5. 서버가 켜지면 콘솔에 출력: `▶ 내기 돌림판: http://localhost:3000`
6. `OPENAI_API_KEY`가 비어 있으면 추가로 경고 출력: `⚠ OPENAI_API_KEY가 없습니다. AI 분석 대신 직접 나누기로 동작합니다.`

---

## 5. 실행 방법 (사람용)

```bash
# 1) 폴더로 이동
cd bet-roulette

# 2) 환경변수 파일 만들고 API 키 입력
cp .env.example .env
# .env 파일을 열어 OPENAI_API_KEY= 뒤에 키를 붙여넣기

# 3) 실행 (설치할 패키지가 없으므로 npm install 불필요)
npm run dev

# 4) 브라우저에서 열기
# http://localhost:3000
```

---

## 6. 완료 기준

- [ ] 2장의 폴더 구조와 실제 파일 목록이 **정확히 일치**한다 (추가 파일 없음).
- [ ] `package.json`에 `dependencies`가 없다.
- [ ] `npm run dev` 실행 후 `http://localhost:3000`에서 `index.html`이 열린다.
- [ ] `.env`가 `.gitignore`에 있다.

## 7. 검증 방법

| 검증 | 방법 | 기대 결과 |
|---|---|---|
| 서버 실행 | `npm run dev` | 콘솔에 `▶ 내기 돌림판: http://localhost:3000` |
| 정적 파일 | 브라우저에서 `http://localhost:3000/css/tokens.css` | CSS 내용이 보임 |
| 404 | `http://localhost:3000/없는파일.js` | `Not Found` |
| 경로 차단 | `curl http://localhost:3000/../package.json --path-as-is` | 404 |
| API 연결 | `curl -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d '{"text":"a, b"}'` | JSON 응답이 옴 (형식은 docs/04) |
