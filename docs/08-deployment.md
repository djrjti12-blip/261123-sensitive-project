# 08. Vercel 배포 지침

> 목표: GitHub에 코드를 올리면 Vercel이 자동으로 사이트를 만들어 준다.
> `public/` 폴더는 화면 파일로, `api/` 폴더는 서버리스 함수로 자동 인식된다. **`vercel.json`은 만들지 않는다.**

---

## 1. 배포 전 점검

- [ ] `npm test` 통과
- [ ] `docs/09` 수동 점검표 로컬에서 통과
- [ ] `git status`에 `.env`가 보이지 않는다
- [ ] `public/` 폴더 안에서 `sk-`, `OPENAI`, `process.env`를 검색했을 때 결과가 없다
- [ ] `package.json`에 `"engines": { "node": "24.x" }`가 있다

## 2. GitHub에 올리기

```bash
git init
git add .
git commit -m "감성 분석 서비스 v1.0"
git branch -M main
git remote add origin https://github.com/<내-아이디>/sentiment-analyzer.git
git push -u origin main
```

> `git add .` 직후 `git status`로 `.env`가 목록에 **없는지** 다시 확인한다. 있으면 즉시 멈추고 `.gitignore`를 점검한다.

## 3. Vercel 프로젝트 만들기 (웹 화면에서)

1. https://vercel.com 로그인 → **Add New… → Project**
2. GitHub 저장소 `sentiment-analyzer` 선택 → **Import**
3. 설정 화면에서:

| 항목 | 값 |
|---|---|
| Framework Preset | **Other** |
| Root Directory | `./` (기본값) |
| Build Command | 비워둠 (빌드 없음) |
| Output Directory | `public` |
| Install Command | 기본값 (`npm install`) |

4. **Environment Variables** 펼치기 → 아래 추가:

| Key | Value | 비고 |
|---|---|---|
| `OPENAI_API_KEY` | `sk-...` (실제 키) | 필수 |
| `OPENAI_MODEL` | (비워두거나 추가하지 않음) | 다른 모델을 쓸 때만 |

5. **Deploy** 클릭 → 1~2분 후 `https://<프로젝트명>.vercel.app` 주소가 생긴다.

> 환경 변수를 나중에 바꾸면 **Deployments → 최신 배포 → Redeploy** 해야 적용된다.

## 4. 배포 후 확인

- [ ] 배포 주소 접속 → 화면이 로컬과 똑같이 보인다 (Pretendard 글꼴 포함)
- [ ] 긍정/부정/중립 예시 문장(`docs/04` §5)으로 분석이 된다
- [ ] 주소창에 `https://<주소>/api/analyze` 입력 → `METHOD_NOT_ALLOWED` JSON이 보인다
- [ ] 개발자 도구 > Sources에서 `sk-` 검색 결과가 없다
- [ ] Vercel 대시보드 > 프로젝트 > **Logs**에서 오류 로그에 사용자 문장이 찍히지 않는다

## 5. 비용 보호 (필수)

배포된 사이트는 누구나 사용할 수 있으므로, OpenAI 쪽에서 비용 한도를 건다.

1. https://platform.openai.com → **Settings → Limits** (또는 Billing)
2. 월 사용 한도(budget / usage limit)를 감당 가능한 금액으로 설정
3. 한도 알림 이메일 설정

> 한도에 도달하면 서비스는 `AI_RATE_LIMITED` 문구를 보여준다. 이는 정상 동작이다.

## 6. 문제 해결

| 증상 | 원인 후보 | 확인 방법 |
|---|---|---|
| 화면은 뜨는데 분석 시 "서비스 설정에 문제가 있어요" | Vercel에 `OPENAI_API_KEY` 미설정 또는 오타 | Settings → Environment Variables 확인 후 Redeploy |
| "AI 서비스에 연결하지 못했어요"가 계속 뜸 | 모델 이름 오류, OpenAI 장애 | Vercel Logs에서 `[analyze] AI_SERVICE_ERROR 404` 등 확인. 404면 모델 이름 문제 → 사용자에게 보고 |
| 404 페이지가 뜸 | Output Directory가 `public`이 아님 | Settings → Build & Deployment 확인 |
| `/api/analyze`가 404 | `api/` 폴더가 루트에 없음 | 저장소 구조 확인 |
| 글꼴이 기본 글꼴로 보임 | `fonts.css` 경로 오류 | Network 탭에서 `.woff2` 요청 확인 |

에이전트는 위 표로 해결되지 않는 배포 문제를 만나면 설정을 임의로 바꾸지 말고 **로그 내용과 함께 사용자에게 보고**한다.
