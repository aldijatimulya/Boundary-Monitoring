import { downloadExcel, excelDate, excelFilename } from "@/lib/export/excel";
import { TimelineProgressRow } from "@/lib/types";
import { TimelineMatrix } from "@/lib/timeline-matrix";

const STATUS_TEXT: Record<string, string> = {
  belum_mulai: "Belum mulai",
  on_progress: "On progress",
  selesai: "Selesai",
  delay: "Delay",
};

// Kolom mengikuti field di view v_timeline_progress (yang membungkus tabel
// timeline_activities + kalkulasi progres/status otomatis).
export function exportTimelineDataExcel(rows: TimelineProgressRow[]) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  downloadExcel(excelFilename("Timeline-Kegiatan"), [
    {
      name: "Timeline",
      rows: rows.map((r) => ({
        Kegiatan: r.nama_kegiatan,
        "Kegiatan Induk": r.parent_activity_id ? byId.get(r.parent_activity_id)?.nama_kegiatan ?? "-" : "-",
        Predecessor: r.predecessor_id ? byId.get(r.predecessor_id)?.nama_kegiatan ?? "-" : "-",
        "Tanggal Mulai": excelDate(r.tanggal_mulai),
        "Tanggal Selesai": excelDate(r.tanggal_selesai),
        "Durasi (hari)": r.durasi_hari,
        PIC: r.pic ?? "-",
        "Bobot (%)": r.bobot,
        "Progres (%)": r.progres_terhitung,
        Status: STATUS_TEXT[r.status_terhitung] ?? r.status_terhitung,
        "Konflik Dependency": r.dependency_conflict ? "Ya" : "Tidak",
      })),
    },
  ]);
}

export function exportTimelineMatrixExcel(matrix: TimelineMatrix) {
  const header = (row: Record<string, string | number>) => row;
  const weekHeaders = matrix.weeks.map((w, i) => `Mgg ${i + 1} (${w.label})`);

  const activityRows = matrix.activities.map((a) => {
    const row: Record<string, string | number> = {
      Kegiatan: a.nama_kegiatan,
      "Bobot (%)": a.bobotPersen,
    };
    a.weekly.forEach((v, wi) => {
      row[weekHeaders[wi]] = v > 0 ? v : "";
    });
    return header(row);
  });

  const rencanaRow: Record<string, string | number> = { Kegiatan: "RENCANA KUMULATIF (%)", "Bobot (%)": 100 };
  matrix.rencanaKumulatif.forEach((v, wi) => (rencanaRow[weekHeaders[wi]] = v));

  const realisasiRow: Record<string, string | number> = { Kegiatan: "REALISASI KUMULATIF (%)", "Bobot (%)": "" };
  matrix.realisasiKumulatif.forEach((v, wi) => (realisasiRow[weekHeaders[wi]] = v === null ? "" : v));

  downloadExcel(excelFilename("Timeline-Matriks-Kurva-S"), [
    { name: "Matriks Timeline", rows: [...activityRows, rencanaRow, realisasiRow] },
  ]);
}
