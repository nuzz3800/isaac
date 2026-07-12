import { useState } from "react";
import {
  useBingo,
  saveBingoCell,
  boardStats,
  currentPeriod,
  periodLabel,
} from "../api/bingo";
import { BRAND } from "../branding";

export default function Bingo({ members, myId }) {
  const period = currentPeriod();
  const boards = useBingo(period);
  // sheet: 편집 중인 칸 { index, text, done }
  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(false);

  if (boards === null)
    return (
      <div className="app center">
        <p className="splash">빙고판 펼치는 중...</p>
      </div>
    );

  const myBoard = boards[myId] || {};
  const my = boardStats(myBoard);

  const others = Object.entries(members)
    .filter(([id]) => id !== myId && boards[id])
    .map(([id, m]) => ({ id, ...m, board: boards[id], stats: boardStats(boards[id]) }))
    .sort((a, b) => b.stats.doneCount - a.stats.doneCount);

  function openCell(index) {
    const cell = myBoard[index];
    setSheet({ index, text: cell?.text || "", done: !!cell?.done });
  }

  async function saveSheet(overrides = {}) {
    const next = { ...sheet, ...overrides };
    setBusy(true);
    try {
      await saveBingoCell(period, myId, next.index, next.text.trim(), next.done);
      setSheet(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <p className="eyebrow">
        {BRAND.group} · {periodLabel(period)}
      </p>
      <h1 className="title">목표 빙고 🏖</h1>
      <p className="subtitle">
        {"올해 남은 반년, 이루고 싶은 9가지를 채워봐요."}
        {"\n"}
        {"이루면 칸을 눌러 초록 스티커를 붙여요!"}
      </p>

      <div className="panel bingo-panel">
        <div className="row-between">
          <b>내 빙고판</b>
          <span className="member-sub">
            {my.filled === 0
              ? "칸을 눌러 목표를 적어봐요"
              : `달성 ${my.doneCount}/9 · 빙고 ${my.lines}줄`}
          </span>
        </div>
        <BingoGrid board={myBoard} onCell={openCell} />
      </div>

      <h2 className="section-title">가원들의 빙고판</h2>
      {others.length === 0 && (
        <p className="hint">아직 아무도 안 채웠어요 — 첫 주자가 되어봐요!</p>
      )}
      <div className="stack">
        {others.map((m) => (
          <div className="panel bingo-panel" key={m.id}>
            <div className="row-between">
              <b>
                {m.emoji} {m.name}
              </b>
              <span className="member-sub">
                달성 {m.stats.doneCount}/9 · 빙고 {m.stats.lines}줄
              </span>
            </div>
            <BingoGrid board={m.board} mini />
          </div>
        ))}
      </div>

      {sheet && (
        <div className="sheet">
          <b>{sheet.index + 1}번 칸의 목표</b>
          <input
            className="input"
            placeholder="예: 성경 1독, 헬스장 등록하기"
            maxLength={30}
            value={sheet.text}
            onChange={(e) => setSheet({ ...sheet, text: e.target.value })}
            autoFocus
          />
          {sheet.text.trim() && (
            <button
              className={`pray-btn${sheet.done ? " active" : ""}`}
              onClick={() => setSheet({ ...sheet, done: !sheet.done })}
            >
              {sheet.done ? "🟢 달성했어요!" : "달성했다면 눌러주세요"}
            </button>
          )}
          <div className="field-row">
            <button className="btn btn-ghost" onClick={() => setSheet(null)}>
              취소
            </button>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => saveSheet()}
            >
              {sheet.text.trim() ? "저장" : myBoard[sheet.index] ? "칸 비우기" : "저장"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BingoGrid({ board, onCell, mini }) {
  return (
    <div className={`bingo-grid${mini ? " mini" : ""}`}>
      {[...Array(9).keys()].map((i) => {
        const cell = board[i];
        return (
          <button
            key={i}
            type="button"
            className={`bingo-cell${cell?.done ? " done" : ""}${!cell?.text ? " empty" : ""}`}
            onClick={onCell ? () => onCell(i) : undefined}
            disabled={!onCell}
          >
            {cell?.text || (onCell ? "+" : "")}
          </button>
        );
      })}
    </div>
  );
}
