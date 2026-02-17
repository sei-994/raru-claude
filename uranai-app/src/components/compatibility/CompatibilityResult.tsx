"use client";

import { CompatibilityResult as CompatibilityResultType } from "@/types";
import ShareButtons from "@/components/shared/ShareButtons";
import AdBanner from "@/components/shared/AdBanner";

interface Props {
  result: CompatibilityResultType;
  numberA: number;
  numberB: number;
}

export default function CompatibilityResult({ result, numberA, numberB }: Props) {
  const shareText = `【相性診断】ライフパスナンバー ${numberA} × ${numberB} の相性は ${result.score}%！\n\n星詠み占いで相性を診断してみよう！`;

  return (
    <div className="animate-fade-in-up mx-auto max-w-lg space-y-6">
      {/* Score */}
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-mystic-500/30 bg-mystic-800">
            <span className="text-xl font-bold text-gold-400">{numberA}</span>
          </div>
          <span className="text-2xl text-pink-400">×</span>
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-mystic-500/30 bg-mystic-800">
            <span className="text-xl font-bold text-gold-400">{numberB}</span>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-shimmer text-4xl font-bold">{result.score}%</span>
          <p className="mt-1 text-xs text-foreground/40">相性スコア</p>
        </div>

        {/* Score bar */}
        <div className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-mystic-700/30">
          <div
            className="animate-fill h-full rounded-full bg-gradient-to-r from-pink-500 via-gold-500 to-gold-300"
            style={{ width: `${result.score}%` }}
          />
        </div>
      </div>

      {/* Overall */}
      <div className="rounded-2xl border border-mystic-700/30 bg-surface/80 p-5 backdrop-blur-sm">
        <h3 className="mb-2 text-xs font-bold text-gold-400">✦ 総合相性</h3>
        <p className="text-sm leading-relaxed text-foreground/80">{result.overall}</p>
      </div>

      {/* Love */}
      <div className="rounded-2xl border border-mystic-700/30 bg-surface/80 p-5">
        <h3 className="mb-2 text-xs font-bold text-pink-400">💕 恋愛の相性</h3>
        <p className="text-sm leading-relaxed text-foreground/80">{result.love}</p>
      </div>

      {/* Work */}
      <div className="rounded-2xl border border-mystic-700/30 bg-surface/80 p-5">
        <h3 className="mb-2 text-xs font-bold text-blue-400">💼 仕事の相性</h3>
        <p className="text-sm leading-relaxed text-foreground/80">{result.work}</p>
      </div>

      {/* Advice */}
      <div className="rounded-lg bg-gold-500/5 p-4">
        <p className="text-center text-xs text-gold-400">💡 {result.advice}</p>
      </div>

      <AdBanner />

      {/* Share */}
      <div>
        <p className="mb-3 text-center text-xs text-foreground/40">結果をシェアする</p>
        <ShareButtons text={shareText} />
      </div>
    </div>
  );
}
