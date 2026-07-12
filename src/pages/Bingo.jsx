import { useState } from "react";
import {
  useBingoBoard,
  saveBingoCell,
  toggleBingoDone,
  clearBingoCell,
  addBingoComment,
  deleteBingoComment,
  boardStats,
  currentPeriod,
  periodLabel,
} from "../api/bingo";
import { BRAND } from "../branding";

export default function Bingo({ members, myId }) {
  const period = currentPeriod();
  const board = useBingoBoard(period);
  const [selected, setSelected] = useState(null); // 선택된 칸 index

  if (board === null)
    return (
      <div className="app center">
        <p className="splash">빙고판 펼치는 중...</p>
      </div>
    );

  const stats = boardStats(board);

  return (
    <div className="app">
      <p className="eyebrow">
        {BRAND.group} · {periodLabel(period)}
      </p>
      <h1 className="title">우리의 목표 빙고 🏖</h1>
      <p className="subtitle">
        {"사랑방이 함께 이룰 9가지 목표예요."}
        {"\n"}
        {"칸을 눌러 목표와 날짜를 적고, 의견도 남겨봐요!"}
      </p>

      <div className="panel bingo-panel">
        <div className="row-between">
          <b>공동 목표판</b>
          <span className="member-sub">
            {stats.filled === 0
              ? "칸을 눌러 시작해요"
              : `목표 ${stats.filled}/9 · 달성 ${stats.doneCount}개 · 빙고 ${stats.lines}줄`}
          </span>
        </div>
        <BingoGrid
          board={board}
          selected={selected}
          onCell={(i) => setSelected(selected === i ? null : i)}
        />
      </div>

      {selected != null && (
        <CellDetail
          key={selected}
          period={period}
          index={selected}
          cell={board[selected]}
          members={members}
          myId={myId}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function monthDay(iso) {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function BingoGrid({ board, selected, onCell }) {
  return (
    <div className="bingo-grid">
      {[...Array(9).keys()].map((i) => {
        const cell = board[i];
        let cls = "bingo-cell";
        if (cell?.done) cls += " done";
        if (!cell?.text) cls += " empty";
        if (selected === i) cls += " selected";
        return (
          <button key={i} type="button" className={cls} onClick={() => onCell(i)}>
            {cell?.text ? (
              <span className="cell-body">
                <span>{cell.text}</span>
                {cell.targetDate && (
                  <span className="cell-date">~{monthDay(cell.targetDate)}</span>
                )}
              </span>
            ) : (
              "+"
            )}
          </button>
        );
      })}
    </div>
  );
}

function CellDetail({ period, index, cell, members, myId, onClose }) {
  const [text, setText] = useState(cell?.text || "");
  const [date, setDate] = useState(cell?.targetDate || "");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const comments = Object.entries(cell?.comments || {}).sort(
    (a, b) => a[1].createdAt - b[1].createdAt
  );

  async function save() {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try {
      await saveBingoCell(period, index, { text: t, targetDate: date });
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (!window.confirm("이 칸의 목표와 의견을 모두 지울까요?")) return;
    await clearBingoCell(period, index);
    onClose();
  }

  async function sendComment() {
    const t = comment.trim();
    if (!t) return;
    await addBingoComment(period, index, myId, t);
    setComment("");
  }

  return (
    <div className="panel bingo-detail">
      <div className="row-between">
        <b>
          {index + 1}번 칸 {cell?.done && "🟢"}
        </b>
        <button className="text-btn" onClick={onClose}>
          닫기 ✕
        </button>
      </div>

      <input
        className="input"
        placeholder="목표 (예: 다 같이 맛집 가기)"
        maxLength={30}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <label className="field-label">언제쯤 이룰까요? (선택)</label>
      <input
        className="input"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <div className="field-row">
        <button
          className="btn btn-primary"
          onClick={save}
          disabled={busy || !text.trim()}
        >
          {cell?.text ? "저장" : "목표 등록"}
        </button>
        {cell?.text && (
          <button className="btn btn-ghost btn-delete" onClick={clear}>
            칸 비우기
          </button>
        )}
      </div>

      {cell?.text && (
        <button
          className={`pray-btn${cell.done ? " active" : ""}`}
          onClick={() => toggleBingoDone(period, index, !cell.done)}
        >
          {cell.done ? "🟢 달성 완료!" : "이뤘다면 눌러주세요"}
        </button>
      )}

      {cell?.text && (
        <>
          <h2 className="section-title">
            의견 {comments.length > 0 && `(${comments.length})`}
          </h2>
          {comments.map(([cid, c]) => (
            <div className="row-between" key={cid}>
              <span className="comment-line">
                <b>{members[c.memberId]?.name || "익명"}</b> {c.text}
              </span>
              {c.memberId === myId && (
                <button
                  className="text-btn danger"
                  onClick={() => deleteBingoComment(period, index, cid)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <div className="field-row">
            <input
              className="input"
              placeholder="의견 남기기 (예: 춘리마라탕 가요!)"
              maxLength={50}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendComment()}
            />
            <button
              className="btn btn-primary btn-comment"
              onClick={sendComment}
              disabled={!comment.trim()}
            >
              등록
            </button>
          </div>
        </>
      )}
    </div>
  );
}
