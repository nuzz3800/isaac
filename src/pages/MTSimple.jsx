import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  useMT,
  startSimpleGame,
  revealSimple,
  scoreSimple,
  applySimplePoints,
  cancelSimpleGame,
} from "../api/mt";
import { SIMPLE_PAIRS, SIMPLE_MAP, SIMPLE_MISSING } from "../mtSimple";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MTSimple() {
  const mt = useMT();

  if (mt === undefined)
    return (
      <div className="app center">
        <p className="splash">게임 준비 중...</p>
      </div>
    );
  if (!mt) return <Navigate to="/mt" replace />;

  const g = mt.simpleGame;
  if (!g) return <SimpleSetup />;
  if (g.status === "done") return <SimpleDone mt={mt} />;
  return <SimplePlaying mt={mt} />;
}

function SimpleSetup() {
  return (
    <div className="app wide">
      <Link to="/mt" className="hint back-link">
        ← MT 홈
      </Link>
      <p className="eyebrow">MT 스페셜</p>
      <h1 className="title">이 색 누구게? 🎨</h1>
      <p className="subtitle">
        {"단순화된 그림을 보고 어떤 캐릭터인지 맞혀요."}
        {"\n"}
        {"두 팀이 동시에 외치고, 먼저 맞힌 팀이 점수!"}
      </p>

      <div className="panel cream">
        <b>준비된 문제 {SIMPLE_PAIRS.length}개</b>
        <span className="member-sub">
          문제 그림 → 정답 공개 → 맞힌 팀 기록 순서로 진행해요
        </span>
      </div>

      {SIMPLE_MISSING.length > 0 && (
        <div className="panel">
          <b>⚠️ 짝이 안 맞는 파일</b>
          <span className="member-sub">{SIMPLE_MISSING.join(" · ")}</span>
        </div>
      )}

      {SIMPLE_PAIRS.length === 0 ? (
        <div className="panel">
          <b>사진 넣는 법 📂</b>
          <span className="member-sub">
            src/assets/mt-simple/ 폴더에 단순화 그림은 "루피.png", 정답 사진은
            "루피2.png"처럼 짝으로 넣으면 돼요. 파일을 넣고 Claude에게 "사진
            넣었어"라고 하면 배포까지 처리해줘요.
          </span>
        </div>
      ) : (
        <div className="footer">
          <button
            className="btn btn-primary"
            onClick={() =>
              startSimpleGame(shuffle(SIMPLE_PAIRS.map((p) => p.name)))
            }
          >
            게임 시작! ({SIMPLE_PAIRS.length}문제)
          </button>
        </div>
      )}
    </div>
  );
}

function SimplePlaying({ mt }) {
  const g = mt.simpleGame;
  const [busy, setBusy] = useState(false);
  const pair = SIMPLE_MAP[g.order[g.pos]];

  async function next(team) {
    setBusy(true);
    try {
      await scoreSimple(mt, team);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app wide">
      <div className="row-between">
        <b className="team-name">
          {g.pos + 1} / {g.order.length}
        </b>
        <span className="member-sub">
          {mt.teams.t1.name} {g.correct?.t1 || 0} : {g.correct?.t2 || 0}{" "}
          {mt.teams.t2.name}
        </span>
      </div>

      <div className="face-stage">
        {pair ? (
          <img
            src={g.revealed ? pair.answerUrl : pair.quizUrl}
            alt="캐릭터"
          />
        ) : (
          <span className="face-missing">사진 없음 ({g.order[g.pos]})</span>
        )}
        {g.revealed && <div className="peek-overlay">{g.order[g.pos]}</div>}
      </div>

      {!g.revealed ? (
        <button className="btn btn-danger btn-reveal" onClick={revealSimple}>
          정답 공개 🔓
        </button>
      ) : (
        <>
          <div className="judge-row">
            <button
              className="judge-btn team-a"
              disabled={busy}
              onClick={() => next("t1")}
            >
              {mt.teams.t1.name} 정답!
            </button>
            <button
              className="judge-btn team-b"
              disabled={busy}
              onClick={() => next("t2")}
            >
              {mt.teams.t2.name} 정답!
            </button>
          </div>
          <button
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => next(null)}
          >
            아무도 못 맞혔어요 →
          </button>
        </>
      )}

      <div className="row-between">
        <span />
        <button
          className="text-btn danger"
          onClick={() =>
            window.confirm("게임을 중단할까요? 진행 상황이 사라져요.") &&
            cancelSimpleGame()
          }
        >
          게임 중단
        </button>
      </div>
    </div>
  );
}

function SimpleDone({ mt }) {
  const navigate = useNavigate();
  const g = mt.simpleGame;
  const [mult, setMult] = useState("10");
  const [busy, setBusy] = useState(false);
  const m = Number(mult) || 0;
  const c1 = g.correct?.t1 || 0;
  const c2 = g.correct?.t2 || 0;

  return (
    <div className="app wide">
      <p className="eyebrow">이 색 누구게? · 결과</p>
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
          맞힌 개수 × 배율만큼 팀 포인트에 더해요
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
              await applySimplePoints(mt, m);
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
            await cancelSimpleGame();
            navigate("/mt");
          }}
        >
          반영 없이 닫기
        </button>
      </div>
    </div>
  );
}
