/**
 * 毎朝自動実行：12星座の今日の運勢をX(Twitter)に投稿するスクリプト
 *
 * 必要な環境変数:
 *   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
 *   SITE_URL (例: https://your-site.vercel.app)
 *
 * 実行: npx tsx scripts/post-daily-fortune.ts
 */

import crypto from "crypto";
import https from "https";

// ─── 占いロジック（サイトと同じ） ───

const zodiacSigns = [
  { id: "aries", nameJa: "牡羊座", symbol: "♈" },
  { id: "taurus", nameJa: "牡牛座", symbol: "♉" },
  { id: "gemini", nameJa: "双子座", symbol: "♊" },
  { id: "cancer", nameJa: "蟹座", symbol: "♋" },
  { id: "leo", nameJa: "獅子座", symbol: "♌" },
  { id: "virgo", nameJa: "乙女座", symbol: "♍" },
  { id: "libra", nameJa: "天秤座", symbol: "♎" },
  { id: "scorpio", nameJa: "蠍座", symbol: "♏" },
  { id: "sagittarius", nameJa: "射手座", symbol: "♐" },
  { id: "capricorn", nameJa: "山羊座", symbol: "♑" },
  { id: "aquarius", nameJa: "水瓶座", symbol: "♒" },
  { id: "pisces", nameJa: "魚座", symbol: "♓" },
];

function createRandom(seed: number) {
  let state = seed | 0;
  function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(arr: T[]): T => arr[Math.floor(next() * arr.length)],
  };
}

function dateSeed(date: Date, extra = ""): number {
  const str = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${extra}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

const luckyColors = [
  "レッド", "ブルー", "グリーン", "イエロー", "ピンク", "パープル",
  "オレンジ", "ゴールド", "シルバー", "ホワイト", "ネイビー", "ラベンダー",
];

const shortMessages = [
  ["控えめな一日。無理せずマイペースで🌿", "休息が大事な日。エネルギーを蓄えて💤"],
  ["穏やかな流れ。小さな幸せを見つけて🍀", "コツコツが吉。焦らずいこう✨"],
  ["安定した運気。いつも通りが一番◎", "バランスの良い一日🌈"],
  ["良い流れ！積極的に動いて吉🌟", "チャンスの予感✨アンテナを張って👀"],
  ["最高の一日！思い切って挑戦を🔥", "幸運に恵まれる日🌟大きな一歩を！"],
];

// ─── Twitter OAuth 1.0a (ライブラリ不要) ───

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string,
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");

  const baseString = `${method}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  return crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
}

function buildAuthHeader(
  method: string,
  url: string,
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessSecret: string,
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(method, url, oauthParams, apiSecret, accessSecret);
  oauthParams["oauth_signature"] = signature;

  const header = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${header}`;
}

function postTweet(text: string): Promise<void> {
  const apiKey = process.env.X_API_KEY!;
  const apiSecret = process.env.X_API_SECRET!;
  const accessToken = process.env.X_ACCESS_TOKEN!;
  const accessSecret = process.env.X_ACCESS_SECRET!;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error("Missing X API credentials in environment variables");
  }

  const url = "https://api.x.com/2/tweets";
  const body = JSON.stringify({ text });
  const authHeader = buildAuthHeader("POST", url, apiKey, apiSecret, accessToken, accessSecret);

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 201) {
            console.log("✅ Tweet posted successfully");
            resolve();
          } else {
            console.error(`❌ Failed (${res.statusCode}): ${data}`);
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ─── メイン処理 ───

async function main() {
  const today = new Date();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const siteUrl = process.env.SITE_URL || "https://your-site.vercel.app";

  // 今日のトップ3星座を選出
  const rankings = zodiacSigns.map((sign) => {
    const seed = dateSeed(today, sign.id);
    const rng = createRandom(seed);
    const overall = rng.int(1, 5);
    return { ...sign, overall, rng };
  });

  rankings.sort((a, b) => b.overall - a.overall);
  const top3 = rankings.slice(0, 3);

  // ランキング投稿
  const rankingTweet = [
    `✨ ${m}/${d} 今日の運勢ランキング ✨`,
    ``,
    `🥇 ${top3[0].symbol} ${top3[0].nameJa}`,
    `🥈 ${top3[1].symbol} ${top3[1].nameJa}`,
    `🥉 ${top3[2].symbol} ${top3[2].nameJa}`,
    ``,
    `あなたの星座の運勢は…？`,
    `👉 ${siteUrl}/daily`,
    ``,
    `#占い #今日の運勢 #星座占い`,
  ].join("\n");

  await postTweet(rankingTweet);

  // 少し待ってから個別投稿（1位の星座）
  await new Promise((r) => setTimeout(r, 3000));

  const best = top3[0];
  const seed = dateSeed(today, best.id);
  const rng = createRandom(seed);
  const overall = rng.int(1, 5);
  const color = rng.pick(luckyColors);
  const msg = rng.pick(shortMessages[overall - 1]);

  const detailTweet = [
    `${best.symbol} ${best.nameJa}さん、今日は最高の一日！`,
    ``,
    `総合運: ${"★".repeat(overall)}${"☆".repeat(5 - overall)}`,
    `ラッキーカラー: ${color}`,
    `${msg}`,
    ``,
    `詳しい運勢はこちら👇`,
    `${siteUrl}/daily`,
    ``,
    `#${best.nameJa} #占い #今日の運勢`,
  ].join("\n");

  await postTweet(detailTweet);

  console.log("🎉 All tweets posted!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
