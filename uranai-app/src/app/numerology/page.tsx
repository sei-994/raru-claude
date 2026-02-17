"use client";

import { useState } from "react";
import { calculateLifePathNumber, numerologyProfiles } from "@/lib/numerology";
import NumerologyResult from "@/components/numerology/NumerologyResult";

export default function NumerologyPage() {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    if (y && m && d) {
      const lpn = calculateLifePathNumber(y, m, d);
      setResult(lpn);
    }
  };

  const profile = result ? numerologyProfiles[result] : null;

  return (
    <div className="pt-20 pb-24">
      {/* Hero */}
      <div className="mb-10 text-center">
        <span className="mb-2 inline-block text-4xl">🔢</span>
        <h1 className="text-shimmer mb-2 text-2xl font-bold">数秘術</h1>
        <p className="text-sm text-foreground/50">
          生年月日から導く ── あなたのライフパスナンバー
        </p>
        <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
      </div>

      <div className="mx-auto max-w-md px-4">
        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="rounded-2xl border border-mystic-700/30 bg-surface/80 p-5 backdrop-blur-sm">
            <p className="mb-4 text-center text-sm text-foreground/60">
              生年月日を入力してください
            </p>
            <div className="flex items-center justify-center gap-2">
              <input
                type="number"
                placeholder="1990"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-20 rounded-lg border border-mystic-700/30 bg-mystic-900/50 px-3 py-2 text-center text-sm text-foreground placeholder-foreground/30 outline-none focus:border-gold-500/50"
                min="1900"
                max="2025"
                required
              />
              <span className="text-xs text-foreground/40">年</span>
              <input
                type="number"
                placeholder="1"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-16 rounded-lg border border-mystic-700/30 bg-mystic-900/50 px-3 py-2 text-center text-sm text-foreground placeholder-foreground/30 outline-none focus:border-gold-500/50"
                min="1"
                max="12"
                required
              />
              <span className="text-xs text-foreground/40">月</span>
              <input
                type="number"
                placeholder="1"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-16 rounded-lg border border-mystic-700/30 bg-mystic-900/50 px-3 py-2 text-center text-sm text-foreground placeholder-foreground/30 outline-none focus:border-gold-500/50"
                min="1"
                max="31"
                required
              />
              <span className="text-xs text-foreground/40">日</span>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                type="submit"
                className="glow-gold rounded-full bg-gradient-to-r from-gold-500 to-gold-400 px-8 py-2.5 text-sm font-bold text-mystic-900 transition-all hover:scale-105"
              >
                診断する
              </button>
            </div>
          </div>
        </form>

        {profile && <NumerologyResult profile={profile} />}
      </div>
    </div>
  );
}
