"use client";

import { useState } from "react";
import type { DailyFortune } from "@/types";
import { generateDailyFortune } from "@/lib/fortune-generator";
import ZodiacSelector from "@/components/daily/ZodiacSelector";
import FortuneResult from "@/components/daily/FortuneResult";

export default function DailyPage() {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [fortune, setFortune] = useState<DailyFortune | null>(null);

  const handleSelect = (id: string) => {
    setSelectedSign(id);
    const result = generateDailyFortune(id, new Date());
    setFortune(result);
  };

  return (
    <div className="pt-20 pb-24">
      {/* Hero */}
      <div className="mb-10 text-center">
        <span className="mb-2 inline-block text-4xl">⭐</span>
        <h1 className="text-shimmer mb-2 text-2xl font-bold">今日の運勢</h1>
        <p className="text-sm text-foreground/50">
          12星座 ── あなたの今日の星の導き
        </p>
        <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
      </div>

      <div className="mx-auto max-w-2xl px-4">
        <ZodiacSelector selected={selectedSign} onSelect={handleSelect} />

        {fortune && selectedSign && (
          <div className="mt-8">
            <FortuneResult fortune={fortune} zodiacId={selectedSign} />
          </div>
        )}
      </div>
    </div>
  );
}
