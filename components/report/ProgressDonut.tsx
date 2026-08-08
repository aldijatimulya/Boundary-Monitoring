type Props = {
  /** Persen realisasi (0-100), dipakai untuk mengisi lingkaran biru. */
  realisasiPersen: number;
  /** Persen target/rencana (0-100), ditampilkan sebagai baris legend saja (bukan arc terpisah). */
  rencanaPersen?: number | null;
  centerLabel?: string;
};

const SIZE = 168;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Donut chart progres realisasi-vs-sisa, dengan legend Realisasi/Rencana/Sisa di sampingnya. */
export default function ProgressDonut({ realisasiPersen, rencanaPersen, centerLabel = "Realisasi" }: Props) {
  const clamped = Math.min(Math.max(realisasiPersen, 0), 100);
  const sisa = Math.round((100 - clamped) * 10) / 10;
  const dashOffset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#E2E8F0" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#2563EB"
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-semibold text-slate-900">{clamped}%</p>
          <p className="text-xs text-slate-400">{centerLabel}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <LegendRow color="bg-brand-blue" label="Realisasi" value={`${clamped}%`} />
        {rencanaPersen != null && <LegendRow color="bg-emerald-500" label="Rencana" value={`${rencanaPersen}%`} />}
        <LegendRow color="bg-amber-400" label="Sisa" value={`${sisa}%`} />
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
      <span className="w-16 text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
