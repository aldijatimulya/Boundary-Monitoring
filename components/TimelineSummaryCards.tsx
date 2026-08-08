"use client";

import { CalendarRange } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { TimelineProgressRow } from "@/lib/types";
import { ProgressDonut } from "./DashboardCharts";

type Props = {
  topLevel: TimelineProgressRow[];
  totalHari: number;
  projectStart?: string;
  projectEnd?: string;
};

const STATUS_META = [
  { key: "selesai", label: "Selesai", dot: "bg-status-done", text: "text-status-done" },
  { key: "on_progress", label: "On Progress", dot: "bg-status-progress", text: "text-status-progress" },
  { key: "belum_mulai", label: "Belum Mulai", dot: "bg-status-pending", text: "text-slate-500" },
  { key: "delay", label: "Delay", dot: "bg-status-risk", text: "text-status-risk" },
] as const;

export default function TimelineSummaryCards({ topLevel, totalHari, projectStart, projectEnd }: Props) {
  // Progres per status dihitung dari total durasi (hari) kegiatan level-atas --
  // supaya jumlah keempatnya konsisten dengan "Total estimasi durasi" di kartu
  // sebelah kiri (326 hari = 118 + 91 + 78 + 39, contoh pada referensi).
  const byStatus = STATUS_META.map((s) => {
    const hari = topLevel.filter((r) => r.status_terhitung === s.key).reduce((sum, r) => sum + r.durasi_hari, 0);
    const persen = totalHari > 0 ? Math.round((hari / totalHari) * 100) : 0;
    return { ...s, hari, persen };
  });

  // Progres keseluruhan: rata-rata progres_terhitung ditimbang durasi kegiatan.
  const totalDurasi = topLevel.reduce((s, r) => s + r.durasi_hari, 0);
  const overallPercent =
    totalDurasi > 0
      ? Math.round(topLevel.reduce((s, r) => s + r.progres_terhitung * r.durasi_hari, 0) / totalDurasi)
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,260px)_1fr_minmax(0,260px)]">
      {/* Total estimasi durasi */}
      <div className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-brand-blue to-blue-800 p-5 text-white shadow-sm">
        <div className="flex items-start justify-between">
          <p className="text-sm text-blue-100">Total Estimasi Durasi</p>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <CalendarRange className="h-4.5 w-4.5" />
          </div>
        </div>
        <p className="mt-4 text-3xl font-semibold">{totalHari} hari</p>
        {projectStart && projectEnd && (
          <p className="mt-2 text-xs text-blue-100/80">
            {format(new Date(projectStart), "d MMM yyyy", { locale: localeId })} –{" "}
            {format(new Date(projectEnd), "d MMM yyyy", { locale: localeId })}
          </p>
        )}
      </div>

      {/* Ringkasan progres per status */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-900">Ringkasan Progres</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {byStatus.map((s) => (
            <div key={s.key}>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                {s.label}
              </div>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{s.persen}%</p>
              <p className="text-xs text-slate-400">{s.hari} hari</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progres keseluruhan */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-900">Progres Keseluruhan</p>
        <ProgressDonut percent={overallPercent} color="#16A34A" size={128} label="Selesai" />
      </div>
    </div>
  );
}
