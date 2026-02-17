"use client";

import { NumerologyProfile } from "@/types";
import ShareButtons from "@/components/shared/ShareButtons";
import AdBanner from "@/components/shared/AdBanner";

interface NumerologyResultProps {
  profile: NumerologyProfile;
}

export default function NumerologyResult({ profile }: NumerologyResultProps) {
  const shareText = `【数秘術】私のライフパスナンバーは「${profile.lifePathNumber}」\n${profile.title}\n\n星詠み占いで診断してみよう！`;

  return (
    <div className="animate-fade-in-up mx-auto max-w-lg space-y-6">
      {/* Number display */}
      <div className="text-center">
        <div className="glow-gold mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold-500/50 bg-gradient-to-br from-mystic-800 to-mystic-900">
          <span className="text-shimmer text-3xl font-bold">{profile.lifePathNumber}</span>
        </div>
        <h2 className="mt-4 text-lg font-bold text-gold-400">{profile.title}</h2>
      </div>

      {/* Description */}
      <div className="rounded-2xl border border-mystic-700/30 bg-surface/80 p-5 backdrop-blur-sm">
        <p className="text-sm leading-relaxed text-foreground/80">{profile.description}</p>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-mystic-700/30 bg-surface/80 p-4">
          <h3 className="mb-2 text-xs font-bold text-gold-400">強み</h3>
          <div className="space-y-1">
            {profile.strengths.map((s) => (
              <p key={s} className="text-xs text-foreground/70">
                ✦ {s}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-mystic-700/30 bg-surface/80 p-4">
          <h3 className="mb-2 text-xs font-bold text-mystic-300">課題</h3>
          <div className="space-y-1">
            {profile.weaknesses.map((w) => (
              <p key={w} className="text-xs text-foreground/70">
                ✧ {w}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Love */}
      <div className="rounded-2xl border border-mystic-700/30 bg-surface/80 p-5">
        <h3 className="mb-2 text-xs font-bold text-pink-400">💕 恋愛傾向</h3>
        <p className="text-sm leading-relaxed text-foreground/80">{profile.love}</p>
      </div>

      {/* Career */}
      <div className="rounded-2xl border border-mystic-700/30 bg-surface/80 p-5">
        <h3 className="mb-2 text-xs font-bold text-blue-400">💼 仕事・適職</h3>
        <p className="text-sm leading-relaxed text-foreground/80">{profile.career}</p>
      </div>

      {/* Compatibility */}
      <div className="rounded-lg bg-gold-500/5 p-4">
        <p className="text-center text-xs text-gold-400">
          相性の良い数字: {profile.compatibility.join(", ")}
        </p>
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
