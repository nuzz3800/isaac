# 김조엘 사랑방 🏡

부산 이삭교회 '김조엘 사랑방'의 홈 사이트. 각자 폰으로 접속해서 쓰는 우리 사랑방만의 공간이에요.

**👉 https://issac-1abff.web.app**

## 뭐가 있나요

- **🏠 홈** — 다가오는 생일·일정, 이번 주 기도제목 한눈에
- **👥 가원** — 서로의 프로필 (생일, MBTI, 좋아하는 것, 한 줄 소개)
- **🙏 기도** — 주별 기도제목 나눔, "함께 기도해요" 버튼
- **📅 일정** — 모임/나들이 일정과 D-day, 참석 체크
- **🎲 놀이** — 거짓말 자기소개 게임 (실시간, QR 입장)

로그인 없이 첫 방문 때 자기 프로필을 만들면 끝. 손님도 놀이(게임)는 QR로 바로 참여할 수 있어요.

## 개발

```bash
npm install
npm run dev      # 로컬 개발 (같은 와이파이 폰에서도 접속 가능)
npm run build    # 프로덕션 빌드
firebase deploy --only hosting --project issac-1abff   # 배포
```

- 스택: React + Vite + Firebase Realtime Database + Firebase Hosting
- 설계 결정·데이터 모델·규칙은 [CLAUDE.md](CLAUDE.md) 참고
- 모임 이름/문구 바꾸기: [src/branding.js](src/branding.js)
- 입장 암호 걸기: Firebase 콘솔에서 RTDB에 `config/passcode` 값 추가 (지우면 해제)

## 운영 메모

- ⚠️ DB 보안 규칙이 테스트 모드라 **2026년 8월 초에 만료**됨 — 만료 전 규칙 교체 필요
- 지난 게임 방(rooms)은 자동 삭제되지 않음 — 가끔 콘솔에서 정리해도 됨
