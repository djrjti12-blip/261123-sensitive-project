# 06. Vercel 배포 지침

> 내 컴퓨터에서만 보이던 사이트를 인터넷 주소로 공개하는 단계입니다.
> 이 단계의 대부분은 **사람이 직접** 웹사이트에서 클릭해야 합니다. AI 에이전트는 파일 준비와 확인만 합니다.

---

## 1. 배포 전 확인 (에이전트가 수행)

- [ ] `docs/07-testing-checklist.md`의 로컬 항목이 모두 통과했다.
- [ ] `.env`가 `.gitignore`에 있고, `git status`에 `.env`가 보이지 않는다.
- [ ] 코드 전체에서 `sk-` 로 시작하는 문자열 검색 결과가 0건이다.
- [ ] `vercel.json`이 docs/01 §3.4와 같다.
- [ ] `README.md`에 실행 방법과 배포 방법이 요약되어 있다.

---

## 2. 배포 방법 (사람이 수행) — GitHub 연결 방식

### 2.1 GitHub에 올리기
```bash
git init
git add .
git commit -m "내기 돌림판 첫 버전"
git branch -M main
git remote add origin https://github.com/내아이디/bet-roulette.git
git push -u origin main
```

### 2.2 Vercel에서 프로젝트 만들기
1. https://vercel.com 로그인 → **Add New… → Project**
2. GitHub 저장소 `bet-roulette` 선택 → **Import**
3. 설정 화면에서 아래처럼 입력:

| 항목 | 값 |
|---|---|
| Framework Preset | **Other** |
| Root Directory | `./` (그대로) |
| Build Command | 비워 둠 (Override 켜고 빈칸) |
| Output Directory | `public` |
| Install Command | 비워 둠 |

4. **Environment Variables** 펼치기 → 추가:

| Key | Value |
|---|---|
| `OPENAI_API_KEY` | 내 OpenAI API 키 |
| `OPENAI_MODEL` | (선택) 비우면 `gpt-4o-mini` |

5. **Deploy** 클릭 → 1~2분 후 `https://bet-roulette-xxxx.vercel.app` 주소가 생김

### 2.3 Node.js 버전
- Vercel 프로젝트 **Settings → General → Node.js Version**을 `20.x` 이상(권장 `22.x`)으로 둔다.

### 2.4 이후 수정 반영
- `git push`만 하면 Vercel이 자동으로 다시 배포한다.
- 환경변수를 바꾼 경우 **Deployments → 최신 배포 → Redeploy**를 눌러야 적용된다.

---

## 3. 배포 후 확인 (사람 + 에이전트)

| 확인 | 방법 | 기대 결과 |
|---|---|---|
| 페이지 열림 | 배포 주소 접속 | 검은 화면 + LevelUp 폰트 |
| API 동작 | `curl -s -X POST https://(주소)/api/analyze -H "Content-Type: application/json" -d '{"text":"a, b, c"}'` | `ok: true` JSON |
| 전체 흐름 | 입력 → 만들기 → 돌리기 | 당첨 결과 표시 |
| 키 노출 | 브라우저 개발자도구 Sources에서 `sk-` 검색 | 0건 |
| 휴대폰 | 실제 휴대폰으로 접속 | 화면이 깨지지 않음 |

---

## 4. 자주 생기는 문제

| 증상 | 원인 | 해결 |
|---|---|---|
| 페이지가 404 | Output Directory가 `public`이 아님 | Settings → Build & Development에서 `public`으로 수정 후 Redeploy |
| 항상 "AI 분석을 사용할 수 없어요" | 환경변수 미등록 또는 등록 후 재배포 안 함 | 환경변수 확인 → Redeploy |
| "AI 응답이 늦어요"가 자주 뜸 | OpenAI 응답 지연 | 잠시 후 재시도. 계속되면 Vercel Logs 확인 |
| "지금은 AI 사용량이 많아요" | OpenAI 요금 한도/결제 문제 | platform.openai.com → Billing 확인 |
| 로그 보는 법 | — | Vercel 프로젝트 → **Logs** 탭에서 `[analyze]` 검색 |

---

## 5. 완료 기준

- [ ] 배포 주소에서 3장의 모든 확인이 통과한다.
- [ ] Vercel 환경변수에만 API 키가 있고, GitHub 저장소에는 없다.
