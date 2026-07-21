import { Link } from "react-router-dom";
import { BRAND } from "../branding";

export default function Play() {
  return (
    <div className="app">
      <p className="eyebrow">{BRAND.group}</p>
      <h1 className="title">놀이터 🎲</h1>
      <p className="subtitle">모임 때 다 같이 즐기는 콘텐츠</p>

      <div className="stack">
        <Link to="/mt" className="panel member-card highlight">
          <span className="avatar">⛺</span>
          <span className="member-info">
            <b>MT 스페셜</b>
            <span className="member-sub">
              팀 대항 점수판 + MT 게임 모음 · 이번 주 MT용!
            </span>
          </span>
          <span className="chevron">›</span>
        </Link>

        <Link to="/game" className="panel member-card">
          <span className="avatar">🤥</span>
          <span className="member-info">
            <b>거짓말 자기소개</b>
            <span className="member-sub">
              키워드 속 거짓말을 찾아라! 실시간 게임 · 2명~
            </span>
          </span>
          <span className="chevron">›</span>
        </Link>

        <Link to="/quiz" className="panel member-card">
          <span className="avatar">👤</span>
          <span className="member-info">
            <b>누구일까요?</b>
            <span className="member-sub">
              가원들의 문답으로 만든 진짜 퀴즈 · 문답이 쌓일수록 풍성해져요
            </span>
          </span>
          <span className="chevron">›</span>
        </Link>

        <div className="panel member-card soon">
          <span className="avatar">💡</span>
          <span className="member-info">
            <b>다음 콘텐츠 준비 중</b>
            <span className="member-sub">
              본인을 맞혀라, 텔레파시, 밸런스 게임이 대기 중!
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
