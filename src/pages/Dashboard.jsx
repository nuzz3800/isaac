import { Link } from "react-router-dom";
import { usePrayers } from "../api/prayers";
import { useEvents } from "../api/events";
import {
  todayISO,
  formatDate,
  ddayLabel,
  weekKeyOf,
  nextBirthday,
} from "../dates";
import { BRAND } from "../branding";

export default function Dashboard({ me, members }) {
  const prayers = usePrayers();
  const events = useEvents();
  const today = todayISO();

  const upcoming = Object.entries(events || {})
    .filter(([, e]) => e.date >= today)
    .sort((a, b) => a[1].date.localeCompare(b[1].date))
    .slice(0, 2);

  const thisWeek = weekKeyOf();
  const weekPrayers = Object.entries(prayers || {})
    .filter(([, p]) => p.weekKey === thisWeek)
    .sort((a, b) => b[1].createdAt - a[1].createdAt);

  const birthdays = Object.values(members)
    .filter((m) => m.birthMonth)
    .map((m) => ({ ...m, bd: nextBirthday(m.birthMonth, m.birthDay) }))
    .filter((m) => m.bd.days <= 30)
    .sort((a, b) => a.bd.days - b.bd.days);

  return (
    <div className="app">
      <p className="brand-eyebrow">
        {BRAND.church} · {BRAND.group}
      </p>
      <h1 className="title">
        {me.emoji} 안녕하세요, {me.name}님!
      </h1>
      <p className="subtitle">{formatDate(today)} · 오늘도 반가워요 🧡</p>

      <div className="stack">
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

        <Link to="/events" className="panel">
          <span className="field-label">📅 다가오는 일정</span>
          {upcoming.length === 0 && (
            <span className="member-sub">
              예정된 일정이 없어요 — 눌러서 하나 잡아볼까요?
            </span>
          )}
          {upcoming.map(([id, e]) => (
            <div className="row-between" key={id}>
              <b>{e.title}</b>
              <span className="member-sub">
                {formatDate(e.date)} · {ddayLabel(e.date)}
              </span>
            </div>
          ))}
        </Link>

        <Link to="/prayers" className="panel">
          <span className="field-label">🙏 이번 주 기도제목</span>
          {weekPrayers.length === 0 ? (
            <span className="member-sub">
              아직 없어요 — 이번 주 기도제목을 올려주세요
            </span>
          ) : (
            <>
              <span className="member-sub">
                {weekPrayers.length}개가 올라왔어요
              </span>
              {weekPrayers.slice(0, 2).map(([id, p]) => (
                <div className="row-between" key={id}>
                  <b>{members[p.memberId]?.name || "익명"}</b>
                  <span className="member-sub preview-text">{p.text}</span>
                </div>
              ))}
            </>
          )}
        </Link>

        <Link to="/play" className="panel">
          <span className="field-label">🎲 놀이터</span>
          <span className="member-sub">
            거짓말 자기소개 게임 하러 가기 →
          </span>
        </Link>
      </div>
    </div>
  );
}
