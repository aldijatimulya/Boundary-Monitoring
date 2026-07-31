-- =========================================================
-- MIGRASI SPRINT 10 — Plank Report, Sosial Report, Inventarisasi Report
-- Jalankan di Supabase SQL Editor SETELAH migration_sprint9_patok_status_permanen.sql.
-- =========================================================

-- =========================================================
-- 1. PLANK REPORT
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
