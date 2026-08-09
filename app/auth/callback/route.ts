import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Dipanggil oleh Supabase setelah: (a) login Google berhasil, atau (b) link
// reset kata sandi di email diklik. Tugasnya cuma satu: tukar `code` di URL
// jadi sesi login (cookie) lewat exchangeCodeForSession, lalu redirect ke
// tujuan berikutnya (?next=...) -- default ke /dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code tidak ada / gagal ditukar (link kedaluwarsa, dipakai dua kali, dst).
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
