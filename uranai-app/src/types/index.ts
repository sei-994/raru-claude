export interface TarotCard {
  id: number;
  nameJa: string;
  nameEn: string;
  symbol: string;
  uprightKeywords: string[];
  reversedKeywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  advice: string;
  element: string;
}

export interface ZodiacSign {
  id: string;
  nameJa: string;
  symbol: string;
  dateRange: string;
  element: string;
  traits: string[];
}

export interface DailyFortune {
  overall: number;
  love: number;
  money: number;
  work: number;
  health: number;
  luckyColor: string;
  luckyItem: string;
  luckyDirection: string;
  message: string;
  advice: string;
}

export interface NumerologyProfile {
  lifePathNumber: number;
  title: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  love: string;
  career: string;
  compatibility: number[];
}

export interface CompatibilityResult {
  score: number;
  overall: string;
  love: string;
  work: string;
  advice: string;
}
