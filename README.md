# 거짓말 자기소개 🤥

교회 팀 아이스브레이킹용 실시간 웹 게임. 각자 폰으로 접속해서, 키워드 속에 숨은 거짓말을 찾아내면 점수!

## 남은 준비 (딱 3단계)

### 1. Firebase 콘솔 설정 (약 5분)

1. [console.firebase.google.com](https://console.firebase.google.com) → **프로젝트 추가** (이름 아무거나, Google 애널리틱스는 꺼도 됨)
2. 왼쪽 메뉴 **빌드 → Realtime Database → 데이터베이스 만들기**
   - 위치: 아무거나 (예: `asia-southeast1`)
   - 보안 규칙: **테스트 모드로 시작** ← 중요! (잠금 모드면 아무것도 안 됨. 테스트 모드는 30일 유효라 내일 행사엔 충분)
3. **프로젝트 개요 → 웹 앱 추가(`</>` 아이콘)** → 앱 이름 아무거나 → 등록
4. 화면에 나오는 `firebaseConfig` 값을 복사해서 `src/firebase.js`에 붙여넣기
   - ⚠️ 복사한 값에 **`databaseURL`이 없으면** Realtime Database 페이지 상단의 주소(`https://...firebasedatabase.app`)를 직접 추가해야 함!

### 2. 로컬에서 실행 & 테스트

```bash
npm install
npm run dev
```

브라우저 탭 2~3개(시크릿 창 섞어서)로 열어 방 만들기 → 참여 → 게임 한 바퀴 돌려보기.
`npm run dev`는 같은 와이파이의 폰에서도 접속 가능 (터미널에 뜨는 Network 주소로).

### 3. 배포 (Firebase Hosting)

```bash
npm run build
npm install -g firebase-tools
firebase login
firebase deploy --only hosting --project 프로젝트ID
```

배포된 주소로 방을 만들면 로비에 QR이 뜸 → 사람들은 스캔만 하면 입장.

## 행사 전 리허설 체크리스트

- [ ] 배포된 주소에서 폰 2대로 실제 게임 한 바퀴 (한 대는 와이파이 끄고 **셀룰러**로 — 교회 와이파이가 안 될 수도 있으니)
- [ ] 게임 중 폰 새로고침 → 같은 화면으로 복귀되는지 확인
- [ ] QR 스캔 → 닉네임 입력 화면으로 바로 가는지 확인
- [ ] 만약을 위한 종이+펜 준비 (최후의 수단)

## 게임 규칙 요약

- 키워드 4~6개 작성, 하나는 거짓말
- 거짓말 맞추면 **+1점**, 투표자 과반이 틀리면 발표자 **+2점**
- 방장이 진행 컨트롤 (정답 공개 / 다음 사람)
- 새로고침해도 자동 복귀, 늦게 온 사람은 관전 → "한 판 더"부터 참여

기술 스펙과 설계 결정은 [CLAUDE.md](CLAUDE.md) 참고.
