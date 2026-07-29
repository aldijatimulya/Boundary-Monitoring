"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import MonthlyReportForm from "@/components/MonthlyReportForm";
import { supabase } from "@/lib/supabase";
import { MonthlyReport, Project } from "@/lib/types";
import { exportMonthlyReportPDF } from "@/lib/export/pdf";
import { exportMonthlyReportDocx } from "@/lib/export/docx";

const BULAN_NAMA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function MonthlyReportPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

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

  return (
    <>
      <Topbar title="Monthly Report" />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex justify-end">
          <button
            onClick={() => setFormOpen(true)}
            className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Tambah laporan bulanan
          </button>
        </div>

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
