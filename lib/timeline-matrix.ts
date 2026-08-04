import { addDays, differenceInCalendarDays, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { TimelineProgressRow } from "@/lib/types";

export type MatrixWeek = { start: string; end: string; label: string };

export type MatrixActivityRow = {
  id: string;
  nama_kegiatan: string;
  bobotPersen: number; // bobot dinormalisasi jadi % dari total bobot seluruh kegiatan leaf
  progresAktual: number; // progres_terhitung kegiatan ini (0-100)
  weekly: number[]; // kontribusi rencana (dalam poin % total proyek) per minggu, selaras dengan `weeks`
};

export type TimelineMatrix = {
  weeks: MatrixWeek[];
  activities: MatrixActivityRow[];
  rencanaKumulatif: number[]; // % kumulatif rencana per minggu (selaras `weeks`)
  realisasiKumulatif: (number | null)[]; // null = minggu itu belum dilewati ("belum diketahui")
  currentWeekIndex: number; // index minggu yang memuat tanggal hari ini, -1 kalau proyek belum mulai
};

/**
 * Bangun matriks Rencana vs Realisasi mingguan dari data timeline yang ada
 * (bobot, tanggal mulai/selesai, progres_terhitung per kegiatan) -- TANPA
 * tabel histori progres mingguan terpisah, karena skema database saat ini
 * memang belum mencatat snapshot progres per minggu.
 *
 * Cara kerja (metode kurva-S standar berbasis bobot & durasi):
 * - Hanya kegiatan LEAF (tanpa sub-kegiatan) yang dihitung -- kegiatan induk
 *   cuma rollup, bobotnya tidak dihitung dobel.
 * - Rencana per minggu = bobot kegiatan (dinormalisasi jadi % dari total)
 *   dibagi rata ke seluruh hari durasinya, lalu dijumlah per minggu.
 * - Realisasi per minggu = kontribusi rencana kegiatan itu di minggu tsb,
 *   dikali rasio progres_terhitung aktualnya -- ini APROKSIMASI (asumsi
 *   progres aktual naik proporsional mengikuti bentuk kurva rencana),
 *   karena kita cuma tahu progres TERKINI, bukan progres di tiap minggu
 *   sebelumnya. Kolom realisasi hanya diisi sampai minggu berjalan; minggu
 *   yang belum dilewati sengaja dikosongkan (null), bukan diisi 0.
 */
export function buildTimelineMatrix(rows: TimelineProgressRow[]): TimelineMatrix | null {
  if (rows.length === 0) return null;

  const childIds = new Set(rows.map((r) => r.parent_activity_id).filter(Boolean) as string[]);
  const leaves = rows.filter((r) => !childIds.has(r.id));
  if (leaves.length === 0) return null;

  const startStr = leaves.reduce((min, r) => (r.tanggal_mulai < min ? r.tanggal_mulai : min), leaves[0].tanggal_mulai);
  const endStr = leaves.reduce((max, r) => (r.tanggal_selesai > max ? r.tanggal_selesai : max), leaves[0].tanggal_selesai);
  const rangeStart = new Date(startStr);
  const rangeEnd = new Date(endStr);
  if (rangeEnd < rangeStart) return null;

  const weeks: MatrixWeek[] = [];
  let cursor = rangeStart;
  while (cursor <= rangeEnd) {
    const weekEnd = addDays(cursor, 6) > rangeEnd ? rangeEnd : addDays(cursor, 6);
    weeks.push({
      start: cursor.toISOString().slice(0, 10),
      end: weekEnd.toISOString().slice(0, 10),
      label: `${format(cursor, "d MMM", { locale: localeId })}–${format(weekEnd, "d MMM", { locale: localeId })}`,
    });
    cursor = addDays(cursor, 7);
  }

  const totalBobot = leaves.reduce((s, r) => s + Number(r.bobot || 0), 0);
  const equalWeight = totalBobot <= 0;

  const activities: MatrixActivityRow[] = leaves.map((r) => {
    const bobotPersen = equalWeight ? 100 / leaves.length : (Number(r.bobot || 0) / totalBobot) * 100;
    const actStart = new Date(r.tanggal_mulai);
    const actEnd = new Date(r.tanggal_selesai);
    const totalDays = Math.max(1, differenceInCalendarDays(actEnd, actStart) + 1);

    const weekly = weeks.map((w) => {
      const wStart = new Date(w.start);
      const wEnd = new Date(w.end);
      const overlapStart = actStart > wStart ? actStart : wStart;
      const overlapEnd = actEnd < wEnd ? actEnd : wEnd;
      const overlapDays = differenceInCalendarDays(overlapEnd, overlapStart) + 1;
      if (overlapDays <= 0) return 0;
      const fraction = overlapDays / totalDays;
      return Math.round(fraction * bobotPersen * 100) / 100;
    });

    return {
      id: r.id,
      nama_kegiatan: r.nama_kegiatan,
      bobotPersen: Math.round(bobotPersen * 100) / 100,
      progresAktual: Number(r.progres_terhitung) || 0,
      weekly,
    };
  });

  const rencanaKumulatif: number[] = [];
  weeks.reduce((acc, _w, wi) => {
    const total = acc + activities.reduce((s, a) => s + a.weekly[wi], 0);
    rencanaKumulatif[wi] = Math.round(total * 100) / 100;
    return total;
  }, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  let currentWeekIndex = weeks.findIndex((w) => todayStr >= w.start && todayStr <= w.end);
  if (currentWeekIndex === -1) {
    currentWeekIndex = todayStr > weeks[weeks.length - 1].end ? weeks.length - 1 : -1;
  }

  const realisasiKumulatif: (number | null)[] = [];
  let accR = 0;
  weeks.forEach((_w, wi) => {
    accR += activities.reduce((s, a) => s + a.weekly[wi] * (a.progresAktual / 100), 0);
    realisasiKumulatif[wi] = wi <= currentWeekIndex ? Math.round(accR * 100) / 100 : null;
  });

  return { weeks, activities, rencanaKumulatif, realisasiKumulatif, currentWeekIndex };
}
