"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Clock, Cloud, CheckCircle2, LucideIcon } from "lucide-react";
import Topbar from "@/components/Topbar";
import DailyReportForm from "@/components/DailyReportForm";
import { supabase } from "@/lib/supabase";
import { DailyReport, Project } from "@/lib/types";
import { exportDailyReportPDF } from "@/lib/export/pdf";
import { exportDailyReportDocx } from "@/lib/export/docx";
import { useProfile } from "@/lib/useProfile";

const STATUS_TEXT: Record<DailyReport["status_approval"], string> = {
  draft: "Draft",
  submitted: "Menunggu approval",
  approved: "Disetujui",
};

const TONE_CLASS: Record<"blue" | "emerald" | "amber" | "violet", string> = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
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
      <p className="mt-2 truncate text-lg font-semibold text-slate-900" title={value}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{sublabel}</p>
    </div>
  );
}

export default function DailyReportPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DailyReport | null>(null);
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

  // Laporan paling baru (sudah diurutkan desc dari query) -- dipakai untuk
  // kartu ringkasan "hari ini" di atas tabel.
  const featured = useMemo(() => reports[0] ?? null, [reports]);

  const jamKerja = featured?.jam_kerja_mulai
    ? `${featured.jam_kerja_mulai.slice(0, 5)}${featured.jam_kerja_selesai ? ` - ${featured.jam_kerja_selesai.slice(0, 5)}` : ""}`
    : "-";

  return (
    <>
      <Topbar title="Daily Report" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap justify-end gap-2">
          {canEdit && (
            <button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Tambah laporan harian
            </button>
          )}
        </div>

        {featured && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={Users}
              label="Jumlah personil"
              value={`${featured.personil ?? "-"}`}
              sublabel="Orang"
              tone="blue"
            />
            <StatCard icon={Clock} label="Jam kerja" value={jamKerja} sublabel="Laporan terbaru" tone="emerald" />
            <StatCard icon={Cloud} label="Cuaca" value={featured.cuaca ?? "-"} sublabel="Laporan terbaru" tone="amber" />
            <StatCard
              icon={CheckCircle2}
              label="Status laporan"
              value={STATUS_TEXT[featured.status_approval]}
              sublabel={featured.tanggal}
              tone="violet"
            />
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-normal">Tanggal</th>
                <th className="px-4 py-3 font-normal">Tim</th>
                <th className="px-4 py-3 font-normal">Kegiatan</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal text-right">Aksi</th>
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
                  <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditing(r);
                          setFormOpen(true);
                        }}
                        className="text-xs text-brand-blue hover:underline"
                      >
                        Edit
                      </button>
                    )}
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
          report={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={() => {
            setFormOpen(false);
            setEditing(null);
            loadData();
          }}
        />
      )}
    </>
  );
}
