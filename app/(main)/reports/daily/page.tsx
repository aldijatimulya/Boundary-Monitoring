"use client";

import { useEffect, useMemo, useState } from "react";
import Topbar from "@/components/Topbar";
import DailyReportForm from "@/components/DailyReportForm";
import ProgressDonut from "@/components/report/ProgressDonut";
import StatCard from "@/components/report/StatCard";
import InfoListCard from "@/components/report/InfoListCard";
import RincianKegiatanCard from "@/components/report/RincianKegiatanCard";
import ReportFilterBar, { FilterField, filterSelectClass } from "@/components/report/ReportFilterBar";
import ReportDetailDrawer from "@/components/report/ReportDetailDrawer";
import { supabase } from "@/lib/supabase";
import { DailyReport, Project } from "@/lib/types";
import { exportDailyReportPDF } from "@/lib/export/pdf";
import { exportDailyReportDocx } from "@/lib/export/docx";
import { exportDailyReportsExcel } from "@/lib/export/report-excel";
import { useProfile } from "@/lib/useProfile";
import { Users, Target, TrendingUp, Clock, ClipboardList, MapPin, Layers, FileText } from "lucide-react";

export default function DailyReportPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailReport, setDetailReport] = useState<DailyReport | null>(null);
  const { canEdit } = useProfile();

  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterTim, setFilterTim] = useState("");
  const [filterCuaca, setFilterCuaca] = useState("");

  async function loadData() {
    setLoading(true);
    const { data: projects } = await supabase.from("projects").select("id,name,client_name").limit(1);
    setProject((projects?.[0] as Project) ?? null);

    const { data } = await supabase
      .from("daily_reports")
      .select("*")
      .order("tanggal", { ascending: false })
      .returns<DailyReport[]>();
    setReports(data ?? []);
    if (data && data.length > 0) setFilterTanggal(data[0].tanggal);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const timOptions = useMemo(() => Array.from(new Set(reports.map((r) => r.tim).filter(Boolean))) as string[], [reports]);
  const cuacaOptions = useMemo(() => Array.from(new Set(reports.map((r) => r.cuaca).filter(Boolean))) as string[], [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(
      (r) =>
        (!filterTanggal || r.tanggal === filterTanggal) &&
        (!filterTim || r.tim === filterTim) &&
        (!filterCuaca || r.cuaca === filterCuaca)
    );
  }, [reports, filterTanggal, filterTim, filterCuaca]);

  // Laporan yang ditonjolkan di panel ringkasan: hasil filter tanggal/tim/cuaca,
  // fallback ke laporan terbaru kalau filter tidak menghasilkan apa-apa.
  const featured = filteredReports[0] ?? reports[0] ?? null;

  return (
    <>
      <Topbar title="Daily Report" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <ReportFilterBar
          filters={
            <>
              <FilterField label="Tanggal">
                <input
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className={filterSelectClass}
                />
              </FilterField>
              <FilterField label="Tim">
                <select value={filterTim} onChange={(e) => setFilterTim(e.target.value)} className={filterSelectClass}>
                  <option value="">Semua tim</option>
                  {timOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Cuaca">
                <select value={filterCuaca} onChange={(e) => setFilterCuaca(e.target.value)} className={filterSelectClass}>
                  <option value="">Semua cuaca</option>
                  {cuacaOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </FilterField>
            </>
          }
          onDownloadExcel={() => exportDailyReportsExcel(filteredReports.length > 0 ? filteredReports : reports)}
          downloadDisabled={reports.length === 0}
          addLabel="Tambah laporan harian"
          onAdd={() => setFormOpen(true)}
          canAdd={canEdit}
        />

        {loading && <p className="py-8 text-center text-sm text-slate-400">Memuat data...</p>}

        {!loading && !featured && (
          <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
            Belum ada laporan harian. Klik &quot;Tambah laporan harian&quot; untuk mulai.
          </div>
        )}

        {!loading && featured && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard icon={Users} label="Jumlah personil" value={`${featured.personil ?? "-"}`} sublabel="Orang" tone="blue" />
              <StatCard icon={Target} label="Target hari ini" value={`${featured.target_persen ?? 0}%`} sublabel="Rencana" tone="emerald" />
              <StatCard icon={TrendingUp} label="Realisasi" value={`${featured.realisasi_persen ?? 0}%`} sublabel="Terhadap rencana" tone="amber" />
              <StatCard
                icon={Clock}
                label="Jam kerja"
                value={`${featured.jam_kerja_mulai ?? "-"} - ${featured.jam_kerja_selesai ?? "-"}`}
                tone="violet"
              />
              <StatCard
                icon={ClipboardList}
                label="Status kegiatan"
                value={featured.status_approval === "approved" ? "Selesai" : "On Progress"}
                sublabel={featured.status_approval === "approved" ? "Disetujui" : "Sedang berjalan"}
                tone="slate"
                dot={featured.status_approval === "approved" ? "emerald" : "amber"}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-medium text-slate-900">Ringkasan Progress</h3>
                <div className="mt-4">
                  <ProgressDonut realisasiPersen={featured.realisasi_persen ?? 0} rencanaPersen={featured.target_persen ?? 0} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-medium text-slate-900">Informasi Utama</h3>
                <div className="mt-4">
                  <InfoListCard
                    rows={[
                      { icon: Clock, label: "Jam mulai", value: featured.jam_kerja_mulai ?? "-" },
                      { icon: Clock, label: "Jam selesai", value: featured.jam_kerja_selesai ?? "-" },
                      {
                        icon: MapPin,
                        label: "Koordinat",
                        value: featured.koordinat_lat && featured.koordinat_lng ? `${featured.koordinat_lat}, ${featured.koordinat_lng}` : "-",
                      },
                      { icon: Layers, label: "Kegiatan", value: featured.kegiatan },
                      { icon: FileText, label: "Dokumentasi foto", value: `${featured.foto_urls?.length ?? 0} file` },
                    ]}
                  />
                </div>
                <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                  Data progres dihitung berdasarkan realisasi terhadap target kegiatan pada hari ini.
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
            <h3 className="text-sm font-medium text-slate-900">Detail Laporan Harian</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-normal">Tanggal</th>
                <th className="px-4 py-3 font-normal">Tim</th>
                <th className="px-4 py-3 font-normal">Kegiatan</th>
                <th className="px-4 py-3 font-normal">Realisasi</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredReports.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Tidak ada laporan yang cocok dengan filter.</td></tr>
              )}
              {filteredReports.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-2">{r.tanggal}</td>
                  <td className="px-4 py-2">{r.tim ?? "-"}</td>
                  <td className="px-4 py-2 max-w-xs truncate">{r.kegiatan}</td>
                  <td className="px-4 py-2">{r.realisasi_persen ?? 0}%</td>
                  <td className="px-4 py-2 capitalize">{r.status_approval}</td>
                  <td className="px-4 py-2 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => setDetailReport(r)} className="text-xs font-medium text-brand-blue hover:underline">Lihat detail lengkap</button>
                    <button onClick={() => exportDailyReportPDF(r)} className="text-xs text-slate-500 hover:underline">PDF</button>
                    <button onClick={() => exportDailyReportDocx(r)} className="text-xs text-slate-500 hover:underline">Word</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {formOpen && project && (
        <DailyReportForm
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
          title={`Laporan ${detailReport.tanggal}`}
          subtitle={detailReport.tim ?? ""}
          onClose={() => setDetailReport(null)}
          rincianKegiatan={detailReport.rincian_kegiatan}
          fotoUrls={detailReport.foto_urls}
          fields={[
            { label: "Tanggal", value: detailReport.tanggal },
            { label: "Tim", value: detailReport.tim ?? "-" },
            { label: "Jumlah personil", value: `${detailReport.personil ?? "-"} Orang` },
            { label: "Cuaca", value: detailReport.cuaca ?? "-" },
            { label: "Jam kerja", value: `${detailReport.jam_kerja_mulai ?? "-"} - ${detailReport.jam_kerja_selesai ?? "-"}` },
            {
              label: "Koordinat",
              value: detailReport.koordinat_lat && detailReport.koordinat_lng ? `${detailReport.koordinat_lat}, ${detailReport.koordinat_lng}` : "-",
            },
            { label: "Kegiatan", value: detailReport.kegiatan },
            { label: "Target", value: `${detailReport.target ?? "-"} (${detailReport.target_persen ?? 0}%)` },
            { label: "Realisasi", value: `${detailReport.realisasi ?? "-"} (${detailReport.realisasi_persen ?? 0}%)` },
            { label: "Material digunakan", value: detailReport.material_digunakan ?? "-" },
            { label: "Permasalahan", value: detailReport.permasalahan ?? "-" },
            { label: "Mitigasi", value: detailReport.mitigasi ?? "-" },
            { label: "Kesimpulan", value: detailReport.kesimpulan ?? "-" },
            { label: "Rencana besok", value: detailReport.rencana_besok ?? "-" },
            { label: "Status", value: detailReport.status_approval },
          ]}
        />
      )}
    </>
  );
}
