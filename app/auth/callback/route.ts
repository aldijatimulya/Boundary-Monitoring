import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Setelah user login lewat Google (atau provider OAuth lain), Supabase
// redirect balik ke sini dengan query `?code=...`. Tugas route ini cuma satu:
// tukar code itu jadi session (cookie) lewat exchangeCodeForSession, lalu
// redirect ke halaman tujuan. Tanpa route ini, redirect dari Google akan
// 404 dan sesi TIDAK PERNAH terbentuk -- ini penyebab utama "Masuk dengan
// Google" gagal.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // `next` opsional -- kalau nanti ada kebutuhan redirect ke halaman spesifik
  // setelah login (bukan selalu /dashboard), tinggal kirim ?next=/xxx.
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    let response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
    // Kalau gagal tukar code (mis. code kedaluwarsa/dipakai ulang), lempar ke
    // login dengan pesan error supaya user tahu, bukan diam-diam redirect ke
    // dashboard tanpa sesi.
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  // Tidak ada `code` sama sekali di URL -- kemungkinan diakses langsung/salah.
  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
