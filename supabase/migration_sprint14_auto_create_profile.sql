-- =========================================================
-- MIGRASI SPRINT 14 — Auto-buat profil untuk user baru (termasuk login Google)
-- Jalankan di Supabase SQL Editor.
--
-- Sebelum ini, kolom `profiles` diisi manual satu-satu (admin invite user
-- lewat Dashboard, lalu insert baris `profiles` sendiri). Itu cukup selama
-- SATU-SATUNYA cara login adalah email/password yang di-invite admin.
--
-- Sekarang ada tombol "Masuk dengan Google" -- artinya siapa pun dengan akun
-- Google (yang diizinkan di OAuth consent screen) bisa MEMBUAT AKUN BARU
-- sendiri saat pertama kali klik tombol itu (Supabase otomatis bikin baris
-- auth.users). Tanpa trigger ini, baris auth.users itu tidak akan punya
-- pasangan baris `profiles` -- akibatnya seluruh halaman aplikasi error/kosong
-- karena useProfile() tidak menemukan profil apa pun untuk user itu.
--
-- Trigger ini menutup celah itu: begitu ada baris baru di auth.users (dari
-- provider MANAPUN -- Google atau email/password), otomatis dibuatkan baris
-- `profiles` dengan role default 'viewer_medco' (read-only, paling aman).
-- Supaya SEMUA login Google baru otomatis "admin", bukan itu yang dilakukan
-- migrasi ini -- role admin/surveyor/pic_lapangan tetap harus di-set manual
-- oleh admin lewat UPDATE (lihat contoh di paling bawah), persis seperti
-- alur invite manual sebelumnya, cuma sekarang tidak perlu INSERT lagi.
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    'viewer_medco'
  )
  on conflict (id) do nothing; -- jaga-jaga kalau baris profiles sudah dibuat manual lebih dulu
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------
-- Cara menjadikan seseorang admin/surveyor/pic_lapangan SETELAH mereka login
-- pertama kali (baik lewat Google maupun email/password) -- jalankan manual
-- di SQL Editor, ganti email-nya:
--
--   update profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'nama@medcoenergi.com');
--
-- Role yang valid: 'admin', 'surveyor', 'pic_lapangan', 'viewer_medco'.
-- ---------------------------------------------------------
