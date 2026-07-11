import { useState } from "react";
import { submitKeywords, startPlaying } from "./game";

const FIELD_COUNT = 6;
const MIN_KEYWORDS = 4;

export default function Writing({ room, roomCode, playerId, onLeave }) {
  const me = room.players?.[playerId];
  const isHost = room.hostId === playerId;
  const isSpectator = !!me?.spectator;

  if (isSpectator)
    return (
      <WaitingBoard
        room={room}
        roomCode={roomCode}
        isHost={false}
        headline="관전 중이에요 👀"
        sub="다음 판부터 정식으로 참여할 수 있어요"
        onLeave={onLeave}
      />
    );

  if (me?.submitted)
    return (
      <WaitingBoard
        room={room}
        roomCode={roomCode}
        isHost={isHost}
        headline="제출 완료! ✅"
        sub="다른 가원들을 기다리는 중..."
        onLeave={onLeave}
      />
    );

  return <KeywordForm roomCode={roomCode} playerId={playerId} />;
}

function KeywordForm({ roomCode, playerId }) {
  const [fields, setFields] = useState(Array(FIELD_COUNT).fill(""));
  const [lie, setLie] = useState(-1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function setField(i, value) {
    const next = [...fields];
    next[i] = value;
    setFields(next);
  }

  async function submit() {
    const trimmed = fields.map((f) => f.trim());
    const filledCount = trimmed.filter(Boolean).length;
    if (filledCount < MIN_KEYWORDS)
      return setError(`키워드를 ${MIN_KEYWORDS}개 이상 채워줘요.`);
    if (lie < 0 || !trimmed[lie])
      return setError("어떤 키워드가 거짓말인지 골라줘요.");

    // 빈 칸을 걷어내고 거짓말 위치를 다시 계산
    const keywords = [];
    let lieIndex = -1;
    trimmed.forEach((text, i) => {
      if (!text) return;
      if (i === lie) lieIndex = keywords.length;
      keywords.push(text);
    });

    setBusy(true);
    setError("");
    try {
      await submitKeywords(roomCode, playerId, keywords, lieIndex);
    } catch {
      setError("제출에 실패했어요. 다시 시도해줘요.");
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <h1 className="title">나를 소개하는 키워드</h1>
      <p className="subtitle">
        4~6개를 쓰고, 그중 <b>하나는 거짓말</b>로! 🤫
        <br />
        오른쪽 버튼으로 거짓말을 표시해줘요.
      </p>

      <div className="stack">
        {fields.map((value, i) => (
          <div className="keyword-row" key={i}>
            <input
              className="input"
              placeholder={
                i < MIN_KEYWORDS ? `키워드 ${i + 1}` : `키워드 ${i + 1} (선택)`
              }
              maxLength={20}
              value={value}
              onChange={(e) => setField(i, e.target.value)}
            />
            <button
              type="button"
              className={`lie-toggle ${lie === i ? "active" : ""}`}
              onClick={() => setLie(lie === i ? -1 : i)}
              disabled={!value.trim()}
              title="이게 거짓말"
            >
              {lie === i ? "🤥" : "🤫"}
            </button>
          </div>
        ))}
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" onClick={submit} disabled={busy}>
          {busy ? "제출 중..." : "제출하기"}
        </button>
        <p className="hint">
          팁: 진짜 같은 거짓말일수록 점수 벌기 좋아요 (과반이 틀리면 +2점!)
        </p>
      </div>
    </div>
  );
}

function WaitingBoard({ room, roomCode, isHost, headline, sub, onLeave }) {
  const [busy, setBusy] = useState(false);
  const active = Object.entries(room.players || {})
    .filter(([, p]) => !p.spectator)
    .sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const submitted = active.filter(([, p]) => p.submitted);
  const allDone = submitted.length === active.length;

  async function begin() {
    setBusy(true);
    try {
      await startPlaying(
        roomCode,
        submitted.map(([id]) => id)
      );
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <h1 className="title">{headline}</h1>
      <p className="subtitle">{sub}</p>

      <h2 className="section-title">
        제출 현황 {submitted.length} / {active.length}
      </h2>
      <ul className="player-list">
        {active.map(([id, p]) => (
          <li key={id} className="player-row">
            <span>{p.nickname}</span>
            <span>{p.submitted ? "✅" : "⏳"}</span>
          </li>
        ))}
      </ul>

      <div className="footer">
        {isHost && allDone && (
          <button
            className="btn btn-primary"
            onClick={begin}
            disabled={busy || submitted.length < 2}
          >
            게임 시작! 🎉
          </button>
        )}
        {isHost && !allDone && submitted.length >= 2 && (
          <button
            className="btn btn-ghost"
            onClick={() =>
              window.confirm(
                `아직 ${active.length - submitted.length}명이 제출 전이에요. 제출한 ${submitted.length}명만으로 시작할까요? (미제출자는 투표만 참여)`
              ) && begin()
            }
            disabled={busy}
          >
            제출한 사람만으로 시작
          </button>
        )}
        <button className="btn btn-ghost btn-small" onClick={onLeave}>
          나가기
        </button>
      </div>
    </div>
  );
}
