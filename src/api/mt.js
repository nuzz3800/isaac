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
// 세그먼트(판) 단위 진행: sequence가 판 순서 (예: [t1,t2,t1,t2] = 팀당 2판 교대),
// order는 segSize × 판 수 만큼의 사진. correct는 판별 맞춘 개수 배열.

export async function startFaceGame(order, segSize, sequence) {
  await set(ref(db, "mt/faceGame"), {
    status: "playing",
    order,
    segSize,
    sequence,
    pos: 0,
    correct: sequence.map(() => 0),
  });
}

export function faceSegOf(g, pos = g.pos) {
  return Math.floor(pos / g.segSize);
}

export function faceTeamOf(g, pos = g.pos) {
  return g.sequence[faceSegOf(g, pos)];
}

// 지금 세그먼트가 그 팀의 몇 판째인지 (1부터)
export function faceRoundOf(g, pos = g.pos) {
  const si = faceSegOf(g, pos);
  return g.sequence.slice(0, si + 1).filter((t) => t === g.sequence[si]).length;
}

export function faceTeamTotal(g, team) {
  return g.sequence.reduce(
    (sum, t, i) => (t === team ? sum + (g.correct?.[i] || 0) : sum),
    0
  );
}

export async function judgeFace(mt, isCorrect) {
  const g = mt.faceGame;
  const si = faceSegOf(g);
  const next = g.pos + 1;
  const updates = { pos: next };
  if (isCorrect) updates[`correct/${si}`] = (g.correct?.[si] || 0) + 1;
  if (next >= g.order.length) updates.status = "done";
  else if (next % g.segSize === 0) updates.awaitSwitch = true;
  await update(ref(db, "mt/faceGame"), updates);
}

export async function ackTeamSwitch() {
  await update(ref(db, "mt/faceGame"), { awaitSwitch: null });
}

// 맞춘 개수 합계 × 배율을 팀 포인트에 더하고 게임 종료
export async function applyFacePoints(mt, multiplier) {
  const g = mt.faceGame;
  await update(ref(db, "mt"), {
    "teams/t1/points":
      (mt.teams.t1.points || 0) + faceTeamTotal(g, "t1") * multiplier,
    "teams/t2/points":
      (mt.teams.t2.points || 0) + faceTeamTotal(g, "t2") * multiplier,
    faceGame: null,
  });
}

export async function cancelFaceGame() {
  await remove(ref(db, "mt/faceGame"));
}

// ── 이 색 누구게? (단순화 캐릭터 맞추기) ─────────────────────
// 두 팀 동시 대결: 단순화 그림 → 정답 공개 → 맞춘 팀 기록.
// mt/simpleGame: { status, order[이름], pos, revealed, correct: {t1, t2} }

export async function startSimpleGame(order) {
  await set(ref(db, "mt/simpleGame"), {
    status: "playing",
    order,
    pos: 0,
    revealed: false,
    correct: { t1: 0, t2: 0 },
  });
}

export async function revealSimple() {
  await update(ref(db, "mt/simpleGame"), { revealed: true });
}

// team: "t1" | "t2" | null(아무도 못 맞힘) → 기록 후 다음 문제로
export async function scoreSimple(mt, team) {
  const g = mt.simpleGame;
  const next = g.pos + 1;
  const updates = { pos: next, revealed: false };
  if (team) updates[`correct/${team}`] = (g.correct?.[team] || 0) + 1;
  if (next >= g.order.length) updates.status = "done";
  await update(ref(db, "mt/simpleGame"), updates);
}

export async function applySimplePoints(mt, multiplier) {
  const g = mt.simpleGame;
  await update(ref(db, "mt"), {
    "teams/t1/points":
      (mt.teams.t1.points || 0) + (g.correct?.t1 || 0) * multiplier,
    "teams/t2/points":
      (mt.teams.t2.points || 0) + (g.correct?.t2 || 0) * multiplier,
    simpleGame: null,
  });
}

export async function cancelSimpleGame() {
  await remove(ref(db, "mt/simpleGame"));
}
