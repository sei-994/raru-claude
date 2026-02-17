"use client";

import { useState, useCallback } from "react";
import { majorArcana } from "@/lib/tarot-data";
import { createRandom, dateSeed } from "@/lib/seed-random";
import TarotCard from "./TarotCard";
import TarotResult from "./TarotResult";

interface SelectedCard {
  card: (typeof majorArcana)[number];
  isReversed: boolean;
}

export default function TarotDeck() {
  const [phase, setPhase] = useState<"selecting" | "revealing" | "result">("selecting");
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [revealedCards, setRevealedCards] = useState<SelectedCard[]>([]);
  const [shuffledDeck, setShuffledDeck] = useState<typeof majorArcana>(() => {
    const seed = dateSeed(new Date(), String(Math.random()));
    const rng = createRandom(seed);
    return rng.shuffle([...majorArcana]);
  });

  const maxCards = 3;

  const handleCardClick = useCallback(
    (index: number) => {
      if (phase !== "selecting") return;
      if (selectedIndices.includes(index)) {
        setSelectedIndices((prev) => prev.filter((i) => i !== index));
      } else if (selectedIndices.length < maxCards) {
        setSelectedIndices((prev) => [...prev, index]);
      }
    },
    [phase, selectedIndices],
  );

  const handleReveal = useCallback(() => {
    const seed = dateSeed(new Date(), selectedIndices.join("-"));
    const rng = createRandom(seed);

    const cards = selectedIndices.map((i) => ({
      card: shuffledDeck[i],
      isReversed: rng.float() > 0.5,
    }));

    setRevealedCards(cards);
    setPhase("revealing");

    setTimeout(() => {
      setPhase("result");
    }, 1500);
  }, [selectedIndices, shuffledDeck]);

  const handleReset = useCallback(() => {
    const seed = dateSeed(new Date(), String(Math.random()));
    const rng = createRandom(seed);
    setShuffledDeck(rng.shuffle([...majorArcana]));
    setSelectedIndices([]);
    setRevealedCards([]);
    setPhase("selecting");
  }, []);

  if (phase === "result") {
    return <TarotResult cards={revealedCards} onReset={handleReset} />;
  }

  const positionLabels = ["過去", "現在", "未来"];

  return (
    <div className="mx-auto max-w-4xl px-4">
      {/* Instructions */}
      <div className="mb-8 text-center">
        <p className="text-sm text-foreground/60">
          {phase === "selecting"
            ? `心を落ち着けて、気になるカードを${maxCards}枚選んでください`
            : "カードを開いています..."}
        </p>
        <p className="mt-1 text-xs text-gold-500/60">
          選択中: {selectedIndices.length} / {maxCards}
        </p>
      </div>

      {/* Revealed cards */}
      {phase === "revealing" && revealedCards.length > 0 && (
        <div className="mb-8 flex items-center justify-center gap-6">
          {revealedCards.map((rc, i) => (
            <div key={rc.card.id} className="text-center">
              <p className="mb-2 text-xs text-gold-500/60">{positionLabels[i]}</p>
              <div className="animate-fade-in-up" style={{ animationDelay: `${i * 0.3}s` }}>
                <TarotCard
                  card={rc.card}
                  isFlipped={true}
                  isSelected={true}
                  isReversed={rc.isReversed}
                  size="lg"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card grid */}
      {phase === "selecting" && (
        <>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {shuffledDeck.map((card, index) => (
              <TarotCard
                key={card.id}
                card={card}
                isFlipped={false}
                isSelected={selectedIndices.includes(index)}
                onClick={() => handleCardClick(index)}
                size="sm"
              />
            ))}
          </div>

          {/* Reveal button */}
          {selectedIndices.length === maxCards && (
            <div className="mt-8 flex justify-center animate-fade-in-up">
              <button
                onClick={handleReveal}
                className="glow-gold rounded-full bg-gradient-to-r from-gold-500 to-gold-400 px-8 py-3 text-sm font-bold text-mystic-900 transition-all hover:scale-105 hover:shadow-lg"
              >
                カードを開く
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
