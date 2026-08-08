"use client";

import { useEffect, useRef, useState, Fragment, useMemo } from "react";
import Topbar from "@/components/Topbar";
import TimelineForm from "@/components/TimelineForm";
import TimelineGanttChart from "@/components/TimelineGanttChart";
import TimelineMatrixTable from "@/components/TimelineMatrixTable";
import TimelineCurveChart from "@/components/TimelineCurveChart";
import { supabase } from "@/lib/supabase";
import { TimelineActivity, TimelineProgressRow, STATUS_LABEL, Project } from "@/lib/types";
import { buildTimelineMatrix } from "@/lib/timeline-matrix";
import { exportTimelineDataExcel, exportTimelineMatrixExcel } from "@/lib/export/excel-timeline";
import { findSvgInContainer, downloadSvgAsPng, svgToPngDataUrl } from "@/lib/export/svg-to-png";
import { exportTimelineCurveExcel } from "@/lib/export/excel-chart";
import { useProfile } from "@/lib/useProfile";
import { format } from "date-fns";

export default function TimelinePage() {
  const [project, setProject] = useState<Project | null>(null);
  const [rows, setRows] = useState<TimelineProgressRow[]>([]);
  const [raw, setRaw] = useState<TimelineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineActivity | null>(null);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [downloadingChartExcel, setDownloadingChartExcel] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const { canEdit } = useProfile();

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
  const matrix = useMemo(() => buildTimelineMatrix(rows), [rows]);

  const projectStart = rows[0]?.tanggal_mulai;
  const projectEnd = rows.reduce(
    (latest, a) => (a.tanggal_selesai > latest ? a.tanggal_selesai : latest),
    rows[0]?.tanggal_selesai ?? ""
  );
  const totalHari =
    projectStart && projectEnd
      ? Math.round((new Date(projectEnd).getTime() - new Date(projectStart).getTime()) / 86400000) + 1
      : 0;

  async function handleDownloadChartImage() {
    const svg = findSvgInContainer(chartRef.current);
    if (!svg) return;
    setDownloadingImage(true);
    try {
      await downloadSvgAsPng(svg, `Timeline-Kurva-S_${new Date().toISOString().slice(0, 10)}.png`);
    } catch {
      alert("Gagal membuat gambar grafik. Coba lagi.");
    } finally {
      setDownloadingImage(false);
    }
  }

  async function handleDownloadChartExcel() {
    const svg = findSvgInContainer(chartRef.current);
    if (!svg || !matrix) return;
    setDownloadingChartExcel(true);
    try {
      const pngDataUrl = await svgToPngDataUrl(svg);
      await exportTimelineCurveExcel(pngDataUrl, matrix);
    } catch {
      alert("Gagal membuat file Excel grafik. Coba lagi.");
    } finally {
      setDownloadingChartExcel(false);
    }
  }

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
          {canEdit ? (
            <button
              onClick={() => {
                setEditing(activity ?? null);
                setFormOpen(true);
              }}
              className="text-xs text-brand-blue hover:underline"
            >
              Edit
            </button>
          ) : (
            <span className="text-xs text-slate-300">—</span>
          )}
        </td>
      </tr>
    );
  }

  return (
    <>
      <Topbar title="Timeline — matriks kegiatan" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-sm text-slate-500">Total estimasi durasi proyek (dihitung otomatis)</p>
            <p className="mt-1 text-2xl font-medium">{totalHari} hari</p>
            {projectStart && (
              <p className="mt-1 text-xs text-slate-400">
                {format(new Date(projectStart), "d MMM yyyy")} — {format(new Date(projectEnd), "d MMM yyyy")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportTimelineDataExcel(rows)}
              disabled={rows.length === 0}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Download Excel
            </button>
            {canEdit && (
              <button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Tambah kegiatan
              </button>
            )}
          </div>
        </div>

        <TimelineGanttChart rows={rows} topLevel={topLevel} childrenOf={childrenOf} />

        {matrix && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-slate-700">Kurva-S Timeline</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadChartImage}
                  disabled={downloadingImage}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {downloadingImage ? "Menyiapkan..." : "Download Gambar (PNG)"}
                </button>
                <button
                  onClick={handleDownloadChartExcel}
                  disabled={downloadingChartExcel}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {downloadingChartExcel ? "Menyiapkan..." : "Download Grafik (Excel)"}
                </button>
              </div>
            </div>
            <TimelineCurveChart ref={chartRef} matrix={matrix} />
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-slate-700">Matriks Timeline — Rencana vs Realisasi</h2>
          <button
            onClick={() => matrix && exportTimelineMatrixExcel(matrix)}
            disabled={!matrix}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Download Matriks (Excel)
          </button>
        </div>
        <TimelineMatrixTable matrix={matrix} />

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
