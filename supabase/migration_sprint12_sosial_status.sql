-- =========================================================
-- MIGRASI SPRINT 12 — Status kasus + Patok Terpasang di Sosial Report
-- Jalankan di Supabase SQL Editor.
--
-- Redesign halaman Sosial Report (lihat referensi desain) butuh 2 data baru
-- yang belum ada di tabel/​view lama:
--   1. `status` per kasus okupasi/sosial (Proses / Selesai) -- dipakai untuk
--      badge status di tabel, filter status, dan panel "Ringkasan Status".
--   2. `patok_terpasang` per baris -- jumlah patok yang sudah terpasang di
--      cluster kasus itu, diambil dari v_patok_report_latest (bukan kolom
--      baru, cuma di-join di view).
--
-- Default status 'proses' supaya data lama otomatis kebagian status yang
-- masuk akal (belum ditandai selesai) tanpa perlu diisi manual satu-satu.
-- =========================================================

alter table sosial_report
  add column if not exists status text not null default 'proses'
  check (status in ('proses', 'selesai'));

-- PENTING: pakai DROP + CREATE (bukan CREATE OR REPLACE VIEW) karena kolom
-- baru (status, patok_terpasang) disisipkan bukan cuma di akhir daftar --
-- lihat catatan yang sama di migration_sprint11_plank_jumlah.sql.
drop view if exists v_sosial_report;

create view v_sosial_report as
select
  s.id,
  s.cluster_id,
  c.name as lokasi,
  c.desa, c.kecamatan, c.kabupaten,
  s.luas_okupasi_m2,
  s.jenis_okupasi,
  s.pemilik_lahan,
  s.keterangan,
  s.status,
  s.tanggal_catat,
  coalesce(p.total_patok, 0) as patok_terpasang
from sosial_report s
join clusters c on c.id = s.cluster_id
left join v_patok_report_latest p on p.cluster_id = s.cluster_id
order by s.tanggal_catat desc, s.created_at desc;
