"use client";

import { TarotCard as TarotCardType } from "@/types";

interface TarotCardProps {
  card: TarotCardType;
  isFlipped: boolean;
  isSelected: boolean;
  isReversed?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-16 h-24",
  md: "w-24 h-36",
  lg: "w-32 h-48",
};

export default function TarotCard({
  card,
  isFlipped,
  isSelected,
  isReversed = false,
  onClick,
  size = "md",
}: TarotCardProps) {
  return (
    <div
      className={`perspective cursor-pointer ${sizeClasses[size]} ${
        isSelected ? "-translate-y-2 scale-105" : "hover:-translate-y-1"
      } transition-transform duration-300`}
      onClick={onClick}
    >
      <div className={`card-inner ${isFlipped ? "flipped" : ""}`}>
        {/* Back of card */}
        <div className="card-face flex items-center justify-center rounded-xl border-2 border-mystic-500/50 bg-gradient-to-br from-mystic-800 via-mystic-700 to-mystic-800 shadow-lg">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">✦</span>
            <div className="h-px w-8 bg-gold-500/50" />
            <span className="text-[10px] text-gold-500/50">TAROT</span>
          </div>
        </div>

        {/* Front of card */}
        <div
          className={`card-face card-back flex flex-col items-center justify-between rounded-xl border-2 p-2 shadow-lg ${
            isSelected
              ? "border-gold-400 glow-gold bg-gradient-to-br from-mystic-900 via-mystic-800 to-mystic-900"
              : "border-mystic-500/30 bg-gradient-to-br from-mystic-900 via-mystic-800 to-mystic-900"
          }`}
          style={isReversed ? { transform: "rotateY(180deg) rotateZ(180deg)" } : undefined}
        >
          <span className="text-[8px] text-gold-500/60">{card.nameEn}</span>
          <span className="text-3xl">{card.symbol}</span>
          <div className="text-center">
            <p className="text-xs font-bold text-gold-400">{card.nameJa}</p>
            <p className="text-[8px] text-foreground/40">
              {isReversed ? "逆位置" : "正位置"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
