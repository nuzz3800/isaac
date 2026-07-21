import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  useMT,
  startFaceGame,
  judgeFace,
  ackTeamSwitch,
  applyFacePoints,
  cancelFaceGame,
  faceSegOf,
  faceTeamOf,
  faceRoundOf,
  faceTeamTotal,
} from "../api/mt";
import { FACES, FACE_MAP } from "../mtFaces";

const SEG_SIZE = 15;
const COUNTDOWN = 3;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 사진 수에 따른 판 구성: 60장 이상이면 팀당 2판 교대(1팀→2팀→1팀→2팀)
function planGame(poolSize) {
  if (poolSize >= SEG_SIZE * 4)
    return { segSize: SEG_SIZE, sequence: ["t1", "t2", "t1", "t2"] };
  if (poolSize >= 2)
    return {
      segSize: Math.min(SEG_SIZE, Math.floor(poolSize / 2)),
      sequence: ["t1", "t2"],
    };
  return null;
}

export default function MTFaces() {
  const mt = useMT();

  if (mt === undefined)
    return (
      <div className="app center">
        <p className="splash">게임 준비 중...</p>
      </div>
    );
  if (!mt) return <Navigate to="/mt" replace />;

  const g = mt.faceGame;
  if (!g) return <FaceSetup />;
  if (g.status === "done") return <FaceDone mt={mt} />;
  return <FacePlaying mt={mt} />;
}

function FaceSetup() {
  const plan = planGame(FACES.length);
  const roundsPerTeam = plan ? plan.sequence.length / 2 : 0;

  return (
    <div className="app wide">
      <Link to="/mt" className="hint back-link">
        ← MT 홈
      </Link>
      <p className="eyebrow">MT 스페셜</p>
      <h1 className="title">인물 맞추기 🧑</h1>
      <p className="subtitle">
        {"화면의 인물을 3초 안에 맞혀요!"}
        {"\n"}
        {"진행자가 하단 버튼으로 정답/오답을 판정해요."}
      </p>

      <div className="panel cream">
        <b>준비된 사진 {FACES.length}장</b>
        <span className="member-sub">
          {plan
            ? `팀당 ${plan.segSize}장 × ${roundsPerTeam}판 (총 ${plan.segSize * plan.sequence.length}장) · 1팀 → 2팀 교대로 진행해요`
            : "사진이 아직 없어요"}
        </span>
      </div>

      {!plan ? (
        <div className="panel">
          <b>사진 넣는 법 📂</b>
          <span className="member-sub">
            프로젝트의 src/assets/mt-faces/ 폴더에 이미지를 넣으면 돼요.
            파일명이 곧 정답 이름이에요 (예: 아이유.jpg). 파일을 넣고
            Claude에게 "사진 넣었어"라고 하면 배포까지 처리해줘요.
          </span>
        </div>
      ) : (
        <div className="footer">
          <button
            className="btn btn-primary"
            onClick={() =>
              startFaceGame(
                shuffle(FACES.map((f) => f.name)).slice(
                  0,
                  plan.segSize * plan.sequence.length
                ),
                plan.segSize,
                plan.sequence
              )
            }
          >
            게임 시작! (팀당 {plan.segSize}장 × {roundsPerTeam}판)
          </button>
        </div>
      )}
    </div>
  );
}

function FacePlaying({ mt }) {
  const g = mt.faceGame;

  if (g.awaitSwitch) {
    const nextTeam = mt.teams[faceTeamOf(g)];
    const nextRound = faceRoundOf(g);
    return (
      <div className="app wide center">
        <div className="hero">
          <div className="hero-emoji">🔄</div>
          <h1 className="title">
            이제 {nextTeam.name} {nextRound}판 차례!
          </h1>
          <p className="subtitle">
            현재 스코어 — {mt.teams.t1.name} {faceTeamTotal(g, "t1")}개 ·{" "}
            {mt.teams.t2.name} {faceTeamTotal(g, "t2")}개
          </p>
        </div>
        <button className="btn btn-primary" onClick={ackTeamSwitch}>
          {nextTeam.name} 시작! 🔥
        </button>
      </div>
    );
  }

  return <FaceRound key={g.pos} mt={mt} g={g} />;
}

function FaceRound({ mt, g }) {
  const [sec, setSec] = useState(COUNTDOWN);
  const [peek, setPeek] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sec <= 0) return;
    const t = setTimeout(() => setSec((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sec]);

  const teamKey = faceTeamOf(g);
  const team = mt.teams[teamKey];
  const round = faceRoundOf(g);
  const name = g.order[g.pos];
  const face = FACE_MAP[name];
  const idxInSeg = g.pos % g.segSize;
  const segCorrect = g.correct?.[faceSegOf(g)] || 0;

  async function judge(isCorrect) {
    setBusy(true);
    try {
      await judgeFace(mt, isCorrect);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app wide">
      <div className="row-between">
        <b className="team-name">
          {team.name} · {round}판
        </b>
        <span className="member-sub">
          {idxInSeg + 1} / {g.segSize} · 이번 판 {segCorrect}개 · 합계{" "}
          {faceTeamTotal(g, teamKey)}개
        </span>
      </div>

      <div className="face-stage">
        {face ? (
          <img src={face.url} alt="인물 사진" />
        ) : (
          <span className="face-missing">사진 없음 ({name})</span>
        )}
        <span className={`face-count${sec === 0 ? " over" : ""}`}>
          {sec > 0 ? sec : "⏰"}
        </span>
        {peek && <div className="peek-overlay">{name}</div>}
      </div>

      <div className="judge-row">
        <button
          className="judge-btn wrong"
          disabled={busy}
          onClick={() => judge(false)}
        >
          오답 ✕
        </button>
        <button
          className="judge-btn right"
          disabled={busy}
          onClick={() => judge(true)}
        >
          정답 ⭕
        </button>
      </div>

      <div className="row-between">
        <button className="text-btn" onClick={() => setPeek(!peek)}>
          {peek ? "정답 가리기" : "💡 정답 보기"}
        </button>
        <button
          className="text-btn danger"
          onClick={() =>
            window.confirm("게임을 중단할까요? 진행 상황이 사라져요.") &&
            cancelFaceGame()
          }
        >
          게임 중단
        </button>
      </div>
    </div>
  );
}

function FaceDone({ mt }) {
  const navigate = useNavigate();
  const g = mt.faceGame;
  const [mult, setMult] = useState("10");
  const [busy, setBusy] = useState(false);
  const m = Number(mult) || 0;
  const c1 = faceTeamTotal(g, "t1");
  const c2 = faceTeamTotal(g, "t2");

  // 팀별 판당 점수 (예: "1판 8 · 2판 11")
  function breakdown(team) {
    return g.sequence
      .map((t, i) => ({ t, n: g.correct?.[i] || 0 }))
      .filter(({ t }) => t === team)
      .map(({ n }, idx) => `${idx + 1}판 ${n}`)
      .join(" · ");
  }

  return (
    <div className="app wide">
      <p className="eyebrow">인물 맞추기 · 결과</p>
      <h1 className="title">
        {c1 === c2
          ? "무승부! 🤝"
          : `${(c1 > c2 ? mt.teams.t1 : mt.teams.t2).name} 승리! 🏆`}
      </h1>

      <div className="team-grid">
        {["t1", "t2"].map((tk) => (
          <div className="panel team-card" key={tk}>
            <b className="team-name">{mt.teams[tk].name}</b>
            <span className="team-score">
              {faceTeamTotal(g, tk)}
              <span className="pts">개</span>
            </span>
            <span className="member-sub">{breakdown(tk)}</span>
          </div>
        ))}
      </div>

      <div className="panel">
        <b>포인트로 반영하기</b>
        <span className="member-sub">
          맞춘 개수 합계 × 배율만큼 팀 포인트에 더해요
        </span>
        <div className="field-row">
          <input
            className="input"
            inputMode="numeric"
            placeholder="배율"
            value={mult}
            onChange={(e) => setMult(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <span className="member-sub">
          {mt.teams.t1.name} +{c1 * m}점 · {mt.teams.t2.name} +{c2 * m}점
        </span>
      </div>

      <div className="footer">
        <button
          className="btn btn-primary"
          disabled={busy || m <= 0}
          onClick={async () => {
            setBusy(true);
            try {
              await applyFacePoints(mt, m);
              navigate("/mt");
            } finally {
              setBusy(false);
            }
          }}
        >
          포인트 반영하고 돌아가기
        </button>
        <button
          className="btn btn-ghost"
          onClick={async () => {
            if (!window.confirm("포인트 반영 없이 결과를 닫을까요?")) return;
            await cancelFaceGame();
            navigate("/mt");
          }}
        >
          반영 없이 닫기
        </button>
      </div>
    </div>
  );
}
