"use client";

import { useMemo, useRef, useState } from "react";
import { addDays, differenceInCalendarDays, format, isWithinInterval } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  MapPin,
  Milestone,
  Ruler,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { TimelineProgressRow } from "@/lib/types";

type Props = {
  rows: TimelineProgressRow[];
  childrenOf: (id: string) => TimelineProgressRow[];
  topLevel: TimelineProgressRow[];
};

type Column = { start: Date; end: Date; days: number; label: string; title?: string };
type MonthGroup = { label: string; days: number };
type StatusKey = "selesai" | "on_progress" | "belum_mulai" | "delay";

const STATUS_COLOR: Record<string, { base: string; fill: string; solid: boolean }> = {
  selesai: { base: "bg-emerald-100", fill: "bg-status-done", solid: true },
  on_progress: { base: "bg-amber-100", fill: "bg-status-progress", solid: false },
  belum_mulai: { base: "bg-slate-100", fill: "bg-status-pending", solid: false },
  delay: { base: "bg-red-100", fill: "bg-status-risk", solid: true },
};

const LEGEND: { key: StatusKey; label: string; color: string }[] = [
  { key: "selesai", label: "Selesai", color: "bg-status-done" },
  { key: "on_progress", label: "On Progress", color: "bg-status-progress" },
  { key: "belum_mulai", label: "Belum Mulai", color: "bg-status-pending" },
  { key: "delay", label: "Delay", color: "bg-status-risk" },
];

// Jenis kegiatan disimpulkan dari nama kegiatan (bukan kolom terpisah di DB),
// supaya tiap baris timeline dapat ikon + label kategori seperti pada
// referensi desain -- cukup cocokkan kata kunci yang biasa dipakai di
// nama kegiatan proyek (Inventarisasi, Rekonstruksi, Pemasangan, Sosialisasi).
const ACTIVITY_KIND = [
  { match: /inventarisasi/i, label: "Inventarisasi", icon: ClipboardList, className: "bg-emerald-50 text-emerald-600" },
  { match: /rekonstruksi/i, label: "Rekonstruksi", icon: Ruler, className: "bg-blue-50 text-blue-600" },
  { match: /plank/i, label: "Pemasangan Plank", icon: Milestone, className: "bg-teal-50 text-teal-600" },
  { match: /patok|tanda batas|pemasangan/i, label: "Pemasangan", icon: MapPin, className: "bg-amber-50 text-amber-600" },
  { match: /sosialisasi/i, label: "Sosialisasi", icon: Users, className: "bg-violet-50 text-violet-600" },
] as const;
const DEFAULT_KIND = { label: "Kegiatan", icon: ClipboardList, className: "bg-slate-100 text-slate-500" };

function getActivityKind(nama: string) {
  return ACTIVITY_KIND.find((k) => k.match.test(nama)) ?? DEFAULT_KIND;
}

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
      label: `Mg ${weekIndex}`,
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

const ZOOM_STEPS = [0.75, 1, 1.4, 1.8, 2.4];

export default function TimelineGanttChart({ rows, childrenOf, topLevel }: Props) {
  const captureRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleStatus, setVisibleStatus] = useState<Set<StatusKey>>(
    new Set(["selesai", "on_progress", "belum_mulai", "delay"])
  );
  const [zoomIndex, setZoomIndex] = useState(1); // index ke ZOOM_STEPS, default 1x

  function toggleStatus(key: StatusKey) {
    setVisibleStatus((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key); // minimal 1 status tetap aktif
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function scrollByColumns(dir: 1 | -1) {
    scrollRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  }

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
  const zoomScale = ZOOM_STEPS[zoomIndex];
  const baseMinWidth = granularity === "day" ? 900 : Math.max(700, columns.length * 64);
  const contentMinWidth = Math.round(baseMinWidth * zoomScale);

  function isRowVisible(r: TimelineProgressRow) {
    return visibleStatus.has(r.status_terhitung as StatusKey);
  }

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
    const isDelay = r.status_terhitung === "delay";
    const isDone = r.status_terhitung === "selesai";
    return (
      <div className="group relative h-6" style={style} title={`${r.nama_kegiatan} — ${r.progres_terhitung}%`}>
        <div className={`relative h-full w-full overflow-hidden rounded ${colors.base}`}>
          {!colors.solid && (
            <div
              className={`h-full rounded ${colors.fill}`}
              style={{ width: `${Math.min(Math.max(r.progres_terhitung, 0), 100)}%` }}
            />
          )}
          {colors.solid && !isDelay && <div className={`h-full w-full rounded ${colors.fill}`} />}
          {isDelay && (
            <>
              {/* Bagian yang sudah tercapai tetap solid merah, sisanya diberi
                  pola garis-garis (hatch) supaya kelihatan jelas ini bagian
                  yang molor/terlambat -- meniru pola pada referensi desain. */}
              <div
                className={`h-full ${colors.fill}`}
                style={{ width: `${Math.min(Math.max(r.progres_terhitung, 0), 100)}%` }}
              />
              <div
                className="absolute inset-y-0 right-0 opacity-70"
                style={{
                  left: `${Math.min(Math.max(r.progres_terhitung, 0), 100)}%`,
                  backgroundImage:
                    "repeating-linear-gradient(135deg, #FCA5A5 0px, #FCA5A5 4px, #FEE2E2 4px, #FEE2E2 8px)",
                }}
              />
            </>
          )}
        </div>
        {isDone && (
          <div className="absolute -right-2 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-status-done text-white ring-2 ring-white">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </div>
        )}
      </div>
    );
  }

  function renderRow(r: TimelineProgressRow, indent = false) {
    if (!isRowVisible(r)) return null;
    const kind = getActivityKind(r.nama_kegiatan);
    const Icon = kind.icon;
    return (
      <div key={r.id} className="flex border-b border-slate-50 last:border-b-0">
        <div
          className={`sticky left-0 z-10 flex w-64 shrink-0 items-start gap-2 border-r border-slate-100 bg-white px-3 py-2 ${
            indent ? "pl-8" : ""
          }`}
        >
          {!indent && (
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${kind.className}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <div className="min-w-0">
            <p
              className={`truncate text-xs ${indent ? "text-slate-500" : "font-medium text-slate-700"}`}
              title={r.nama_kegiatan}
            >
              {r.dependency_conflict && (
                <span title="Konflik dependency: mulai sebelum predecessor selesai" className="mr-1 text-red-500">
                  ⚠
                </span>
              )}
              {r.nama_kegiatan}
            </p>
            {!indent && <p className="truncate text-[11px] text-slate-400">{kind.label}</p>}
          </div>
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
          <div className="relative" data-timeline-export-ignore="true">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
            </button>
            {filterOpen && (
              <div className="absolute right-0 z-30 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                {LEGEND.map((l) => (
                  <label
                    key={l.key}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={visibleStatus.has(l.key)}
                      onChange={() => toggleStatus(l.key)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                    />
                    <span className={`h-2 w-2 rounded-full ${l.color}`} />
                    {l.label}
                  </label>
                ))}
              </div>
            )}
          </div>
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

      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-2" data-timeline-export-ignore="true">
        <button
          onClick={() => scrollByColumns(-1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
          aria-label="Geser ke kiri"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs capitalize text-slate-500">
          {granularity === "day" ? "Hari" : "Minggu"}
        </span>
        <button
          onClick={() => scrollByColumns(1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
          aria-label="Geser ke kanan"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="overflow-x-auto">
        <div ref={contentRef} style={{ minWidth: contentMinWidth }}>
          {/* Header */}
          <div className="flex border-b border-slate-100">
            <div className="w-64 shrink-0 border-r border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
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
          <div className="relative pb-7">
            {showTodayLine && (
              <>
                <div
                  className="pointer-events-none absolute bottom-7 top-0 z-20 border-l-2 border-dashed border-brand-coral"
                  style={{ left: `calc(16rem + (100% - 16rem) * ${(todayLeftPct / 100).toFixed(4)})` }}
                />
                <div
                  className="pointer-events-none absolute bottom-0 z-20 -translate-x-1/2 rounded-full bg-brand-coral px-2 py-0.5 text-[10px] font-medium text-white"
                  style={{ left: `calc(16rem + (100% - 16rem) * ${(todayLeftPct / 100).toFixed(4)})` }}
                >
                  Hari Ini
                </div>
              </>
            )}
            {topLevel.map((r) => {
              const children = childrenOf(r.id);
              const anyVisible = isRowVisible(r) || children.some(isRowVisible);
              if (!anyVisible) return null;
              return (
                <div key={r.id}>
                  {renderRow(r)}
                  {children.map((c) => renderRow(c, true))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3"
        data-timeline-export-ignore="true"
      >
        <p className="text-xs text-slate-400">Klik pada bar kegiatan untuk melihat detail progres.</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
            disabled={zoomIndex === 0}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Perkecil"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <input
            type="range"
            min={0}
            max={ZOOM_STEPS.length - 1}
            step={1}
            value={zoomIndex}
            onChange={(e) => setZoomIndex(Number(e.target.value))}
            className="h-1 w-24 accent-brand-blue"
          />
          <button
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Perbesar"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
