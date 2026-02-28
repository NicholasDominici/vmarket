'use client';

export function FearGreedGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const angle = -90 + (clamped / 100) * 180;
  const label =
    clamped >= 80 ? 'Extreme Greed' :
    clamped >= 60 ? 'Greed' :
    clamped >= 40 ? 'Neutral' :
    clamped >= 20 ? 'Fear' : 'Extreme Fear';
  const color =
    clamped >= 80 ? '#3ecf8e' :
    clamped >= 60 ? '#6dd4a0' :
    clamped >= 40 ? '#f0c000' :
    clamped >= 20 ? '#f4916b' : '#f45b69';

  return (
    <div className="border border-border rounded-md bg-card p-4">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-2">
        Fear & Greed Index
      </span>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 120" className="w-full max-w-[200px]">
          {/* Background arc segments */}
          <path d="M 20 100 A 80 80 0 0 1 60 34" fill="none" stroke="#f45b69" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
          <path d="M 60 34 A 80 80 0 0 1 100 20" fill="none" stroke="#f4916b" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
          <path d="M 100 20 A 80 80 0 0 1 140 34" fill="none" stroke="#f0c000" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
          <path d="M 140 34 A 80 80 0 0 1 160 54" fill="none" stroke="#6dd4a0" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
          <path d="M 160 54 A 80 80 0 0 1 180 100" fill="none" stroke="#3ecf8e" strokeWidth="12" strokeLinecap="round" opacity="0.3" />

          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2={100 + 65 * Math.cos((angle * Math.PI) / 180)}
            y2={100 + 65 * Math.sin((angle * Math.PI) / 180)}
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="4" fill={color} />

          {/* Labels */}
          <text x="15" y="115" fontSize="8" fill="#6e7681" textAnchor="start">Fear</text>
          <text x="185" y="115" fontSize="8" fill="#6e7681" textAnchor="end">Greed</text>
        </svg>
        <div className="text-center -mt-2">
          <span className="text-2xl font-semibold tabular-nums" style={{ color }}>{clamped.toFixed(0)}</span>
          <span className="text-[11px] text-muted-foreground block">{label}</span>
        </div>
      </div>
    </div>
  );
}
