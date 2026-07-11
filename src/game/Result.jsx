import { useState } from "react";
import { playAgain } from "./game";
import { BRAND } from "../branding";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Result({ room, roomCode, playerId, onLeave }) {
  const isHost = room.hostId === playerId;
  const [busy, setBusy] = useState(false);

  const ranked = Object.entries(room.players || {})
    .filter(([, p]) => !p.spectator)
    .sort((a, b) => (b[1].score || 0) - (a[1].score || 0));

  // 동점자는 같은 순위
  let lastScore = null;
  let lastRank = 0;
  const rows = ranked.map(([id, p], i) => {
    const score = p.score || 0;
    const rank = score === lastScore ? lastRank : i + 1;
    lastScore = score;
    lastRank = rank;
    return { id, ...p, score, rank };
  });

  const spectators = Object.entries(room.players || {}).filter(
    ([, p]) => p.spectator
  );

  async function again() {
    setBusy(true);
    try {
      await playAgain(roomCode, room);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <p className="eyebrow">{BRAND.group} · 최종 결과</p>
      <h1 className="title">{BRAND.resultTitle}</h1>

      <ul className="player-list rank-list">
        {rows.map((p) => (
          <li
            key={p.id}
            className={`player-row ${p.rank === 1 ? "winner" : ""}`}
          >
            <span>
              <span className="rank">{MEDALS[p.rank - 1] || `${p.rank}위`}</span>{" "}
              {p.nickname}
              {p.id === playerId && <span className="tag">나</span>}
            </span>
            <b>{p.score}점</b>
          </li>
        ))}
      </ul>

      {spectators.length > 0 && (
        <p className="hint">
          👀 관전: {spectators.map(([, p]) => p.nickname).join(", ")}
        </p>
      )}

      <div className="footer">
        <p className="hint">{BRAND.resultClosing}</p>
        {isHost && (
          <button className="btn btn-primary" onClick={again} disabled={busy}>
            같은 멤버로 한 판 더 🔄
          </button>
        )}
        <button className="btn btn-ghost" onClick={onLeave}>
          나가기
        </button>
      </div>
    </div>
  );
}
