-- =========================================================
-- MIGRASI SPRINT 13 — Perbaikan formula Selisih & status Reconstruction Report
-- Jalankan di Supabase SQL Editor.
--
-- Perubahan pada view v_report_matrix_latest:
--
-- 1. SELISIH sekarang = REALISASI - TARGET (sebelumnya TARGET - REALISASI).
--    Jadi nilai negatif = realisasi masih kurang dari target, nol/positif =
--    sudah sesuai atau melebihi target. % Selisih ikut dibalik tandanya.
--
-- 2. Status "Selesai" sekarang berarti: sudah ADA realisasi tercatat (bukan
--    nol) DAN selisihnya terhadap target berada dalam toleransi ±10%.
--    Sebelumnya butuh realisasi >=95% dari target -- ini keliru karena
--    rekonstruksi yang sudah benar-benar dikerjakan di lapangan tetap
--    dianggap "belum selesai" hanya gara-gara progress bar belum tepat
--    100%, padahal pekerjaannya memang sudah dilakukan di lokasi itu.
--
-- 3. Status "On progress" sekarang berarti: sudah ada realisasi tercatat,
--    TAPI selisihnya terhadap target masih di luar toleransi ±10%.
--
-- 4. Threshold lama 70%-95% (yang menghasilkan status "need_follow_up" /
--    "Delay") dihapus dari perhitungan otomatis ini. Enum status &
--    label "Perlu tindak lanjut"/"Delay" di kode SENGAJA dibiarkan ada
--    untuk kompatibilitas (tidak akan pernah error), tapi datanya akan
--    selalu 0 di panel Ringkasan Progres kecuali dipakai lagi nanti untuk
--    keperluan lain (mis. status yang di-override manual).
--
-- CREATE OR REPLACE dipakai (bukan DROP+CREATE) karena daftar & urutan
-- kolom TIDAK berubah -- cuma isi definisinya. Ini aman dipakai meski ada
-- view lain (v_project_progress) yang SELECT dari view ini.
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
  case when c.luas_pembebasan_ha > 0
    then round(((coalesce(rm.luas_rekonstruksi_ha, 0) - c.luas_pembebasan_ha) / c.luas_pembebasan_ha) * 100, 2)
    else 0 end as persen_selisih,
  case
    when coalesce(rm.luas_rekonstruksi_ha, 0) = 0 then 'not_started'
    when c.luas_pembebasan_ha > 0
      and abs((coalesce(rm.luas_rekonstruksi_ha, 0) - c.luas_pembebasan_ha) / c.luas_pembebasan_ha) <= 0.10
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
