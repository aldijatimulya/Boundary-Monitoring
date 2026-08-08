import { Network, MapPin, Users, Map } from "lucide-react";

type Props = {
  totalCluster: number;
  totalLokasi: number;
  totalPemilik: number;
  totalLuas: number;
};

export default function InventarisasiStatCards({ totalCluster, totalLokasi, totalPemilik, totalLuas }: Props) {
  const cards = [
    {
      label: "Total Cluster Tercatat",
      value: totalCluster.toLocaleString("id-ID"),
      sub: "Cluster dengan data inventarisasi",
      icon: Network,
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Lokasi",
      value: totalLokasi.toLocaleString("id-ID"),
      sub: "Lokasi ganti rugi tercatat",
      icon: MapPin,
      iconClassName: "bg-teal-50 text-teal-600",
    },
    {
      label: "Total Pemilik Lahan",
      value: totalPemilik.toLocaleString("id-ID"),
      sub: "Pemilik tercatat di seluruh cluster",
      icon: Users,
      iconClassName: "bg-amber-50 text-amber-600",
    },
    {
      label: "Total Luasan Keseluruhan",
      value: `${totalLuas.toLocaleString("id-ID")} m²`,
      sub: "Akumulasi luas ganti rugi",
      icon: Map,
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
