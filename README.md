# 내기 돌림판 (Bet Roulette)

AI가 입력 문장에서 항목을 추출하여 공정한 돌림판을 생성하고 무작위로 당첨을 결정하는 웹 서비스입니다.

## 1. 실행 방법

1. 환경변수 파일 생성
```bash
cp .env.example .env
```
`.env` 파일에 `OPENAI_API_KEY`를 설정합니다.

2. 로컬 개발 서버 실행 (설치할 npm 패키지 없음)
```bash
npm run dev
```

3. 브라우저에서 `http://localhost:3000` 접속

## 2. 배포 방법 (Vercel)

1. GitHub 저장소에 푸시합니다.
2. Vercel에서 저장소를 임포트하고 Framework Preset을 `Other`, Output Directory를 `public`으로 설정합니다.
3. Environment Variables에 `OPENAI_API_KEY`를 추가하고 배포합니다.
