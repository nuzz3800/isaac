# 김조엘 사랑방 홈

부산 이삭교회 '김조엘 사랑방'(소그룹)의 커뮤니티 웹사이트.
**장기 프로젝트** — 계속 발전시킬 예정이므로 확장을 막는 하드코딩을 피할 것.
2026-07-13 거짓말게임 첫 사용 후, 사랑방 홈 사이트로 확장됨.

- 배포 주소: https://issac-1abff.web.app (Firebase 프로젝트 `issac-1abff`)
- 사랑방 구성원은 **'가원'** 이라고 부름 — UI 문구에서 '참가자/멤버' 대신 사용
- 출생 연도는 **'01동기' 형식**으로 표기 (2001년생 ❌) — `dates.js`의 `cohortLabel`/`parseCohortYear` 사용
- 프로필에 '한 줄 소개' 없음 (사용자가 명시적으로 제외 요청)
- 톤: 따뜻하고 장난기 있는 해요체

## 디자인 언어 (사용자 제공 레퍼런스 기반 — 명상앱 무드)

- 차분한 노을빛: 라벤더→피치→크림 그라데이션 배경, 코퍼(#c07a4e) 포인트, 다크 네이비(#2c3040)
- 타이포 (사용자 선택): 제목·버튼·탭·섹션헤더는 **쿠키런체**(CookieRun, 눈누 CDN woff
  400/700/900 — styles.css 상단 @font-face), 본문은 Noto Sans KR (Google Fonts).
  쿠키런 라이선스: 게임 분야 외 무료. 긴 본문엔 쿠키런 쓰지 말 것(가독성)
- 카드: 흰색 `.panel`/`.card`, radius 20px, 테두리 대신 부드러운 그림자(`--shadow`)
- 탭바: 하단 플로팅 다크 네이비 필(pill), 활성 탭 코퍼
- 버튼: 필 형태(999px). primary=네이비, danger(강조 액션)=코퍼
- 스플래시: 페이지 로드마다 로고+사랑방 이름 1.7초 (App.jsx의 SplashScreen)
- 로고: `src/Logo.jsx` — 실제 로고의 **SVG 근사 재현** (핑크 #E4136B + 블루 #1E4396 십자 바람개비).
  실제 로고 파일을 받으면 `public/logo.png`로 교체할 것

## 사이트 구조 (react-router, 하단 탭바)

| 경로 | 화면 | 내용 |
|---|---|---|
| `/` | 홈 대시보드 | 인사, 다가오는 생일(30일)·일정, 이번 주 기도제목 미리보기 |
| `/members`, `/members/:id` | 가원 | 프로필 목록/상세/수정 (이모지 아바타, 생일, MBTI, 한줄소개, 좋아하는 것) |
| `/prayers` | 기도 | 주별(일요일 시작) 기도제목, 🙏 함께 기도해요 토글 |
| `/events` | 일정 | 일정 등록, D-day, 참석/불참 RSVP |
| `/play` | 놀이 | 콘텐츠 허브 — 거짓말게임, 누구일까요? |
| `/game` | 거짓말게임 | **게이트/프로필 없이 접근 가능** (QR 손님용). 옛 링크 `/?room=` → `/game?room=` 리다이렉트 |

## 정체성/보안 모델 (소규모 신뢰 기반)

- 로그인 없음. 첫 방문 시 프로필 목록에서 자기 이름 선택 or 새로 생성 → `localStorage(joel-member-id)`
- 입장 암호(선택): DB `config/passcode`가 존재하면 게이트 활성화, 없으면 통과.
  통과한 암호는 `localStorage(joel-pass)`에 저장. `/game`은 게이트 제외
- DB 규칙은 현재 테스트 모드 — **2026-08 초 만료 예정. 만료 전 `rooms`/`members` 등
  경로별 open 규칙으로 교체 필요** (기도제목이 있으니 장기적으로 강화 검토)

## 제품 방향 (중요)

이 사이트는 **주일 하루 집중 사용**을 전제로 설계한다 (사용자가 명시적으로 결정).
평일 사용을 가정한 기능(맛집 리스트, 익명 카드, 스트릭 등)은 만들지 않는다.
핵심 축: **쌓이는 기록 보관소** (기도제목 아카이브·응답, 프로필 문답, 일정).
평일 접점은 단톡방에 공유하는 링크로만. 출석 랭킹·참여 압박 기능 금지.
~~주일 모임 모드~~는 만들었다가 **사용자 결정으로 제거함** (2026-07: 모임 순서가
매주 달라서 고정 러너가 안 맞음) — 다시 제안하지 말 것.

## 기도 페이지 구성 (아카이브 중심, 사용자 요청 반영)

위→아래: 이번 주(비어도 항상 표시) → 지난주 → 지금까지(주별 그룹).
'기도제목 적기'는 **하단 고정 버튼** → 바텀시트 작성창. 본인 기도엔
🌱 응답됨 토글(수정/삭제 옆) — 응답 수는 상단 요약에 집계.

## 프로필 문답 & '누구일까요?' 퀴즈 (`/quiz`)

- 문답 은행은 `src/questions.js` — id 변경/삭제 금지(기존 답변 고아됨), 추가는 자유
- 퀴즈는 `quiz` 싱글턴 노드 (모임 모드 패턴): 대기실(참가하기) → 라운드(투표→공개→채점)
  → 결과. 진행 컨트롤은 `hostId`(대기실 연 사람)만. 방 코드 없음 — 프로필로 식별
- 출제 규칙: 문답에서 자동 생성, 같은 질문에 같은 답이 있으면 애매하므로 제외,
  한 사람당 최대 3문제, 최대 10라운드, 4지선다(정답 가원 + 랜덤 3명)
- 최소 조건: 가원 3명 이상 + 출제 가능 문제 5개 이상 (부족하면 문답 채우기 유도)

## 개발 워크플로우

기능 개발은 **브랜치 + PR**로 진행 (main 직접 커밋 지양, 사용자 결정).
`gh` CLI 미설치 — 브랜치 푸시 후 GitHub 웹에서 PR 생성.
리뷰용 미리보기: `firebase hosting:channel:deploy <이름> --project issac-1abff` (임시 URL 발급).
머지 후 main에서 `npm run build` → `firebase deploy --only hosting`.

## 데이터 모델 (Firebase RTDB)

```
config/passcode: string?              // 있으면 입장 암호 게이트 켜짐
members/{memberId}: { name, emoji, birthMonth?, birthDay?, birthYear?,
                      mbti?, likes?, createdAt,
                      answers?: { questionId: string } }  // 프로필 문답
prayers/{prayerId}: { memberId, text, weekKey(일요일 ISO), createdAt,
                      prayedBy: { memberId: true },
                      answered?: true, answeredAt? }   // 🌱 기도 페이지에서 본인이 체크
meetingLog/{id}: (구 모임 모드 잔재 — 기능 제거됨, 데이터만 남아있을 수 있음)
events/{eventId}:   { title, date(ISO), time?, place?, note?, createdBy,
                      createdAt, rsvp: { memberId: "yes"|"no" } }
rooms/{roomCode}:   거짓말게임 (아래 참고)
```

## 파일 구조

```
src/
  App.jsx        — 라우터 + 게이트 + 프로필 선택 + 탭바
  branding.js    — 교회/사랑방 이름·문구 (다른 모임 확장 시 이 파일만 교체)
  identity.js    — 내 memberId (localStorage)
  dates.js       — 주차(weekKey)·D-day·생일 계산 (로컬 시간 기준)
  api/           — members / prayers / events (구독 훅 + 쓰기 함수)
  pages/         — Dashboard, Members, MemberDetail, MemberForm, Welcome,
                   Prayers, Events, Play
  game/          — 거짓말게임 (GameApp + 화면들 + game.js, 독립 모듈)
```

## 거짓말게임 확정 규칙

- 키워드 4~6개 중 1개 거짓말. 맞춘 사람 +1, 투표자 과반이 틀리면 발표자 +2
- 발표 순서는 제출자만 랜덤 셔플. 본인 투표 금지. 투표 변경은 공개 전까지
- 타이머 없음 — 방장이 강제 공개/다음 진행. 미제출자는 투표만 참여
- 늦은 입장은 관전자, "한 판 더" 시 정식 참가
- 게임 세션은 `localStorage(liar-intro-session)`으로 새로고침 복구
- 상태 전이(공개/다음/점수)는 방장 클라이언트만 쓰기 → 경합 없음
- 정답 공개 직전 서버에서 방 상태 재조회 (막판 투표 누락 방지)

## UI 주의사항

- 모바일 전용 (max-width 480px), `100dvh` 사용 (100vh 금지), 입력 font-size ≥16px
- 새 콘텐츠 카드는 `.panel`, 리스트형은 `.panel.member-card` 재사용
- 배포: `npm run build` → `firebase deploy --only hosting --project issac-1abff`
