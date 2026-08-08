import { downloadExcel, excelDate, excelFilename } from "@/lib/export/excel";
import { formatM2 } from "@/lib/units";
import { PLANK_TARGET_TITIK } from "@/lib/targets";
import {
  ReportMatrixRow,
  PatokReportRow,
  PlankLocation,
  SosialReportRow,
  InventarisasiDetailRow,
} from "@/lib/types";

const STATUS_TEXT: Record<string, string> = {
  not_started: "Belum mulai",
  on_progress: "On progress",
  completed: "Selesai",
  need_follow_up: "Perlu tindak lanjut",
  terpasang: "Sudah terpasang",
  belum_terpasang: "Belum terpasang",
  proses: "Proses",
  selesai: "Selesai",
};

// Kolom mengikuti persis field yang ada di view v_report_matrix_latest / tabel
// clusters di Supabase -- bukan cuma yang tampil di layar -- supaya hasil
// Excel-nya "mirip database".
export function exportReconstructionExcel(rows: ReportMatrixRow[]) {
  downloadExcel(excelFilename("Reconstruction-Report"), [
    {
      name: "Reconstruction Report",
      rows: rows.map((r) => ({
        Lokasi: r.lokasi,
        Desa: r.desa ?? "-",
        Kecamatan: r.kecamatan ?? "-",
        Kabupaten: r.kabupaten ?? "-",
        "Pembebasan (m²)": formatM2(r.luas_pembebasan_ha),
        "Deliniasi (m²)": formatM2(r.luas_deliniasi_ha ?? 0),
        "Rekonstruksi (m²)": formatM2(r.luas_rekonstruksi_ha),
        "Selisih (m²)": formatM2(r.selisih_ha),
        "% Selisih": r.persen_selisih,
        Status: STATUS_TEXT[r.status] ?? r.status,
        "Update Terakhir": excelDate(r.tanggal_update),
      })),
    },
  ]);
}

export function exportPatokExcel(rows: PatokReportRow[]) {
  downloadExcel(excelFilename("Patok-Report"), [
    {
      name: "Patok Report",
      rows: rows.map((r) => ({
        Cluster: r.lokasi,
        Desa: r.desa ?? "-",
        Kecamatan: r.kecamatan ?? "-",
        Kabupaten: r.kabupaten ?? "-",
        "Patok Sementara": r.jumlah_patok_sementara,
        "Patok Permanen": r.jumlah_patok_permanen,
        "Total Patok": r.total_patok,
        "% Permanen": r.persen_permanen,
        Status: STATUS_TEXT[r.status] ?? r.status,
        Keterangan: r.keterangan ?? "-",
        "Update Terakhir": excelDate(r.tanggal_update),
      })),
    },
  ]);
}

export function exportPlankExcel(rows: PlankLocation[]) {
  const total = rows.reduce((s, r) => s + Number(r.jumlah_plank || 0), 0);
  downloadExcel(excelFilename("Plank-Report"), [
    {
      name: "Plank Report",
      rows: [
        ...rows.map((p) => ({
          "Nama Lokasi": p.nama_lokasi,
          Cluster: p.cluster_nama ?? "-",
          "Jumlah Plank Terpasang": p.jumlah_plank,
          Latitude: p.koordinat_lat ?? "-",
          Longitude: p.koordinat_lng ?? "-",
          "Data Spasial (KML/GeoJSON)": p.geometry ? "Ada" : "Tidak ada",
          "Jumlah Foto": p.foto_urls?.length ?? 0,
          Keterangan: p.keterangan ?? "-",
          "Tanggal Dibuat": excelDate(p.created_at),
        })),
        {
          "Nama Lokasi": "TOTAL KESELURUHAN",
          Cluster: "",
          "Jumlah Plank Terpasang": total,
          Latitude: "",
          Longitude: "",
          "Data Spasial (KML/GeoJSON)": "",
          "Jumlah Foto": "",
          Keterangan: `Target: ${PLANK_TARGET_TITIK} titik (${Math.round((total / PLANK_TARGET_TITIK) * 1000) / 10}%)`,
          "Tanggal Dibuat": "",
        },
      ],
    },
  ]);
}

export function exportSosialExcel(rows: SosialReportRow[]) {
  const total = rows.reduce((s, r) => s + Number(r.luas_okupasi_m2), 0);
  downloadExcel(excelFilename("Sosial-Report"), [
    {
      name: "Sosial Report",
      rows: [
        ...rows.map((r) => ({
          Cluster: r.lokasi,
          Desa: r.desa ?? "-",
          Kecamatan: r.kecamatan ?? "-",
          Kabupaten: r.kabupaten ?? "-",
          "Pemilik Lahan": r.pemilik_lahan ?? "-",
          "Jenis Okupasi": r.jenis_okupasi ?? "-",
          "Luas Okupasi (m²)": r.luas_okupasi_m2,
          "Patok Terpasang": r.patok_terpasang,
          Status: STATUS_TEXT[r.status] ?? r.status,
          Keterangan: r.keterangan ?? "-",
          "Tanggal Catat": excelDate(r.tanggal_catat),
        })),
        // Baris total di paling bawah, sama seperti tfoot di tabel pada halaman.
        {
          Cluster: "TOTAL KESELURUHAN",
          Desa: "",
          Kecamatan: "",
          Kabupaten: "",
          "Pemilik Lahan": "",
          "Jenis Okupasi": "",
          "Luas Okupasi (m²)": total,
          "Patok Terpasang": "",
          Status: "",
          Keterangan: "",
          "Tanggal Catat": "",
        },
      ],
    },
  ]);
}

export function exportInventarisasiExcel(
  detail: InventarisasiDetailRow[],
  summary: { lokasi: string; jumlah_lokasi: number; jumlah_pemilik: number; total_luas_m2: number }[]
) {
  downloadExcel(excelFilename("Inventarisasi-Report"), [
    {
      // Sheet 1: detail per pemilik -- mengikuti view v_inventarisasi_detail.
      name: "Detail Pemilik",
      rows: detail.map((r) => ({
        Cluster: r.cluster_nama,
        Lokasi: r.nama_lokasi,
        "Nama Pemilik": r.nama_pemilik ?? "-",
        "Luas (m²)": r.luas_m2 ?? 0,
        Keterangan: r.keterangan ?? "-",
      })),
    },
    {
      // Sheet 2: rekap per cluster -- mengikuti view v_inventarisasi_summary.
      name: "Rekap per Cluster",
      rows: summary.map((r) => ({
        Cluster: r.lokasi,
        "Jumlah Lokasi": r.jumlah_lokasi,
        "Jumlah Pemilik": r.jumlah_pemilik,
        "Total Luas (m²)": r.total_luas_m2,
      })),
    },
  ]);
}
