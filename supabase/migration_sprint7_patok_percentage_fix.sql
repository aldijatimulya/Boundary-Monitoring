-- =========================================================
-- MIGRASI SPRINT 7 — Perbaikan Patok Report
-- Jalankan di Supabase SQL Editor SETELAH migration_sprint5_patok.sql dan
-- migration_sprint6_fix_report_rls.sql.
--
-- Perubahan:
-- 1. Persentase sekarang = patok permanen ÷ patok SEMENTARA (bukan ÷ total
--    sementara+permanen). "Sementara" dianggap sebagai jumlah titik yang perlu
--    di-upgrade jadi permanen, jadi persentase ini = seberapa banyak dari
--    titik itu yang sudah permanen. (Cluster dgn 20 sementara & 20 permanen
--    sekarang benar tampil 100%, bukan 50%.)
-- 2. Tambah kolom `keterangan` (dari update terakhir) supaya bisa ditampilkan
--    di tabel Patok Report -- misalnya untuk menjelaskan kenapa ada patok
--    sementara yang belum di-upgrade jadi permanen.
-- =========================================================

create or replace view v_patok_report_latest as
select
  c.id as cluster_id,
  c.project_id,
  c.name as lokasi,
  c.desa, c.kecamatan, c.kabupaten,
  coalesce(pr.jumlah_patok_sementara, 0) as jumlah_patok_sementara,
  coalesce(pr.jumlah_patok_permanen, 0) as jumlah_patok_permanen,
  coalesce(pr.jumlah_patok_sementara, 0) + coalesce(pr.jumlah_patok_permanen, 0) as total_patok,
  case
    when coalesce(pr.jumlah_patok_sementara, 0) > 0
      then round((coalesce(pr.jumlah_patok_permanen, 0)::numeric / pr.jumlah_patok_sementara) * 100, 2)
    when coalesce(pr.jumlah_patok_permanen, 0) > 0 then 100
    else 0
  end as persen_permanen,
  case
    when coalesce(pr.jumlah_patok_sementara, 0) + coalesce(pr.jumlah_patok_permanen, 0) = 0 then 'belum_terpasang'
    else 'terpasang'
  end as status,
  pr.tanggal_update,
  pr.keterangan
from clusters c
left join lateral (
  select jumlah_patok_sementara, jumlah_patok_permanen, tanggal_update, keterangan
  from patok_report
  where patok_report.cluster_id = c.id
  order by tanggal_update desc
  limit 1
) pr on true;
