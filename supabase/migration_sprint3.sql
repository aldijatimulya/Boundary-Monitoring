-- =========================================================
-- MIGRASI SPRINT 3 — Storage untuk foto laporan
-- Jalankan file ini di SQL Editor Supabase HANYA JIKA kamu sudah
-- menjalankan schema.sql + migration_sprint2.sql sebelumnya.
-- Kalau ini instalasi baru, cukup jalankan schema.sql (sudah termasuk semua ini).
-- =========================================================

-- 1. Buat bucket "report-photos" (public read, supaya foto bisa ditampilkan
--    langsung di dashboard/PDF tanpa perlu signed URL)
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

-- 2. Policy: siapa pun yang login boleh upload
create policy "authenticated_upload_report_photos"
on storage.objects for insert
with check (bucket_id = 'report-photos' and auth.role() = 'authenticated');

-- 3. Policy: semua orang boleh baca (karena bucket public + dipakai untuk
--    ditampilkan di laporan PDF/dashboard)
create policy "public_read_report_photos"
on storage.objects for select
using (bucket_id = 'report-photos');

-- 4. Policy: user yang login boleh hapus foto yang pernah diunggah
create policy "authenticated_delete_report_photos"
on storage.objects for delete
using (bucket_id = 'report-photos' and auth.role() = 'authenticated');
