// 날짜 유틸 — 전부 로컬 시간 기준 (한국에서만 쓰는 사이트)
const KDAY = ["일", "월", "화", "수", "목", "금", "토"];
const NTH = ["첫", "둘", "셋", "넷", "다섯"];

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO() {
  return toISO(new Date());
}

// 그 날짜가 속한 주의 일요일 (교회 기준 한 주의 시작)
export function weekKeyOf(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return toISO(d);
}

export function weekLabel(weekKey) {
  const d = new Date(`${weekKey}T00:00:00`);
  const nth = Math.ceil(d.getDate() / 7);
  return `${d.getMonth() + 1}월 ${NTH[nth - 1] || nth}째 주`;
}

export function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${KDAY[d.getDay()]})`;
}

// 오늘부터 며칠 남았는지. 0=오늘, 음수=지남
export function daysUntil(iso) {
  const today = new Date(`${todayISO()}T00:00:00`);
  const target = new Date(`${iso}T00:00:00`);
  return Math.round((target - today) / 86400000);
}

export function ddayLabel(iso) {
  const n = daysUntil(iso);
  if (n === 0) return "오늘!";
  if (n === 1) return "내일";
  if (n > 0) return `D-${n}`;
  return "지남";
}

// 다음 생일까지 남은 날짜와 날짜 문자열
export function nextBirthday(month, day) {
  const now = new Date(`${todayISO()}T00:00:00`);
  let d = new Date(now.getFullYear(), month - 1, day);
  if (d < now) d = new Date(now.getFullYear() + 1, month - 1, day);
  return { iso: toISO(d), days: Math.round((d - now) / 86400000) };
}
