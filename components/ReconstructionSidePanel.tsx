import { LayoutGrid, CheckCircle2, Clock, CircleDashed, AlertTriangle } from "lucide-react";
import { ReportMatrixRow } from "@/lib/types";
import { formatM2 } from "@/lib/units";
import { ProgressDonut } from "./DashboardCharts";

type Props = { rows: ReportMatrixRow[] };

const STATUS_META = [
  { key: "completed", label: "Selesai", dot: "bg-status-done" },
  { key: "on_progress", label: "On Progress", dot: "bg-status-progress" },
  { key: "not_started", label: "Belum Mulai", dot: "bg-status-pending" },
  { key: "need_follow_up", label: "Delay", dot: "bg-status-risk" },
] as const;

export default function ReconstructionSidePanel({ rows }: Props) {
  const totalTarget = rows.reduce((s, r) => s + Number(r.luas_pembebasan_ha), 0);

  const byStatus = STATUS_META.map((s) => {
    const target = rows.filter((r) => r.status === s.key).reduce((sum, r) => sum + Number(r.luas_pembebasan_ha), 0);
    const persen = totalTarget > 0 ? Math.round((target / totalTarget) * 100) : 0;
    return { ...s, target, persen };
  });

  const selesaiPersen = byStatus.find((s) => s.key === "completed")?.persen ?? 0;

  const clusterStats = [
    { label: "Total Cluster", value: rows.length, icon: LayoutGrid, className: "bg-blue-50 text-blue-600" },
    {
      label: "Cluster Selesai",
      value: rows.filter((r) => r.status === "completed").length,
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Cluster On Progress",
      value: rows.filter((r) => r.status === "on_progress").length,
      icon: Clock,
      className: "bg-amber-50 text-amber-600",
    },
    {
      label: "Cluster Belum Mulai",
      value: rows.filter((r) => r.status === "not_started").length,
      icon: CircleDashed,
      className: "bg-slate-100 text-slate-500",
    },
    {
      label: "Cluster Delay",
      value: rows.filter((r) => r.status === "need_follow_up").length,
      icon: AlertTriangle,
      className: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-900">Ringkasan Progres</p>
        <div className="mt-3 flex items-center gap-4">
          <ProgressDonut percent={selesaiPersen} color="#16A34A" size={110} label="Selesai" />
          <div className="min-w-0 flex-1 space-y-2">
            {byStatus.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                  {s.label}
                </div>
                <span className="shrink-0 text-slate-400">
                  {formatM2(s.target)} m² ({s.persen}%)
                </span>
              </div>
            ))}
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
