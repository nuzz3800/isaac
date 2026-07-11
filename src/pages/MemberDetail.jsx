import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { nextBirthday, cohortLabel } from "../dates";
import { QUESTIONS } from "../questions";
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
    ["🎓 동기", cohortLabel(m.birthYear)],
    [
      "🎂 생일",
      m.birthMonth
        ? `${m.birthMonth}월 ${m.birthDay}일` +
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

      {(() => {
        const answered = QUESTIONS.filter((q) => m.answers?.[q.id]);
        if (answered.length === 0)
          return (
            isMe && (
              <p className="hint" style={{ marginTop: 16 }}>
                문답을 채우면 '누구일까요?' 퀴즈에 출제돼요 👀
              </p>
            )
          );
        return (
          <>
            <h2 className="section-title">
              💬 {m.name}님의 문답 {answered.length}개
            </h2>
            <div className="stack">
              {answered.map((q) => (
                <div className="panel" key={q.id}>
                  <span className="field-label">{q.label}</span>
                  <b>{m.answers[q.id]}</b>
                </div>
              ))}
            </div>
          </>
        );
      })()}

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
