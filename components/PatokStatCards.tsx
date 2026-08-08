import { MapPin, ShieldCheck, Percent, Flag } from "lucide-react";

type Props = {
  totalSementara: number;
  totalPermanen: number;
  persenPermanen: number; // permanen / sementara
  sisaPatok: number; // sementara - permanen
};

export default function PatokStatCards({ totalSementara, totalPermanen, persenPermanen, sisaPatok }: Props) {
  const cards = [
    {
      label: "Total Patok Sementara",
      value: totalSementara.toLocaleString("id-ID"),
      sub: "Patok yang sudah terpasang di lapangan",
      icon: MapPin,
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Patok Permanen",
      value: totalPermanen.toLocaleString("id-ID"),
      sub: "Patok permanen yang sudah terpasang",
      icon: ShieldCheck,
      iconClassName: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Persentase Patok Permanen",
      value: `${persenPermanen}%`,
      sub: "Dari total patok sementara",
      icon: Percent,
      iconClassName: "bg-violet-50 text-violet-600",
    },
    {
      label: "Sisa Patok Permanen",
      value: sisaPatok.toLocaleString("id-ID"),
      sub: "Masih perlu dipasang patok permanen",
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
