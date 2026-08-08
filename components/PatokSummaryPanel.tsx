import { LayoutGrid, CheckCircle2, CircleDashed } from "lucide-react";
import { PatokReportRow } from "@/lib/types";

type Props = {
  rows: PatokReportRow[];
  totalSementara: number;
  totalPermanen: number;
  persenPermanen: number; // permanen / sementara
  sisaPatok: number; // sementara - permanen
};

/**
 * Donut ringkasan pemasangan patok: total di tengah = jumlah patok sementara +
 * permanen (sama seperti kartu statistik di atas). Segmen "Belum Terpasang"
 * disediakan untuk kalau nanti ada target total patok yang dilacak terpisah --
 * untuk saat ini nilainya selalu 0 karena model data belum menyimpan target itu.
 */
function InstallSummaryDonut({ totalSementara, totalPermanen }: { totalSementara: number; totalPermanen: number }) {
  const total = totalSementara + totalPermanen;
  const size = 110;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const sementaraFrac = total > 0 ? totalSementara / total : 0;
  const permanenFrac = total > 0 ? totalPermanen / total : 0;

  const sementaraLen = circumference * sementaraFrac;
  const permanenLen = circumference * permanenFrac;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#eef1f5" strokeWidth={stroke} fill="none" />
      {permanenLen > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#16A34A"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${permanenLen} ${circumference - permanenLen}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      {sementaraLen > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2563EB"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${sementaraLen} ${circumference - sementaraLen}`}
          strokeDashoffset={-permanenLen}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" className="fill-slate-900 text-xl font-semibold">
        {total.toLocaleString("id-ID")}
      </text>
      <text x="50%" y="62%" textAnchor="middle" dominantBaseline="central" className="fill-slate-400 text-[10px]">
        Total Patok
      </text>
    </svg>
  );
}

export default function PatokSummaryPanel({ rows, totalSementara, totalPermanen, persenPermanen, sisaPatok }: Props) {
  const total = totalSementara + totalPermanen;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const legend = [
    { label: "Patok Sementara", value: totalSementara, pct: pct(totalSementara), dot: "bg-brand-blue" },
    { label: "Patok Permanen", value: totalPermanen, pct: pct(totalPermanen), dot: "bg-status-done" },
    { label: "Belum Terpasang", value: 0, pct: 0, dot: "bg-slate-300" },
  ];

  const clusterStats = [
    { label: "Total Cluster", value: rows.length, icon: LayoutGrid, className: "bg-blue-50 text-blue-600" },
    {
      label: "Cluster Terpasang Permanen",
      value: rows.filter((r) => r.status === "terpasang").length,
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Cluster Belum Terpasang",
      value: rows.filter((r) => r.status === "belum_terpasang").length,
      icon: CircleDashed,
      className: "bg-slate-100 text-slate-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-900">Ringkasan Pemasangan Patok</p>
        <div className="mt-3 flex items-center gap-4">
          <InstallSummaryDonut totalSementara={totalSementara} totalPermanen={totalPermanen} />
          <div className="min-w-0 flex-1 space-y-2">
            {legend.map((l) => (
              <div key={l.label} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${l.dot}`} />
                  {l.label}
                </div>
                <span className="shrink-0 text-slate-400">
                  {l.value.toLocaleString("id-ID")} ({l.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-900">Progres Pemasangan Patok Permanen</p>
          <span className="text-sm font-semibold text-brand-blue">{persenPermanen}%</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-blue transition-all"
            style={{ width: `${Math.min(100, persenPermanen)}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-emerald-50 p-3">
            <p className="text-lg font-semibold text-emerald-700">{totalPermanen.toLocaleString("id-ID")}</p>
            <p className="text-xs text-emerald-600">Terpasang</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="text-lg font-semibold text-amber-700">{sisaPatok.toLocaleString("id-ID")}</p>
            <p className="text-xs text-amber-600">Belum Terpasang</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-900">Statistik Cluster</p>
        <div className="mt-3 space-y-1">
          {clusterStats.map((s) => (
            <div key={s.label} className="flex items-center justify-between rounded-lg px-1 py-2">
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${s.className}`}>
                  <s.icon className="h-3.5 w-3.5" />
                </div>
                {s.label}
              </div>
              <span className="text-sm font-medium text-slate-900">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
