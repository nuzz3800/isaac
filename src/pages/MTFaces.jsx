import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  useMT,
  startFaceGame,
  judgeFace,
  ackTeamSwitch,
  applyFacePoints,
  cancelFaceGame,
} from "../api/mt";
import { FACES, FACE_MAP } from "../mtFaces";

const MAX_PER_TEAM = 15;
const COUNTDOWN = 3;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  const perTeam = Math.min(MAX_PER_TEAM, Math.floor(FACES.length / 2));

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
          {perTeam > 0
            ? `한 판에 팀당 ${perTeam}장씩, 총 ${perTeam * 2}장을 사용해요 (1팀 먼저 → 2팀)`
            : "사진이 아직 없어요"}
        </span>
      </div>

      {perTeam === 0 ? (
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
                shuffle(FACES.map((f) => f.name)).slice(0, perTeam * 2),
                perTeam
              )
            }
          >
            게임 시작! (팀당 {perTeam}장)
          </button>
        </div>
      )}
    </div>
  );
}

function FacePlaying({ mt }) {
  const g = mt.faceGame;
  const teamKey = g.pos < g.perTeam ? "t1" : "t2";
  const team = mt.teams[teamKey];

  if (g.awaitSwitch)
    return (
      <div className="app wide center">
        <div className="hero">
          <div className="hero-emoji">🔄</div>
          <h1 className="title">이제 {mt.teams.t2.name} 차례!</h1>
          <p className="subtitle">
            {mt.teams.t1.name}: {g.correct?.t1 || 0}개 성공 — 준비되면 시작해요
          </p>
        </div>
        <button className="btn btn-primary" onClick={ackTeamSwitch}>
          {mt.teams.t2.name} 시작! 🔥
        </button>
      </div>
    );

  return <FaceRound key={g.pos} mt={mt} g={g} teamKey={teamKey} team={team} />;
}

function FaceRound({ mt, g, teamKey, team }) {
  const [sec, setSec] = useState(COUNTDOWN);
  const [peek, setPeek] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sec <= 0) return;
    const t = setTimeout(() => setSec((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sec]);

  const name = g.order[g.pos];
  const face = FACE_MAP[name];
  const idxInTeam = g.pos < g.perTeam ? g.pos : g.pos - g.perTeam;

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
        <b className="team-name">{team.name}</b>
        <span className="member-sub">
          {idxInTeam + 1} / {g.perTeam} · 맞춘 개수 {g.correct?.[teamKey] || 0}
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
  const c1 = g.correct?.t1 || 0;
  const c2 = g.correct?.t2 || 0;

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
              {g.correct?.[tk] || 0}
              <span className="pts">개</span>
            </span>
          </div>
        ))}
      </div>

      <div className="panel">
        <b>포인트로 반영하기</b>
        <span className="member-sub">
          맞춘 개수 × 배율만큼 팀 포인트에 더해요
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
