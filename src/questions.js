// 프로필 문답 은행 — 답변은 members/{id}/answers/{questionId}에 저장.
// 이 문답들이 '누구일까요?' 퀴즈의 문제 재료가 된다:
// "Q. {label}에 '{답변}'이라고 답한 가원은?"
// 추가는 자유, id 변경/삭제는 기존 답변이 고아가 되니 주의.
export const QUESTIONS = [
  // 나의 기본기
  { id: "hometown", label: "어디 출신이에요?", ph: "예: 부산 토박이" },
  { id: "job", label: "요즘 뭐 하며 지내요?", ph: "일, 전공, 준비 중인 것..." },
  { id: "hobby", label: "취미가 뭐예요?", ph: "" },
  { id: "morning_night", label: "아침형? 저녁형?", ph: "예: 못 말리는 저녁형" },

  // 먹는 얘기 (최고의 아이스브레이커)
  { id: "food_love", label: "최애 음식은?", ph: "" },
  { id: "food_hate", label: "이건 진짜 못 먹어요", ph: "예: 오이..." },
  { id: "stress", label: "스트레스 풀 때 하는 것은?", ph: "" },

  // 의외의 모습
  { id: "talent", label: "숨은 재능이나 특기는?", ph: "사소한 것도 좋아요" },
  { id: "proud", label: "소소한 자랑 하나!", ph: "" },
  { id: "habit", label: "나만의 습관이나 버릇은?", ph: "" },
  { id: "fear", label: "이건 진짜 무서워요", ph: "예: 벌레, 높은 곳..." },
  { id: "recent_into", label: "요즘 푹 빠져있는 것은?", ph: "" },

  // 취향
  { id: "karaoke", label: "노래방 애창곡은?", ph: "" },
  { id: "movie", label: "인생 영화나 드라마는?", ph: "" },
  { id: "travel", label: "지금 당장 떠난다면 어디로?", ph: "" },
  { id: "gift", label: "받고 싶은 선물은?", ph: "" },

  // 꿈과 상상
  { id: "dream", label: "어릴 적 꿈은?", ph: "" },
  { id: "bucket", label: "버킷리스트 하나는?", ph: "" },
  { id: "superpower", label: "초능력 하나를 가진다면?", ph: "" },

  // 신앙
  { id: "hymn", label: "은혜받는 찬양은?", ph: "" },
  { id: "bible", label: "좋아하는 성경 인물은?", ph: "" },
];

export function answeredCount(member) {
  return Object.keys(member?.answers || {}).length;
}
