import { Users, Map, Network, BookMarked } from "lucide-react";

type Props = {
  totalKasus: number;
  totalLuas: number;
  clusterTerdampak: number;
  totalPatok: number;
};

export default function SosialStatCards({ totalKasus, totalLuas, clusterTerdampak, totalPatok }: Props) {
  const cards = [
    {
      label: "Total Kasus Okupasi/Sosial",
      value: totalKasus.toLocaleString("id-ID"),
      sub: "Kasus tercatat",
      icon: Users,
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Luas Okupasi",
      value: `${totalLuas.toLocaleString("id-ID")} m²`,
      sub: "Total luas terdampak",
      icon: Map,
      iconClassName: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Cluster Terdampak",
      value: clusterTerdampak.toLocaleString("id-ID"),
      sub: "Cluster",
      icon: Network,
      iconClassName: "bg-amber-50 text-amber-600",
    },
    {
      label: "Total Patok Terpasang",
      value: totalPatok.toLocaleString("id-ID"),
      sub: "Patok permanen",
      icon: BookMarked,
      iconClassName: "bg-violet-50 text-violet-600",
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
