-- =========================================================
-- SKEMA DATABASE: Boundary Monitoring System (Medco E&P SSR)
-- Jalankan file ini di Supabase SQL Editor
-- =========================================================

create extension if not exists "uuid-ossp";

-- 1. PROFILES (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin','surveyor','pic_lapangan','viewer_medco')) default 'viewer_medco',
  team text,
  created_at timestamptz default now()
);

-- 2. PROJECTS (induk proyek, misal "SSR Boundary Reconstruction 2024")
create table projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  client_name text not null default 'PT Medco E&P South Sumatra Region',
  start_date date,
  end_date date,
  status text check (status in ('planning','ongoing','completed','on_hold')) default 'planning',
  created_at timestamptz default now()
);

-- 3. CLUSTERS (wilayah/blok kerja dalam satu proyek)
create table clusters (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  desa text,
  kecamatan text,
  kabupaten text,
  luas_pembebasan_ha numeric(12,2) not null default 0,
  luas_deliniasi_ha numeric(12,2) default 0,
  target_rekonstruksi_ha numeric(12,2),
  geometry jsonb,
  keterangan text,
  created_at timestamptz default now()
);

-- 4. REPORT MATRIX (progres rekonstruksi per cluster, time-series)
-- Catatan: selisih & persentase TIDAK disimpan di sini karena bergantung pada
-- data cluster (tabel lain) -- Postgres generated column tidak boleh lintas tabel.
-- Nilai turunan itu dihitung di view v_report_matrix di bawah.
create table report_matrix (
  id uuid primary key default uuid_generate_v4(),
  cluster_id uuid references clusters(id) on delete cascade,
  tanggal_update date not null default current_date,
  luas_rekonstruksi_ha numeric(12,2) not null default 0,
  keterangan text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- 4b. PATOK REPORT (progres pemasangan tanda batas per cluster, time-series —
-- pola sama seperti report_matrix: tiap "Catat update" nambah baris baru).
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

-- 5. TIMELINE ACTIVITIES (matriks Gantt)
create table timeline_activities (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  cluster_id uuid references clusters(id),
  parent_activity_id uuid references timeline_activities(id),
  -- predecessor: kegiatan yang harus selesai dulu sebelum kegiatan ini bisa mulai
  predecessor_id uuid references timeline_activities(id),
  nama_kegiatan text not null,
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  -- durasi dihitung otomatis, tidak diinput manual
  durasi_hari integer generated always as (tanggal_selesai - tanggal_mulai + 1) stored,
  pic text,
  status text check (status in ('belum_mulai','on_progress','selesai','delay')) default 'belum_mulai',
  progres_persen numeric(5,2) default 0,
  bobot numeric(5,2) default 1,
  created_at timestamptz default now()
);

create index idx_timeline_parent on timeline_activities(parent_activity_id);
create index idx_timeline_predecessor on timeline_activities(predecessor_id);

-- 6. DAILY REPORTS
create table daily_reports (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  cluster_id uuid references clusters(id),
  tanggal date not null,
  tim text,
  personil integer,
  jam_kerja_mulai time,
  jam_kerja_selesai time,
  kegiatan text not null,
  target text,
  realisasi text,
  cuaca text,
  koordinat_lat numeric(10,6),
  koordinat_lng numeric(10,6),
  material_digunakan text,
  permasalahan text,
  mitigasi text,
  kesimpulan text,
  rencana_besok text,
  foto_urls text[],
  dibuat_oleh uuid references profiles(id),
  disetujui_oleh uuid references profiles(id),
  status_approval text check (status_approval in ('draft','submitted','approved')) default 'draft',
  created_at timestamptz default now()
);

-- 7. WEEKLY REPORTS
create table weekly_reports (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  minggu_ke integer not null,
  periode_mulai date not null,
  periode_selesai date not null,
  ringkasan_capaian text,
  progres_rencana_persen numeric(5,2),
  progres_realisasi_persen numeric(5,2),
  kendala text,
  mitigasi text,
  foto_urls text[],
  dibuat_oleh uuid references profiles(id),
  disetujui_oleh uuid references profiles(id),
  created_at timestamptz default now()
);

-- 8. MONTHLY REPORTS
create table monthly_reports (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  bulan integer not null,
  tahun integer not null,
  ringkasan_eksekutif text,
  progres_rencana_persen numeric(5,2),
  progres_realisasi_persen numeric(5,2),
  analisis_kendala text,
  proyeksi_bulan_depan text,
  lampiran_urls text[],
  dibuat_oleh uuid references profiles(id),
  disetujui_oleh uuid references profiles(id),
  created_at timestamptz default now()
);

-- 9. DOCUMENTS (Document Center: SHP, DXF, PDF, Excel, foto, drone)
create table documents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  cluster_id uuid references clusters(id),
  nama_file text not null,
  kategori text check (kategori in ('shp','dxf','pdf','excel','foto','drone','lainnya')) not null,
  file_url text not null,
  ukuran_kb integer,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- =========================================================
-- VIEWS: kalkulasi otomatis (dipakai langsung oleh dashboard/report matrix)
-- =========================================================

-- Report matrix per cluster: ambil update TERBARU tiap cluster + hitung selisih & %
create view v_report_matrix_latest as
select
  c.id as cluster_id,
  c.project_id,
  c.name as lokasi,
  c.desa, c.kecamatan, c.kabupaten,
  c.luas_pembebasan_ha,
  c.luas_deliniasi_ha,
  coalesce(rm.luas_rekonstruksi_ha, 0) as luas_rekonstruksi_ha,
  c.luas_pembebasan_ha - coalesce(rm.luas_rekonstruksi_ha, 0) as selisih_ha,
  case when c.luas_pembebasan_ha > 0
    then round(((c.luas_pembebasan_ha - coalesce(rm.luas_rekonstruksi_ha, 0)) / c.luas_pembebasan_ha) * 100, 2)
    else 0 end as persen_selisih,
  case
    when coalesce(rm.luas_rekonstruksi_ha, 0) = 0 then 'not_started'
    when coalesce(rm.luas_rekonstruksi_ha, 0) >= c.luas_pembebasan_ha * 0.95 then 'completed'
    when coalesce(rm.luas_rekonstruksi_ha, 0) >= c.luas_pembebasan_ha * 0.70 then 'on_progress'
    else 'need_follow_up'
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

-- Patok report per cluster: ambil update TERBARU tiap cluster + hitung total &
-- persentase. Persentase = patok permanen dibagi patok SEMENTARA (jumlah titik
-- yang perlu di-upgrade jadi permanen) -- bukan dibagi total sementara+permanen.
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

-- Progres proyek keseluruhan (dipakai untuk kartu "Progres Proyek" di dashboard)
create view v_project_progress as
select
  project_id,
  sum(luas_pembebasan_ha) as total_pembebasan_ha,
  sum(luas_rekonstruksi_ha) as total_rekonstruksi_ha,
  case when sum(luas_pembebasan_ha) > 0
    then round((sum(luas_rekonstruksi_ha) / sum(luas_pembebasan_ha)) * 100, 2)
    else 0 end as progres_persen
from v_report_matrix_latest
group by project_id;

-- Progres induk otomatis dari sub-kegiatan: rata-rata tertimbang (bobot) anak-anaknya.
-- Kalau kegiatan tidak punya anak, pakai progres_persen miliknya sendiri.
create view v_timeline_progress as
select
  t.id,
  t.project_id,
  t.nama_kegiatan,
  t.parent_activity_id,
  t.predecessor_id,
  t.tanggal_mulai,
  t.tanggal_selesai,
  t.durasi_hari,
  t.pic,
  t.bobot,
  case
    when exists (select 1 from timeline_activities c where c.parent_activity_id = t.id)
    then coalesce((
      select round(sum(c.progres_persen * c.bobot) / nullif(sum(c.bobot), 0), 2)
      from timeline_activities c
      where c.parent_activity_id = t.id
    ), 0)
    else t.progres_persen
  end as progres_terhitung,
  -- status turunan: delay kalau lewat tanggal selesai tapi belum 100%
  case
    when t.status = 'selesai' then 'selesai'
    when current_date > t.tanggal_selesai and t.progres_persen < 100 then 'delay'
    when t.progres_persen > 0 then 'on_progress'
    else t.status
  end as status_terhitung,
  -- peringatan dependency: mulai lebih awal dari selesainya predecessor
  case
    when p.tanggal_selesai is not null and t.tanggal_mulai < p.tanggal_selesai
    then true else false
  end as dependency_conflict,
  p.tanggal_selesai as predecessor_selesai
from timeline_activities t
left join timeline_activities p on p.id = t.predecessor_id;

-- =========================================================
-- ROW LEVEL SECURITY: aktifkan supaya data aman by default
-- =========================================================
alter table profiles enable row level security;
alter table projects enable row level security;
alter table clusters enable row level security;
alter table patok_report enable row level security;
alter table report_matrix enable row level security;
alter table timeline_activities enable row level security;
alter table daily_reports enable row level security;
alter table weekly_reports enable row level security;
alter table monthly_reports enable row level security;
alter table documents enable row level security;

-- Semua user yang sudah login boleh membaca (dashboard bersifat internal tim + Medco viewer)
create policy "read_all_authenticated" on projects for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated" on clusters for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated" on report_matrix for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated" on patok_report for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated" on timeline_activities for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated" on daily_reports for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated" on weekly_reports for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated" on monthly_reports for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated" on documents for select using (auth.role() = 'authenticated');
create policy "read_own_profile" on profiles for select using (auth.role() = 'authenticated');

-- Hanya surveyor/pic_lapangan/admin yang boleh menulis data lapangan
create policy "write_field_roles" on daily_reports for insert with check (auth.role() = 'authenticated');
-- BUG di versi awal: policy insert weekly/monthly_reports sempat tidak dibuat,
-- padahal RLS-nya sudah aktif (default deny-all) -- lihat migration_sprint6_fix_report_rls.sql.
create policy "write_field_roles" on weekly_reports for insert with check (auth.role() = 'authenticated');
create policy "write_field_roles" on monthly_reports for insert with check (auth.role() = 'authenticated');
create policy "update_field_roles" on daily_reports for update using (auth.role() = 'authenticated');
create policy "update_field_roles" on weekly_reports for update using (auth.role() = 'authenticated');
create policy "update_field_roles" on monthly_reports for update using (auth.role() = 'authenticated');
create policy "write_field_roles" on report_matrix for insert with check (auth.role() = 'authenticated');
create policy "write_patok_report" on patok_report for insert with check (auth.role() = 'authenticated');
create policy "write_field_roles" on timeline_activities for insert with check (auth.role() = 'authenticated');
create policy "update_timeline" on timeline_activities for update using (auth.role() = 'authenticated');
create policy "write_clusters" on clusters for insert with check (auth.role() = 'authenticated');
create policy "update_clusters" on clusters for update using (auth.role() = 'authenticated');
create policy "write_projects" on projects for insert with check (auth.role() = 'authenticated');
create policy "write_documents" on documents for insert with check (auth.role() = 'authenticated');
create policy "delete_documents" on documents for delete using (auth.role() = 'authenticated');

-- =========================================================
-- STORAGE: bucket untuk dokumentasi foto laporan
-- =========================================================
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

create policy "authenticated_upload_report_photos"
on storage.objects for insert
with check (bucket_id = 'report-photos' and auth.role() = 'authenticated');

create policy "public_read_report_photos"
on storage.objects for select
using (bucket_id = 'report-photos');

create policy "authenticated_delete_report_photos"
on storage.objects for delete
using (bucket_id = 'report-photos' and auth.role() = 'authenticated');

-- Bucket untuk Document Center (SHP/DXF/PDF/Excel/foto/drone)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "authenticated_upload_documents"
on storage.objects for insert
with check (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "public_read_documents"
on storage.objects for select
using (bucket_id = 'documents');

create policy "authenticated_delete_documents"
on storage.objects for delete
using (bucket_id = 'documents' and auth.role() = 'authenticated');

-- Catatan: policy di atas adalah baseline. Perketat sesuai kebutuhan role
-- (misal admin-only untuk update/delete) setelah modul auth berjalan di Sprint 1.
