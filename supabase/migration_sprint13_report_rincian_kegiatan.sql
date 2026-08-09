-- =========================================================
-- MIGRASI SPRINT 13 — Rincian Kegiatan + persen realisasi di Daily/Weekly/Monthly Report
-- Jalankan di Supabase SQL Editor.
--
-- Fitur "Rincian Kegiatan" (breakdown jenis kegiatan + persen realisasi per
-- baris, mis. Inventarisasi 40%, Rekonstruksi 60%) sudah dibangun di UI
-- (RincianKegiatanInput, RincianKegiatanCard, ReportDetailDrawer) dan dipakai
-- di export Excel/PDF/Word, tapi kolomnya belum ada di database. Migrasi ini
-- menambahkan:
--   1. `rincian_kegiatan` (jsonb) di daily_reports, weekly_reports, dan
--      monthly_reports -- menyimpan array [{ jenis, persen }, ...].
--   2. `target_persen` dan `realisasi_persen` (numeric) khusus di
--      daily_reports -- target/realisasi dalam angka persen, terpisah dari
--      kolom `target`/`realisasi` lama yang tetap teks bebas.
--      (weekly_reports & monthly_reports sudah punya
--      progres_rencana_persen/progres_realisasi_persen sejak awal, jadi
--      tidak perlu kolom baru untuk itu.)
--
-- Semua kolom nullable / default NULL supaya laporan lama yang belum diisi
-- rincian kegiatannya tetap tampil normal (dianggap "belum ada rincian").
-- =========================================================

alter table daily_reports
  add column if not exists target_persen numeric(5,2),
  add column if not exists realisasi_persen numeric(5,2),
  add column if not exists rincian_kegiatan jsonb;

alter table weekly_reports
  add column if not exists rincian_kegiatan jsonb;

alter table monthly_reports
  add column if not exists rincian_kegiatan jsonb;
