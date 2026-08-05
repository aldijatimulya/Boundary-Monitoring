"use client";

import { useMemo, useRef, useState } from "react";
import { addDays, differenceInCalendarDays, format, isWithinInterval } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { TimelineProgressRow } from "@/lib/types";

type Props = {
  rows: TimelineProgressRow[];
  childrenOf: (id: string) => TimelineProgressRow[];
  topLevel: TimelineProgressRow[];
};

type Column = { start: Date; end: Date; days: number; label: string; title?: string };
type MonthGroup = { label: string; days: number };

const STATUS_COLOR: Record<string, { base: string; fill: string; solid: boolean }> = {
  selesai: { base: "bg-emerald-100", fill: "bg-status-done", solid: true },
  on_progress: { base: "bg-amber-100", fill: "bg-status-progress", solid: false },
  belum_mulai: { base: "bg-slate-100", fill: "bg-status-pending", solid: false },
  delay: { base: "bg-red-100", fill: "bg-status-risk", solid: true },
};

const LEGEND = [
  { key: "selesai", label: "Selesai", color: "bg-status-done" },
  { key: "on_progress", label: "On Progress", color: "bg-status-progress" },
  { key: "belum_mulai", label: "Belum Mulai", color: "bg-status-pending" },
  { key: "delay", label: "Delay", color: "bg-status-risk" },
];

function buildDayColumns(start: Date, end: Date): { columns: Column[]; monthGroups: MonthGroup[] } {
  const columns: Column[] = [];
  const monthGroups: MonthGroup[] = [];
  let cursor = start;
  while (cursor <= end) {
    columns.push({ start: cursor, end: cursor, days: 1, label: format(cursor, "d") });
    const monthLabel = format(cursor, "MMMM yyyy", { locale: localeId });
    const lastGroup = monthGroups[monthGroups.length - 1];
    if (lastGroup && lastGroup.label === monthLabel) {
      lastGroup.days += 1;
    } else {
      monthGroups.push({ label: monthLabel, days: 1 });
    }
    cursor = addDays(cursor, 1);
  }
  return { columns, monthGroups };
}

function buildWeekColumns(start: Date, end: Date): { columns: Column[]; monthGroups: MonthGroup[] } {
  const columns: Column[] = [];
  const monthGroups: MonthGroup[] = [];
  let cursor = start;
  let weekIndex = 0;
  while (cursor <= end) {
    weekIndex += 1;
    const colEnd = addDays(cursor, 6) > end ? end : addDays(cursor, 6);
    const days = differenceInCalendarDays(colEnd, cursor) + 1;
    columns.push({
      start: cursor,
      end: colEnd,
      days,
      label: `Mgg ${weekIndex}`,
      title: `Minggu ${weekIndex}: ${format(cursor, "d MMM", { locale: localeId })} – ${format(colEnd, "d MMM yyyy", { locale: localeId })}`,
    });
    const monthLabel = format(cursor, "MMMM yyyy", { locale: localeId });
    const lastGroup = monthGroups[monthGroups.length - 1];
    if (lastGroup && lastGroup.label === monthLabel) {
      lastGroup.days += days;
    } else {
      monthGroups.push({ label: monthLabel, days });
    }
    cursor = addDays(colEnd, 1);
  }
  return { columns, monthGroups };
}



export default function TimelineGanttChart({ rows, childrenOf, topLevel }: Props) {
  const captureRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [downloadingImage, setDownloadingImage] = useState(false);

  async function handleDownloadImage() {
    if (!captureRef.current) return;
    setDownloadingImage(true);
    try {
      // html-to-image di-lazy-load (bukan import biasa) supaya ukurannya
      // (~30KB) tidak ikut ke initial bundle halaman Timeline -- cuma
      // di-download browser saat tombol ini benar-benar diklik.
      const { toPng } = await import("html-to-image");
      // Chart-nya HTML biasa (bukan SVG) dan lebih lebar dari layar (makanya
      // di-scroll horizontal) -- lebar target diambil dari elemen konten
      // paling dalam (contentRef), bukan dari kartu pembungkusnya, supaya
      // hasil gambarnya penuh sampai minggu terakhir, tidak terpotong scroll.
      const fullWidth = (contentRef.current?.scrollWidth ?? captureRef.current.scrollWidth) + 2;
      const dataUrl = await toPng(captureRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        filter: (node) => !(node instanceof HTMLElement && node.dataset.timelineExportIgnore === "true"),
        width: fullWidth,
        height: captureRef.current.scrollHeight,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Timeline-Gantt-Chart_${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch {
      alert("Gagal membuat gambar timeline. Coba lagi.");
    } finally {
      setDownloadingImage(false);
    }
  }

  const { overallStart, overallEnd } = useMemo(() => {
    if (rows.length === 0) return { overallStart: null as Date | null, overallEnd: null as Date | null };
    let minStart = new Date(rows[0].tanggal_mulai);
    let maxEnd = new Date(rows[0].tanggal_selesai);
    for (const r of rows) {
      const s = new Date(r.tanggal_mulai);
      const e = new Date(r.tanggal_selesai);
      if (s < minStart) minStart = s;
      if (e > maxEnd) maxEnd = e;
    }
    return { overallStart: minStart, overallEnd: maxEnd };
  }, [rows]);

  const { columns, monthGroups, totalDays, granularity } = useMemo(() => {
    if (!overallStart || !overallEnd) {
      return { columns: [] as Column[], monthGroups: [] as MonthGroup[], totalDays: 0, granularity: "day" as const };
    }
    const totalDays = differenceInCalendarDays(overallEnd, overallStart) + 1;
    if (totalDays <= 31) {
      const { columns, monthGroups } = buildDayColumns(overallStart, overallEnd);
      return { columns, monthGroups, totalDays, granularity: "day" as const };
    }
    // Selalu pakai kolom mingguan (bukan cuma nama bulan) berapa pun panjang
    // proyeknya, supaya info "minggu ke berapa" selalu kelihatan di header --
    // sebelumnya proyek >180 hari jatuh ke tampilan bulanan saja tanpa
    // breakdown minggu. Tabel jadi lebar untuk proyek panjang, tapi sudah ada
    // scroll horizontal (sama seperti Matriks Timeline yang juga selalu mingguan).
    const { columns, monthGroups } = buildWeekColumns(overallStart, overallEnd);
    return { columns, monthGroups, totalDays, granularity: "week" as const };
  }, [overallStart, overallEnd]);

  if (!overallStart || !overallEnd || rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
        Belum ada kegiatan untuk ditampilkan pada matriks timeline.
      </div>
    );
  }

  const today = new Date();
  const showTodayLine = isWithinInterval(today, { start: overallStart, end: overallEnd });
  const todayLeftPct = showTodayLine ? (differenceInCalendarDays(today, overallStart) / totalDays) * 100 : 0;

  function barStyle(r: TimelineProgressRow) {
    const start = new Date(r.tanggal_mulai);
    const end = new Date(r.tanggal_selesai);
    const leftPct = (differenceInCalendarDays(start, overallStart!) / totalDays) * 100;
    const widthPct = ((differenceInCalendarDays(end, start) + 1) / totalDays) * 100;
    return { left: `${leftPct}%`, width: `${Math.max(widthPct, 0.6)}%` };
  }

  function renderBar(r: TimelineProgressRow) {
    const colors = STATUS_COLOR[r.status_terhitung] ?? STATUS_COLOR.belum_mulai;
    const style = barStyle(r);
    return (
      <div className="relative h-6" style={style} title={`${r.nama_kegiatan} — ${r.progres_terhitung}%`}>
        <div className={`h-full w-full rounded ${colors.base}`}>
          {!colors.solid && (
            <div
              className={`h-full rounded ${colors.fill}`}
              style={{ width: `${Math.min(Math.max(r.progres_terhitung, 0), 100)}%` }}
            />
          )}
          {colors.solid && <div className={`h-full w-full rounded ${colors.fill}`} />}
        </div>
      </div>
    );
  }

  function renderRow(r: TimelineProgressRow, indent = false) {
    return (
      <div key={r.id} className="flex border-b border-slate-50 last:border-b-0">
        <div
          className={`sticky left-0 z-10 w-56 shrink-0 truncate border-r border-slate-100 bg-white px-3 py-2 text-xs ${
            indent ? "pl-8 text-slate-500" : "font-medium text-slate-700"
          }`}
          title={r.nama_kegiatan}
        >
          {r.nama_kegiatan}
        </div>
        <div className="relative flex-1 py-1.5">{renderBar(r)}</div>
      </div>
    );
  }

  return (
    <div ref={captureRef} className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <p className="font-medium text-slate-900">Timeline Kegiatan</p>
        <div className="flex flex-wrap items-center gap-4">
          {LEGEND.map((l) => (
            <div key={l.key} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
              {l.label}
            </div>
          ))}
          <button
            onClick={handleDownloadImage}
            disabled={downloadingImage}
            data-timeline-export-ignore="true"
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50"
          >
            {downloadingImage ? "Menyiapkan..." : "Download Gambar (PNG)"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div ref={contentRef} style={{ minWidth: granularity === "day" ? 900 : Math.max(700, columns.length * 64) }}>
          {/* Header */}
          <div className="flex border-b border-slate-100">
            <div className="w-56 shrink-0 border-r border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
              Kegiatan
            </div>
            <div className="flex-1">
              {monthGroups.length > 0 && (
                <div className="flex border-b border-slate-100">
                  {monthGroups.map((g, i) => (
                    <div
                      key={i}
                      style={{ width: `${(g.days / totalDays) * 100}%` }}
                      className="border-r border-slate-100 bg-slate-50 px-2 py-1 text-center text-xs font-medium capitalize text-slate-500 last:border-r-0"
                    >
                      {g.label}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex">
                {columns.map((c, i) => (
                  <div
                    key={i}
                    style={{ width: `${(c.days / totalDays) * 100}%` }}
                    title={c.title}
                    className="border-r border-slate-100 bg-slate-50 px-1 py-1 text-center text-[11px] text-slate-400 last:border-r-0"
                  >
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="relative">
            {showTodayLine && (
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-20 border-l-2 border-dashed border-brand-coral"
                style={{ left: `calc(14rem + (100% - 14rem) * ${(todayLeftPct / 100).toFixed(4)})` }}
              />
            )}
            {topLevel.map((r) => (
              <div key={r.id}>
                {renderRow(r)}
                {childrenOf(r.id).map((c) => renderRow(c, true))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
