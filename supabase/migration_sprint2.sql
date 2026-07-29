-- =========================================================
-- MIGRASI SPRINT 2
-- Jalankan file ini di SQL Editor Supabase HANYA JIKA kamu sudah
-- menjalankan supabase/schema.sql versi Sprint 1 sebelumnya.
-- Kalau ini instalasi baru, cukup jalankan schema.sql (sudah termasuk semua ini).
-- =========================================================

-- 1. Tambah kolom dependency antar kegiatan
alter table timeline_activities
  add column if not exists predecessor_id uuid references timeline_activities(id);

create index if not exists idx_timeline_parent on timeline_activities(parent_activity_id);
create index if not exists idx_timeline_predecessor on timeline_activities(predecessor_id);

-- 2. View rollup progres otomatis + deteksi konflik dependency
create or replace view v_timeline_progress as
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
  case
    when t.status = 'selesai' then 'selesai'
    when current_date > t.tanggal_selesai and t.progres_persen < 100 then 'delay'
    when t.progres_persen > 0 then 'on_progress'
    else t.status
  end as status_terhitung,
  case
    when p.tanggal_selesai is not null and t.tanggal_mulai < p.tanggal_selesai
    then true else false
  end as dependency_conflict,
  p.tanggal_selesai as predecessor_selesai
from timeline_activities t
left join timeline_activities p on p.id = t.predecessor_id;

-- 3. Policy tambahan untuk form input Sprint 2 (edit kegiatan, tambah cluster/project)
drop policy if exists "update_timeline" on timeline_activities;
create policy "update_timeline" on timeline_activities for update using (auth.role() = 'authenticated');

drop policy if exists "write_clusters" on clusters;
create policy "write_clusters" on clusters for insert with check (auth.role() = 'authenticated');

drop policy if exists "update_clusters" on clusters;
create policy "update_clusters" on clusters for update using (auth.role() = 'authenticated');

drop policy if exists "write_projects" on projects;
create policy "write_projects" on projects for insert with check (auth.role() = 'authenticated');
