import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useMeeting,
  startMeeting,
  updateMeeting,
  endMeeting,
} from "../api/meetings";
import { usePrayers, addPrayer, toggleAnswered } from "../api/prayers";
import { useEvents, setRsvp } from "../api/events";
import { weekKeyOf, formatDate, ddayLabel, todayISO } from "../dates";
import { BRAND } from "../branding";

const STEPS = [
  { icon: "🌱", title: "지난주 기도 돌아보기" },
  { icon: "🙏", title: "이번 주 기도제목" },
  { icon: "📅", title: "일정 확인" },
  { icon: "🎲", title: "놀이 & 마무리" },
];

export default function Meeting({ members, myId }) {
  const meeting = useMeeting();
  const prayers = usePrayers();
  const events = useEvents();

  if (meeting === undefined || prayers === null || events === null)
    return (
      <div className="app center">
        <p className="splash">모임 준비 중...</p>
      </div>
    );

  if (!meeting)
    return <Intro memberCount={Object.keys(members).length} myId={myId} />;

  return (
    <Running
      meeting={meeting}
      members={members}
      myId={myId}
      prayers={prayers}
      events={events}
    />
  );
}

function Intro({ myId }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="app">
      <Link to="/" className="hint back-link">
        ← 홈으로
      </Link>
      <p className="eyebrow">{BRAND.group}</p>
      <h1 className="title">주일 모임 모드 ☀️</h1>
      <p className="subtitle">
        모임 순서대로 다 같이 진행해요.
        {"\n"}한 명이 시작하면 모두의 화면이 함께 움직여요.
      </p>

      <div className="stack">
        {STEPS.map((s, i) => (
          <div className="panel member-card" key={i}>
            <span className="avatar">{s.icon}</span>
            <span className="member-info">
              <b>
                {i + 1}. {s.title}
              </b>
              <span className="member-sub">
                {
                  [
                    "지난주 나눈 기도를 하나씩 돌아보며 응답을 체크해요",
                    "그 자리에서 다 같이 이번 주 기도제목을 적어요",
                    "다가오는 일정을 보고 참석 여부를 정해요",
                    "시간이 남으면 게임 한 판, 그리고 마무리!",
                  ][i]
                }
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="footer">
        <button
          className="btn btn-primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await startMeeting(myId);
            } finally {
              setBusy(false);
            }
          }}
        >
          모임 시작하기
        </button>
        <p className="hint">누구나 시작할 수 있어요 — 보통 진행자가 눌러요 🙂</p>
      </div>
    </div>
  );
}

function Running({ meeting, members, myId, prayers, events }) {
  const step = meeting.step || 0;
  const [busy, setBusy] = useState(false);

  const thisWeek = weekKeyOf();
  const lastWeek = weekKeyOf(new Date(Date.now() - 7 * 86400000));
  const lastPrayers = Object.entries(prayers)
    .filter(([, p]) => p.weekKey === lastWeek)
    .sort((a, b) => a[1].createdAt - b[1].createdAt);
  const weekPrayers = Object.entries(prayers)
    .filter(([, p]) => p.weekKey === thisWeek)
    .sort((a, b) => a[1].createdAt - b[1].createdAt);

  async function go(next) {
    await updateMeeting({ step: next });
  }

  async function finish() {
    if (!window.confirm("모임을 마칠까요? 모두의 화면이 종료돼요.")) return;
    setBusy(true);
    try {
      await endMeeting(meeting, {
        prayersShared: weekPrayers.length,
        answeredChecked: lastPrayers.filter(([, p]) => p.answered).length,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <p className="eyebrow">
        모임 진행 중 · {formatDate(meeting.date)}
      </p>
      <div className="step-dots">
        {STEPS.map((s, i) => (
          <span key={i} className={`dot${i === step ? " active" : ""}`} />
        ))}
      </div>
      <h1 className="title">
        {STEPS[step].icon} {STEPS[step].title}
      </h1>

      {step === 0 && (
        <ReviewStep
          meeting={meeting}
          members={members}
          lastPrayers={lastPrayers}
        />
      )}
      {step === 1 && (
        <WriteStep members={members} myId={myId} weekPrayers={weekPrayers} />
      )}
      {step === 2 && <EventsStep events={events} members={members} myId={myId} />}
      {step === 3 && (
        <div className="stack">
          <Link to="/game" className="play-banner">
            <span className="member-info">
              <b>거짓말 자기소개</b>
              <span className="play-sub">시간이 남으면 다 같이 한 판!</span>
            </span>
            <span className="play-fab">▶</span>
          </Link>
          <div className="panel cream">
            <b>오늘의 모임 요약</b>
            <span className="member-sub">
              🙏 이번 주 기도제목 {weekPrayers.length}개 · 🌱 응답 체크{" "}
              {lastPrayers.filter(([, p]) => p.answered).length}개
            </span>
          </div>
        </div>
      )}

      <div className="footer">
        <div className="field-row">
          <button
            className="btn btn-ghost"
            disabled={step === 0}
            onClick={() => go(step - 1)}
          >
            ← 이전
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => go(step + 1)}>
              다음 단계 →
            </button>
          ) : (
            <button className="btn btn-danger" onClick={finish} disabled={busy}>
              모임 마치기 🌙
            </button>
          )}
        </div>
        <p className="hint">단계 이동은 진행자 한 명이 눌러주세요</p>
      </div>
    </div>
  );
}

// 1단계: 지난주 기도를 한 개씩 넘기며 돌아보고 응답 체크
function ReviewStep({ meeting, members, lastPrayers }) {
  if (lastPrayers.length === 0)
    return (
      <div className="panel cream">
        <b>지난주에 나눈 기도제목이 없어요</b>
        <span className="member-sub">바로 다음 단계로 넘어가요!</span>
      </div>
    );

  const i = Math.min(meeting.reviewIndex || 0, lastPrayers.length - 1);
  const [id, p] = lastPrayers[i];
  const author = members[p.memberId];

  return (
    <div className="stack">
      <p className="hint">
        {i + 1} / {lastPrayers.length}
      </p>
      <div className="panel review-card">
        <span className="avatar-big">{author?.emoji || "🙂"}</span>
        <b>{author?.name || "익명"}님의 기도</b>
        <p className="review-text">{p.text}</p>
        <button
          className={`pray-btn${p.answered ? " active" : ""}`}
          onClick={() => toggleAnswered(id, !p.answered)}
        >
          {p.answered ? "🌱 응답됐어요!" : "응답됐다면 눌러주세요"}
        </button>
      </div>
      <div className="field-row">
        <button
          className="btn btn-ghost"
          disabled={i === 0}
          onClick={() => updateMeeting({ reviewIndex: i - 1 })}
        >
          ◀ 이전 기도
        </button>
        <button
          className="btn btn-ghost"
          disabled={i >= lastPrayers.length - 1}
          onClick={() => updateMeeting({ reviewIndex: i + 1 })}
        >
          다음 기도 ▶
        </button>
      </div>
    </div>
  );
}

// 2단계: 각자 폰으로 이번 주 기도제목 작성 (실시간으로 목록에 쌓임)
function WriteStep({ members, myId, weekPrayers }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try {
      await addPrayer(myId, t);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <textarea
        className="input textarea"
        placeholder="이번 주 나의 기도제목을 적어주세요"
        maxLength={200}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="btn btn-primary"
        onClick={submit}
        disabled={busy || !text.trim()}
      >
        올리기
      </button>

      <p className="hint">
        {weekPrayers.length > 0
          ? `지금까지 ${weekPrayers.length}개가 올라왔어요`
          : "첫 기도제목을 기다리고 있어요..."}
      </p>
      {weekPrayers.map(([id, p]) => (
        <div className="panel" key={id}>
          <b>
            {members[p.memberId]?.emoji} {members[p.memberId]?.name || "익명"}
          </b>
          <p className="prayer-text">{p.text}</p>
        </div>
      ))}
    </div>
  );
}

// 3단계: 다가오는 일정 + 그 자리에서 참석 체크
function EventsStep({ events, members, myId }) {
  const today = todayISO();
  const upcoming = Object.entries(events)
    .filter(([, e]) => e.date >= today)
    .sort((a, b) => a[1].date.localeCompare(b[1].date));

  if (upcoming.length === 0)
    return (
      <div className="stack">
        <div className="panel cream">
          <b>예정된 일정이 없어요</b>
          <span className="member-sub">이 자리에서 다음 모임을 잡아볼까요?</span>
        </div>
        <Link to="/events" className="btn btn-ghost">
          일정 페이지에서 추가하기 →
        </Link>
      </div>
    );

  return (
    <div className="stack">
      {upcoming.map(([id, e]) => {
        const rsvp = e.rsvp || {};
        const mine = rsvp[myId];
        const yesNames = Object.entries(rsvp)
          .filter(([, v]) => v === "yes")
          .map(([mid]) => members[mid]?.name)
          .filter(Boolean);
        return (
          <div className="panel" key={id}>
            <div className="row-between">
              <b>{e.title}</b>
              <span className="dday-chip">{ddayLabel(e.date)}</span>
            </div>
            <span className="member-sub">
              {formatDate(e.date)}
              {e.time && ` ${e.time}`}
              {e.place && ` · ${e.place}`}
            </span>
            <div className="rsvp-row">
              <button
                className={`rsvp-btn${mine === "yes" ? " on" : ""}`}
                onClick={() => setRsvp(id, myId, mine === "yes" ? null : "yes")}
              >
                갈게요 ✋
              </button>
              <button
                className={`rsvp-btn${mine === "no" ? " on no" : ""}`}
                onClick={() => setRsvp(id, myId, mine === "no" ? null : "no")}
              >
                못 가요 😢
              </button>
            </div>
            {yesNames.length > 0 && (
              <span className="member-sub">
                참석 {yesNames.length}명 — {yesNames.join(", ")}
              </span>
            )}
          </div>
        );
      })}
      <Link to="/events" className="btn btn-ghost">
        일정 추가하러 가기 →
      </Link>
    </div>
  );
}
