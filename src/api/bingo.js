import { useEffect, useState } from "react";
import { ref, set, onValue } from "firebase/database";
import { db } from "../firebase";

// 목표 빙고 — 반기마다 가원별 3x3 목표판.
// bingo/{periodKey}/{memberId}/{cellIndex 0~8}: { text, done?: true, doneAt? }
// periodKey는 "2026H2" 형식이라 내년/상반기로 자연 확장됨.

export function currentPeriod(date = new Date()) {
  return `${date.getFullYear()}${date.getMonth() < 6 ? "H1" : "H2"}`;
}

export function periodLabel(period) {
  return `${period.slice(0, 4)} ${period.endsWith("H1") ? "상반기" : "하반기"}`;
}

export function useBingo(period) {
  const [boards, setBoards] = useState(null); // null = 로딩
  useEffect(
    () => onValue(ref(db, `bingo/${period}`), (s) => setBoards(s.val() || {})),
    [period]
  );
  return boards;
}

// text가 비면 칸 삭제
export async function saveBingoCell(period, memberId, index, text, done) {
  await set(
    ref(db, `bingo/${period}/${memberId}/${index}`),
    text
      ? { text, done: done ? true : null, doneAt: done ? Date.now() : null }
      : null
  );
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
