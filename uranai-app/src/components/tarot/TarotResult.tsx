"use client";

import { TarotCard as TarotCardType } from "@/types";
import TarotCard from "./TarotCard";
import ShareButtons from "@/components/shared/ShareButtons";
import AdBanner from "@/components/shared/AdBanner";

interface SelectedCard {
  card: TarotCardType;
  isReversed: boolean;
}

interface TarotResultProps {
  cards: SelectedCard[];
  onReset: () => void;
}

const positionLabels = ["過去", "現在", "未来"];
const positionDescriptions = [
  "これまでの流れを表しています",
  "今のあなたの状況を映しています",
  "これから訪れる可能性を示しています",
];

export default function TarotResult({ cards, onReset }: TarotResultProps) {
  const shareText =
    `【タロット占い結果】\n` +
    cards
      .map(
        (c, i) =>
          `${positionLabels[i]}: ${c.card.nameJa}(${c.isReversed ? "逆" : "正"})`,
      )
      .join("\n") +
    `\n\n星詠み占いで占ってみよう！`;

  return (
    <div className="mx-auto max-w-2xl px-4">
      {/* Card display */}
      <div className="mb-8 flex items-start justify-center gap-4 sm:gap-6">
        {cards.map((rc, i) => (
          <div
            key={rc.card.id}
            className="animate-fade-in-up text-center"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            <p className="mb-2 text-xs text-gold-500/60">{positionLabels[i]}</p>
            <TarotCard
              card={rc.card}
              isFlipped={true}
              isSelected={true}
              isReversed={rc.isReversed}
              size="md"
            />
          </div>
        ))}
      </div>

      {/* Readings */}
      <div className="space-y-6">
        {cards.map((rc, i) => (
          <div
            key={rc.card.id}
            className="animate-fade-in-up rounded-2xl border border-mystic-700/30 bg-surface/80 p-5 backdrop-blur-sm"
            style={{ animationDelay: `${0.6 + i * 0.3}s` }}
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="text-2xl">{rc.card.symbol}</span>
              <div>
                <h3 className="font-bold text-gold-400">
                  {positionLabels[i]}:{" "}
                  <span className="text-foreground">
                    {rc.card.nameJa}
                    <span className="ml-1 text-xs text-foreground/50">
                      ({rc.isReversed ? "逆位置" : "正位置"})
                    </span>
                  </span>
                </h3>
                <p className="text-xs text-foreground/40">{positionDescriptions[i]}</p>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {(rc.isReversed ? rc.card.reversedKeywords : rc.card.uprightKeywords).map(
                (kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-mystic-700/30 px-3 py-1 text-xs text-mystic-300"
                  >
                    {kw}
                  </span>
                ),
              )}
            </div>

            <p className="text-sm leading-relaxed text-foreground/80">
              {rc.isReversed ? rc.card.reversedMeaning : rc.card.uprightMeaning}
            </p>

            <div className="mt-3 rounded-lg bg-gold-500/5 p-3">
              <p className="text-xs text-gold-400">
                💡 {rc.card.advice}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Ad */}
      <AdBanner className="my-6" />

      {/* Summary */}
      <div
        className="animate-fade-in-up mt-6 rounded-2xl border border-gold-500/20 bg-gradient-to-br from-mystic-800/80 to-mystic-900/80 p-5"
        style={{ animationDelay: "1.5s" }}
      >
        <h3 className="mb-3 text-center text-sm font-bold text-gold-400">
          総合メッセージ
        </h3>
        <p className="text-center text-sm leading-relaxed text-foreground/80">
          {cards.length === 3
            ? `過去の「${cards[0].card.nameJa}」から現在の「${cards[1].card.nameJa}」を経て、未来には「${cards[2].card.nameJa}」が待っています。${cards[2].card.advice}`
            : cards.map((c) => c.card.advice).join(" ")}
        </p>
      </div>

      {/* Share */}
      <div className="my-6">
        <p className="mb-3 text-center text-xs text-foreground/40">
          結果をシェアする
        </p>
        <ShareButtons text={shareText} />
      </div>

      {/* Reset */}
      <div className="flex justify-center pb-8">
        <button
          onClick={onReset}
          className="rounded-full border border-mystic-500/30 px-6 py-2 text-sm text-foreground/60 transition-colors hover:border-gold-500/30 hover:text-gold-400"
        >
          もう一度占う
        </button>
      </div>
    </div>
  );
}
