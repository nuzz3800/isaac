import { useState } from "react";
import { castVote, revealAnswer, nextTurn, tallyTurn } from "./game";

export default function Voting({ room, roomCode, playerId }) {
  const targetId = room.turnOrder?.[room.currentTurnIndex];
  const target = room.players?.[targetId];
  const me = room.players?.[playerId];
  const isHost = room.hostId === playerId;
  const isTarget = targetId === playerId;
  const isSpectator = !!me?.spectator;
  const revealed = room.turnPhase === "revealed";

  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (!target) return null;

  const votes = room.votes?.[targetId] || {};
  const myVote = votes[playerId];
  const canVote = !revealed && !isTarget && !isSpectator;
  const current = selected ?? (myVote ? myVote.index : null);

  // 투표 대상: 관전자와 발표자 본인 제외 (미제출자도 투표는 참여)
  const voterIds = Object.entries(room.players || {})
    .filter(([id, p]) => !p.spectator && id !== targetId)
    .map(([id]) => id);
  const votedCount = voterIds.filter((id) => votes[id] != null).length;

  const { correctIds, totalVoted, presenterBonus } = revealed
    ? tallyTurn(room, targetId)
    : { correctIds: [], totalVoted: 0, presenterBonus: false };

  async function vote() {
    if (current == null) return;
    setBusy(true);
    try {
      await castVote(roomCode, targetId, playerId, current, comment.trim());
      setSelected(null);
      setComment("");
    } finally {
      setBusy(false);
    }
  }

  async function reveal() {
    if (
      votedCount < voterIds.length &&
      !window.confirm(
        `아직 ${voterIds.length - votedCount}명이 투표 전이에요. 그래도 정답을 공개할까요?`
      )
    )
      return;
    setBusy(true);
    try {
      await revealAnswer(roomCode);
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    setBusy(true);
    try {
      await nextTurn(roomCode, room);
    } finally {
      setBusy(false);
    }
  }

  const isLastTurn = room.currentTurnIndex + 1 >= room.turnOrder.length;

  return (
    <div className="app">
      <p className="eyebrow">
        {room.currentTurnIndex + 1} / {room.turnOrder.length} 번째
      </p>
      <h1 className="title">
        {isTarget ? "내 차례예요! 🎤" : `${target.nickname}님의 자기소개`}
      </h1>
      <p className="subtitle">
        {revealed
          ? "정답 공개! 🎉"
          : isTarget
            ? "누가 속을까? 시치미 뚝 떼고 기다려요 🤫"
            : isSpectator
              ? "관전 중이에요 👀"
              : "이 중 거짓말 하나를 골라줘요"}
      </p>

      <div className="stack">
        {(target.keywords || []).map((keyword, i) => {
          const votersHere = voterIds.filter((id) => votes[id]?.index === i);
          let cls = "card";
          if (revealed) cls += i === target.lieIndex ? " lie" : " truth";
          else if (canVote && current === i) cls += " selected";
          return (
            <div key={i}>
              <button
                type="button"
                className={cls}
                onClick={() => canVote && setSelected(i)}
                disabled={!canVote}
              >
                <span className="card-text">{keyword}</span>
                {revealed && (
                  <span className="card-mark">
                    {i === target.lieIndex ? "🤥 거짓말!" : "✓ 진실"}
                  </span>
                )}
              </button>
              {revealed && votersHere.length > 0 && (
                <div className="voter-chips">
                  {votersHere.map((id) => (
                    <span
                      key={id}
                      className={`chip ${i === target.lieIndex ? "chip-correct" : ""}`}
                    >
                      {room.players[id]?.nickname}
                      {i === target.lieIndex && " +1"}
                      {votes[id]?.comment && <em> “{votes[id].comment}”</em>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {revealed && (
        <div className="notice">
          {correctIds.length > 0
            ? `${correctIds.length}명이 거짓말을 찾아냈어요! (+1점)`
            : totalVoted > 0
              ? "아무도 못 맞췄어요! 완벽한 연기 👏"
              : "투표한 사람이 없었어요."}
          {presenterBonus && ` 과반이 속아서 ${target.nickname}님 +2점!`}
        </div>
      )}

      <div className="footer">
        {!revealed && (
          <p className="hint">
            🗳 {votedCount} / {voterIds.length}명 투표 완료
          </p>
        )}

        {canVote && !myVote && (
          <>
            <input
              className="input"
              placeholder="왜 그렇게 생각해요? (선택, 정답 때 공개)"
              maxLength={30}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={vote}
              disabled={current == null || busy}
            >
              투표하기
            </button>
          </>
        )}
        {canVote && myVote && selected != null && selected !== myVote.index && (
          <button className="btn btn-primary" onClick={vote} disabled={busy}>
            이걸로 변경
          </button>
        )}
        {canVote && myVote && (selected == null || selected === myVote.index) && (
          <p className="hint">투표 완료! 다른 카드를 누르면 바꿀 수 있어요.</p>
        )}

        {isHost && !revealed && (
          <button className="btn btn-danger" onClick={reveal} disabled={busy}>
            정답 공개 🔓
          </button>
        )}
        {isHost && revealed && (
          <button className="btn btn-primary" onClick={next} disabled={busy}>
            {isLastTurn ? "최종 결과 보기 🏆" : "다음 사람 →"}
          </button>
        )}
        {!isHost && revealed && (
          <p className="hint">방장이 넘기길 기다리는 중...</p>
        )}
      </div>
    </div>
  );
}
