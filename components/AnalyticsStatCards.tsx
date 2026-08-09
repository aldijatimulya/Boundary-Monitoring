import { TrendingUp, Flag, CalendarCheck, Gauge } from "lucide-react";

type Props = {
  velocityLabel: string;
  velocitySub: string;
  sisaValue: string;
  sisaSub: string;
  estimasiValue: string;
  estimasiSub: string;
  jadwalValue: string;
  jadwalSub: string;
  jadwalTone: "emerald" | "amber" | "slate"; // hijau = lebih cepat, amber = berpotensi mundur, slate = belum bisa dihitung
};

const TONE_CLASS: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  slate: "bg-slate-100 text-slate-500",
};

export default function AnalyticsStatCards({
  velocityLabel,
  velocitySub,
  sisaValue,
  sisaSub,
  estimasiValue,
  estimasiSub,
  jadwalValue,
  jadwalSub,
  jadwalTone,
}: Props) {
  const cards = [
    {
      label: "Kecepatan progres",
      value: velocityLabel,
      sub: velocitySub,
      icon: TrendingUp,
      tone: "blue",
    },
    {
      label: "Sisa realisasi",
      value: sisaValue,
      sub: sisaSub,
      icon: Flag,
      tone: "amber",
    },
    {
      label: "Estimasi selesai",
      value: estimasiValue,
      sub: estimasiSub,
      icon: CalendarCheck,
      tone: "violet",
    },
    {
      label: "Terhadap jadwal rencana",
      value: jadwalValue,
      sub: jadwalSub,
      icon: Gauge,
      tone: jadwalTone,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm text-slate-500">{c.label}</p>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONE_CLASS[c.tone]}`}>
              <c.icon className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 truncate text-2xl font-semibold text-slate-900" title={c.value}>
            {c.value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
