"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Link reset dari email sudah ditukar jadi sesi oleh /auth/callback sebelum
  // sampai ke halaman ini -- di sini kita cuma perlu pastikan sesinya ada.
  // Kalau tidak ada (link sudah dipakai / kedaluwarsa), tampilkan pesan error
  // daripada form yang tidak akan pernah berhasil disubmit.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("Gagal mengubah kata sandi. Coba lagi.");
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.refresh();
      router.push("/dashboard");
    }, 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-blue-950 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <ShieldCheck className="h-6 w-6 text-brand-blue" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Atur Kata Sandi Baru</h1>
        </div>

        {checking && <p className="mt-6 text-center text-sm text-slate-400">Memeriksa link...</p>}

        {!checking && !hasSession && !done && (
          <p className="mt-6 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
            Link reset kata sandi tidak valid atau sudah kedaluwarsa. Minta link baru dari halaman login.
          </p>
        )}

        {!checking && hasSession && !done && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-slate-600">Kata Sandi Baru</label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <div>
              <label className="text-sm text-slate-600">Konfirmasi Kata Sandi</label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
              {loading ? "Menyimpan..." : "Simpan kata sandi baru"}
            </button>
          </form>
        )}

        {done && (
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="text-sm text-slate-600">Kata sandi berhasil diubah. Mengalihkan ke dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
