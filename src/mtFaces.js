// 인물 맞추기 사진 목록 — src/assets/mt-faces/ 폴더의 이미지를 자동 수집.
// ⚠️ 파일명이 곧 정답 이름! (예: "아이유.jpg" → 정답 "아이유")
// 사진을 넣거나 뺀 뒤에는 빌드+배포 필요.
const modules = import.meta.glob("./assets/mt-faces/*.{png,jpg,jpeg,webp,gif}", {
  eager: true,
  query: "?url",
  import: "default",
});

export const FACES = Object.entries(modules).map(([path, url]) => ({
  name: decodeURIComponent(path.split("/").pop().replace(/\.[^.]+$/, "")),
  url,
}));

export const FACE_MAP = Object.fromEntries(FACES.map((f) => [f.name, f]));
