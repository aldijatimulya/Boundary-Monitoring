-- =========================================================
-- MIGRASI SPRINT 4 (bagian 3) — Document Center
-- Jalankan file ini di SQL Editor Supabase HANYA JIKA kamu sudah menjalankan
-- schema.sql sebelumnya (tabel `documents` sudah ada sejak Sprint 1, tapi
-- belum punya policy insert/delete dan belum ada bucket storage-nya).
-- Kalau ini instalasi baru, cukup jalankan schema.sql (sudah termasuk semua ini).
-- =========================================================

-- 1. Policy tabel `documents`: siapa pun yang login boleh upload metadata &
--    menghapus (baseline sama seperti tabel lain di project ini — perketat
--    per-role kalau modul role-based access sudah aktif).
create policy "write_documents"
on documents for insert
with check (auth.role() = 'authenticated');

create policy "delete_documents"
on documents for delete
using (auth.role() = 'authenticated');

-- 2. Bucket "documents" (public read, supaya link unduh & preview foto/drone
--    bisa langsung dibuka tanpa signed URL — sama seperti bucket report-photos
--    di Sprint 3). Kalau file SHP/DXF proyek bersifat sangat rahasia, beri
--    tahu saya — bisa diganti ke private bucket + signed URL.
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
