import { Link } from "react-router-dom";
import { usePrayers } from "../api/prayers";
import { useEvents } from "../api/events";
import { useBingo, currentPeriod, boardStats, periodLabel } from "../api/bingo";
import {
  todayISO,
  formatDate,
  ddayLabel,
  daysUntil,
  weekKeyOf,
  nextBirthday,
} from "../dates";
import ChurchLogo from "../Logo";

export default function Dashboard({ me, members, myId, onSwitchProfile }) {
  const prayers = usePrayers();
  const events = useEvents();
  const period = currentPeriod();
  const boards = useBingo(period);
  const myBingo = boardStats(boards?.[myId] || {});
  const today = todayISO();

  const hour = new Date().getHours();
  const greet =
    hour < 6
      ? "고요한 새벽이에요"
      : hour < 12
        ? "좋은 아침이에요"
        : hour < 18
          ? "좋은 오후예요"
          : "편안한 저녁이에요";

  const upcoming = Object.entries(events || {})
    .filter(([, e]) => e.date >= today)
    .sort((a, b) => a[1].date.localeCompare(b[1].date));
  const nextEvent = upcoming[0];

  const thisWeek = weekKeyOf();
  const weekPrayers = Object.entries(prayers || {})
    .filter(([, p]) => p.weekKey === thisWeek)
    .sort((a, b) => b[1].createdAt - a[1].createdAt);
  const prayerAuthors = new Set(weekPrayers.map(([, p]) => p.memberId)).size;

  const memberCount = Object.keys(members).length;

  const birthdays = Object.values(members)
    .filter((m) => m.birthMonth)
    .map((m) => ({ ...m, bd: nextBirthday(m.birthMonth, m.birthDay) }))
    .filter((m) => m.bd.days <= 30)
    .sort((a, b) => a.bd.days - b.bd.days);

  return (
    <div className="app dash">
      <Sky />

      <header className="dash-top">
        <span className="round-chip">
          <ChurchLogo size={22} />
        </span>
        <span className="dash-top-right">
          <span className="round-chip date-chip">{formatDate(today)}</span>
          <button
            className="round-chip date-chip switch-chip"
            onClick={() =>
              window.confirm(
                `${me.name}님이 아니에요? 프로필 선택 화면으로 돌아가요.`
              ) && onSwitchProfile()
            }
          >
            ⇄ 사용자 변경
          </button>
        </span>
      </header>

      <p className="dash-eyebrow">
        {greet}, {me.name}님
      </p>
      <h1 className="dash-title">{"서로를 향한 마음이\n모이는 곳"}</h1>

      <section className="panel stats-panel">
        <div className="row-between">
          <span className="field-label">우리 사랑방</span>
          <Link className="view-all" to="/members">
            전체 보기
          </Link>
        </div>
        <div className="stats-row">
          <Stat label="가원" value={`${memberCount}명`} pct={100} />
          <Stat
            label="이번 주 기도"
            value={`${prayerAuthors}/${memberCount}`}
            pct={memberCount ? (prayerAuthors / memberCount) * 100 : 0}
          />
          <Stat
            label="다음 모임"
            value={nextEvent ? ddayLabel(nextEvent[1].date) : "미정"}
            pct={
              nextEvent
                ? Math.max(8, 100 - (daysUntil(nextEvent[1].date) / 30) * 100)
                : 0
            }
          />
        </div>
      </section>

      {birthdays.length > 0 && (
        <div className="panel highlight">
          <span className="field-label">🎂 다가오는 생일</span>
          {birthdays.map((m) => (
            <div className="row-between" key={m.name}>
              <b>
                {m.emoji} {m.name}
              </b>
              <span className="dday-chip">
                {m.bd.days === 0 ? "오늘! 🎉" : `D-${m.bd.days}`}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="section-row">
        <h2>다가오는 일정</h2>
        <Link className="view-all" to="/events">
          전체 보기
        </Link>
      </div>
      <div className="stack">
        {upcoming.length === 0 && (
          <Link to="/events" className="panel cream">
            <b>예정된 일정이 없어요</b>
            <span className="member-sub">눌러서 첫 일정을 잡아볼까요?</span>
          </Link>
        )}
        {upcoming.slice(0, 2).map(([id, e]) => (
          <Link to="/events" className="panel cream" key={id}>
            <div className="row-between">
              <b>{e.title}</b>
              <span className="dday-chip">{ddayLabel(e.date)}</span>
            </div>
            <span className="member-sub">
              {formatDate(e.date)}
              {e.time && ` ${e.time}`}
              {e.place && ` · ${e.place}`}
            </span>
          </Link>
        ))}
      </div>

      <div className="section-row">
        <h2>이번 주 기도제목</h2>
        <Link className="view-all" to="/prayers">
          전체 보기
        </Link>
      </div>
      <Link to="/prayers" className="panel cream">
        {weekPrayers.length === 0 ? (
          <>
            <b>아직 이번 주 기도제목이 없어요</b>
            <span className="member-sub">가장 먼저 나눠볼까요? 🙏</span>
          </>
        ) : (
          <>
            {weekPrayers.slice(0, 2).map(([id, p]) => (
              <div className="row-between" key={id}>
                <b>{members[p.memberId]?.name || "익명"}</b>
                <span className="member-sub preview-text">{p.text}</span>
              </div>
            ))}
            <span className="member-sub">
              총 {weekPrayers.length}개 · {prayerAuthors}명이 나눴어요
            </span>
          </>
        )}
      </Link>

      <div className="section-row">
        <h2>{periodLabel(period)} 목표 빙고</h2>
        <Link className="view-all" to="/bingo">
          전체 보기
        </Link>
      </div>
      <Link to="/bingo" className="panel cream">
        {myBingo.filled === 0 ? (
          <>
            <b>🏖 올해 남은 반년, 목표 9개를 채워봐요</b>
            <span className="member-sub">
              이루면 초록 스티커를 붙이는 재미!
            </span>
          </>
        ) : (
          <>
            <b>🏖 내 빙고판</b>
            <span className="member-sub">
              목표 {myBingo.filled}/9 · 달성 {myBingo.doneCount}개 · 빙고{" "}
              {myBingo.lines}줄
            </span>
          </>
        )}
      </Link>

      <div className="section-row">
        <h2>놀이터</h2>
        <Link className="view-all" to="/play">
          전체 보기
        </Link>
      </div>
      <Link to="/game" className="play-banner">
        <span className="member-info">
          <b>거짓말 자기소개</b>
          <span className="play-sub">키워드 속 거짓말을 찾아라!</span>
        </span>
        <span className="play-fab">▶</span>
      </Link>
    </div>
  );
}

function Stat({ label, value, pct }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <div className="ring" style={{ "--p": Math.round(pct) }}>
        <span className="stat-value">{value}</span>
      </div>
    </div>
  );
}

// 장식용 노을 풍경 헤더 (레퍼런스의 사진 영역을 SVG로)
function Sky() {
  return (
    <div className="sky" aria-hidden="true">
      <svg
        viewBox="0 0 480 265"
        preserveAspectRatio="xMidYMax slice"
        width="100%"
        height="100%"
      >
        <defs>
          <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e9e2f2" />
            <stop offset="0.55" stopColor="#f7ddcd" />
            <stop offset="1" stopColor="#f6ecdd" />
          </linearGradient>
        </defs>
        <rect width="480" height="265" fill="url(#skyg)" />
        <circle cx="368" cy="118" r="58" fill="#f2c69e" opacity="0.45" />
        <circle cx="368" cy="118" r="34" fill="#f0bd8f" opacity="0.65" />
        <path
          d="M0 196 Q120 152 250 188 T480 178 V265 H0 Z"
          fill="#e5d5e0"
          opacity="0.75"
        />
        <path
          d="M0 222 Q150 186 310 216 T480 208 V265 H0 Z"
          fill="#f4efe8"
        />
      </svg>
    </div>
  );
}
