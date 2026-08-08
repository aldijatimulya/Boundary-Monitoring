"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import WeeklyReportForm from "@/components/WeeklyReportForm";
import { supabase } from "@/lib/supabase";
import { WeeklyReport, Project } from "@/lib/types";
import { exportWeeklyReportPDF } from "@/lib/export/pdf";
import { exportWeeklyReportDocx } from "@/lib/export/docx";
import { useProfile } from "@/lib/useProfile";

export default function WeeklyReportPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const { canEdit } = useProfile();

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
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <Topbar title="Weekly Report" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap justify-end gap-2">
          {canEdit && (
            <button
              onClick={() => setFormOpen(true)}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Tambah laporan mingguan
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-normal">Minggu</th>
                <th className="px-4 py-3 font-normal">Periode</th>
                <th className="px-4 py-3 font-normal text-right">Rencana</th>
                <th className="px-4 py-3 font-normal text-right">Realisasi</th>
                <th className="px-4 py-3 font-normal text-right">Export</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Memuat data...</td></tr>
              )}
              {!loading && reports.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Belum ada laporan mingguan.</td></tr>
              )}
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="px-4 py-2">Minggu {r.minggu_ke}</td>
                  <td className="px-4 py-2">{r.periode_mulai} — {r.periode_selesai}</td>
                  <td className="px-4 py-2 text-right">{r.progres_rencana_persen ?? 0}%</td>
                  <td className="px-4 py-2 text-right">{r.progres_realisasi_persen ?? 0}%</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button onClick={() => exportWeeklyReportPDF(r)} className="text-xs text-brand-blue hover:underline">PDF</button>
                    <button onClick={() => exportWeeklyReportDocx(r)} className="text-xs text-brand-blue hover:underline">Word</button>
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
    </>
  );
}
