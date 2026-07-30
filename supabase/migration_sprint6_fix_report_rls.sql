-- =========================================================
-- MIGRASI SPRINT 6 — Perbaikan RLS: weekly_reports & monthly_reports
-- Jalankan file ini di Supabase SQL Editor (project yang sudah punya schema.sql).
--
-- BUG: schema.sql mengaktifkan Row Level Security di tabel weekly_reports dan
-- monthly_reports serta membuat policy SELECT untuk keduanya, TAPI lupa
-- membuat policy INSERT (dan UPDATE). Postgres RLS defaultnya deny-all untuk
-- operasi yang tidak punya policy eksplisit -- makanya submit "Laporan
-- Mingguan" / "Laporan Bulanan" selalu gagal dengan error:
--   "new row violates row-level security policy for table weekly_reports"
-- padahal daily_reports sudah benar sejak awal (sudah ada policy
-- "write_field_roles" untuk insert).
--
-- Migrasi ini aman dijalankan berkali-kali (pakai drop policy if exists dulu).
-- =========================================================

drop policy if exists "write_field_roles" on weekly_reports;
create policy "write_field_roles" on weekly_reports
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "write_field_roles" on monthly_reports;
create policy "write_field_roles" on monthly_reports
  for insert with check (auth.role() = 'authenticated');

-- Sekalian tambahkan UPDATE policy untuk ketiga tabel laporan (daily/weekly/
-- monthly) -- belum ada sama sekali sebelumnya, jadi kalau nanti dibuatkan
-- fitur "edit laporan" akan kena masalah RLS yang sama seperti di atas.
drop policy if exists "update_field_roles" on daily_reports;
create policy "update_field_roles" on daily_reports
  for update using (auth.role() = 'authenticated');

drop policy if exists "update_field_roles" on weekly_reports;
create policy "update_field_roles" on weekly_reports
  for update using (auth.role() = 'authenticated');

drop policy if exists "update_field_roles" on monthly_reports;
create policy "update_field_roles" on monthly_reports
  for update using (auth.role() = 'authenticated');
