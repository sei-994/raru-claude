"use client";

import { zodiacSigns } from "@/lib/zodiac-data";

interface ZodiacSelectorProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function ZodiacSelector({ selected, onSelect }: ZodiacSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {zodiacSigns.map((sign) => (
        <button
          key={sign.id}
          onClick={() => onSelect(sign.id)}
          className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-all ${
            selected === sign.id
              ? "glow-gold border-gold-500/50 bg-gold-500/10"
              : "border-mystic-700/30 bg-surface/50 hover:border-mystic-500/30 hover:bg-surface-light/50"
          }`}
        >
          <span className="text-2xl">{sign.symbol}</span>
          <span
            className={`text-xs ${selected === sign.id ? "text-gold-400" : "text-foreground/60"}`}
          >
            {sign.nameJa}
          </span>
          <span className="text-[9px] text-foreground/30">{sign.dateRange}</span>
        </button>
      ))}
    </div>
  );
}
