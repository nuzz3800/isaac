import { useEffect, useState } from "react";
import { ref, push, set, update, remove, onValue } from "firebase/database";
import { db } from "../firebase";

// events/{eventId}: { title, date(ISO), time?, place?, note?, createdBy, createdAt,
//                     rsvp: { memberId: "yes" | "no" } }

export function useEvents() {
  const [events, setEvents] = useState(null);
  useEffect(
    () => onValue(ref(db, "events"), (s) => setEvents(s.val() || {})),
    []
  );
  return events;
}

export async function addEvent(data) {
  const r = push(ref(db, "events"));
  await set(r, { ...data, createdAt: Date.now() });
}

// 수정/삭제는 누구나 가능 (신뢰 기반 — 만든 사람이 없어도 계획 변경 가능해야 함)
export async function updateEvent(eventId, data) {
  await update(ref(db, `events/${eventId}`), data);
}

export async function deleteEvent(eventId) {
  await remove(ref(db, `events/${eventId}`));
}

export async function setRsvp(eventId, memberId, answer) {
  await set(ref(db, `events/${eventId}/rsvp/${memberId}`), answer);
}
