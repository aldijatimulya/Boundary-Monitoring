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
} from "lucide-react";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Inventarisasi Data",
    points: ["Pengumpulan data batas wilayah", "Validasi dokumen legal", "Pemetaan kondisi existing"],
  },
  {
    icon: Crosshair,
    title: "Pengukuran RTK",
    points: ["Pengukuran titik batas GNSS RTK", "Rekam koordinat akurat real-time", "Validasi posisi titik batas"],
  },
  {
    icon: MapPinned,
    title: "Pemasangan Tanda Batas",
    points: ["Pemasangan patok pipa permanen", "Patok dicat merah & kuning", "Dokumentasi & koordinat patok"],
  },
];

const PROCESS_STEPS = ["Perencanaan", "Inventarisasi Data", "Pengukuran RTK", "Pemasangan Patok", "Monitoring & Pelaporan"];

const TRUST_BADGES = [
  { icon: ShieldCheck, title: "Akurat & Terpercaya", desc: "Data akurat untuk keputusan tepat" },
  { icon: Layers, title: "Terintegrasi", desc: "Data, dokumen, dan peta dalam satu sistem" },
  { icon: LockBadge, title: "Aman & Terkendali", desc: "Akses terbatas untuk personel berwenang" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-navy-950">
      {/* Panel kiri: branding & sekilas alur kerja -- disembunyikan di layar sempit
          supaya form login tetap jadi fokus utama di HP */}
      <div className="relative hidden w-full max-w-2xl flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-blue-900 px-10 py-10 text-white lg:flex xl:px-16">
        <DecorativePattern />

        <div className="relative">
          <div className="flex items-center gap-3">
            <img src="/brand/medcoenergi-logo.png" alt="MedcoEnergi" className="h-10 w-10 object-contain" />
            <span className="text-sm font-semibold tracking-wide text-white">MEDCOENERGI</span>
          </div>

          <h1 className="mt-8 text-4xl font-bold leading-tight xl:text-5xl">
            Boundary
            <br />
            <span className="text-blue-400">Monitoring System</span>
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-300">PT Medco E&P South Sumatra Region</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            Sistem terintegrasi untuk mendukung kegiatan inventarisasi data, pengukuran batas menggunakan
            RTK, dan pemasangan tanda batas patok pipa secara akurat, terdokumentasi, dan terpantau.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <f.icon className="h-4 w-4 text-blue-300" />
                </div>
                <p className="mt-3 text-xs font-semibold text-white">{f.title}</p>
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
        </div>

        <div className="relative space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center text-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <span className="mt-1.5 max-w-[70px] text-[10px] leading-tight text-slate-400">{step}</span>
                </div>
                {i < PROCESS_STEPS.length - 1 && <div className="mx-2 h-px w-6 bg-white/10 xl:w-10" />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs text-slate-400">
            {TRUST_BADGES.map((b) => (
              <div key={b.title} className="flex items-start gap-2">
                <b.icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                <div>
                  <p className="font-medium text-slate-200">{b.title}</p>
                  <p className="text-[11px] leading-snug">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-slate-500">
            © {new Date().getFullYear()} PT Medco E&P South Sumatra Region. All rights reserved.
          </p>
        </div>
      </div>

      {/* Panel kanan: form login */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <img src="/brand/medcoenergi-logo.png" alt="MedcoEnergi" className="h-12 w-12 object-contain" />
            <p className="mt-2 text-sm font-semibold text-slate-700">Boundary Monitoring System</p>
            <p className="text-xs text-slate-400">PT Medco E&P South Sumatra Region</p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <ShieldCheck className="h-6 w-6 text-brand-blue" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">Selamat Datang Kembali</h2>
              <p className="mt-1 text-sm text-slate-500">Masuk untuk melanjutkan ke dashboard.</p>
            </div>

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
                    className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
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
                    className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-9 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
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

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-brand-blue py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <div className="mt-6 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
              <LockBadge className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <p className="text-[11px] leading-snug text-slate-500">
                Sistem terintegrasi untuk mendukung kegiatan boundary perusahaan. Hubungi admin proyek kalau
                belum punya akun.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Pola garis kontur dekoratif ala peta topografi, murni SVG -- tidak pakai foto. */
function DecorativePattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15]"
      viewBox="0 0 600 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {[80, 160, 240, 320, 400, 480, 560, 640, 720].map((y, i) => (
        <path
          key={y}
          d={`M -50 ${y} C 100 ${y - 40}, 200 ${y + 40}, 350 ${y - 20} S 550 ${y + 30}, 650 ${y}`}
          stroke="white"
          strokeWidth="1"
          opacity={0.5 - i * 0.03}
        />
      ))}
      {[
        [120, 140],
        [420, 260],
        [300, 520],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill="#60A5FA" opacity={0.6} />
      ))}
    </svg>
  );
}
