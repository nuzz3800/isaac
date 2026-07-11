# 거짓말 자기소개 (Liar Intro)

교회 아이스브레이킹용 실시간 웹 게임. 각자 자기 키워드 4~6개를 쓰고
그 중 하나를 거짓말로 섞는다. 나머지 사람들이 거짓말을 맞추면 점수를 얻는다.

**장기 프로젝트** — 첫 사용은 부산 이삭교회 '김조엘 사랑방' (2026-07-13),
이후 계속 발전시킬 예정. 확장을 막는 하드코딩을 피할 것.

## 브랜딩

- 모임 이름·환영 문구·마무리 문구는 전부 `src/branding.js`의 `BRAND` 객체에 모여 있음.
  다른 사랑방/모임으로 확장 시 이 파일만 교체 (단, `index.html`의 `<title>`은 정적이라 별도 수정)
- 사랑방 구성원은 '가원'이라고 부름 — UI 문구에서 '참가자' 대신 사용
- 톤: 따뜻하고 장난기 있는 해요체. 배포 주소: https://issac-1abff.web.app (Firebase 프로젝트 `issac-1abff`)

## 게임 흐름 (상태 머신)

`rooms/{code}/status` 값으로 화면이 갈린다: `lobby → writing → playing → done`

1. **lobby**: 방장이 방 생성(4자리 숫자 코드) → 참가자가 코드/QR로 입장 (닉네임만, 로그인 없음)
2. **writing**: 각자 키워드 4~6개 입력, 하나를 거짓말로 표시, 제출
3. **playing**: 발표 순서(랜덤)대로 한 명씩 반복
   - `turnPhase: "voting"` — 대상자의 키워드 공개, 나머지가 거짓말 지목 (+선택적 한 줄 코멘트)
   - `turnPhase: "revealed"` — 방장이 정답 공개 버튼 → 점수 반영
4. **done**: 최종 리더보드

## 확정된 규칙 (변경 시 이 문서도 갱신)

- **점수**: 거짓말을 맞춘 사람 +1. 투표자 과반이 틀리면 발표자 +2 (그럴듯한 거짓말 인센티브)
- **발표 순서**: 게임 시작 시 제출 완료자만으로 랜덤 셔플 (`turnOrder`)
- **본인 투표 금지**: 발표 차례인 사람은 투표 불가, 실시간 투표 수만 보임
- **투표 변경**: 정답 공개 전까지 가능. 타이머 없음 — 방장이 언제든 강제 공개 가능
- **미제출자**: 방장이 "제출한 사람만으로 시작" 가능. 미제출자는 발표만 빠지고 투표는 참여
- **늦은 입장**: 게임 시작 후 입장은 관전자(spectator) — 투표/점수 없음. "한 판 더" 시 정식 참가로 전환
- **재접속**: `localStorage`에 `{roomCode, playerId}` 저장. 새로고침/화면잠금 후 접속 시 같은 플레이어로 자동 복귀 (제일 중요한 현장 안정성 장치)
- **방장 권한**: `hostId`로 판별, 방장도 localStorage로 복귀하면 권한 유지
- **lieIndex 노출**: 클라이언트 렌더링에서만 가림 (교회 모임 수준에서 충분, 오버엔지니어링 금지)

## 기술 스택

- 프론트: React 18 + Vite (JavaScript, 라우터 없이 status 조건부 렌더링)
- 실시간 DB: Firebase Realtime Database (테스트 모드 규칙 — 하루짜리 이벤트)
- 배포: Firebase Hosting (`firebase.json` 포함, `firebase deploy --project <id>`)
- QR: `qrcode.react` — 링크에 `?room={code}` 포함, 스캔하면 닉네임 입력으로 직행

## 데이터 모델 (RTDB)

```
rooms/{roomCode}
  status: "lobby" | "writing" | "playing" | "done"
  hostId, createdAt
  turnOrder: [playerId...]        // playing 진입 시 생성
  currentTurnIndex: number
  turnPhase: "voting" | "revealed"
  players/{playerId}:
    { nickname, joinedAt, keywords[], lieIndex, submitted, score, spectator? }
  votes/{targetPlayerId}/{voterPlayerId}: { index, comment?, at }
```

모든 클라이언트는 `rooms/{roomCode}` 하나만 구독. 상태 전이(공개/다음/점수)는 방장 클라이언트만 쓰기 → 경합 없음.

## 파일 구조

- `src/firebase.js` — Firebase 초기화. **config는 사용자가 콘솔에서 받아 직접 붙여넣음** (`isConfigured`로 미설정 감지)
- `src/game.js` — 모든 DB 조작 + 세션(localStorage) 로직
- `src/App.jsx` — 세션 복구, 방 구독, status별 화면 분기
- `src/components/` — Home, Lobby, Writing, Voting(투표+정답공개), Result

## UI 주의사항

- 모바일 전용 설계 (max-width 480px), 높이는 `100vh` 대신 `100dvh` (iOS Safari)
- 입력 필드 font-size 16px 이상 (iOS 자동 줌 방지)
- 참가 인원 6~9명 가정, 시작 최소 2명(테스트용)
