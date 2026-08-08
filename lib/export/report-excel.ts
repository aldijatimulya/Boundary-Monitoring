import { downloadExcel, excelDate, excelFilename } from "@/lib/export/excel";
import type { DailyReport, WeeklyReport, MonthlyReport, RincianKegiatanItem } from "@/lib/types";

function rincianToText(items: RincianKegiatanItem[] | null | undefined): string {
  if (!items || items.length === 0) return "-";
  return items.map((it) => `${it.jenis}: ${it.persen}%`).join("; ");
}

/** Export daftar laporan harian (sesuai filter yang sedang aktif) ke satu file Excel. */
export function exportDailyReportsExcel(reports: DailyReport[]) {
  const rows = reports.map((r) => ({
    Tanggal: excelDate(r.tanggal),
    Tim: r.tim ?? "-",
    "Jumlah Personil": r.personil ?? "-",
    "Jam Mulai": r.jam_kerja_mulai ?? "-",
    "Jam Selesai": r.jam_kerja_selesai ?? "-",
    Cuaca: r.cuaca ?? "-",
    Kegiatan: r.kegiatan,
    "Target (%)": r.target_persen ?? "-",
    "Realisasi (%)": r.realisasi_persen ?? "-",
    "Rincian Kegiatan": rincianToText(r.rincian_kegiatan),
    "Material Digunakan": r.material_digunakan ?? "-",
    Permasalahan: r.permasalahan ?? "-",
    Mitigasi: r.mitigasi ?? "-",
    Status: r.status_approval,
  }));
  downloadExcel(excelFilename("Laporan-Harian"), [{ name: "Daily Report", rows }]);
}

/** Export daftar laporan mingguan ke satu file Excel. */
export function exportWeeklyReportsExcel(reports: WeeklyReport[]) {
  const rows = reports.map((r) => ({
    "Minggu Ke": r.minggu_ke,
    "Periode Mulai": excelDate(r.periode_mulai),
    "Periode Selesai": excelDate(r.periode_selesai),
    "Ringkasan Capaian": r.ringkasan_capaian ?? "-",
    "Rencana (%)": r.progres_rencana_persen ?? "-",
    "Realisasi (%)": r.progres_realisasi_persen ?? "-",
    "Rincian Kegiatan": rincianToText(r.rincian_kegiatan),
    Kendala: r.kendala ?? "-",
    Mitigasi: r.mitigasi ?? "-",
  }));
  downloadExcel(excelFilename("Laporan-Mingguan"), [{ name: "Weekly Report", rows }]);
}

const BULAN_NAMA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Export daftar laporan bulanan ke satu file Excel. */
export function exportMonthlyReportsExcel(reports: MonthlyReport[]) {
  const rows = reports.map((r) => ({
    Bulan: BULAN_NAMA[r.bulan - 1] ?? r.bulan,
    Tahun: r.tahun,
    "Ringkasan Eksekutif": r.ringkasan_eksekutif ?? "-",
    "Rencana (%)": r.progres_rencana_persen ?? "-",
    "Realisasi (%)": r.progres_realisasi_persen ?? "-",
    "Rincian Kegiatan": rincianToText(r.rincian_kegiatan),
    "Analisis Kendala": r.analisis_kendala ?? "-",
    "Proyeksi Bulan Depan": r.proyeksi_bulan_depan ?? "-",
  }));
  downloadExcel(excelFilename("Laporan-Bulanan"), [{ name: "Monthly Report", rows }]);
}
