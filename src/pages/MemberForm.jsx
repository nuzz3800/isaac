import { useState } from "react";
import { createMember, updateMember } from "../api/members";
import { parseCohortYear } from "../dates";

const EMOJIS = [
  "😀", "😎", "🥰", "🤗", "😇", "🤓",
  "🥳", "😺", "🐶", "🐻", "🐰", "🦁",
  "🐥", "🐟", "🌻", "🍀", "⭐", "🔥",
];
const MBTIS = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
  "비밀 🤫",
];

export default function MemberForm({ title, initial, memberId, onSaved, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [emoji, setEmoji] = useState(initial?.emoji || "😀");
  const [birthMonth, setBirthMonth] = useState(initial?.birthMonth || "");
  const [birthDay, setBirthDay] = useState(initial?.birthDay || "");
  const [cohort, setCohort] = useState(
    initial?.birthYear ? String(initial.birthYear).slice(-2) : ""
  );
  const [mbti, setMbti] = useState(initial?.mbti || "");
  const [likes, setLikes] = useState(initial?.likes || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    const trimmedName = name.trim();
    if (!trimmedName) return setError("이름을 입력해주세요.");
    if ((birthMonth && !birthDay) || (!birthMonth && birthDay))
      return setError("생일은 월과 일을 함께 골라주세요.");
    if (cohort && !parseCohortYear(cohort))
      return setError("동기는 01 또는 2001처럼 적어주세요.");

    setBusy(true);
    setError("");
    const data = {
      name: trimmedName,
      emoji,
      birthMonth: birthMonth ? Number(birthMonth) : null,
      birthDay: birthDay ? Number(birthDay) : null,
      birthYear: cohort ? parseCohortYear(cohort) : null,
      mbti: mbti || null,
      likes: likes.trim() || null,
    };
    try {
      if (memberId) {
        await updateMember(memberId, data);
        onSaved(memberId);
      } else {
        onSaved(await createMember(data));
      }
    } catch {
      setError("저장에 실패했어요. 다시 시도해주세요.");
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <h1 className="title">{title}</h1>
      <p className="subtitle">가원들에게 나를 소개해주세요</p>

      <div className="stack">
        <label className="field-label">나를 나타내는 이모지</label>
        <div className="emoji-grid">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className={`emoji-cell${emoji === e ? " active" : ""}`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="field-label">이름 *</label>
        <input
          className="input"
          placeholder="이름 (실명 추천!)"
          maxLength={10}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="field-label">동기</label>
        <input
          className="input"
          placeholder="예: 01 (01동기로 표시돼요)"
          inputMode="numeric"
          maxLength={4}
          value={cohort}
          onChange={(e) => setCohort(e.target.value.replace(/\D/g, ""))}
        />

        <label className="field-label">생일</label>
        <div className="field-row">
          <select
            className="input"
            value={birthMonth}
            onChange={(e) => setBirthMonth(e.target.value)}
          >
            <option value="">월</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}월
              </option>
            ))}
          </select>
          <select
            className="input"
            value={birthDay}
            onChange={(e) => setBirthDay(e.target.value)}
          >
            <option value="">일</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}일
              </option>
            ))}
          </select>
        </div>

        <label className="field-label">MBTI</label>
        <select
          className="input"
          value={mbti}
          onChange={(e) => setMbti(e.target.value)}
        >
          <option value="">아직 몰라요</option>
          {MBTIS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label className="field-label">좋아하는 것들</label>
        <input
          className="input"
          placeholder="예: 커피, 축구, 찬양, 낮잠"
          maxLength={60}
          value={likes}
          onChange={(e) => setLikes(e.target.value)}
        />

        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? "저장 중..." : "저장하기"}
        </button>
        {onCancel && (
          <button className="btn btn-ghost" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </div>
  );
}
