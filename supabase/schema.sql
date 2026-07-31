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
-- Helper: role profil user yang sedang login (dari tabel profiles, bukan
-- auth.role() bawaan Supabase yang cuma tahu "authenticated"/"anon").
create or replace function current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

-- Helper: apakah user boleh menulis/mengubah data (admin, surveyor, pic_lapangan).
-- viewer_medco (dan role lain yang tidak terdaftar) selalu false -- read-only.
create or replace function can_edit()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_profile_role() in ('admin', 'surveyor', 'pic_lapangan'), false)
$$;

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

-- Hanya role admin/surveyor/pic_lapangan (can_edit()) yang boleh menulis data
-- lapangan -- viewer_medco cuma bisa baca (lihat policy select di atas).
create policy "write_field_roles" on daily_reports for insert with check (can_edit());
create policy "write_field_roles" on weekly_reports for insert with check (can_edit());
create policy "write_field_roles" on monthly_reports for insert with check (can_edit());
create policy "update_field_roles" on daily_reports for update using (can_edit());
create policy "update_field_roles" on weekly_reports for update using (can_edit());
create policy "update_field_roles" on monthly_reports for update using (can_edit());
create policy "write_field_roles" on report_matrix for insert with check (can_edit());
create policy "write_patok_report" on patok_report for insert with check (can_edit());
create policy "write_field_roles" on timeline_activities for insert with check (can_edit());
create policy "update_timeline" on timeline_activities for update using (can_edit());
create policy "write_clusters" on clusters for insert with check (can_edit());
create policy "update_clusters" on clusters for update using (can_edit());
create policy "write_projects" on projects for insert with check (can_edit());
create policy "write_documents" on documents for insert with check (can_edit());
create policy "delete_documents" on documents for delete using (can_edit());

-- =========================================================
-- STORAGE: bucket untuk dokumentasi foto laporan
-- =========================================================
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

create policy "authenticated_upload_report_photos"
on storage.objects for insert
with check (bucket_id = 'report-photos' and can_edit());

create policy "public_read_report_photos"
on storage.objects for select
using (bucket_id = 'report-photos');

create policy "authenticated_delete_report_photos"
on storage.objects for delete
using (bucket_id = 'report-photos' and can_edit());

-- Bucket untuk Document Center (SHP/DXF/PDF/Excel/foto/drone)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "authenticated_upload_documents"
on storage.objects for insert
with check (bucket_id = 'documents' and can_edit());

create policy "public_read_documents"
on storage.objects for select
using (bucket_id = 'documents');

create policy "authenticated_delete_documents"
on storage.objects for delete
using (bucket_id = 'documents' and can_edit());

-- Catatan: policy di atas adalah baseline. Perketat sesuai kebutuhan role
-- (misal admin-only untuk update/delete) setelah modul auth berjalan di Sprint 1.
-- Satu baris = satu lokasi plank (papan tanda batas) yang sudah dipasang.
-- Beda dengan clusters (yang merepresentasikan batas WILAYAH), plank_locations
-- ini titik/area kecil spesifik tempat plank berdiri -- bisa banyak per
-- cluster, bisa juga tidak terhubung ke cluster manapun.
-- =========================================================
create table plank_locations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  cluster_id uuid references clusters(id) on delete set null,
  nama_lokasi text not null,
  koordinat_lat numeric,
  koordinat_lng numeric,
  -- GeoJSON Point/Polygon dari upload KML/GeoJSON (opsional) -- disinkronkan
  -- ke Spatial Map sebagai layer terpisah "Lokasi Plank".
  geometry jsonb,
  foto_urls text[],
  keterangan text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create view v_plank_locations as
select
  p.id,
  p.project_id,
  p.cluster_id,
  c.name as cluster_nama,
  p.nama_lokasi,
  p.koordinat_lat,
  p.koordinat_lng,
  p.geometry,
  p.foto_urls,
  p.keterangan,
  p.created_at
from plank_locations p
left join clusters c on c.id = p.cluster_id
order by p.created_at desc;

alter table plank_locations enable row level security;
create policy "read_all_authenticated" on plank_locations for select using (auth.role() = 'authenticated');
create policy "write_plank_locations" on plank_locations for insert with check (can_edit());
create policy "update_plank_locations" on plank_locations for update using (can_edit());
create policy "delete_plank_locations" on plank_locations for delete using (can_edit());

-- =========================================================
-- 2. SOSIAL REPORT
-- Satu baris = satu kasus okupasi/permasalahan sosial di suatu cluster.
-- Beda dengan report_matrix/patok_report (yang ambil update TERBARU saja),
-- di sini SEMUA baris ditampilkan -- satu cluster wajar punya banyak kasus
-- okupasi berbeda sekaligus (bukan riwayat yang saling menimpa).
-- =========================================================
create table sosial_report (
  id uuid primary key default uuid_generate_v4(),
  cluster_id uuid references clusters(id) on delete cascade,
  luas_okupasi_m2 numeric(12,2) not null default 0,
  jenis_okupasi text,
  pemilik_lahan text,
  keterangan text,
  tanggal_catat date not null default current_date,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

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
  s.tanggal_catat
from sosial_report s
join clusters c on c.id = s.cluster_id
order by s.tanggal_catat desc, s.created_at desc;

alter table sosial_report enable row level security;
create policy "read_all_authenticated" on sosial_report for select using (auth.role() = 'authenticated');
create policy "write_sosial_report" on sosial_report for insert with check (can_edit());
create policy "update_sosial_report" on sosial_report for update using (can_edit());
create policy "delete_sosial_report" on sosial_report for delete using (can_edit());

-- =========================================================
-- 3. INVENTARISASI REPORT
-- Cluster -> banyak Lokasi (mis. "SWF 1", "SWF 2"...) -> banyak Pemilik lahan
-- per lokasi, masing-masing dengan luasannya sendiri (m2). Total luasan per
-- cluster = rekap otomatis dari seluruh pemilik di seluruh lokasi cluster itu.
-- =========================================================
create table inventarisasi_lokasi (
  id uuid primary key default uuid_generate_v4(),
  cluster_id uuid references clusters(id) on delete cascade,
  nama_lokasi text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table inventarisasi_pemilik (
  id uuid primary key default uuid_generate_v4(),
  lokasi_id uuid references inventarisasi_lokasi(id) on delete cascade,
  nama_pemilik text not null,
  luas_m2 numeric(12,2) not null default 0,
  keterangan text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Detail gabungan lokasi + pemilik, siap dikelompokkan di sisi aplikasi
-- (per cluster -> per lokasi -> daftar pemilik).
create view v_inventarisasi_detail as
select
  c.id as cluster_id,
  c.name as cluster_nama,
  il.id as lokasi_id,
  il.nama_lokasi,
  ip.id as pemilik_id,
  ip.nama_pemilik,
  ip.luas_m2,
  ip.keterangan
from inventarisasi_lokasi il
join clusters c on c.id = il.cluster_id
left join inventarisasi_pemilik ip on ip.lokasi_id = il.id
order by c.name, il.nama_lokasi, ip.nama_pemilik;

-- Rekap total per cluster -- dipakai untuk kartu ringkasan di halaman.
create view v_inventarisasi_summary as
select
  c.id as cluster_id,
  c.name as lokasi,
  count(distinct il.id) as jumlah_lokasi,
  count(ip.id) as jumlah_pemilik,
  coalesce(sum(ip.luas_m2), 0) as total_luas_m2
from clusters c
left join inventarisasi_lokasi il on il.cluster_id = c.id
left join inventarisasi_pemilik ip on ip.lokasi_id = il.id
group by c.id, c.name;

alter table inventarisasi_lokasi enable row level security;
create policy "read_all_authenticated" on inventarisasi_lokasi for select using (auth.role() = 'authenticated');
create policy "write_inventarisasi_lokasi" on inventarisasi_lokasi for insert with check (can_edit());
create policy "delete_inventarisasi_lokasi" on inventarisasi_lokasi for delete using (can_edit());

alter table inventarisasi_pemilik enable row level security;
create policy "read_all_authenticated" on inventarisasi_pemilik for select using (auth.role() = 'authenticated');
create policy "write_inventarisasi_pemilik" on inventarisasi_pemilik for insert with check (can_edit());
create policy "update_inventarisasi_pemilik" on inventarisasi_pemilik for update using (can_edit());
create policy "delete_inventarisasi_pemilik" on inventarisasi_pemilik for delete using (can_edit());
