import { DailyFortune } from "@/types";
import { createRandom, dateSeed } from "./seed-random";

const luckyColors = [
  "レッド", "ブルー", "グリーン", "イエロー", "ピンク", "パープル",
  "オレンジ", "ゴールド", "シルバー", "ホワイト", "ネイビー", "ラベンダー",
  "コーラル", "ミント", "ベージュ", "ターコイズ",
];

const luckyItems = [
  "花束", "手鏡", "アロマキャンドル", "天然石ブレスレット", "ハンカチ",
  "小さなぬいぐるみ", "ポストカード", "リップクリーム", "カフェラテ",
  "チョコレート", "ノート", "お守り", "ヘアアクセサリー", "紅茶",
  "フルーツ", "写真集", "入浴剤", "ドライフラワー",
];

const luckyDirections = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];

const messages: string[][] = [
  // overall 1
  ["少し控えめな一日。無理せず自分のペースで過ごしましょう。", "休息を大切にする日。エネルギーを蓄えて明日に備えて。"],
  // overall 2
  ["穏やかな流れの一日。小さな幸せを見つけてみて。", "コツコツと積み重ねることが吉。焦らずに。"],
  // overall 3
  ["安定した運気。いつも通りの行動が良い結果を生みます。", "バランスの良い一日。普段の努力が実を結びそう。"],
  // overall 4
  ["良い流れが来ています！積極的に行動してみて。", "チャンスの予感。アンテナを張っておきましょう。"],
  // overall 5
  ["最高の一日！何をやっても上手くいきそう。思い切って挑戦を！", "幸運に恵まれる日。大きな一歩を踏み出して。"],
];

const advices: string[][] = [
  ["深呼吸してリラックスすることを心がけて。", "温かい飲み物で心を落ち着けましょう。"],
  ["身近な人への感謝を伝えてみましょう。", "小さな目標を一つ達成してみて。"],
  ["新しい情報にアンテナを張ってみて。", "いつもと違う道を歩いてみるのもおすすめ。"],
  ["人との繋がりを大切に。良い出会いの予感。", "自分磨きに時間を使うと吉。"],
  ["直感を信じて行動して！今日は何でもできる日。", "思い切った決断が幸運を呼びます。"],
];

export function generateDailyFortune(zodiacId: string, date: Date): DailyFortune {
  const seed = dateSeed(date, zodiacId);
  const rng = createRandom(seed);

  const overall = rng.int(1, 5);
  const love = rng.int(1, 5);
  const money = rng.int(1, 5);
  const work = rng.int(1, 5);
  const health = rng.int(1, 5);

  return {
    overall,
    love,
    money,
    work,
    health,
    luckyColor: rng.pick(luckyColors),
    luckyItem: rng.pick(luckyItems),
    luckyDirection: rng.pick(luckyDirections),
    message: rng.pick(messages[overall - 1]),
    advice: rng.pick(advices[overall - 1]),
  };
}
