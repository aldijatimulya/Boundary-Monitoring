import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Halaman/route yang tidak butuh login sama sekali. "/auth/callback" WAJIB
// ada di sini -- itu route yang baru saja dituju Google setelah user login,
// dan sesi (cookie) baru terbentuk SETELAH route itu selesai jalan. Kalau
// tidak dikecualikan, middleware ini akan keburu redirect ke /login duluan
// sebelum sempat menukar code jadi sesi.
const PUBLIC_PATHS = ["/login", "/auth/callback"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Tulis cookie baru (token refresh) ke request DAN response supaya
          // sesi tetap konsisten sepanjang siklus request ini.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Ini juga yang memicu refresh token otomatis kalau sudah mau kedaluwarsa --
  // wajib dipanggil supaya sesi tidak logout sendiri di tengah pemakaian.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware di semua path KECUALI:
     * - _next/static, _next/image (asset build Next.js)
     * - favicon.ico
     * - file statis lain (svg, png, jpg, dst)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
