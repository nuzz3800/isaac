import { useEffect, useState } from "react";
import { ref, update, remove, push, set, onValue } from "firebase/database";
import { db } from "../firebase";

// 목표 빙고 — 반기마다 사랑방 **공동** 3x3 목표판 (개인별 아님).
// bingo/{periodKey}/cells/{0~8}: { text, targetDate?(ISO), done?, doneAt?,
//                                  comments/{id}: { memberId, text, createdAt } }
// periodKey는 "2026H2" 형식이라 내년/상반기로 자연 확장됨.

export function currentPeriod(date = new Date()) {
  return `${date.getFullYear()}${date.getMonth() < 6 ? "H1" : "H2"}`;
}

export function periodLabel(period) {
  return `${period.slice(0, 4)} ${period.endsWith("H1") ? "상반기" : "하반기"}`;
}

export function useBingoBoard(period) {
  const [board, setBoard] = useState(null); // null = 로딩
  useEffect(
    () =>
      onValue(ref(db, `bingo/${period}/cells`), (s) => setBoard(s.val() || {})),
    [period]
  );
  return board;
}

// update를 쓰는 이유: set이면 칸에 달린 댓글까지 날아감
export async function saveBingoCell(period, index, { text, targetDate }) {
  await update(ref(db, `bingo/${period}/cells/${index}`), {
    text,
    targetDate: targetDate || null,
  });
}

export async function toggleBingoDone(period, index, on) {
  await update(ref(db, `bingo/${period}/cells/${index}`), {
    done: on ? true : null,
    doneAt: on ? Date.now() : null,
  });
}

// 목표+댓글 전부 삭제
export async function clearBingoCell(period, index) {
  await remove(ref(db, `bingo/${period}/cells/${index}`));
}

export async function addBingoComment(period, index, memberId, text) {
  const r = push(ref(db, `bingo/${period}/cells/${index}/comments`));
  await set(r, { memberId, text, createdAt: Date.now() });
}

export async function deleteBingoComment(period, index, commentId) {
  await remove(ref(db, `bingo/${period}/cells/${index}/comments/${commentId}`));
}

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // 가로
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // 세로
  [0, 4, 8], [2, 4, 6], // 대각선
];

export function boardStats(board = {}) {
  const isDone = (i) => !!board[i]?.done;
  const filled = [...Array(9).keys()].filter((i) => board[i]?.text).length;
  const doneCount = [...Array(9).keys()].filter(isDone).length;
  const lines = LINES.filter((line) => line.every(isDone)).length;
  return { filled, doneCount, lines };
}
