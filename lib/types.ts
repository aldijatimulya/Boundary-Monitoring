export type Cluster = {
  id: string;
  project_id: string;
  name: string;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  luas_pembebasan_ha: number;
  luas_deliniasi_ha: number | null;
  target_rekonstruksi_ha: number | null;
  // GeoJSON Polygon/MultiPolygon batas cluster (kolom `geometry` jsonb di Supabase).
  // null kalau cluster belum punya data spasial.
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  keterangan: string | null;
};

// Satu baris siap-pakai untuk Spatial Map: gabungan geometri cluster (tabel
// `clusters`) + status/metrik terkini (view `v_report_matrix_latest`).
export type SpatialClusterFeature = {
  cluster_id: string;
  name: string;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  luas_pembebasan_ha: number;
  luas_rekonstruksi_ha: number;
  selisih_ha: number;
  persen_selisih: number;
  status: ReportMatrixRow["status"];
  tanggal_update: string | null;
};

// Layer tile Google Earth Engine yang bisa ditumpuk di atas peta (mis. dari
// ee.Image(...).getMapId() -> urlFormat). Dikonfigurasi lewat env var, lihat
// lib/gee-layers.ts.
export type GeeTileLayer = {
  id: string;
  label: string;
  urlTemplate: string;
  attribution?: string;
  defaultVisible?: boolean;
};

// Satu baris siap-pakai untuk Patok Report: pemasangan tanda batas terkini per
// cluster, dari view v_patok_report_latest (histori insert, bukan update).
export type PatokReportRow = {
  cluster_id: string;
  project_id: string;
  lokasi: string;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  jumlah_patok_sementara: number;
  jumlah_patok_permanen: number;
  total_patok: number;
  persen_permanen: number;
  status: "terpasang" | "belum_terpasang";
  tanggal_update: string | null;
  keterangan: string | null;
};

export type ReportMatrixRow = {
  cluster_id: string;
  project_id: string;
  lokasi: string;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  luas_pembebasan_ha: number;
  luas_deliniasi_ha: number | null;
  luas_rekonstruksi_ha: number;
  selisih_ha: number;
  persen_selisih: number;
  status: "not_started" | "on_progress" | "completed" | "need_follow_up";
  tanggal_update: string | null;
};

export type Project = {
  id: string;
  name: string;
  client_name: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: "planning" | "ongoing" | "completed" | "on_hold";
};

export type TimelineActivity = {
  id: string;
  project_id: string;
  cluster_id: string | null;
  parent_activity_id: string | null;
  predecessor_id: string | null;
  nama_kegiatan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  durasi_hari: number;
  pic: string | null;
  status: "belum_mulai" | "on_progress" | "selesai" | "delay";
  progres_persen: number;
  bobot: number;
};

// Hasil dari view v_timeline_progress: progres & status sudah dihitung otomatis
export type TimelineProgressRow = {
  id: string;
  project_id: string;
  nama_kegiatan: string;
  parent_activity_id: string | null;
  predecessor_id: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  durasi_hari: number;
  pic: string | null;
  bobot: number;
  progres_terhitung: number;
  status_terhitung: TimelineActivity["status"];
  dependency_conflict: boolean;
  predecessor_selesai: string | null;
};

export type DailyReport = {
  id: string;
  project_id: string;
  cluster_id: string | null;
  tanggal: string;
  tim: string | null;
  personil: number | null;
  jam_kerja_mulai: string | null;
  jam_kerja_selesai: string | null;
  kegiatan: string;
  target: string | null;
  realisasi: string | null;
  cuaca: string | null;
  koordinat_lat: number | null;
  koordinat_lng: number | null;
  material_digunakan: string | null;
  permasalahan: string | null;
  mitigasi: string | null;
  kesimpulan: string | null;
  rencana_besok: string | null;
  foto_urls: string[] | null;
  status_approval: "draft" | "submitted" | "approved";
};

export type WeeklyReport = {
  id: string;
  project_id: string;
  minggu_ke: number;
  periode_mulai: string;
  periode_selesai: string;
  ringkasan_capaian: string | null;
  progres_rencana_persen: number | null;
  progres_realisasi_persen: number | null;
  kendala: string | null;
  mitigasi: string | null;
  foto_urls: string[] | null;
};

export type MonthlyReport = {
  id: string;
  project_id: string;
  bulan: number;
  tahun: number;
  ringkasan_eksekutif: string | null;
  progres_rencana_persen: number | null;
  progres_realisasi_persen: number | null;
  analisis_kendala: string | null;
  proyeksi_bulan_depan: string | null;
  lampiran_urls: string[] | null;
};

export type DocumentCategory = "shp" | "dxf" | "pdf" | "excel" | "foto" | "drone" | "lainnya";

export type DocumentRecord = {
  id: string;
  project_id: string;
  cluster_id: string | null;
  nama_file: string;
  kategori: DocumentCategory;
  file_url: string;
  ukuran_kb: number | null;
  uploaded_by: string | null;
  created_at: string;
};

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  shp: "Shapefile (SHP)",
  dxf: "CAD (DXF)",
  pdf: "PDF",
  excel: "Excel",
  foto: "Foto",
  drone: "Citra Drone",
  lainnya: "Lainnya",
};

export const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  not_started: { label: "Belum mulai", className: "bg-slate-100 text-slate-600" },
  on_progress: { label: "On progress", className: "bg-amber-100 text-amber-700" },
  completed: { label: "Selesai", className: "bg-emerald-100 text-emerald-700" },
  need_follow_up: { label: "Perlu tindak lanjut", className: "bg-red-100 text-red-700" },
  belum_mulai: { label: "Belum mulai", className: "bg-slate-100 text-slate-600" },
  delay: { label: "Delay", className: "bg-red-100 text-red-700" },
  selesai: { label: "Selesai", className: "bg-emerald-100 text-emerald-700" },
  terpasang: { label: "Sudah terpasang", className: "bg-emerald-100 text-emerald-700" },
  belum_terpasang: { label: "Belum terpasang", className: "bg-slate-100 text-slate-600" },
  proses: { label: "Proses", className: "bg-amber-100 text-amber-700" },
};

// ---- Plank Report ----
export type PlankLocation = {
  id: string;
  project_id: string | null;
  cluster_id: string | null;
  cluster_nama: string | null;
  nama_lokasi: string;
  jumlah_plank: number;
  koordinat_lat: number | null;
  koordinat_lng: number | null;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | GeoJSON.Point | null;
  foto_urls: string[] | null;
  keterangan: string | null;
  created_at: string;
};

// ---- Sosial Report ----
export type SosialReportRow = {
  id: string;
  cluster_id: string;
  lokasi: string;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  luas_okupasi_m2: number;
  jenis_okupasi: string | null;
  pemilik_lahan: string | null;
  keterangan: string | null;
  status: "proses" | "selesai";
  tanggal_catat: string;
  // Jumlah patok terpasang di cluster kasus ini (join ke v_patok_report_latest,
  // bukan kolom sosial_report sendiri) -- lihat migration_sprint12.
  patok_terpasang: number;
};

// ---- Inventarisasi Report ----
export type InventarisasiDetailRow = {
  cluster_id: string;
  cluster_nama: string;
  lokasi_id: string;
  nama_lokasi: string;
  pemilik_id: string | null;
  nama_pemilik: string | null;
  luas_m2: number | null;
  keterangan: string | null;
};

export type InventarisasiSummaryRow = {
  cluster_id: string;
  lokasi: string;
  jumlah_lokasi: number;
  jumlah_pemilik: number;
  total_luas_m2: number;
};
