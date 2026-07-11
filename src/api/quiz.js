import { useEffect, useState } from "react";
import { ref, get, set, update, remove, onValue } from "firebase/database";
import { db } from "../firebase";
import { QUESTIONS } from "../questions";

// quiz (싱글턴): 가원 문답으로 만드는 '누구일까요?' 퀴즈.
// 모임 모드처럼 한 방에 하나만 진행, 프로필로 식별하므로 방 코드 불필요.
// {
//   status: "lobby" | "playing" | "done",
//   hostId, startedAt,
//   questions: [{ targetId, questionId, answer, choices: [memberId] }],
//   currentIndex, phase: "voting" | "revealed",
//   players: { memberId: { score, joinedAt } },
//   votes: { [roundIndex]: { [voterId]: choiceMemberId } },
// }

const MAX_ROUNDS = 10;
const MAX_PER_TARGET = 3; // 한 사람에게 문제가 몰리지 않게

export function useQuiz() {
  const [quiz, setQuiz] = useState(undefined); // undefined=로딩, null=없음
  useEffect(
    () => onValue(ref(db, "quiz"), (s) => setQuiz(s.val() ?? null)),
    []
  );
  return quiz;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 문답 → 문제 풀. 같은 질문에 같은 답을 한 가원이 또 있으면
// 정답이 애매해지므로 그 문답은 출제에서 뺀다.
export function buildQuestionPool(members) {
  const pool = [];
  for (const [memberId, m] of Object.entries(members)) {
    for (const q of QUESTIONS) {
      const answer = m.answers?.[q.id];
      if (!answer) continue;
      const ambiguous = Object.entries(members).some(
        ([otherId, other]) =>
          otherId !== memberId &&
          (other.answers?.[q.id] || "").trim().toLowerCase() ===
            answer.trim().toLowerCase()
      );
      if (!ambiguous) pool.push({ targetId: memberId, questionId: q.id, answer });
    }
  }
  return pool;
}

export function pickQuestions(members) {
  const memberIds = Object.keys(members);
  const picked = [];
  const perTarget = {};
  for (const item of shuffle(buildQuestionPool(members))) {
    if (picked.length >= MAX_ROUNDS) break;
    if ((perTarget[item.targetId] || 0) >= MAX_PER_TARGET) continue;
    perTarget[item.targetId] = (perTarget[item.targetId] || 0) + 1;
    picked.push({
      ...item,
      choices: shuffle([
        item.targetId,
        ...shuffle(memberIds.filter((id) => id !== item.targetId)).slice(0, 3),
      ]),
    });
  }
  return picked;
}

export async function openLobby(myId) {
  await set(ref(db, "quiz"), {
    status: "lobby",
    hostId: myId,
    startedAt: Date.now(),
    players: { [myId]: { score: 0, joinedAt: Date.now() } },
  });
}

export async function joinQuiz(memberId) {
  await set(ref(db, `quiz/players/${memberId}`), {
    score: 0,
    joinedAt: Date.now(),
  });
}

export async function startQuiz(members) {
  await update(ref(db, "quiz"), {
    status: "playing",
    questions: pickQuestions(members),
    currentIndex: 0,
    phase: "voting",
    votes: null,
  });
}

export async function castQuizVote(roundIndex, voterId, choiceId) {
  await set(ref(db, `quiz/votes/${roundIndex}/${voterId}`), choiceId);
}

// 정답 공개 + 채점 (진행자만 호출, 공개 직전 서버에서 재조회)
export async function revealQuizRound() {
  const snap = await get(ref(db, "quiz"));
  const quiz = snap.val();
  if (!quiz || quiz.phase === "revealed") return;
  const q = quiz.questions[quiz.currentIndex];
  const votes = quiz.votes?.[quiz.currentIndex] || {};
  const updates = { phase: "revealed" };
  for (const [voterId, choiceId] of Object.entries(votes)) {
    if (voterId === q.targetId) continue;
    if (choiceId === q.targetId) {
      updates[`players/${voterId}/score`] =
        (quiz.players?.[voterId]?.score || 0) + 1;
    }
  }
  await update(ref(db, "quiz"), updates);
}

export async function nextQuizRound(quiz) {
  const next = quiz.currentIndex + 1;
  if (next >= quiz.questions.length) {
    await update(ref(db, "quiz"), { status: "done" });
  } else {
    await update(ref(db, "quiz"), { currentIndex: next, phase: "voting" });
  }
}

// 같은 참가자로 새 문제 세트 한 판 더
export async function replayQuiz(quiz, members) {
  const updates = {
    status: "playing",
    questions: pickQuestions(members),
    currentIndex: 0,
    phase: "voting",
    votes: null,
  };
  for (const id of Object.keys(quiz.players || {})) {
    updates[`players/${id}/score`] = 0;
  }
  await update(ref(db, "quiz"), updates);
}

export async function closeQuiz() {
  await remove(ref(db, "quiz"));
}
