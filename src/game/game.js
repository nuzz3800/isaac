import { ref, get, set, update, push, child } from "firebase/database";
import { db } from "../firebase";

// ── 세션 (새로고침/화면잠금 후 같은 플레이어로 복귀하는 핵심 장치) ──
const SESSION_KEY = "liar-intro-session";

export function saveSession(roomCode, playerId) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode, playerId }));
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ── 방 생성/입장 ──────────────────────────────────────────────

export async function createRoom(nickname) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const roomCode = String(Math.floor(1000 + Math.random() * 9000));
    const roomRef = ref(db, `rooms/${roomCode}`);
    const snap = await get(roomRef);
    if (snap.exists()) continue;

    const playerId = push(child(roomRef, "players")).key;
    await set(roomRef, {
      status: "lobby",
      hostId: playerId,
      createdAt: Date.now(),
      players: {
        [playerId]: { nickname, joinedAt: Date.now(), score: 0, submitted: false },
      },
    });
    saveSession(roomCode, playerId);
    return { roomCode, playerId };
  }
  throw new Error("방 코드를 만들지 못했어요. 다시 시도해줘요.");
}

export async function joinRoom(roomCode, nickname) {
  const roomRef = ref(db, `rooms/${roomCode}`);
  const snap = await get(roomRef);
  if (!snap.exists()) throw new Error("존재하지 않는 방 코드예요.");

  const room = snap.val();
  if (room.status === "done") throw new Error("이미 끝난 방이에요.");

  // 게임 시작 후 입장은 관전자 — 다음 판("한 판 더")부터 정식 참가
  const spectator = room.status !== "lobby";
  const playerId = push(child(roomRef, "players")).key;
  await set(ref(db, `rooms/${roomCode}/players/${playerId}`), {
    nickname,
    joinedAt: Date.now(),
    score: 0,
    submitted: false,
    ...(spectator ? { spectator: true } : {}),
  });
  saveSession(roomCode, playerId);
  return { roomCode, playerId };
}

// ── 진행 (상태 전이는 방장 클라이언트만 호출 → 쓰기 경합 없음) ──

export async function startWriting(roomCode) {
  await update(ref(db, `rooms/${roomCode}`), { status: "writing" });
}

export async function submitKeywords(roomCode, playerId, keywords, lieIndex) {
  await update(ref(db, `rooms/${roomCode}/players/${playerId}`), {
    keywords,
    lieIndex,
    submitted: true,
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function startPlaying(roomCode, submittedPlayerIds) {
  await update(ref(db, `rooms/${roomCode}`), {
    status: "playing",
    turnOrder: shuffle(submittedPlayerIds),
    currentTurnIndex: 0,
    turnPhase: "voting",
  });
}

export async function castVote(roomCode, targetId, voterId, index, comment) {
  await set(ref(db, `rooms/${roomCode}/votes/${targetId}/${voterId}`), {
    index,
    ...(comment ? { comment } : {}),
    at: Date.now(),
  });
}

// 점수 규칙: 거짓말을 맞춘 사람 +1, 투표자 과반이 틀리면 발표자 +2
export function tallyTurn(room, targetId) {
  const target = room.players[targetId];
  const votes = room.votes?.[targetId] || {};
  const correctIds = [];
  let totalVoted = 0;
  for (const [voterId, vote] of Object.entries(votes)) {
    if (voterId === targetId || typeof vote?.index !== "number") continue;
    totalVoted++;
    if (vote.index === target.lieIndex) correctIds.push(voterId);
  }
  const presenterBonus = totalVoted > 0 && correctIds.length * 2 < totalVoted;
  return { correctIds, totalVoted, presenterBonus };
}

export async function revealAnswer(roomCode) {
  // 방장 화면에 아직 안 닿은 막판 투표가 빠지지 않게, 공개 직전 서버에서 다시 읽음
  const snap = await get(ref(db, `rooms/${roomCode}`));
  const room = snap.val();
  const targetId = room.turnOrder[room.currentTurnIndex];
  const { correctIds, presenterBonus } = tallyTurn(room, targetId);

  const updates = { turnPhase: "revealed" };
  for (const voterId of correctIds) {
    updates[`players/${voterId}/score`] = (room.players[voterId]?.score || 0) + 1;
  }
  if (presenterBonus) {
    updates[`players/${targetId}/score`] = (room.players[targetId]?.score || 0) + 2;
  }
  await update(ref(db, `rooms/${roomCode}`), updates);
}

export async function nextTurn(roomCode, room) {
  const next = room.currentTurnIndex + 1;
  if (next >= room.turnOrder.length) {
    await update(ref(db, `rooms/${roomCode}`), { status: "done" });
  } else {
    await update(ref(db, `rooms/${roomCode}`), {
      currentTurnIndex: next,
      turnPhase: "voting",
    });
  }
}

// 같은 멤버로 새 판 — 관전자도 정식 참가로 전환
export async function playAgain(roomCode, room) {
  const updates = {
    status: "writing",
    turnOrder: null,
    currentTurnIndex: null,
    turnPhase: null,
    votes: null,
  };
  for (const playerId of Object.keys(room.players || {})) {
    updates[`players/${playerId}/keywords`] = null;
    updates[`players/${playerId}/lieIndex`] = null;
    updates[`players/${playerId}/submitted`] = false;
    updates[`players/${playerId}/score`] = 0;
    updates[`players/${playerId}/spectator`] = null;
  }
  await update(ref(db, `rooms/${roomCode}`), updates);
}
