import { useEffect, useState } from "react";
import { ref, set, update, remove, onValue } from "firebase/database";
import { db } from "../firebase";

// MT 스페셜 — 두 팀 점수판 + MT 게임들.
// 오프라인 게임 점수도 반영해야 하므로 포인트는 언제든 수동 수정 가능.
// mt: {
//   createdAt,
//   teams: { t1: {name, points}, t2: {name, points} },
//   faceGame?: {  // 인물 맞추기 진행 상태 (새로고침 복구용)
//     status: "playing"|"done", order: [이름...], perTeam,
//     pos, correct: {t1, t2}, awaitSwitch?: true
//   }
// }

export function useMT() {
  const [mt, setMt] = useState(undefined); // undefined=로딩, null=없음
  useEffect(() => onValue(ref(db, "mt"), (s) => setMt(s.val() ?? null)), []);
  return mt;
}

export async function setupMT(name1, name2) {
  await set(ref(db, "mt"), {
    createdAt: Date.now(),
    teams: {
      t1: { name: name1, points: 0 },
      t2: { name: name2, points: 0 },
    },
  });
}

export async function renameTeam(team, name) {
  await update(ref(db, `mt/teams/${team}`), { name });
}

export async function setTeamPoints(team, points) {
  await update(ref(db, `mt/teams/${team}`), { points });
}

export async function addTeamPoints(mt, team, delta) {
  await setTeamPoints(team, (mt.teams[team].points || 0) + delta);
}

export async function resetMT() {
  await remove(ref(db, "mt"));
}

// ── 인물 맞추기 ──────────────────────────────────────────────
// order 앞 perTeam장은 1팀, 뒤 perTeam장은 2팀 몫

export async function startFaceGame(order, perTeam) {
  await set(ref(db, "mt/faceGame"), {
    status: "playing",
    order,
    perTeam,
    pos: 0,
    correct: { t1: 0, t2: 0 },
  });
}

export async function judgeFace(mt, isCorrect) {
  const g = mt.faceGame;
  const team = g.pos < g.perTeam ? "t1" : "t2";
  const next = g.pos + 1;
  const updates = { pos: next };
  if (isCorrect) updates[`correct/${team}`] = (g.correct?.[team] || 0) + 1;
  if (next >= g.order.length) updates.status = "done";
  else if (next === g.perTeam) updates.awaitSwitch = true;
  await update(ref(db, "mt/faceGame"), updates);
}

export async function ackTeamSwitch() {
  await update(ref(db, "mt/faceGame"), { awaitSwitch: null });
}

// 맞춘 개수 × 배율을 팀 포인트에 더하고 게임 종료
export async function applyFacePoints(mt, multiplier) {
  const g = mt.faceGame;
  await update(ref(db, "mt"), {
    "teams/t1/points":
      (mt.teams.t1.points || 0) + (g.correct?.t1 || 0) * multiplier,
    "teams/t2/points":
      (mt.teams.t2.points || 0) + (g.correct?.t2 || 0) * multiplier,
    faceGame: null,
  });
}

export async function cancelFaceGame() {
  await remove(ref(db, "mt/faceGame"));
}
