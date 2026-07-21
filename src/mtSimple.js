// '이 색 누구게?' (단순화 캐릭터 맞추기) 사진 목록 — src/assets/mt-simple/.
// ⚠️ 파일 짝 규칙: "루피.png"(단순화 그림) + "루피2.png"(정답 사진).
// 파일명(2 제외)이 곧 정답 이름. 사진을 넣은 뒤에는 빌드+배포 필요.
const modules = import.meta.glob(
  "./assets/mt-simple/*.{png,jpg,jpeg,webp,gif}",
  { eager: true, query: "?url", import: "default" }
);

const files = {};
for (const [path, url] of Object.entries(modules)) {
  const name = decodeURIComponent(
    path.split("/").pop().replace(/\.[^.]+$/, "")
  );
  files[name] = url;
}

export const SIMPLE_PAIRS = [];
export const SIMPLE_MISSING = []; // 짝이 안 맞는 파일 (안내용)

for (const name of Object.keys(files)) {
  if (name.endsWith("2")) {
    if (!files[name.slice(0, -1)])
      SIMPLE_MISSING.push(`${name} (단순화 그림 없음)`);
    continue;
  }
  if (files[`${name}2`]) {
    SIMPLE_PAIRS.push({
      name,
      quizUrl: files[name],
      answerUrl: files[`${name}2`],
    });
  } else {
    SIMPLE_MISSING.push(`${name} (정답 사진 없음)`);
  }
}

export const SIMPLE_MAP = Object.fromEntries(
  SIMPLE_PAIRS.map((p) => [p.name, p])
);
