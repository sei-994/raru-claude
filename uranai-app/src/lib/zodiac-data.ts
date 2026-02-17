import { ZodiacSign } from "@/types";

export const zodiacSigns: ZodiacSign[] = [
  { id: "aries", nameJa: "牡羊座", symbol: "♈", dateRange: "3/21 - 4/19", element: "火", traits: ["情熱的", "行動力", "リーダー"] },
  { id: "taurus", nameJa: "牡牛座", symbol: "♉", dateRange: "4/20 - 5/20", element: "地", traits: ["安定", "忍耐", "感性"] },
  { id: "gemini", nameJa: "双子座", symbol: "♊", dateRange: "5/21 - 6/21", element: "風", traits: ["知性", "社交性", "好奇心"] },
  { id: "cancer", nameJa: "蟹座", symbol: "♋", dateRange: "6/22 - 7/22", element: "水", traits: ["感受性", "包容力", "家庭的"] },
  { id: "leo", nameJa: "獅子座", symbol: "♌", dateRange: "7/23 - 8/22", element: "火", traits: ["自信", "創造性", "華やか"] },
  { id: "virgo", nameJa: "乙女座", symbol: "♍", dateRange: "8/23 - 9/22", element: "地", traits: ["分析力", "繊細", "奉仕"] },
  { id: "libra", nameJa: "天秤座", symbol: "♎", dateRange: "9/23 - 10/23", element: "風", traits: ["調和", "美的感覚", "社交的"] },
  { id: "scorpio", nameJa: "蠍座", symbol: "♏", dateRange: "10/24 - 11/22", element: "水", traits: ["洞察力", "情熱", "探究心"] },
  { id: "sagittarius", nameJa: "射手座", symbol: "♐", dateRange: "11/23 - 12/21", element: "火", traits: ["自由", "冒険", "哲学"] },
  { id: "capricorn", nameJa: "山羊座", symbol: "♑", dateRange: "12/22 - 1/19", element: "地", traits: ["野心", "責任感", "堅実"] },
  { id: "aquarius", nameJa: "水瓶座", symbol: "♒", dateRange: "1/20 - 2/18", element: "風", traits: ["独創性", "博愛", "改革"] },
  { id: "pisces", nameJa: "魚座", symbol: "♓", dateRange: "2/19 - 3/20", element: "水", traits: ["共感力", "芸術性", "直感"] },
];
