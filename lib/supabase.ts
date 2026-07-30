import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client ini dipakai di semua komponen/halaman "use client" (browser).
// Pakai createBrowserClient dari @supabase/ssr (bukan createClient biasa dari
// @supabase/supabase-js) supaya sesi login disimpan lewat COOKIE, bukan cuma
// localStorage. Ini penting karena Server Component (dashboard, spatial) dan
// middleware.ts perlu ikut membaca sesi yang sama lewat cookie request --
// kalau sesi cuma di localStorage, server tidak akan pernah tahu user sudah
// login, dan semua query ke tabel yang di-protect RLS
// (`auth.role() = 'authenticated'`) akan dianggap anonim lalu diblokir.
//
// Untuk operasi admin sisi-server (butuh bypass RLS), buat client terpisah
// dengan SUPABASE_SERVICE_ROLE_KEY di dalam route handler / server action --
// jangan pernah expose service role ke browser.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
