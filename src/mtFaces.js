// 인물 맞추기 사진 목록 — src/assets/mt-faces/{카테고리}/ 폴더의 이미지를 자동 수집.
// ⚠️ 파일명이 곧 정답 이름, 폴더명이 곧 카테고리! (국내/해외/캐릭터 등 자유롭게)
// 사진을 넣거나 옮긴 뒤에는 빌드+배포 필요.
const catModules = import.meta.glob(
  "./assets/mt-faces/*/*.{png,jpg,jpeg,webp,gif}",
  { eager: true, query: "?url", import: "default" }
);
// 폴더 없이 바로 넣은 사진도 허용 (카테고리 "기타")
const rootModules = import.meta.glob(
  "./assets/mt-faces/*.{png,jpg,jpeg,webp,gif}",
  { eager: true, query: "?url", import: "default" }
);

function nameOf(path) {
  return decodeURIComponent(path.split("/").pop().replace(/\.[^.]+$/, ""));
}

export const FACES = [
  ...Object.entries(catModules).map(([path, url]) => {
    const parts = path.split("/");
    return { name: nameOf(path), category: parts[parts.length - 2], url };
  }),
  ...Object.entries(rootModules).map(([path, url]) => ({
    name: nameOf(path),
    category: "기타",
    url,
  })),
];

export const FACE_MAP = Object.fromEntries(FACES.map((f) => [f.name, f]));

export function categoryCounts() {
  const counts = {};
  for (const f of FACES) counts[f.category] = (counts[f.category] || 0) + 1;
  return counts;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 카테고리를 모든 판(세그먼트)에 골고루 분배한 출제 순서 생성.
// 큰 카테고리부터 스네이크(0→3, 3→0) 순서로 나눠 담아 판별 구성이 비슷해지게.
export function buildBalancedOrder(segCount, segSize) {
  const need = segCount * segSize;
  const byCat = {};
  for (const f of FACES) (byCat[f.category] = byCat[f.category] || []).push(f.name);
  let lists = Object.values(byCat).map(shuffle);

  // 사진이 필요량보다 많으면 카테고리 비율대로 추림
  if (FACES.length > need) {
    const takes = lists.map((l) =>
      Math.floor((l.length * need) / FACES.length)
    );
    let rest = need - takes.reduce((a, b) => a + b, 0);
    for (let i = 0; rest > 0; i = (i + 1) % lists.length) {
      if (takes[i] < lists[i].length) {
        takes[i]++;
        rest--;
      }
    }
    lists = lists.map((l, i) => l.slice(0, takes[i]));
  }

  lists.sort((a, b) => b.length - a.length);
  const buckets = Array.from({ length: segCount }, () => []);
  const snakeAt = (s) => {
    const p = s % (segCount * 2);
    return p < segCount ? p : segCount * 2 - 1 - p;
  };
  let step = 0;
  for (const list of lists) {
    for (const name of list) {
      let b = snakeAt(step);
      let guard = 0;
      while (buckets[b].length >= segSize && guard++ <= segCount * 2) {
        step++;
        b = snakeAt(step);
      }
      if (buckets[b].length >= segSize) break; // 모든 판이 찼음
      buckets[b].push(name);
      step++;
    }
  }
  return buckets.flatMap((bucket) => shuffle(bucket));
}
