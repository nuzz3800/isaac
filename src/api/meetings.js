import { useEffect, useState } from "react";
import { ref, set, update, remove, push, onValue } from "firebase/database";
import { db } from "../firebase";
import { todayISO } from "../dates";

// meeting (싱글턴): { date, startedBy, startedAt, step, reviewIndex }
// — 진행 중인 모임은 하나뿐이라는 전제 (한 사랑방이니까)
// 끝난 모임은 meetingLog/{id}에 요약 보관 → 나중에 '사랑방 역사' 재료

export function useMeeting() {
  const [meeting, setMeeting] = useState(undefined); // undefined=로딩, null=없음
  useEffect(
    () => onValue(ref(db, "meeting"), (s) => setMeeting(s.val() ?? null)),
    []
  );
  return meeting;
}

export async function startMeeting(memberId) {
  await set(ref(db, "meeting"), {
    date: todayISO(),
    startedBy: memberId,
    startedAt: Date.now(),
    step: 0,
    reviewIndex: 0,
  });
}

export async function updateMeeting(data) {
  await update(ref(db, "meeting"), data);
}

export async function endMeeting(meeting, summary) {
  await set(push(ref(db, "meetingLog")), {
    ...meeting,
    ...summary,
    endedAt: Date.now(),
  });
  await remove(ref(db, "meeting"));
}
