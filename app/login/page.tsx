"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ClipboardList,
  Crosshair,
  MapPinned,
  ShieldCheck,
  Layers,
  Lock as LockBadge,
  ArrowRight,
  Calendar,
  FileText,
  BarChart3,
  Globe,
} from "lucide-react";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Inventarisasi Data",
    points: ["Pengumpulan data batas wilayah", "Validasi dokumen legal", "Pemetaan kondisi existing"],
    badge: "bg-blue-600",
  },
  {
    icon: Crosshair,
    title: "Pengukuran RTK",
    points: ["Pengukuran titik batas GNSS RTK", "Rekam koordinat akurat real-time", "Validasi posisi titik batas"],
    badge: "bg-emerald-600",
  },
  {
    icon: MapPinned,
    title: "Pemasangan Tanda Batas",
    points: ["Pemasangan patok pipa permanen", "Patok dicat merah & kuning", "Dokumentasi & koordinat patok"],
    badge: "bg-amber-500",
  },
];

const PROCESS_STEPS = [
  { label: "Perencanaan", icon: Calendar },
  { label: "Inventarisasi Data", icon: FileText },
  { label: "Pengukuran RTK", icon: Crosshair },
  { label: "Pemasangan Patok", icon: MapPinned },
  { label: "Monitoring & Pelaporan", icon: BarChart3 },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, title: "Akurat & Terpercaya", desc: "Data akurat untuk keputusan tepat" },
  { icon: Layers, title: "Terintegrasi", desc: "Data, dokumen, dan peta dalam satu sistem" },
  { icon: LockBadge, title: "Aman & Terkendali", desc: "Akses terbatas untuk personel berwenang" },
];

type Mode = "login" | "forgot" | "forgot_sent";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email atau kata sandi salah. Coba lagi.");
      setLoading(false);
      return;
    }
    // router.refresh() penting: memaksa Server Component (mis. dashboard)
    // di-render ulang di server supaya langsung membaca cookie sesi yang baru
    // saja dibuat, bukan menampilkan versi cache dari sebelum login.
    router.refresh();
    router.push("/dashboard");
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError("Gagal mengirim link reset. Periksa email dan coba lagi.");
      return;
    }
    setMode("forgot_sent");
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // Kalau berhasil, browser langsung diarahkan ke Google -- baris di bawah
    // cuma jalan kalau ada error SEBELUM redirect (mis. provider Google belum
    // diaktifkan di Supabase Dashboard).
    if (error) {
      setError("Login Google belum tersedia. Hubungi admin untuk mengaktifkannya.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Panel kiri: branding, ilustrasi & sekilas alur kerja -- disembunyikan
          di layar sempit supaya form login tetap jadi fokus utama di HP */}
      <div className="relative hidden w-full flex-col overflow-hidden bg-white px-10 py-10 lg:flex lg:w-[58%] xl:px-16">
        <div className="relative flex items-center gap-3">
          <img src="/brand/medcoenergi-logo.png" alt="MedcoEnergi" className="h-10 w-10 object-contain" />
          <div>
            <p className="text-sm font-bold tracking-wide text-slate-900">MEDCOENERGI</p>
            <p className="text-[11px] text-slate-400">PT Medco E&P</p>
          </div>
        </div>

        <div className="relative mt-8 grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_360px]">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 xl:text-5xl">
              Boundary
              <br />
              <span className="text-brand-blue">Monitoring</span>
              <br />
              System
            </h1>
            <div className="mt-3 h-1 w-14 rounded-full bg-brand-blue" />
            <p className="mt-3 text-sm font-medium text-slate-500">PT Medco E&P South Sumatra Region</p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
              Sistem terintegrasi untuk mendukung kegiatan inventarisasi data, pengukuran batas menggunakan
              RTK, dan pemasangan tanda batas patok pipa secara akurat, terdokumentasi, dan terpantau.
            </p>
          </div>
          <div className="hidden xl:block">
            <LoginIllustration />
          </div>
        </div>

        <div className="relative mt-8 grid grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${f.badge}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <f.icon className="h-4 w-4 text-brand-blue" />
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-900">{f.title}</p>
              <ul className="mt-2 space-y-1">
                {f.points.map((p) => (
                  <li key={p} className="text-[11px] leading-snug text-slate-400">
                    • {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="relative mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          {PROCESS_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center text-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                  <step.icon className="h-3.5 w-3.5" />
                </span>
                <span className="mt-1.5 max-w-[70px] text-[10px] leading-tight text-slate-500">{step.label}</span>
              </div>
              {i < PROCESS_STEPS.length - 1 && (
                <div className="mx-2 h-px w-6 border-t border-dashed border-slate-300 xl:w-8" />
              )}
            </div>
          ))}
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-4 text-xs text-slate-500">
          {TRUST_BADGES.map((b) => (
            <div key={b.title} className="flex items-start gap-2">
              <b.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
              <div>
                <p className="font-medium text-slate-700">{b.title}</p>
                <p className="text-[11px] leading-snug">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative mt-6 text-[11px] text-slate-400">
          © {new Date().getFullYear()} PT Medco E&P South Sumatra Region. All rights reserved.
        </p>
      </div>

      {/* Panel kanan: form login, dengan background gelap + aksen dekoratif */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-blue-800 px-4 py-10 sm:px-8">
        <DotGridPattern />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />

        {/* Badge bahasa -- statis (cuma Bahasa Indonesia yang didukung saat
            ini), disiapkan sebagai tempat kalau nanti multi-bahasa dibangun */}
        <div className="absolute right-6 top-6 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
          <Globe className="h-3.5 w-3.5" />
          ID
        </div>

        <div className="relative w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <img src="/brand/medcoenergi-logo.png" alt="MedcoEnergi" className="h-12 w-12 object-contain" />
            <p className="mt-2 text-sm font-semibold text-white">Boundary Monitoring System</p>
            <p className="text-xs text-slate-300">PT Medco E&P South Sumatra Region</p>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white p-8 shadow-2xl">
            {mode !== "forgot_sent" && (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-blue-100">
                  <ShieldCheck className="h-6 w-6 text-brand-blue" />
                </div>
                {mode === "login" ? (
                  <>
                    <h2 className="mt-4 text-xl font-semibold text-slate-900">Selamat Datang Kembali! 👋</h2>
                    <p className="mt-1 text-sm text-slate-500">Masuk untuk melanjutkan ke dashboard.</p>
                  </>
                ) : (
                  <>
                    <h2 className="mt-4 text-xl font-semibold text-slate-900">Lupa Kata Sandi?</h2>
                    <p className="mt-1 text-sm text-slate-500">Masukkan email untuk menerima link reset.</p>
                  </>
                )}
              </div>
            )}

            {mode === "login" && (
              <>
                <form onSubmit={handleLogin} className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm text-slate-600">Email</label>
                    <div className="relative mt-1">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@medcoenergi.com"
                        className="w-full rounded-xl border border-transparent bg-slate-100/80 py-2.5 pl-9 pr-3 text-sm transition focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Kata Sandi</label>
                    <div className="relative mt-1">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan kata sandi"
                        className="w-full rounded-xl border border-transparent bg-slate-100/80 py-2.5 pl-9 pr-9 text-sm transition focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setMode("forgot");
                      }}
                      className="text-xs font-medium text-brand-blue hover:underline"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
                  >
                    {loading ? "Memproses..." : "Masuk"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-400">atau</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <GoogleIcon className="h-4 w-4" />
                  {googleLoading ? "Mengalihkan..." : "Masuk dengan Google"}
                </button>

                <div className="mt-6 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                  <LockBadge className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <p className="text-[11px] leading-snug text-slate-500">
                    Sistem terintegrasi untuk mendukung kegiatan boundary perusahaan. Hubungi admin proyek kalau
                    belum punya akun.
                  </p>
                </div>
              </>
            )}

            {mode === "forgot" && (
              <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm text-slate-600">Email</label>
                  <div className="relative mt-1">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@medcoenergi.com"
                      className="w-full rounded-xl border border-transparent bg-slate-100/80 py-2.5 pl-9 pr-3 text-sm transition focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 disabled:opacity-60"
                >
                  {loading ? "Mengirim..." : "Kirim link reset"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setMode("login");
                  }}
                  className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Kembali ke login
                </button>
              </form>
            )}

            {mode === "forgot_sent" && (
              <div className="flex flex-col items-center py-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                  <Mail className="h-6 w-6 text-emerald-600" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Cek Email Kamu</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Kalau <span className="font-medium text-slate-700">{email}</span> terdaftar, link reset kata
                  sandi sudah dikirim ke sana. Buka email itu untuk melanjutkan.
                </p>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="mt-6 text-xs font-medium text-brand-blue hover:underline"
                >
                  Kembali ke login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Logo Google 4-warna standar, dipakai sesuai pedoman branding tombol
 *  "Sign in with Google" -- bukan aset custom. */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.1-5.1C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 5.9 4.3C13.7 15.4 18.5 12.4 24 12.4c3.1 0 5.8 1.1 8 3l5.1-5.1C34 6.1 29.3 4 24 4c-7.4 0-13.8 4.1-17.1 10.1z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.3 0-9.7-3.3-11.3-7.9l-6.1 4.7C9.9 39.9 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.2 5.2C40.6 35.8 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

/** Ilustrasi vektor sederhana: petugas lapangan dengan alat GNSS RTK, gunung
 *  di latar belakang, dan patok pipa merah-kuning -- SVG asli, bukan foto. */
function LoginIllustration() {
  return (
    <svg viewBox="0 0 360 320" className="w-full" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="180" cy="290" rx="150" ry="18" fill="#EEF2FF" />
      <path d="M0 220 L60 140 L120 200 L190 100 L260 190 L360 210 L360 320 L0 320 Z" fill="#DBEAFE" opacity="0.6" />
      <path d="M40 230 L100 160 L150 210 L210 130 L270 220 Z" fill="#BFDBFE" opacity="0.7" />

      <circle cx="70" cy="60" r="18" fill="#F1F5F9" />
      <circle cx="100" cy="45" r="24" fill="#F8FAFC" />
      <circle cx="130" cy="65" r="16" fill="#F1F5F9" />

      <path d="M280 60 q10 -8 20 0" stroke="#93C5FD" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M295 50 q10 -8 20 0" stroke="#93C5FD" strokeWidth="3" fill="none" strokeLinecap="round" />

      <g transform="translate(255,120)">
        <rect x="-4" y="0" width="8" height="150" rx="3" fill="#CBD5E1" />
        <rect x="-16" y="150" width="32" height="10" rx="3" fill="#94A3B8" />
        <circle cx="0" cy="-14" r="16" fill="#2563EB" />
        <circle cx="0" cy="-14" r="7" fill="#BFDBFE" />
        <path d="M-24 -14 a24 24 0 0 1 48 0" stroke="#60A5FA" strokeWidth="3" fill="none" opacity="0.6" />
      </g>

      <g transform="translate(305,150)">
        <rect x="-7" y="0" width="14" height="90" fill="#DC2626" />
        <rect x="-7" y="18" width="14" height="18" fill="#FACC15" />
        <rect x="-7" y="54" width="14" height="18" fill="#FACC15" />
        <rect x="-11" y="88" width="22" height="8" rx="2" fill="#78716C" />
      </g>

      <g transform="translate(150,120)">
        <circle cx="20" cy="18" r="16" fill="#F2C9A0" />
        <path d="M4 16 a16 16 0 0 1 32 0 v-4 a16 16 0 0 0 -32 0 z" fill="#F8FAFC" />
        <rect x="0" y="30" width="40" height="60" rx="10" fill="#1D4ED8" />
        <rect x="-6" y="34" width="14" height="46" rx="6" fill="#1E40AF" />
        <rect x="32" y="34" width="14" height="46" rx="6" fill="#1E40AF" />
        <rect x="6" y="86" width="12" height="40" rx="5" fill="#334155" />
        <rect x="22" y="86" width="12" height="40" rx="5" fill="#334155" />
        <rect x="2" y="122" width="20" height="8" rx="3" fill="#0F172A" />
        <rect x="18" y="122" width="20" height="8" rx="3" fill="#0F172A" />
        <rect x="30" y="46" width="18" height="26" rx="3" fill="#0EA5A0" transform="rotate(18 39 59)" />
      </g>
    </svg>
  );
}

/** Pola titik-titik dekoratif di pojok kanan-bawah panel gelap, murni CSS/SVG. */
function DotGridPattern() {
  const dots = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      dots.push(<circle key={`${row}-${col}`} cx={col * 14} cy={row * 14} r="1.4" fill="white" />);
    }
  }
  return (
    <svg className="pointer-events-none absolute bottom-6 right-6 h-20 w-20 opacity-20" viewBox="0 0 84 84">
      {dots}
    </svg>
  );
}
