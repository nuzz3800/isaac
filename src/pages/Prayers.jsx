import { useState } from "react";
import {
  usePrayers,
  addPrayer,
  updatePrayer,
  deletePrayer,
  togglePrayed,
} from "../api/prayers";
import { weekKeyOf, weekLabel } from "../dates";
import { BRAND } from "../branding";

export default function Prayers({ members, myId }) {
  const prayers = usePrayers();
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  if (prayers === null)
    return (
      <div className="app center">
        <p className="splash">기도제목 불러오는 중...</p>
      </div>
    );

  const thisWeek = weekKeyOf();

  // 주별로 묶고 최신 주부터
  const byWeek = {};
  for (const [id, p] of Object.entries(prayers)) {
    (byWeek[p.weekKey] = byWeek[p.weekKey] || []).push([id, p]);
  }
  const weeks = Object.keys(byWeek).sort((a, b) => b.localeCompare(a));
  for (const w of weeks) byWeek[w].sort((a, b) => a[1].createdAt - b[1].createdAt);

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

  async function saveEdit(id) {
    const t = editText.trim();
    if (!t) return;
    await updatePrayer(id, t);
    setEditingId(null);
  }

  return (
    <div className="app">
      <p className="eyebrow">{BRAND.group}</p>
      <h1 className="title">기도제목 🙏</h1>
      <p className="subtitle">
        서로의 한 주를 위해 기도해요.
        {"\n"}🙏 버튼을 누르면 "함께 기도하고 있어요"라는 표시예요.
      </p>

      {writing ? (
        <div className="stack">
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
        <div className="panel cream">
          <b>이번 주, 마음에 어떤 기도가 있나요?</b>
          <span className="member-sub">나누면 가원들이 함께 기도해줘요</span>
          <button
            className="btn btn-primary btn-compact"
            onClick={() => setWriting(true)}
          >
            기도제목 적기 ✍️
          </button>
        </div>
      )}

      {weeks.length === 0 && (
        <p className="hint" style={{ marginTop: 24 }}>
          아직 기도제목이 없어요. 첫 기도제목을 올려주세요 🧡
        </p>
      )}

      {weeks.map((week) => (
        <div key={week}>
          <h2 className="section-title">
            {weekLabel(week)}
            {week === thisWeek && " · 이번 주"}
          </h2>
          <div className="stack">
            {byWeek[week].map(([id, p]) => {
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
                    </b>
                    {mine && editingId !== id && (
                      <span>
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
                        <button className="text-btn" onClick={() => setEditingId(null)}>
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
        </div>
      ))}
    </div>
  );
}
