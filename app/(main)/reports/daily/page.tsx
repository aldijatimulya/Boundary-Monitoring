"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import DailyReportForm from "@/components/DailyReportForm";
import { supabase } from "@/lib/supabase";
import { DailyReport, Project } from "@/lib/types";
import { exportDailyReportPDF } from "@/lib/export/pdf";
import { exportDailyReportDocx } from "@/lib/export/docx";
import { useProfile } from "@/lib/useProfile";

export default function DailyReportPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const { canEdit } = useProfile();

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
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <Topbar title="Daily Report" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap justify-end gap-2">
          {canEdit && (
            <button
              onClick={() => setFormOpen(true)}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Tambah laporan harian
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-normal">Tanggal</th>
                <th className="px-4 py-3 font-normal">Tim</th>
                <th className="px-4 py-3 font-normal">Kegiatan</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal text-right">Export</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Memuat data...</td></tr>
              )}
              {!loading && reports.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Belum ada laporan harian. Klik "Tambah laporan harian" untuk mulai.</td></tr>
              )}
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="px-4 py-2">{r.tanggal}</td>
                  <td className="px-4 py-2">{r.tim ?? "-"}</td>
                  <td className="px-4 py-2 max-w-xs truncate">{r.kegiatan}</td>
                  <td className="px-4 py-2 capitalize">{r.status_approval}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button onClick={() => exportDailyReportPDF(r)} className="text-xs text-brand-blue hover:underline">PDF</button>
                    <button onClick={() => exportDailyReportDocx(r)} className="text-xs text-brand-blue hover:underline">Word</button>
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
    </>
  );
}
