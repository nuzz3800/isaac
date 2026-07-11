import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// ── 여기만 바꾸면 됨 ─────────────────────────────────────────────
// Firebase 콘솔 → 프로젝트 설정(⚙️) → 내 앱 → SDK 설정 및 구성에서 복사.
// ⚠️ databaseURL이 복사한 값에 없으면 Realtime Database 페이지 상단의
//    주소(https://...firebasedatabase.app)를 직접 넣어야 함!
const firebaseConfig = {
  apiKey: "AIzaSyDdWO8VzE5etAcwfbTTbrZwMrqwWjqL_8E",
  authDomain: "issac-1abff.firebaseapp.com",
  databaseURL: "https://issac-1abff-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "issac-1abff",
  storageBucket: "issac-1abff.firebasestorage.app",
  messagingSenderId: "865185575806",
  appId: "1:865185575806:web:1752ecb3992257e2a3f92f",
  measurementId: "G-G0Q7S5GXS7",
};
// ────────────────────────────────────────────────────────────────

export const isConfigured = !firebaseConfig.apiKey.includes("여기에");

const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getDatabase(app) : null;
