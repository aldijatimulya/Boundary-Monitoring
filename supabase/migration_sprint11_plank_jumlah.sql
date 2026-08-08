-- =========================================================
-- MIGRASI SPRINT 11 — Kolom jumlah plank terpasang
-- Jalankan di Supabase SQL Editor.
--
-- Sebelumnya plank_locations cuma mencatat SATU baris per lokasi plank tanpa
-- kuantitas -- padahal satu lokasi kadang butuh lebih dari satu plank
-- terpasang. Kolom `jumlah_plank` ditambahkan supaya progres "Pemasangan
-- Plank" di Dashboard bisa dihitung otomatis: SUM(jumlah_plank) dibagi target
-- keseluruhan 150 titik.
--
-- Default 1 dan constraint >= 1 supaya data lama (yang belum punya nilai ini)
-- otomatis dianggap "1 plank per lokasi" -- estimasi paling wajar daripada 0,
-- karena kalau ada baris di plank_locations artinya minimal 1 plank memang
-- sudah terpasang di sana.
-- =========================================================

alter table plank_locations
  add column if not exists jumlah_plank integer not null default 1
  check (jumlah_plank >= 1);

create or replace view v_plank_locations as
select
  p.id,
  p.project_id,
  p.cluster_id,
  c.name as cluster_nama,
  p.nama_lokasi,
  p.jumlah_plank,
  p.koordinat_lat,
  p.koordinat_lng,
  p.geometry,
  p.foto_urls,
  p.keterangan,
  p.created_at
from plank_locations p
left join clusters c on c.id = p.cluster_id
order by p.created_at desc;
