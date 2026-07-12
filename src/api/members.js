import { useEffect, useState } from "react";
import { ref, push, set, update, remove, onValue } from "firebase/database";
import { db } from "../firebase";

// members/{memberId}: { name, emoji, birthMonth, birthDay, birthYear?, mbti, oneLiner, likes, createdAt }

export function useMembers() {
  const [members, setMembers] = useState(null); // null = 로딩 중
  useEffect(
    () => onValue(ref(db, "members"), (s) => setMembers(s.val() || {})),
    []
  );
  return members;
}

export async function createMember(data) {
  const r = push(ref(db, "members"));
  await set(r, { ...data, createdAt: Date.now() });
  return r.key;
}

export async function updateMember(memberId, data) {
  await update(ref(db, `members/${memberId}`), data);
}

// 프로필 삭제 — 본인 것만 UI에 노출. 그 프로필이 쓴 기도/RSVP는
// 남되 작성자가 '익명'으로 표시됨 (주 용도: 실수로 만든 중복 정리)
export async function deleteMember(memberId) {
  await remove(ref(db, `members/${memberId}`));
}
