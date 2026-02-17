interface LuckMeterProps {
  label: string;
  value: number; // 1-5
  color?: string;
}

export default function LuckMeter({ label, value, color = "bg-gold-500" }: LuckMeterProps) {
  const percentage = (value / 5) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs text-foreground/70">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-mystic-700/30">
        <div
          className={`animate-fill h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-gold-400">{value}/5</span>
    </div>
  );
}
