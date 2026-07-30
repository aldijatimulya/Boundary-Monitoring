-- =========================================================
-- MIGRASI SPRINT 5 — Patok Report
-- Jalankan file ini di Supabase SQL Editor (project yang sudah punya schema.sql).
-- Menambahkan tabel & view baru untuk mencatat progres pemasangan tanda batas
-- (patok sementara & permanen) per cluster, terpisah dari Reconstruction Report.
-- =========================================================

-- 1. PATOK REPORT (progres pemasangan patok per cluster, time-series — sama
--    polanya seperti report_matrix: tiap "Catat update" nambah baris baru,
--    bukan menimpa data lama, supaya histori pemasangan bisa ditelusuri).
create table patok_report (
  id uuid primary key default uuid_generate_v4(),
  cluster_id uuid references clusters(id) on delete cascade,
  tanggal_update date not null default current_date,
  jumlah_patok_sementara integer not null default 0,
  jumlah_patok_permanen integer not null default 0,
  keterangan text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- 2. VIEW: ambil update TERBARU tiap cluster + hitung total & persentase.
--    Persentase = patok permanen dibagi total patok terpasang (sementara +
--    permanen) yang tercatat pada update terakhir itu.
--    Status: "belum_terpasang" kalau belum ada patok sama sekali (total = 0),
--    selain itu "terpasang".
create view v_patok_report_latest as
select
  c.id as cluster_id,
  c.project_id,
  c.name as lokasi,
  c.desa, c.kecamatan, c.kabupaten,
  coalesce(pr.jumlah_patok_sementara, 0) as jumlah_patok_sementara,
  coalesce(pr.jumlah_patok_permanen, 0) as jumlah_patok_permanen,
  coalesce(pr.jumlah_patok_sementara, 0) + coalesce(pr.jumlah_patok_permanen, 0) as total_patok,
  case
    when coalesce(pr.jumlah_patok_sementara, 0) + coalesce(pr.jumlah_patok_permanen, 0) > 0
    then round(
      (coalesce(pr.jumlah_patok_permanen, 0)::numeric /
        (coalesce(pr.jumlah_patok_sementara, 0) + coalesce(pr.jumlah_patok_permanen, 0))) * 100, 2)
    else 0
  end as persen_permanen,
  case
    when coalesce(pr.jumlah_patok_sementara, 0) + coalesce(pr.jumlah_patok_permanen, 0) = 0 then 'belum_terpasang'
    else 'terpasang'
  end as status,
  pr.tanggal_update
from clusters c
left join lateral (
  select jumlah_patok_sementara, jumlah_patok_permanen, tanggal_update
  from patok_report
  where patok_report.cluster_id = c.id
  order by tanggal_update desc
  limit 1
) pr on true;

-- 3. ROW LEVEL SECURITY — pola sama seperti report_matrix (baca untuk semua
--    yang login, insert untuk semua yang login; perketat per-role kalau modul
--    role-based access sudah aktif).
alter table patok_report enable row level security;

create policy "read_all_authenticated" on patok_report for select using (auth.role() = 'authenticated');
create policy "write_patok_report" on patok_report for insert with check (auth.role() = 'authenticated');
