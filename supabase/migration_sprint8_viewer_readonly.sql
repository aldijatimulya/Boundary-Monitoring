-- =========================================================
-- MIGRASI SPRINT 8 — Akses viewer read-only (untuk pihak perusahaan/klien)
-- Jalankan di Supabase SQL Editor SETELAH migration_sprint7_patok_percentage_fix.sql.
--
-- BUG yang diperbaiki: semua policy insert/update/delete di schema.sql cuma
-- mengecek `auth.role() = 'authenticated'` -- yaitu status login Supabase,
-- BUKAN kolom `role` di tabel `profiles` (admin/surveyor/pic_lapangan/
-- viewer_medco). Akibatnya SEMUA akun yang login -- termasuk akun viewer --
-- sebenarnya masih bisa insert/update/delete lewat API, walau tombol di UI-nya
-- disembunyikan. Migrasi ini menegakkan pembatasan itu di level database,
-- supaya viewer betul-betul read-only walau mereka utak-atik lewat DevTools
-- sekalipun.
--
-- Aman dijalankan berkali-kali (drop policy if exists dulu).
-- =========================================================

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
-- viewer_medco (dan role lain yang tidak terdaftar di sini) akan selalu false.
create or replace function can_edit()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_profile_role() in ('admin', 'surveyor', 'pic_lapangan'), false)
$$;

-- ---- Ganti semua policy insert/update/delete supaya pakai can_edit() ----

drop policy if exists "write_field_roles" on daily_reports;
create policy "write_field_roles" on daily_reports for insert with check (can_edit());
drop policy if exists "update_field_roles" on daily_reports;
create policy "update_field_roles" on daily_reports for update using (can_edit());

drop policy if exists "write_field_roles" on weekly_reports;
create policy "write_field_roles" on weekly_reports for insert with check (can_edit());
drop policy if exists "update_field_roles" on weekly_reports;
create policy "update_field_roles" on weekly_reports for update using (can_edit());

drop policy if exists "write_field_roles" on monthly_reports;
create policy "write_field_roles" on monthly_reports for insert with check (can_edit());
drop policy if exists "update_field_roles" on monthly_reports;
create policy "update_field_roles" on monthly_reports for update using (can_edit());

drop policy if exists "write_field_roles" on report_matrix;
create policy "write_field_roles" on report_matrix for insert with check (can_edit());

drop policy if exists "write_patok_report" on patok_report;
create policy "write_patok_report" on patok_report for insert with check (can_edit());

drop policy if exists "write_field_roles" on timeline_activities;
create policy "write_field_roles" on timeline_activities for insert with check (can_edit());
drop policy if exists "update_timeline" on timeline_activities;
create policy "update_timeline" on timeline_activities for update using (can_edit());

drop policy if exists "write_clusters" on clusters;
create policy "write_clusters" on clusters for insert with check (can_edit());
drop policy if exists "update_clusters" on clusters;
create policy "update_clusters" on clusters for update using (can_edit());

drop policy if exists "write_projects" on projects;
create policy "write_projects" on projects for insert with check (can_edit());

drop policy if exists "write_documents" on documents;
create policy "write_documents" on documents for insert with check (can_edit());
drop policy if exists "delete_documents" on documents;
create policy "delete_documents" on documents for delete using (can_edit());

-- ---- Storage (upload/hapus file foto laporan & Document Center) ----

drop policy if exists "authenticated_upload_report_photos" on storage.objects;
create policy "authenticated_upload_report_photos"
on storage.objects for insert
with check (bucket_id = 'report-photos' and can_edit());

drop policy if exists "authenticated_delete_report_photos" on storage.objects;
create policy "authenticated_delete_report_photos"
on storage.objects for delete
using (bucket_id = 'report-photos' and can_edit());

drop policy if exists "authenticated_upload_documents" on storage.objects;
create policy "authenticated_upload_documents"
on storage.objects for insert
with check (bucket_id = 'documents' and can_edit());

drop policy if exists "authenticated_delete_documents" on storage.objects;
create policy "authenticated_delete_documents"
on storage.objects for delete
using (bucket_id = 'documents' and can_edit());

-- Catatan: kebijakan SELECT (baca) di semua tabel TIDAK diubah -- tetap
-- `auth.role() = 'authenticated'`, supaya viewer tetap bisa melihat semua data
-- (dashboard, laporan, peta, dsb), cuma tidak bisa menulis/mengubah/menghapus.
