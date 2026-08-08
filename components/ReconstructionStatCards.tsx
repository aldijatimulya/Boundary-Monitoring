import { Target, CheckCircle2, TrendingUp, Flag } from "lucide-react";
import { formatM2 } from "@/lib/units";

type Props = {
  totalTarget: number; // hektar
  totalRealisasi: number; // hektar
  progresPersen: number;
};

export default function ReconstructionStatCards({ totalTarget, totalRealisasi, progresPersen }: Props) {
  const sisaTarget = Math.max(totalTarget - totalRealisasi, 0);

  const cards = [
    {
      label: "Total Target Rekonstruksi",
      value: `${formatM2(totalTarget)} m²`,
      sub: "Luas total area yang direncanakan",
      icon: Target,
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      label: "Realisasi Rekonstruksi",
      value: `${formatM2(totalRealisasi)} m²`,
      sub: "Luas area yang telah direkonstruksi",
      icon: CheckCircle2,
      iconClassName: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Progres Proyek",
      value: `${progresPersen}%`,
      sub: "Dari total target rekonstruksi",
      icon: TrendingUp,
      iconClassName: "bg-violet-50 text-violet-600",
    },
    {
      label: "Sisa Target",
      value: `${formatM2(sisaTarget)} m²`,
      sub: "Luas area yang belum direkonstruksi",
      icon: Flag,
      iconClassName: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm text-slate-500">{c.label}</p>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${c.iconClassName}`}>
              <c.icon className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{c.value}</p>
          <p className="mt-1 text-xs text-slate-400">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
