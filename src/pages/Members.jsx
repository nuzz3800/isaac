import { Link } from "react-router-dom";
import { BRAND } from "../branding";
import { cohortLabel } from "../dates";
import { answeredCount } from "../questions";

export default function Members({ members, myId }) {
  const list = Object.entries(members).sort((a, b) =>
    a[1].name.localeCompare(b[1].name, "ko")
  );

  return (
    <div className="app">
      <p className="eyebrow">{BRAND.group}</p>
      <h1 className="title">우리 가원들 👥</h1>
      <p className="subtitle">
        이름을 누르면 자세한 소개가 보여요.
        {"\n"}문답이 쌓이면 '누구일까요?' 퀴즈가 열려요 👀
      </p>

      <div className="stack">
        {list.map(([id, m]) => {
          const qna = answeredCount(m);
          const sub = [
            cohortLabel(m.birthYear),
            m.mbti,
            m.birthMonth ? `${m.birthMonth}월 ${m.birthDay}일생` : null,
            qna > 0 ? `문답 ${qna}개` : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <Link to={`/members/${id}`} className="panel member-card" key={id}>
              <span className="avatar">{m.emoji}</span>
              <span className="member-info">
                <b>
                  {m.name}
                  {id === myId && <span className="tag">나</span>}
                </b>
                <span className="member-sub">
                  {sub || "소개를 기다리는 중..."}
                </span>
              </span>
              <span className="chevron">›</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
