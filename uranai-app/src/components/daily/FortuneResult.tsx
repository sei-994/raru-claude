"use client";

import { DailyFortune } from "@/types";
import { zodiacSigns } from "@/lib/zodiac-data";
import LuckMeter from "@/components/shared/LuckMeter";
import ShareButtons from "@/components/shared/ShareButtons";
import AdBanner from "@/components/shared/AdBanner";

interface FortuneResultProps {
  fortune: DailyFortune;
  zodiacId: string;
}

export default function FortuneResult({ fortune, zodiacId }: FortuneResultProps) {
  const sign = zodiacSigns.find((s) => s.id === zodiacId);
  if (!sign) return null;

  const today = new Date();
  const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;

  const shareText = `【${dateStr} ${sign.nameJa}の運勢】\n総合運: ${"★".repeat(fortune.overall)}${"☆".repeat(5 - fortune.overall)}\nラッキーカラー: ${fortune.luckyColor}\n\n星詠み占いで今日の運勢をチェック！`;

  return (
    <div className="animate-fade-in-up mx-auto max-w-lg">
      {/* Header */}
      <div className="mb-6 text-center">
        <span className="text-4xl">{sign.symbol}</span>
        <h2 className="mt-2 text-lg font-bold text-gold-400">
          {sign.nameJa}の今日の運勢
        </h2>
        <p className="text-xs text-foreground/40">{dateStr}</p>
      </div>

      {/* Message */}
      <div className="mb-6 rounded-2xl border border-mystic-700/30 bg-surface/80 p-5 backdrop-blur-sm">
        <p className="text-center text-sm leading-relaxed text-foreground/80">
          {fortune.message}
        </p>
      </div>

      {/* Meters */}
      <div className="mb-6 space-y-3 rounded-2xl border border-mystic-700/30 bg-surface/80 p-5 backdrop-blur-sm">
        <LuckMeter label="総合運" value={fortune.overall} />
        <LuckMeter label="恋愛運" value={fortune.love} color="bg-pink-400" />
        <LuckMeter label="金運" value={fortune.money} color="bg-yellow-400" />
        <LuckMeter label="仕事運" value={fortune.work} color="bg-blue-400" />
        <LuckMeter label="健康運" value={fortune.health} color="bg-green-400" />
      </div>

      {/* Lucky items */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-mystic-700/30 bg-surface/80 p-3 text-center">
          <p className="text-[10px] text-foreground/40">ラッキーカラー</p>
          <p className="mt-1 text-sm font-bold text-gold-400">{fortune.luckyColor}</p>
        </div>
        <div className="rounded-xl border border-mystic-700/30 bg-surface/80 p-3 text-center">
          <p className="text-[10px] text-foreground/40">ラッキーアイテム</p>
          <p className="mt-1 text-sm font-bold text-gold-400">{fortune.luckyItem}</p>
        </div>
        <div className="rounded-xl border border-mystic-700/30 bg-surface/80 p-3 text-center">
          <p className="text-[10px] text-foreground/40">ラッキー方角</p>
          <p className="mt-1 text-sm font-bold text-gold-400">{fortune.luckyDirection}</p>
        </div>
      </div>

      {/* Advice */}
      <div className="mb-6 rounded-lg bg-gold-500/5 p-4">
        <p className="text-center text-xs text-gold-400">💡 {fortune.advice}</p>
      </div>

      <AdBanner className="mb-6" />

      {/* Share */}
      <div className="mb-6">
        <p className="mb-3 text-center text-xs text-foreground/40">結果をシェアする</p>
        <ShareButtons text={shareText} />
      </div>
    </div>
  );
}
