import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { nextBirthday } from "../dates";
import MemberForm from "./MemberForm";

export default function MemberDetail({ members, myId, onSwitchProfile }) {
  const { id } = useParams();
  const m = members[id];
  const isMe = id === myId;
  const [editing, setEditing] = useState(false);

  if (!m)
    return (
      <div className="app center">
        <p className="splash">없는 프로필이에요.</p>
        <Link to="/members" className="btn btn-ghost">
          가원 목록으로
        </Link>
      </div>
    );

  if (editing)
    return (
      <MemberForm
        title="내 프로필 수정 ✏️"
        initial={m}
        memberId={id}
        onSaved={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );

  const birthday = m.birthMonth
    ? nextBirthday(m.birthMonth, m.birthDay)
    : null;

  const rows = [
    [
      "🎂 생일",
      m.birthMonth
        ? `${m.birthYear ? `${m.birthYear}년 ` : ""}${m.birthMonth}월 ${m.birthDay}일` +
          (birthday.days === 0
            ? " — 오늘이 생일! 🎉"
            : birthday.days <= 30
              ? ` (D-${birthday.days})`
              : "")
        : null,
    ],
    ["🧭 MBTI", m.mbti],
    ["🧡 좋아하는 것", m.likes],
  ].filter(([, v]) => v);

  return (
    <div className="app">
      <Link to="/members" className="hint back-link">
        ← 가원들
      </Link>

      <div className="profile-head">
        <span className="avatar avatar-big">{m.emoji}</span>
        <h1 className="title">
          {m.name}
          {isMe && <span className="tag">나</span>}
        </h1>
        {m.oneLiner && <p className="subtitle">“{m.oneLiner}”</p>}
      </div>

      <div className="stack">
        {rows.length === 0 && (
          <div className="panel">
            <span className="member-sub">
              아직 소개가 비어 있어요{isMe && " — 아래에서 채워주세요!"}
            </span>
          </div>
        )}
        {rows.map(([label, value]) => (
          <div className="panel" key={label}>
            <span className="field-label">{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>

      {isMe && (
        <div className="footer">
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            내 프로필 수정하기
          </button>
          <button className="btn btn-ghost btn-small" onClick={onSwitchProfile}>
            다른 사람으로 전환
          </button>
        </div>
      )}
    </div>
  );
}
