import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { ClusterProductivity } from "@/lib/analytics";

export default function AnalyticsClusterSummary({ clusters }: { clusters: ClusterProductivity[] }) {
  const selesai = clusters.filter((c) => c.remainingHa === 0).length;
  const atRisk = clusters.filter((c) => c.remainingHa !== 0 && c.atRisk).length;
  const onProgress = clusters.length - selesai - atRisk;

  const rows = [
    { label: "Selesai", value: selesai, icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600" },
    { label: "On progress", value: onProgress, icon: Clock, className: "bg-amber-50 text-amber-600" },
    { label: "Perlu perhatian", value: atRisk, icon: AlertTriangle, className: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-900">Ringkasan Status Cluster</p>
      <div className="mt-3 space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-lg px-1 py-2">
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${r.className}`}>
                <r.icon className="h-3.5 w-3.5" />
              </div>
              {r.label}
            </div>
            <span className="text-sm font-medium text-slate-900">{r.value}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Dari {clusters.length} cluster. "Perlu perhatian" = progres stagnan atau proyeksi selesai &gt;180 hari lagi.
      </p>
    </div>
  );
}
