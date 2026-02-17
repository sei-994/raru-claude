"use client";

import { useState } from "react";
import { calculateLifePathNumber } from "@/lib/numerology";
import { calculateCompatibility } from "@/lib/compatibility";
import { CompatibilityResult as CompatibilityResultType } from "@/types";
import CompatibilityResult from "@/components/compatibility/CompatibilityResult";

interface PersonInput {
  year: string;
  month: string;
  day: string;
}

export default function CompatibilityPage() {
  const [personA, setPersonA] = useState<PersonInput>({ year: "", month: "", day: "" });
  const [personB, setPersonB] = useState<PersonInput>({ year: "", month: "", day: "" });
  const [result, setResult] = useState<{
    data: CompatibilityResultType;
    numberA: number;
    numberB: number;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const yA = parseInt(personA.year, 10);
    const mA = parseInt(personA.month, 10);
    const dA = parseInt(personA.day, 10);
    const yB = parseInt(personB.year, 10);
    const mB = parseInt(personB.month, 10);
    const dB = parseInt(personB.day, 10);

    if (yA && mA && dA && yB && mB && dB) {
      const lpnA = calculateLifePathNumber(yA, mA, dA);
      const lpnB = calculateLifePathNumber(yB, mB, dB);
      const data = calculateCompatibility(lpnA, lpnB);
      setResult({ data, numberA: lpnA, numberB: lpnB });
    }
  };

  const inputClass =
    "w-16 rounded-lg border border-mystic-700/30 bg-mystic-900/50 px-2 py-2 text-center text-sm text-foreground placeholder-foreground/30 outline-none focus:border-gold-500/50";
  const yearInputClass = inputClass.replace("w-16", "w-20");

  const PersonForm = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: PersonInput;
    onChange: (v: PersonInput) => void;
  }) => (
    <div>
      <p className="mb-2 text-center text-xs text-foreground/60">{label}</p>
      <div className="flex items-center justify-center gap-1">
        <input
          type="number"
          placeholder="1990"
          value={value.year}
          onChange={(e) => onChange({ ...value, year: e.target.value })}
          className={yearInputClass}
          min="1900"
          max="2025"
          required
        />
        <span className="text-[10px] text-foreground/40">年</span>
        <input
          type="number"
          placeholder="1"
          value={value.month}
          onChange={(e) => onChange({ ...value, month: e.target.value })}
          className={inputClass}
          min="1"
          max="12"
          required
        />
        <span className="text-[10px] text-foreground/40">月</span>
        <input
          type="number"
          placeholder="1"
          value={value.day}
          onChange={(e) => onChange({ ...value, day: e.target.value })}
          className={inputClass}
          min="1"
          max="31"
          required
        />
        <span className="text-[10px] text-foreground/40">日</span>
      </div>
    </div>
  );

  return (
    <div className="pt-20 pb-24">
      {/* Hero */}
      <div className="mb-10 text-center">
        <span className="mb-2 inline-block text-4xl">💕</span>
        <h1 className="text-shimmer mb-2 text-2xl font-bold">相性診断</h1>
        <p className="text-sm text-foreground/50">
          数秘術で紐解く ── ふたりの運命の相性
        </p>
        <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
      </div>

      <div className="mx-auto max-w-md px-4">
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="space-y-4 rounded-2xl border border-mystic-700/30 bg-surface/80 p-5 backdrop-blur-sm">
            <PersonForm label="あなたの生年月日" value={personA} onChange={setPersonA} />

            <div className="flex items-center justify-center">
              <span className="text-xl text-pink-400">×</span>
            </div>

            <PersonForm label="相手の生年月日" value={personB} onChange={setPersonB} />

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                className="glow-gold rounded-full bg-gradient-to-r from-gold-500 to-gold-400 px-8 py-2.5 text-sm font-bold text-mystic-900 transition-all hover:scale-105"
              >
                相性を診断する
              </button>
            </div>
          </div>
        </form>

        {result && (
          <CompatibilityResult
            result={result.data}
            numberA={result.numberA}
            numberB={result.numberB}
          />
        )}
      </div>
    </div>
  );
}
