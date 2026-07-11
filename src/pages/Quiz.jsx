import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useQuiz,
  buildQuestionPool,
  openLobby,
  joinQuiz,
  startQuiz,
  castQuizVote,
  revealQuizRound,
  nextQuizRound,
  replayQuiz,
  closeQuiz,
} from "../api/quiz";
import { QUESTIONS } from "../questions";
import { BRAND } from "../branding";

const MIN_POOL = 5;
const MIN_MEMBERS = 3;

export default function Quiz({ members, myId }) {
  const quiz = useQuiz();

  if (quiz === undefined)
    return (
      <div className="app center">
        <p className="splash">퀴즈 준비 중...</p>
      </div>
    );

  if (!quiz) return <Intro members={members} myId={myId} />;
  if (quiz.status === "lobby")
    return <Lobby quiz={quiz} members={members} myId={myId} />;
  if (quiz.status === "playing")
    return (
      <Round
        key={quiz.currentIndex}
        quiz={quiz}
        members={members}
        myId={myId}
      />
    );
  return <Result quiz={quiz} members={members} myId={myId} />;
}

function Intro({ members, myId }) {
  const [busy, setBusy] = useState(false);
  const pool = buildQuestionPool(members);
  const targets = new Set(pool.map((p) => p.targetId)).size;
  const ready =
    pool.length >= MIN_POOL && Object.keys(members).length >= MIN_MEMBERS;

  return (
    <div className="app">
      <Link to="/play" className="hint back-link">
        ← 놀이터
      </Link>
      <p className="eyebrow">{BRAND.group}</p>
      <h1 className="title">누구일까요? 👤</h1>
      <p className="subtitle">
        가원들이 프로필에 남긴 문답이 그대로 문제가 돼요.
        {"\n"}"이렇게 답한 사람, 누구게?"
      </p>

      <div className="panel cream">
        <b>지금 출제 가능한 문제</b>
        <span className="member-sub">
          {pool.length}개 · {targets}명의 문답에서 나왔어요
        </span>
      </div>

      <div className="footer">
        {ready ? (
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await openLobby(myId);
              } finally {
                setBusy(false);
              }
            }}
          >
            퀴즈 대기실 열기
          </button>
        ) : (
          <>
            <p className="hint">
              문제가 아직 부족해요 — 가원 {MIN_MEMBERS}명 이상이 문답을 채우고,
              문제 {MIN_POOL}개 이상이 모이면 시작할 수 있어요.
            </p>
            <Link to="/members" className="btn btn-primary">
              내 문답 채우러 가기 ✍️
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function Lobby({ quiz, members, myId }) {
  const [busy, setBusy] = useState(false);
  const isHost = quiz.hostId === myId;
  const players = Object.entries(quiz.players || {}).sort(
    (a, b) => a[1].joinedAt - b[1].joinedAt
  );
  const joined = !!quiz.players?.[myId];

  return (
    <div className="app">
      <p className="eyebrow">{BRAND.group} · 누구일까요?</p>
      <h1 className="title">퀴즈 대기실 🚪</h1>
      <p className="subtitle">참가할 사람은 아래 버튼을 눌러주세요!</p>

      <h2 className="section-title">참가자 {players.length}명</h2>
      <ul className="player-list">
        {players.map(([id]) => (
          <li key={id} className="player-row">
            <span>
              {members[id]?.emoji} {members[id]?.name}
              {id === quiz.hostId && " 👑"}
            </span>
            {id === myId && <span className="tag">나</span>}
          </li>
        ))}
      </ul>

      <div className="footer">
        {!joined && (
          <button className="btn btn-primary" onClick={() => joinQuiz(myId)}>
            참가하기 ✋
          </button>
        )}
        {isHost && (
          <button
            className="btn btn-primary"
            disabled={busy || players.length < 2}
            onClick={async () => {
              setBusy(true);
              try {
                await startQuiz(members);
              } finally {
                setBusy(false);
              }
            }}
          >
            {players.length < 2 ? "2명 이상 모이면 시작!" : "퀴즈 시작! 🎉"}
          </button>
        )}
        {joined && !isHost && (
          <p className="hint">
            {members[quiz.hostId]?.name}님이 시작하길 기다리는 중...
          </p>
        )}
        {isHost && (
          <button
            className="btn btn-ghost btn-small"
            onClick={() =>
              window.confirm("대기실을 닫을까요?") && closeQuiz()
            }
          >
            대기실 닫기
          </button>
        )}
      </div>
    </div>
  );
}

function Round({ quiz, members, myId }) {
  const [busy, setBusy] = useState(false);
  const i = quiz.currentIndex;
  const q = quiz.questions[i];
  const question = QUESTIONS.find((x) => x.id === q.questionId);
  const revealed = quiz.phase === "revealed";
  const isHost = quiz.hostId === myId;
  const isTarget = q.targetId === myId;
  const isPlayer = !!quiz.players?.[myId];
  const canVote = !revealed && isPlayer && !isTarget;

  const votes = quiz.votes?.[i] || {};
  const myVote = votes[myId];
  const voterIds = Object.keys(quiz.players || {}).filter(
    (id) => id !== q.targetId
  );
  const votedCount = voterIds.filter((id) => votes[id] != null).length;
  const correctVoters = voterIds.filter((id) => votes[id] === q.targetId);

  async function reveal() {
    if (
      votedCount < voterIds.length &&
      !window.confirm(
        `아직 ${voterIds.length - votedCount}명이 투표 전이에요. 공개할까요?`
      )
    )
      return;
    setBusy(true);
    try {
      await revealQuizRound();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <p className="eyebrow">
        문제 {i + 1} / {quiz.questions.length}
      </p>
      <h1 className="title">{question?.label}</h1>
      <div className="panel cream quote-card">“{q.answer}”</div>
      <p className="subtitle" style={{ marginTop: 10 }}>
        {revealed
          ? `정답은 ${members[q.targetId]?.emoji} ${members[q.targetId]?.name}님! 🎉`
          : isTarget
            ? "내 얘기잖아...?! 표정 관리하세요 🤫"
            : "이렇게 답한 가원은 누구일까요?"}
      </p>

      <div className="stack">
        {(q.choices || []).map((choiceId) => {
          const m = members[choiceId];
          const votersHere = voterIds.filter((id) => votes[id] === choiceId);
          let cls = "card";
          if (revealed)
            cls += choiceId === q.targetId ? " lie" : " truth";
          else if (canVote && myVote === choiceId) cls += " selected";
          return (
            <div key={choiceId}>
              <button
                type="button"
                className={cls}
                disabled={!canVote}
                onClick={() => castQuizVote(i, myId, choiceId)}
              >
                <span className="card-text">
                  {m?.emoji} {m?.name || "?"}
                </span>
                {revealed && choiceId === q.targetId && (
                  <span className="card-mark">🎯 정답!</span>
                )}
              </button>
              {revealed && votersHere.length > 0 && (
                <div className="voter-chips">
                  {votersHere.map((id) => (
                    <span
                      key={id}
                      className={`chip ${choiceId === q.targetId ? "chip-correct" : ""}`}
                    >
                      {members[id]?.name}
                      {choiceId === q.targetId && " +1"}
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
          {correctVoters.length > 0
            ? `${correctVoters.length}명이 맞혔어요! (+1점)`
            : "아무도 못 맞혔어요! 아직 서로 멀었네요 😆"}
        </div>
      )}

      <div className="footer">
        {!revealed && (
          <p className="hint">
            🗳 {votedCount} / {voterIds.length}명 투표 완료
            {myVote && " · 다른 카드를 누르면 바꿀 수 있어요"}
            {!isPlayer && " · 관전 중이에요, 다음 판에 함께해요!"}
          </p>
        )}
        {isHost && !revealed && (
          <button className="btn btn-danger" onClick={reveal} disabled={busy}>
            정답 공개 🔓
          </button>
        )}
        {isHost && revealed && (
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await nextQuizRound(quiz);
              } finally {
                setBusy(false);
              }
            }}
          >
            {i + 1 >= quiz.questions.length ? "최종 결과 보기 🏆" : "다음 문제 →"}
          </button>
        )}
        {!isHost && revealed && (
          <p className="hint">진행자가 넘기길 기다리는 중...</p>
        )}
      </div>
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

function Result({ quiz, members, myId }) {
  const [busy, setBusy] = useState(false);
  const isHost = quiz.hostId === myId;

  const ranked = Object.entries(quiz.players || {}).sort(
    (a, b) => (b[1].score || 0) - (a[1].score || 0)
  );
  let lastScore = null;
  let lastRank = 0;
  const rows = ranked.map(([id, p], idx) => {
    const score = p.score || 0;
    const rank = score === lastScore ? lastRank : idx + 1;
    lastScore = score;
    lastRank = rank;
    return { id, score, rank };
  });

  return (
    <div className="app">
      <p className="eyebrow">{BRAND.group} · 누구일까요?</p>
      <h1 className="title">🏆 서로를 제일 잘 아는 사람은?</h1>

      <ul className="player-list">
        {rows.map((p) => (
          <li
            key={p.id}
            className={`player-row ${p.rank === 1 ? "winner" : ""}`}
          >
            <span>
              <span className="rank">{MEDALS[p.rank - 1] || `${p.rank}위`}</span>{" "}
              {members[p.id]?.emoji} {members[p.id]?.name}
              {p.id === myId && <span className="tag">나</span>}
            </span>
            <b>{p.score}점</b>
          </li>
        ))}
      </ul>

      <div className="footer">
        <p className="hint">서로에 대해 몰랐던 게 줄어든 만큼 가까워진 거예요 🧡</p>
        {isHost && (
          <>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await replayQuiz(quiz, members);
                } finally {
                  setBusy(false);
                }
              }}
            >
              새 문제로 한 판 더 🔄
            </button>
            <button
              className="btn btn-ghost"
              onClick={() =>
                window.confirm("퀴즈를 끝낼까요?") && closeQuiz()
              }
            >
              퀴즈 끝내기
            </button>
          </>
        )}
        {!isHost && <Link to="/play" className="btn btn-ghost">놀이터로</Link>}
      </div>
    </div>
  );
}
