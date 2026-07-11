import { useEffect, useState } from "react";
import { ref, push, set, remove, onValue } from "firebase/database";
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

export async function deleteEvent(eventId) {
  await remove(ref(db, `events/${eventId}`));
}

export async function setRsvp(eventId, memberId, answer) {
  await set(ref(db, `events/${eventId}/rsvp/${memberId}`), answer);
}
