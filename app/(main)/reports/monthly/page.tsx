"use client";

import { useEffect, useMemo, useState } from "react";
import Topbar from "@/components/Topbar";
import MonthlyReportForm from "@/components/MonthlyReportForm";
import ProgressDonut from "@/components/report/ProgressDonut";
import StatCard from "@/components/report/StatCard";
import InfoListCard from "@/components/report/InfoListCard";
import RincianKegiatanCard from "@/components/report/RincianKegiatanCard";
import ReportFilterBar, { FilterField, filterSelectClass } from "@/components/report/ReportFilterBar";
import ReportDetailDrawer from "@/components/report/ReportDetailDrawer";
import { supabase } from "@/lib/supabase";
import { MonthlyReport, Project } from "@/lib/types";
import { exportMonthlyReportPDF } from "@/lib/export/pdf";
import { exportMonthlyReportDocx } from "@/lib/export/docx";
import { exportMonthlyReportsExcel } from "@/lib/export/report-excel";
import { useProfile } from "@/lib/useProfile";
import { CalendarDays, Target, TrendingUp, AlertTriangle, ClipboardList } from "lucide-react";

const BULAN_NAMA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function MonthlyReportPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailReport, setDetailReport] = useState<MonthlyReport | null>(null);
  const { canEdit } = useProfile();

  const [filterBulan, setFilterBulan] = useState("");
  const [filterTahun, setFilterTahun] = useState("");

  async function loadData() {
    setLoading(true);
    const { data: projects } = await supabase.from("projects").select("id,name,client_name").limit(1);
    setProject((projects?.[0] as Project) ?? null);

    const { data } = await supabase
      .from("monthly_reports")
      .select("*")
      .order("tahun", { ascending: false })
      .order("bulan", { ascending: false })
      .returns<MonthlyReport[]>();
    setReports(data ?? []);
    if (data && data.length > 0) {
      setFilterBulan(String(data[0].bulan));
      setFilterTahun(String(data[0].tahun));
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const tahunOptions = useMemo(() => Array.from(new Set(reports.map((r) => r.tahun))).sort((a, b) => b - a), [reports]);

  const filteredReports = useMemo(
    () =>
      reports.filter(
        (r) => (!filterBulan || String(r.bulan) === filterBulan) && (!filterTahun || String(r.tahun) === filterTahun)
      ),
    [reports, filterBulan, filterTahun]
  );

  const featured = filteredReports[0] ?? reports[0] ?? null;

  return (
    <>
      <Topbar title="Monthly Report" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <ReportFilterBar
          filters={
            <>
              <FilterField label="Bulan">
                <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className={filterSelectClass}>
                  <option value="">Semua bulan</option>
                  {BULAN_NAMA.map((b, i) => (
                    <option key={b} value={i + 1}>{b}</option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Tahun">
                <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className={filterSelectClass}>
                  <option value="">Semua tahun</option>
                  {tahunOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </FilterField>
            </>
          }
          onDownloadExcel={() => exportMonthlyReportsExcel(filteredReports.length > 0 ? filteredReports : reports)}
          downloadDisabled={reports.length === 0}
          addLabel="Tambah laporan bulanan"
          onAdd={() => setFormOpen(true)}
          canAdd={canEdit}
        />

        {loading && <p className="py-8 text-center text-sm text-slate-400">Memuat data...</p>}

        {!loading && !featured && (
          <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
            Belum ada laporan bulanan. Klik &quot;Tambah laporan bulanan&quot; untuk mulai.
          </div>
        )}

        {!loading && featured && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={CalendarDays}
                label="Periode"
                value={`${BULAN_NAMA[featured.bulan - 1] ?? featured.bulan} ${featured.tahun}`}
                tone="blue"
              />
              <StatCard icon={Target} label="Progres rencana" value={`${featured.progres_rencana_persen ?? 0}%`} tone="emerald" />
              <StatCard icon={TrendingUp} label="Progres realisasi" value={`${featured.progres_realisasi_persen ?? 0}%`} tone="amber" />
              <StatCard
                icon={AlertTriangle}
                label="Kendala"
                value={featured.analisis_kendala ? "Ada" : "Tidak ada"}
                tone="slate"
                dot={featured.analisis_kendala ? "red" : "emerald"}
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
                      { icon: CalendarDays, label: "Periode", value: `${BULAN_NAMA[featured.bulan - 1] ?? featured.bulan} ${featured.tahun}` },
                      { icon: ClipboardList, label: "Ringkasan", value: featured.ringkasan_eksekutif ?? "-" },
                      { icon: TrendingUp, label: "Proyeksi", value: featured.proyeksi_bulan_depan ?? "-" },
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
            <h3 className="text-sm font-medium text-slate-900">Detail Laporan Bulanan</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-normal">Periode</th>
                <th className="px-4 py-3 font-normal text-right">Rencana</th>
                <th className="px-4 py-3 font-normal text-right">Realisasi</th>
                <th className="px-4 py-3 font-normal text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredReports.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Tidak ada laporan yang cocok dengan filter.</td></tr>
              )}
              {filteredReports.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-2">{BULAN_NAMA[r.bulan - 1] ?? r.bulan} {r.tahun}</td>
                  <td className="px-4 py-2 text-right">{r.progres_rencana_persen ?? 0}%</td>
                  <td className="px-4 py-2 text-right">{r.progres_realisasi_persen ?? 0}%</td>
                  <td className="px-4 py-2 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => setDetailReport(r)} className="text-xs font-medium text-brand-blue hover:underline">Lihat detail lengkap</button>
                    <button onClick={() => exportMonthlyReportPDF(r)} className="text-xs text-slate-500 hover:underline">PDF</button>
                    <button onClick={() => exportMonthlyReportDocx(r)} className="text-xs text-slate-500 hover:underline">Word</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {formOpen && project && (
        <MonthlyReportForm
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
          title={`${BULAN_NAMA[detailReport.bulan - 1] ?? detailReport.bulan} ${detailReport.tahun}`}
          subtitle="Laporan Bulanan"
          onClose={() => setDetailReport(null)}
          rincianKegiatan={detailReport.rincian_kegiatan}
          fotoUrls={detailReport.lampiran_urls}
          fields={[
            { label: "Periode", value: `${BULAN_NAMA[detailReport.bulan - 1] ?? detailReport.bulan} ${detailReport.tahun}` },
            { label: "Ringkasan eksekutif", value: detailReport.ringkasan_eksekutif ?? "-" },
            { label: "Progres rencana", value: `${detailReport.progres_rencana_persen ?? 0}%` },
            { label: "Progres realisasi", value: `${detailReport.progres_realisasi_persen ?? 0}%` },
            { label: "Analisis kendala", value: detailReport.analisis_kendala ?? "-" },
            { label: "Proyeksi bulan depan", value: detailReport.proyeksi_bulan_depan ?? "-" },
          ]}
        />
      )}
    </>
  );
}
