import { useEffect, useState } from "react";
import { ref, push, set, update, onValue } from "firebase/database";
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
