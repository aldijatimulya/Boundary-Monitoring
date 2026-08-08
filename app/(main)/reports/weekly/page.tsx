"use client";

import { useEffect, useMemo, useState } from "react";
import Topbar from "@/components/Topbar";
import WeeklyReportForm from "@/components/WeeklyReportForm";
import ProgressDonut from "@/components/report/ProgressDonut";
import StatCard from "@/components/report/StatCard";
import InfoListCard from "@/components/report/InfoListCard";
import RincianKegiatanCard from "@/components/report/RincianKegiatanCard";
import ReportFilterBar, { FilterField, filterSelectClass } from "@/components/report/ReportFilterBar";
import ReportDetailDrawer from "@/components/report/ReportDetailDrawer";
import { supabase } from "@/lib/supabase";
import { WeeklyReport, Project } from "@/lib/types";
import { exportWeeklyReportPDF } from "@/lib/export/pdf";
import { exportWeeklyReportDocx } from "@/lib/export/docx";
import { exportWeeklyReportsExcel } from "@/lib/export/report-excel";
import { useProfile } from "@/lib/useProfile";
import { CalendarRange, Target, TrendingUp, AlertTriangle, ClipboardList } from "lucide-react";

export default function WeeklyReportPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailReport, setDetailReport] = useState<WeeklyReport | null>(null);
  const { canEdit } = useProfile();

  const [filterMinggu, setFilterMinggu] = useState("");

  async function loadData() {
    setLoading(true);
    const { data: projects } = await supabase.from("projects").select("id,name,client_name").limit(1);
    setProject((projects?.[0] as Project) ?? null);

    const { data } = await supabase
      .from("weekly_reports")
      .select("*")
      .order("minggu_ke", { ascending: false })
      .returns<WeeklyReport[]>();
    setReports(data ?? []);
    if (data && data.length > 0) setFilterMinggu(String(data[0].minggu_ke));
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const mingguOptions = useMemo(() => Array.from(new Set(reports.map((r) => r.minggu_ke))).sort((a, b) => b - a), [reports]);

  const filteredReports = useMemo(
    () => reports.filter((r) => !filterMinggu || String(r.minggu_ke) === filterMinggu),
    [reports, filterMinggu]
  );

  const featured = filteredReports[0] ?? reports[0] ?? null;

  return (
    <>
      <Topbar title="Weekly Report" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <ReportFilterBar
          filters={
            <FilterField label="Minggu ke">
              <select value={filterMinggu} onChange={(e) => setFilterMinggu(e.target.value)} className={filterSelectClass}>
                <option value="">Semua minggu</option>
                {mingguOptions.map((m) => (
                  <option key={m} value={m}>Minggu {m}</option>
                ))}
              </select>
            </FilterField>
          }
          onDownloadExcel={() => exportWeeklyReportsExcel(filteredReports.length > 0 ? filteredReports : reports)}
          downloadDisabled={reports.length === 0}
          addLabel="Tambah laporan mingguan"
          onAdd={() => setFormOpen(true)}
          canAdd={canEdit}
        />

        {loading && <p className="py-8 text-center text-sm text-slate-400">Memuat data...</p>}

        {!loading && !featured && (
          <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
            Belum ada laporan mingguan. Klik &quot;Tambah laporan mingguan&quot; untuk mulai.
          </div>
        )}

        {!loading && featured && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={CalendarRange} label="Periode" value={`Minggu ${featured.minggu_ke}`} sublabel={`${featured.periode_mulai} — ${featured.periode_selesai}`} tone="blue" />
              <StatCard icon={Target} label="Progres rencana" value={`${featured.progres_rencana_persen ?? 0}%`} tone="emerald" />
              <StatCard icon={TrendingUp} label="Progres realisasi" value={`${featured.progres_realisasi_persen ?? 0}%`} tone="amber" />
              <StatCard
                icon={AlertTriangle}
                label="Kendala"
                value={featured.kendala ? "Ada" : "Tidak ada"}
                tone="slate"
                dot={featured.kendala ? "red" : "emerald"}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-medium text-slate-900">Ringkasan Progress</h3>
                <div className="mt-4">
                  <ProgressDonut
                    realisasiPersen={featured.progres_realisasi_persen ?? 0}
                    rencanaPersen={featured.progres_rencana_persen ?? 0}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-medium text-slate-900">Informasi Utama</h3>
                <div className="mt-4">
                  <InfoListCard
                    rows={[
                      { icon: CalendarRange, label: "Periode mulai", value: featured.periode_mulai },
                      { icon: CalendarRange, label: "Periode selesai", value: featured.periode_selesai },
                      { icon: ClipboardList, label: "Ringkasan", value: featured.ringkasan_capaian ?? "-" },
                      { icon: AlertTriangle, label: "Mitigasi", value: featured.mitigasi ?? "-" },
                    ]}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-medium text-slate-900">Rincian Kegiatan</h3>
                <div className="mt-4">
                  <RincianKegiatanCard items={featured.rincian_kegiatan} />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-medium text-slate-900">Detail Laporan Mingguan</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-normal">Minggu</th>
                <th className="px-4 py-3 font-normal">Periode</th>
                <th className="px-4 py-3 font-normal text-right">Rencana</th>
                <th className="px-4 py-3 font-normal text-right">Realisasi</th>
                <th className="px-4 py-3 font-normal text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredReports.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Tidak ada laporan yang cocok dengan filter.</td></tr>
              )}
              {filteredReports.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-2">Minggu {r.minggu_ke}</td>
                  <td className="px-4 py-2">{r.periode_mulai} — {r.periode_selesai}</td>
                  <td className="px-4 py-2 text-right">{r.progres_rencana_persen ?? 0}%</td>
                  <td className="px-4 py-2 text-right">{r.progres_realisasi_persen ?? 0}%</td>
                  <td className="px-4 py-2 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => setDetailReport(r)} className="text-xs font-medium text-brand-blue hover:underline">Lihat detail lengkap</button>
                    <button onClick={() => exportWeeklyReportPDF(r)} className="text-xs text-slate-500 hover:underline">PDF</button>
                    <button onClick={() => exportWeeklyReportDocx(r)} className="text-xs text-slate-500 hover:underline">Word</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {formOpen && project && (
        <WeeklyReportForm
          projectId={project.id}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            loadData();
          }}
        />
      )}

      {detailReport && (
        <ReportDetailDrawer
          title={`Minggu ${detailReport.minggu_ke}`}
          subtitle={`${detailReport.periode_mulai} — ${detailReport.periode_selesai}`}
          onClose={() => setDetailReport(null)}
          rincianKegiatan={detailReport.rincian_kegiatan}
          fotoUrls={detailReport.foto_urls}
          fields={[
            { label: "Minggu ke", value: `Minggu ${detailReport.minggu_ke}` },
            { label: "Periode", value: `${detailReport.periode_mulai} — ${detailReport.periode_selesai}` },
            { label: "Ringkasan capaian", value: detailReport.ringkasan_capaian ?? "-" },
            { label: "Progres rencana", value: `${detailReport.progres_rencana_persen ?? 0}%` },
            { label: "Progres realisasi", value: `${detailReport.progres_realisasi_persen ?? 0}%` },
            { label: "Kendala", value: detailReport.kendala ?? "-" },
            { label: "Mitigasi", value: detailReport.mitigasi ?? "-" },
          ]}
        />
      )}
    </>
  );
}
