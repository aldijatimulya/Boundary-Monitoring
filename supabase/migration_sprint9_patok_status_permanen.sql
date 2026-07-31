-- =========================================================
-- MIGRASI SPRINT 9 — Status Patok Report berdasarkan patok PERMANEN
-- Jalankan di Supabase SQL Editor SETELAH migration_sprint8_viewer_readonly.sql.
--
-- Perubahan: status sebelumnya "terpasang" asal ada patok SEMENTARA ataupun
-- PERMANEN (total > 0) -- jadi cluster yang baru dipasang patok sementara
-- (belum ada satupun patok permanen) ikut tertandai "Sudah terpasang", padahal
-- belum. Sekarang status murni berdasarkan JUMLAH PATOK PERMANEN:
--   - permanen = 0  -> "belum_terpasang"
--   - permanen > 0  -> "terpasang"
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
    when coalesce(pr.jumlah_patok_permanen, 0) > 0 then 'terpasang'
    else 'belum_terpasang'
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
