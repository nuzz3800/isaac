import { useState } from "react";
import { BRAND } from "../branding";
import MemberForm from "./MemberForm";
import ChurchLogo from "../Logo";

// 첫 방문: 내 프로필을 고르거나 새로 만든다 (로그인 대신 신뢰 기반)
export default function Welcome({ members, onPicked }) {
  const [creating, setCreating] = useState(false);

  if (creating)
    return (
      <MemberForm
        title="처음 오셨네요, 반가워요! 🧡"
        onSaved={onPicked}
        onCancel={() => setCreating(false)}
      />
    );

  const list = Object.entries(members).sort((a, b) =>
    a[1].name.localeCompare(b[1].name, "ko")
  );

  return (
    <div className="app center">
      <div className="hero">
        <p className="brand-eyebrow">{BRAND.church}</p>
        <div className="hero-emoji">
          <ChurchLogo size={64} />
        </div>
        <h1 className="title">{BRAND.group}</h1>
        <p className="subtitle">
          {list.length > 0
            ? "누구세요? 자기 이름을 눌러주세요"
            : "우리 사랑방의 첫 프로필을 만들어주세요!"}
        </p>
      </div>
      <div className="stack">
        {list.map(([id, m]) => (
          <button key={id} className="card" onClick={() => onPicked(id)}>
            <span className="card-text">
              {m.emoji} {m.name}
            </span>
          </button>
        ))}
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          처음 왔어요 — 프로필 만들기
        </button>
      </div>
    </div>
  );
}
