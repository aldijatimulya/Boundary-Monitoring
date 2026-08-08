import { MapPin, CheckCircle2, Clock, PieChart } from "lucide-react";

type Props = {
  target: number; // total lokasi plank yang direncanakan (angka tetap)
  terpasang: number; // dihitung dari data yang diinput admin (SUM jumlah_plank)
};

export default function PlankStatCards({ target, terpasang }: Props) {
  const belumTerpasang = Math.max(target - terpasang, 0);
  const persentase = target > 0 ? Math.round((terpasang / target) * 1000) / 10 : 0;

  const cards = [
    {
      label: "Total Lokasi Plank",
      value: target.toLocaleString("id-ID"),
      sub: "Lokasi plank terdaftar",
      icon: MapPin,
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      label: "Plank Terpasang",
      value: terpasang.toLocaleString("id-ID"),
      sub: "Plank terpasang di lokasi",
      icon: CheckCircle2,
      iconClassName: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Belum Terpasang",
      value: belumTerpasang.toLocaleString("id-ID"),
      sub: "Plank belum terpasang",
      icon: Clock,
      iconClassName: "bg-amber-50 text-amber-600",
    },
    {
      label: "Persentase Terpasang",
      value: `${persentase}%`,
      sub: "Dari total lokasi plank",
      icon: PieChart,
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
