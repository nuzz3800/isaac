import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { startWriting } from "./game";
import { BRAND } from "../branding";

export default function Lobby({ room, roomCode, playerId, onLeave }) {
  const isHost = room.hostId === playerId;
  const [copied, setCopied] = useState(false);
  const players = Object.entries(room.players || {}).sort(
    (a, b) => a[1].joinedAt - b[1].joinedAt
  );
  const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt("아래 링크를 복사해줘요:", joinUrl);
    }
  }

  return (
    <div className="app">
      <p className="eyebrow">{BRAND.group} · 방 코드</p>
      <h1 className="room-code">{roomCode}</h1>

      <div className="qr-box">
        <QRCodeSVG value={joinUrl} size={140} bgColor="transparent" />
        <button className="btn btn-small" onClick={copyLink}>
          {copied ? "복사됨!" : "입장 링크 복사"}
        </button>
      </div>

      <h2 className="section-title">함께하는 가원 {players.length}명</h2>
      <ul className="player-list">
        {players.map(([id, p]) => (
          <li key={id} className="player-row">
            <span>
              {p.nickname}
              {id === room.hostId && " 👑"}
            </span>
            {id === playerId && <span className="tag">나</span>}
          </li>
        ))}
      </ul>

      <div className="footer">
        {isHost ? (
          <>
            <button
              className="btn btn-primary"
              disabled={players.length < 2}
              onClick={() => startWriting(roomCode)}
            >
              모두 모였어요 — 시작!
            </button>
            <p className="hint">
              {players.length < 2
                ? "2명 이상 모이면 시작할 수 있어요"
                : "다 모였으면 눌러줘요 (6~9명 추천)"}
            </p>
          </>
        ) : (
          <p className="hint">방장이 시작하길 기다리는 중...</p>
        )}
        <button className="btn btn-ghost btn-small" onClick={onLeave}>
          나가기
        </button>
      </div>
    </div>
  );
}
