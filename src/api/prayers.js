import { useEffect, useState } from "react";
import { ref, push, set, update, remove, onValue } from "firebase/database";
import { db } from "../firebase";
import { weekKeyOf } from "../dates";

// prayers/{prayerId}: { memberId, text, weekKey, createdAt, prayedBy: { memberId: true } }

export function usePrayers() {
  const [prayers, setPrayers] = useState(null);
  useEffect(
    () => onValue(ref(db, "prayers"), (s) => setPrayers(s.val() || {})),
    []
  );
  return prayers;
}

export async function addPrayer(memberId, text) {
  const r = push(ref(db, "prayers"));
  await set(r, { memberId, text, weekKey: weekKeyOf(), createdAt: Date.now() });
}

export async function updatePrayer(prayerId, text) {
  await update(ref(db, `prayers/${prayerId}`), { text });
}

export async function deletePrayer(prayerId) {
  await remove(ref(db, `prayers/${prayerId}`));
}

// 🙏 함께 기도해요 토글
export async function togglePrayed(prayerId, memberId, on) {
  await set(ref(db, `prayers/${prayerId}/prayedBy/${memberId}`), on ? true : null);
}

// 🌱 응답됐어요 토글 (모임 모드의 '지난주 기도 돌아보기'에서 사용)
export async function toggleAnswered(prayerId, on) {
  await update(ref(db, `prayers/${prayerId}`), {
    answered: on ? true : null,
    answeredAt: on ? Date.now() : null,
  });
}
