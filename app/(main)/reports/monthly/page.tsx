"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Target, TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import Topbar from "@/components/Topbar";
import MonthlyReportForm from "@/components/MonthlyReportForm";
import { supabase } from "@/lib/supabase";
import { MonthlyReport, Project } from "@/lib/types";
import { exportMonthlyReportPDF } from "@/lib/export/pdf";
import { exportMonthlyReportDocx } from "@/lib/export/docx";
import { useProfile } from "@/lib/useProfile";

const BULAN_NAMA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const TONE_CLASS: Record<"blue" | "emerald" | "amber" | "red", string> = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel: string;
  tone: keyof typeof TONE_CLASS;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs text-slate-500">{label}</p>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONE_CLASS[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sublabel}</p>
    </div>
  );
}

function DetailBlock({ title, value }: { title: string; value: string | null }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-900">{title}</h3>
      <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{value?.trim() ? value : "Belum diisi."}</p>
    </div>
  );
}

export default function MonthlyReportPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const { canEdit } = useProfile();

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
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Laporan bulanan paling baru (sudah diurutkan desc dari query) -- dipakai
  // untuk kartu ringkasan progres + detail di atas tabel.
  const featured = useMemo(() => reports[0] ?? null, [reports]);

  const rencana = featured?.progres_rencana_persen ?? 0;
  const realisasi = featured?.progres_realisasi_persen ?? 0;
  const selisih = realisasi - rencana;
  const SelisihIcon = selisih > 0 ? TrendingUp : selisih < 0 ? TrendingDown : Minus;

  return (
    <>
      <Topbar title="Monthly Report" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap justify-end gap-2">
          {canEdit && (
            <button
              onClick={() => setFormOpen(true)}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Tambah laporan bulanan
            </button>
          )}
        </div>

        {featured && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={Calendar}
                label="Periode terbaru"
                value={`${BULAN_NAMA[featured.bulan - 1]} ${featured.tahun}`}
                sublabel="Laporan bulanan"
                tone="blue"
              />
              <StatCard icon={Target} label="Progres rencana" value={`${rencana}%`} sublabel="Target bulan ini" tone="amber" />
              <StatCard
                icon={TrendingUp}
                label="Progres realisasi"
                value={`${realisasi}%`}
                sublabel="Tercapai bulan ini"
                tone="emerald"
              />
              <StatCard
                icon={SelisihIcon}
                label="Selisih terhadap rencana"
                value={`${selisih > 0 ? "+" : ""}${selisih}%`}
                sublabel={selisih >= 0 ? "Di atas/sesuai rencana" : "Di bawah rencana"}
                tone={selisih < 0 ? "red" : "emerald"}
              />
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-medium text-slate-900">Detail Laporan</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <DetailBlock title="Ringkasan Eksekutif" value={featured.ringkasan_eksekutif} />
                <DetailBlock title="Analisis Kendala" value={featured.analisis_kendala} />
                <DetailBlock title="Proyeksi Bulan Depan" value={featured.proyeksi_bulan_depan} />
              </div>
            </div>
          </>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-normal">Periode</th>
                <th className="px-4 py-3 font-normal text-right">Rencana</th>
                <th className="px-4 py-3 font-normal text-right">Realisasi</th>
                <th className="px-4 py-3 font-normal text-right">Export</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Memuat data...</td></tr>
              )}
              {!loading && reports.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Belum ada laporan bulanan.</td></tr>
              )}
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="px-4 py-2">{BULAN_NAMA[r.bulan - 1]} {r.tahun}</td>
                  <td className="px-4 py-2 text-right">{r.progres_rencana_persen ?? 0}%</td>
                  <td className="px-4 py-2 text-right">{r.progres_realisasi_persen ?? 0}%</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button onClick={() => exportMonthlyReportPDF(r)} className="text-xs text-brand-blue hover:underline">PDF</button>
                    <button onClick={() => exportMonthlyReportDocx(r)} className="text-xs text-brand-blue hover:underline">Word</button>
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
    </>
  );
}
