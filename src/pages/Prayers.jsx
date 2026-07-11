import { useState } from "react";
import {
  usePrayers,
  addPrayer,
  updatePrayer,
  deletePrayer,
  togglePrayed,
  toggleAnswered,
} from "../api/prayers";
import { weekKeyOf, weekLabel } from "../dates";
import { BRAND } from "../branding";

// 아카이브 중심 구성: 위에는 이번 주 → 지난주 → 지금까지의 기도제목이
// 주별로 정리되어 보이고, '기도제목 적기'는 하단 고정 버튼으로.
export default function Prayers({ members, myId }) {
  const prayers = usePrayers();
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  if (prayers === null)
    return (
      <div className="app center">
        <p className="splash">기도제목 불러오는 중...</p>
      </div>
    );

  const thisWeek = weekKeyOf();
  const lastWeek = weekKeyOf(new Date(Date.now() - 7 * 86400000));

  const byWeek = {};
  for (const [id, p] of Object.entries(prayers)) {
    (byWeek[p.weekKey] = byWeek[p.weekKey] || []).push([id, p]);
  }
  const weeks = Object.keys(byWeek).sort((a, b) => b.localeCompare(a));
  for (const w of weeks)
    byWeek[w].sort((a, b) => a[1].createdAt - b[1].createdAt);

  const all = Object.values(prayers);
  const answeredTotal = all.filter((p) => p.answered).length;
  const pastWeeks = weeks.filter((w) => w !== thisWeek && w !== lastWeek);

  function sectionTitle(week) {
    if (week === thisWeek) return "이번 주 기도제목";
    if (week === lastWeek) return "지난주 기도제목";
    return weekLabel(week);
  }

  async function submit() {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try {
      await addPrayer(myId, t);
      setText("");
      setWriting(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app has-writebar">
      <p className="eyebrow">{BRAND.group}</p>
      <h1 className="title">기도제목 🙏</h1>
      <p className="subtitle">
        {all.length > 0
          ? `지금까지 ${all.length}개의 기도가 쌓였어요` +
            (answeredTotal > 0 ? ` · 🌱 응답 ${answeredTotal}개` : "")
          : "우리 사랑방의 기도가 여기에 쌓여가요"}
      </p>

      {/* 이번 주 — 비어 있어도 항상 맨 위에 */}
      <h2 className="section-title">이번 주 기도제목</h2>
      {byWeek[thisWeek] ? (
        <PrayerList
          items={byWeek[thisWeek]}
          members={members}
          myId={myId}
        />
      ) : (
        <div className="panel cream">
          <b>아직 이번 주 기도제목이 없어요</b>
          <span className="member-sub">
            아래 버튼으로 가장 먼저 나눠볼까요? 🧡
          </span>
        </div>
      )}

      {/* 지난주 */}
      {byWeek[lastWeek] && (
        <>
          <h2 className="section-title">지난주 기도제목</h2>
          <PrayerList
            items={byWeek[lastWeek]}
            members={members}
            myId={myId}
          />
        </>
      )}

      {/* 그 이전 — 지금까지의 주일 기도제목 */}
      {pastWeeks.length > 0 && (
        <>
          <h2 className="section-title">지금까지의 기도제목</h2>
          {pastWeeks.map((week) => (
            <div key={week}>
              <p className="week-label">{sectionTitle(week)}</p>
              <PrayerList
                items={byWeek[week]}
                members={members}
                myId={myId}
              />
            </div>
          ))}
        </>
      )}

      {/* 하단 고정: 기도제목 적기 */}
      {writing ? (
        <div className="sheet">
          <textarea
            className="input textarea"
            placeholder="이번 주 나의 기도제목을 적어주세요"
            maxLength={200}
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className="field-row">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setWriting(false);
                setText("");
              }}
            >
              취소
            </button>
            <button
              className="btn btn-primary"
              onClick={submit}
              disabled={busy || !text.trim()}
            >
              올리기
            </button>
          </div>
        </div>
      ) : (
        <div className="write-bar">
          <button
            className="btn btn-primary"
            onClick={() => setWriting(true)}
          >
            기도제목 적기 ✍️
          </button>
        </div>
      )}
    </div>
  );
}

function PrayerList({ items, members, myId }) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  async function saveEdit(id) {
    const t = editText.trim();
    if (!t) return;
    await updatePrayer(id, t);
    setEditingId(null);
  }

  return (
    <div className="stack" style={{ marginBottom: 4 }}>
      {items.map(([id, p]) => {
        const author = members[p.memberId];
        const prayedBy = p.prayedBy || {};
        const count = Object.keys(prayedBy).length;
        const iPrayed = !!prayedBy[myId];
        const mine = p.memberId === myId;

        return (
          <div className="panel" key={id}>
            <div className="row-between">
              <b>
                {author ? `${author.emoji} ${author.name}` : "익명"}
                {p.answered && <span className="answered-chip">🌱 응답</span>}
              </b>
              {mine && editingId !== id && (
                <span>
                  <button
                    className="text-btn"
                    onClick={() => toggleAnswered(id, !p.answered)}
                  >
                    {p.answered ? "응답 취소" : "🌱 응답됨"}
                  </button>
                  <button
                    className="text-btn"
                    onClick={() => {
                      setEditingId(id);
                      setEditText(p.text);
                    }}
                  >
                    수정
                  </button>
                  <button
                    className="text-btn danger"
                    onClick={() =>
                      window.confirm("이 기도제목을 지울까요?") &&
                      deletePrayer(id)
                    }
                  >
                    삭제
                  </button>
                </span>
              )}
            </div>

            {editingId === id ? (
              <>
                <textarea
                  className="input textarea"
                  maxLength={200}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <div className="row-between">
                  <button
                    className="text-btn"
                    onClick={() => setEditingId(null)}
                  >
                    취소
                  </button>
                  <button className="text-btn" onClick={() => saveEdit(id)}>
                    저장
                  </button>
                </div>
              </>
            ) : (
              <p className="prayer-text">{p.text}</p>
            )}

            <button
              className={`pray-btn${iPrayed ? " active" : ""}`}
              onClick={() => togglePrayed(id, myId, !iPrayed)}
            >
              🙏 {count > 0 ? `${count}명이 함께 기도해요` : "함께 기도할게요"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
