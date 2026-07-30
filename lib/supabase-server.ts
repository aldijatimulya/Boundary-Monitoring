import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client Supabase untuk dipakai di Server Component / Server Action
 * (mis. app/(main)/dashboard/page.tsx, app/(main)/spatial/page.tsx).
 *
 * Beda dengan lib/supabase.ts (browser client), client ini membaca sesi login
 * dari COOKIE request yang masuk (lewat next/headers `cookies()`), supaya
 * query yang dijalankan di server ikut membawa token user yang sama seperti
 * di browser -- sehingga RLS policy `auth.role() = 'authenticated'` di
 * Supabase tetap lolos dan datanya konsisten dengan halaman client-side
 * lain (Report, Analytics, dst).
 *
 * Dipanggil ulang tiap request (jangan disimpan sebagai singleton module-level)
 * karena `cookies()` hanya valid dalam lingkup satu request.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Bisa gagal kalau dipanggil dari Server Component murni (bukan
          // Server Action/Route Handler) -- aman diabaikan karena sesi tetap
          // di-refresh lewat middleware.ts di setiap request.
        }
      },
    },
  });
}
