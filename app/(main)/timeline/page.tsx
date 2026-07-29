"use client";

import { useEffect, useState, Fragment } from "react";
import Topbar from "@/components/Topbar";
import TimelineForm from "@/components/TimelineForm";
import { supabase } from "@/lib/supabase";
import { TimelineActivity, TimelineProgressRow, STATUS_LABEL, Project } from "@/lib/types";
import { format } from "date-fns";

export default function TimelinePage() {
  const [project, setProject] = useState<Project | null>(null);
  const [rows, setRows] = useState<TimelineProgressRow[]>([]);
  const [raw, setRaw] = useState<TimelineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineActivity | null>(null);

  async function loadData() {
    setLoading(true);
    const { data: projects } = await supabase.from("projects").select("id,name,client_name").limit(1);
    const proj = projects?.[0] ?? null;
    setProject(proj as Project | null);

    const { data: progressRows } = await supabase
      .from("v_timeline_progress")
      .select("*")
      .order("tanggal_mulai", { ascending: true })
      .returns<TimelineProgressRow[]>();
    setRows(progressRows ?? []);

    const { data: rawRows } = await supabase
      .from("timeline_activities")
      .select("*")
      .returns<TimelineActivity[]>();
    setRaw(rawRows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const topLevel = rows.filter((r) => !r.parent_activity_id);
  const childrenOf = (id: string) => rows.filter((r) => r.parent_activity_id === id);

  const projectStart = rows[0]?.tanggal_mulai;
  const projectEnd = rows.reduce(
    (latest, a) => (a.tanggal_selesai > latest ? a.tanggal_selesai : latest),
    rows[0]?.tanggal_selesai ?? ""
  );
  const totalHari =
    projectStart && projectEnd
      ? Math.round((new Date(projectEnd).getTime() - new Date(projectStart).getTime()) / 86400000) + 1
      : 0;

  function renderRow(r: TimelineProgressRow, indent = false) {
    const status = STATUS_LABEL[r.status_terhitung];
    const activity = raw.find((a) => a.id === r.id);
    return (
      <tr key={r.id} className="border-b border-slate-50">
        <td className={`px-4 py-2 font-medium ${indent ? "pl-10 text-slate-600" : ""}`}>
          {r.dependency_conflict && (
            <span title="Konflik dependency: mulai sebelum predecessor selesai" className="mr-1 text-red-500">
              ⚠
            </span>
          )}
          {r.nama_kegiatan}
        </td>
        <td className="px-4 py-2">{format(new Date(r.tanggal_mulai), "d MMM yyyy")}</td>
        <td className="px-4 py-2">{format(new Date(r.tanggal_selesai), "d MMM yyyy")}</td>
        <td className="px-4 py-2 text-right">{r.durasi_hari}</td>
        <td className="px-4 py-2">{r.pic ?? "-"}</td>
        <td className="px-4 py-2 text-right">{r.progres_terhitung}%</td>
        <td className="px-4 py-2">
          <span className={`rounded-full px-2 py-1 text-xs ${status?.className}`}>{status?.label}</span>
        </td>
        <td className="px-4 py-2 text-right">
          <button
            onClick={() => {
              setEditing(activity ?? null);
              setFormOpen(true);
            }}
            className="text-xs text-brand-blue hover:underline"
          >
            Edit
          </button>
        </td>
      </tr>
    );
  }

  return (
    <>
      <Topbar title="Timeline — matriks kegiatan" />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-sm text-slate-500">Total estimasi durasi proyek (dihitung otomatis)</p>
            <p className="mt-1 text-2xl font-medium">{totalHari} hari</p>
            {projectStart && (
              <p className="mt-1 text-xs text-slate-400">
                {format(new Date(projectStart), "d MMM yyyy")} — {format(new Date(projectEnd), "d MMM yyyy")}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Tambah kegiatan
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-normal">Kegiatan</th>
                <th className="px-4 py-3 font-normal">Mulai</th>
                <th className="px-4 py-3 font-normal">Selesai</th>
                <th className="px-4 py-3 font-normal text-right">Durasi (hari)</th>
                <th className="px-4 py-3 font-normal">PIC</th>
                <th className="px-4 py-3 font-normal text-right">Progres</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal text-right"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && topLevel.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Belum ada kegiatan. Klik "Tambah kegiatan" untuk mulai.
                  </td>
                </tr>
              )}
              {topLevel.map((r) => (
                <Fragment key={r.id}>
                  {renderRow(r)}
                  {childrenOf(r.id).map((c) => renderRow(c, true))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400">
          Kegiatan dengan sub-kegiatan otomatis menampilkan progres = rata-rata tertimbang (bobot) dari
          sub-kegiatannya. Tanda ⚠ muncul kalau tanggal mulai lebih awal dari selesainya kegiatan predecessor.
        </p>
      </main>

      {formOpen && project && (
        <TimelineForm
          projectId={project.id}
          activities={raw}
          editing={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            loadData();
          }}
        />
      )}
      {formOpen && !project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="rounded-xl bg-white p-6 text-sm text-slate-600">
            Belum ada project. Tambahkan minimal satu baris di tabel <code>projects</code> lewat Supabase
            Table Editor terlebih dulu.
            <div className="mt-4 text-right">
              <button onClick={() => setFormOpen(false)} className="rounded-md border border-slate-200 px-4 py-2 text-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
