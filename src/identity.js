// "내가 누구인지" — 로그인 없이 프로필 선택 방식 (신뢰 기반, 소규모 사랑방용)
const ME_KEY = "joel-member-id";

export function getMyId() {
  return localStorage.getItem(ME_KEY);
}

export function setMyId(memberId) {
  localStorage.setItem(ME_KEY, memberId);
}

export function clearMyId() {
  localStorage.removeItem(ME_KEY);
}
