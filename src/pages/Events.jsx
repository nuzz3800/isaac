import { useState } from "react";
import { useEvents, addEvent, deleteEvent, setRsvp } from "../api/events";
import { todayISO, formatDate, ddayLabel } from "../dates";
import { BRAND } from "../branding";

export default function Events({ members, myId }) {
  const events = useEvents();
  const [showForm, setShowForm] = useState(false);

  if (events === null)
    return (
      <div className="app center">
        <p className="splash">일정 불러오는 중...</p>
      </div>
    );

  const today = todayISO();
  const all = Object.entries(events);
  const upcoming = all
    .filter(([, e]) => e.date >= today)
    .sort((a, b) => a[1].date.localeCompare(b[1].date));
  const past = all
    .filter(([, e]) => e.date < today)
    .sort((a, b) => b[1].date.localeCompare(a[1].date));

  return (
    <div className="app">
      <p className="eyebrow">{BRAND.group}</p>
      <h1 className="title">우리 일정 📅</h1>
      <p className="subtitle">모임, 나들이, 봉사... 함께할 시간들이에요</p>

      {showForm ? (
        <EventForm onDone={() => setShowForm(false)} myId={myId} />
      ) : (
        <button className="btn btn-ghost" onClick={() => setShowForm(true)}>
          + 일정 추가하기
        </button>
      )}

      <h2 className="section-title">다가오는 일정</h2>
      {upcoming.length === 0 && (
        <p className="hint">예정된 일정이 없어요. 하나 잡아볼까요? 😄</p>
      )}
      <div className="stack">
        {upcoming.map(([id, e]) => (
          <EventItem key={id} id={id} event={e} members={members} myId={myId} />
        ))}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="section-title">지난 일정</h2>
          <div className="stack">
            {past.map(([id, e]) => (
              <EventItem
                key={id}
                id={id}
                event={e}
                members={members}
                myId={myId}
                isPast
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EventItem({ id, event, members, myId, isPast }) {
  const rsvp = event.rsvp || {};
  const mine = rsvp[myId];
  const yesNames = Object.entries(rsvp)
    .filter(([, v]) => v === "yes")
    .map(([mid]) => members[mid]?.name)
    .filter(Boolean);

  function answer(value) {
    setRsvp(id, myId, mine === value ? null : value);
  }

  return (
    <div className={`panel${isPast ? " past" : ""}`}>
      <div className="row-between">
        <b>{event.title}</b>
        {!isPast && <span className="dday-chip">{ddayLabel(event.date)}</span>}
        {isPast && (
          <button
            className="text-btn danger"
            onClick={() =>
              window.confirm("이 일정을 지울까요?") && deleteEvent(id)
            }
          >
            삭제
          </button>
        )}
      </div>
      <span className="member-sub">
        {formatDate(event.date)}
        {event.time && ` ${event.time}`}
        {event.place && ` · ${event.place}`}
      </span>
      {event.note && <p className="prayer-text">{event.note}</p>}

      {!isPast && (
        <>
          <div className="rsvp-row">
            <button
              className={`rsvp-btn${mine === "yes" ? " on" : ""}`}
              onClick={() => answer("yes")}
            >
              갈게요 ✋
            </button>
            <button
              className={`rsvp-btn${mine === "no" ? " on no" : ""}`}
              onClick={() => answer("no")}
            >
              못 가요 😢
            </button>
          </div>
          {yesNames.length > 0 && (
            <span className="member-sub">
              참석 {yesNames.length}명 — {yesNames.join(", ")}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function EventForm({ onDone, myId }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim()) return setError("일정 이름을 적어주세요.");
    if (!date) return setError("날짜를 골라주세요.");
    setBusy(true);
    setError("");
    try {
      await addEvent({
        title: title.trim(),
        date,
        time: time || null,
        place: place.trim() || null,
        note: note.trim() || null,
        createdBy: myId,
      });
      onDone();
    } catch {
      setError("저장에 실패했어요. 다시 시도해주세요.");
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="stack">
        <input
          className="input"
          placeholder="일정 이름 (예: 사랑방 모임)"
          maxLength={30}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="field-row">
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            className="input"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <input
          className="input"
          placeholder="장소 (선택)"
          maxLength={30}
          value={place}
          onChange={(e) => setPlace(e.target.value)}
        />
        <input
          className="input"
          placeholder="메모 (선택)"
          maxLength={60}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <div className="field-row">
          <button className="btn btn-ghost" onClick={onDone}>
            취소
          </button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
