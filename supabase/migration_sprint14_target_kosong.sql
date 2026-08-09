-- =========================================================
-- MIGRASI SPRINT 14 — Target kosong/nol dengan realisasi terisi dianggap Selesai
-- Jalankan di Supabase SQL Editor.
--
-- Kasus: cluster yang target pembebasannya (luas_pembebasan_ha) belum diisi
-- atau nol, tapi sudah ada realisasi rekonstruksi tercatat -- sebelumnya
-- dianggap "On progress" dengan % Realisasi 0% (karena dibagi target=0).
-- Sekarang dianggap "Selesai" langsung, % Selisih = 0%.
-- =========================================================

create or replace view v_report_matrix_latest as
select
  c.id as cluster_id,
  c.project_id,
  c.name as lokasi,
  c.desa, c.kecamatan, c.kabupaten,
  c.luas_pembebasan_ha,
  c.luas_deliniasi_ha,
  coalesce(rm.luas_rekonstruksi_ha, 0) as luas_rekonstruksi_ha,
  coalesce(rm.luas_rekonstruksi_ha, 0) - c.luas_pembebasan_ha as selisih_ha,
  case
    when c.luas_pembebasan_ha > 0
      then round(((coalesce(rm.luas_rekonstruksi_ha, 0) - c.luas_pembebasan_ha) / c.luas_pembebasan_ha) * 100, 2)
    -- Target kosong/nol tapi realisasi sudah ada -- anggap sudah pas (0%),
    -- bukan dibagi nol.
    when coalesce(rm.luas_rekonstruksi_ha, 0) > 0 then 0
    else 0
  end as persen_selisih,
  case
    when coalesce(rm.luas_rekonstruksi_ha, 0) = 0 then 'not_started'
    -- Target kosong/nol + realisasi sudah diisi -> langsung Selesai.
    when c.luas_pembebasan_ha <= 0 then 'completed'
    when abs((coalesce(rm.luas_rekonstruksi_ha, 0) - c.luas_pembebasan_ha) / c.luas_pembebasan_ha) <= 0.10
      then 'completed'
    else 'on_progress'
  end as status,
  rm.tanggal_update
from clusters c
left join lateral (
  select luas_rekonstruksi_ha, tanggal_update
  from report_matrix
  where report_matrix.cluster_id = c.id
  order by tanggal_update desc
  limit 1
) rm on true;
