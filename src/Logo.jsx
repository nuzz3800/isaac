// 이삭교회 로고 — SVG 근사 재현 (핑크+블루 십자 바람개비).
// 실제 로고 파일(public/logo.png)이 생기면 <img>로 교체할 것.
export default function ChurchLogo({ size = 64 }) {
  const arm = (deg, color) => (
    <rect
      key={deg}
      x="45"
      y="5"
      width="18"
      height="49"
      rx="9"
      fill={color}
      transform={`rotate(${deg} 54 54)`}
    />
  );
  const PINK = "#E4136B";
  const BLUE = "#1E4396";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 108 108"
      role="img"
      aria-label="이삭교회"
    >
      {arm(15, PINK)}
      {arm(105, BLUE)}
      {arm(195, BLUE)}
      {arm(285, PINK)}
    </svg>
  );
}
