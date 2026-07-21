import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useMT,
  setupMT,
  renameTeam,
  setTeamPoints,
  addTeamPoints,
  resetMT,
} from "../api/mt";
import { FACES } from "../mtFaces";
import { BRAND } from "../branding";

export default function MT() {
  const mt = useMT();

  if (mt === undefined)
    return (
      <div className="app center">
        <p className="splash">MT 준비 중...</p>
      </div>
    );

  if (!mt) return <Setup />;

  return (
    <div className="app wide">
      <Link to="/play" className="hint back-link">
        ← 놀이터
      </Link>
      <p className="eyebrow">{BRAND.group}</p>
      <h1 className="title">MT 스페셜 ⛺</h1>
      <p className="subtitle">
        점수는 언제든 직접 고칠 수 있어요 — 오프라인 게임 점수도 여기에!
      </p>

      <div className="team-grid">
        <TeamCard mt={mt} team="t1" />
        <TeamCard mt={mt} team="t2" />
      </div>

      <h2 className="section-title">MT 게임</h2>
      <div className="stack">
        <Link to="/mt/faces" className="panel member-card">
          <span className="avatar">🧑</span>
          <span className="member-info">
            <b>인물 맞추기</b>
            <span className="member-sub">
              사진 보고 3초 안에! · 사진 {FACES.length}장 준비됨
            </span>
          </span>
          <span className="chevron">›</span>
        </Link>
        <div className="panel member-card soon">
          <span className="avatar">💡</span>
          <span className="member-info">
            <b>다음 게임 준비 중</b>
            <span className="member-sub">
              추가하고 싶은 게임을 말해주세요!
            </span>
          </span>
        </div>
      </div>

      <div className="footer">
        <button
          className="btn btn-ghost btn-small btn-delete"
          onClick={() =>
            window.confirm(
              "MT 점수판을 초기화할까요? 두 팀의 포인트가 모두 사라져요."
            ) && resetMT()
          }
        >
          MT 초기화
        </button>
      </div>
    </div>
  );
}

function TeamCard({ mt, team }) {
  const t = mt.teams[team];
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  return (
    <div className="panel team-card">
      <div className="row-between" style={{ width: "100%" }}>
        <b className="team-name">{t.name}</b>
        <button
          className="text-btn"
          onClick={() => {
            const n = window.prompt("팀 이름을 입력해주세요", t.name);
            if (n && n.trim()) renameTeam(team, n.trim().slice(0, 10));
          }}
        >
          ✏️
        </button>
      </div>

      {editing ? (
        <div className="field-row" style={{ width: "100%" }}>
          <input
            className="input"
            inputMode="numeric"
            value={val}
            onChange={(e) => setVal(e.target.value.replace(/[^0-9-]/g, ""))}
            autoFocus
          />
          <button
            className="btn btn-primary btn-comment"
            onClick={() => {
              setTeamPoints(team, Number(val) || 0);
              setEditing(false);
            }}
          >
            저장
          </button>
        </div>
      ) : (
        <button
          className="team-score"
          title="누르면 직접 입력"
          onClick={() => {
            setVal(String(t.points || 0));
            setEditing(true);
          }}
        >
          {t.points || 0}
          <span className="pts">점</span>
        </button>
      )}

      <div className="score-row">
        {[-10, -1, +1, +10].map((d) => (
          <button
            key={d}
            className="score-btn"
            onClick={() => addTeamPoints(mt, team, d)}
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
    </div>
  );
}

function Setup() {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="app center">
      <div className="hero">
        <p className="brand-eyebrow">{BRAND.group}</p>
        <div className="hero-emoji">⛺</div>
        <h1 className="title">MT 스페셜</h1>
        <p className="subtitle">두 팀의 이름을 정하고 시작해요!</p>
      </div>
      <div className="stack">
        <input
          className="input"
          placeholder="1팀 이름 (예: 불사조)"
          maxLength={10}
          value={name1}
          onChange={(e) => setName1(e.target.value)}
        />
        <input
          className="input"
          placeholder="2팀 이름 (예: 피닉스)"
          maxLength={10}
          value={name2}
          onChange={(e) => setName2(e.target.value)}
        />
        <button
          className="btn btn-primary"
          disabled={busy || !name1.trim() || !name2.trim()}
          onClick={async () => {
            setBusy(true);
            try {
              await setupMT(name1.trim(), name2.trim());
            } finally {
              setBusy(false);
            }
          }}
        >
          MT 시작! 🔥
        </button>
        <Link to="/play" className="hint back-link" style={{ textAlign: "center" }}>
          ← 놀이터로
        </Link>
      </div>
    </div>
  );
}
