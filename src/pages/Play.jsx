import { Link } from "react-router-dom";
import { BRAND } from "../branding";

export default function Play() {
  return (
    <div className="app">
      <p className="eyebrow">{BRAND.group}</p>
      <h1 className="title">놀이터 🎲</h1>
      <p className="subtitle">모임 때 다 같이 즐기는 콘텐츠</p>

      <div className="stack">
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

        <div className="panel member-card soon">
          <span className="avatar">💡</span>
          <span className="member-info">
            <b>다음 콘텐츠 준비 중</b>
            <span className="member-sub">
              밸런스 게임, 이상형 월드컵... 아이디어를 들려주세요!
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
