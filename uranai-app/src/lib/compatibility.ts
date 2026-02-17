import { CompatibilityResult } from "@/types";
import { createRandom } from "./seed-random";

// Base compatibility matrix for life path numbers
const compatibilityMatrix: Record<string, number> = {
  "1-1": 65, "1-2": 60, "1-3": 90, "1-4": 55, "1-5": 85, "1-6": 70, "1-7": 80, "1-8": 65, "1-9": 75,
  "2-2": 70, "2-3": 60, "2-4": 85, "2-5": 55, "2-6": 90, "2-7": 65, "2-8": 80, "2-9": 70,
  "3-3": 70, "3-4": 55, "3-5": 90, "3-6": 75, "3-7": 65, "3-8": 60, "3-9": 85,
  "4-4": 75, "4-5": 50, "4-6": 85, "4-7": 70, "4-8": 90, "4-9": 55,
  "5-5": 70, "5-6": 55, "5-7": 85, "5-8": 60, "5-9": 80,
  "6-6": 75, "6-7": 60, "6-8": 80, "6-9": 90,
  "7-7": 65, "7-8": 55, "7-9": 85,
  "8-8": 75, "8-9": 60,
  "9-9": 70,
};

function getBaseScore(n1: number, n2: number): number {
  // Normalize master numbers for matrix lookup
  const a = n1 > 9 ? Math.floor(n1 / 10) + (n1 % 10) : n1;
  const b = n2 > 9 ? Math.floor(n2 / 10) + (n2 % 10) : n2;
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return compatibilityMatrix[`${min}-${max}`] ?? 70;
}

const overallMessages: Record<string, string> = {
  high: "素晴らしい相性です！お互いの長所を引き出し合い、共に成長できる関係です。自然体でいられる心地よさを感じるでしょう。この出会いを大切にしてください。",
  medium: "バランスの取れた良い相性です。違いを認め合うことで、お互いに刺激を与え合える関係になれます。コミュニケーションを大切にすることで、より深い絆が育まれるでしょう。",
  low: "異なる価値観を持つ二人ですが、それは決してマイナスではありません。お互いにない部分を補い合えるパートナーシップです。理解し合う努力を続ければ、とても強い絆になります。",
};

const loveMessages: string[] = [
  "恋愛面では、お互いの気持ちを素直に伝えることが大切です。小さなサプライズが関係を輝かせます。",
  "ロマンチックな相性です。二人だけの特別な時間を作ることで、愛情がより深まるでしょう。",
  "穏やかで安定した愛情が育まれます。日常の中の小さな幸せを共有することが絆を強くします。",
  "情熱的な恋愛になりそうです。お互いの独立性を尊重しながら、一緒にいる時間を大切に。",
  "精神的なつながりが深い関係です。言葉にしなくても通じ合える、心地よい関係を築けるでしょう。",
];

const workMessages: string[] = [
  "仕事面では、お互いの強みを活かした役割分担がうまくいきます。プロジェクトを共にする際は、得意分野を任せ合いましょう。",
  "ビジネスパートナーとしても良い相性です。一人では思いつかないアイデアが、二人なら生まれるでしょう。",
  "異なる視点を持つ二人だからこそ、より完成度の高い成果を出せます。意見の違いを恐れないで。",
  "お互いに刺激を与え合える仕事仲間になれます。切磋琢磨することで、共に高みを目指せるでしょう。",
  "安定感のあるパートナーシップを築けます。信頼関係をベースに、着実に成果を上げていけるでしょう。",
];

const adviceMessages: string[] = [
  "お互いの時間を尊重し、適度な距離感を保つことが長続きの秘訣です。",
  "定期的に二人の将来について話し合う時間を作りましょう。",
  "感謝の気持ちを言葉にして伝えることを忘れずに。",
  "困った時はお互いに頼り合える、信頼関係を築いていきましょう。",
  "新しい体験を一緒にすることで、関係に新鮮さが生まれます。",
];

export function calculateCompatibility(
  lifePathA: number,
  lifePathB: number,
): CompatibilityResult {
  const base = getBaseScore(lifePathA, lifePathB);
  // Add some variation based on the combination
  const seed = lifePathA * 100 + lifePathB;
  const rng = createRandom(seed);
  const variation = rng.int(-5, 5);
  const score = Math.min(100, Math.max(30, base + variation));

  const level = score >= 80 ? "high" : score >= 60 ? "medium" : "low";

  return {
    score,
    overall: overallMessages[level],
    love: rng.pick(loveMessages),
    work: rng.pick(workMessages),
    advice: rng.pick(adviceMessages),
  };
}
