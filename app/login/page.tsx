"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email atau kata sandi salah. Coba lagi.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm rounded-xl bg-white p-8">
        <h1 className="text-lg font-medium text-slate-900">Boundary Monitoring System</h1>
        <p className="mt-1 text-sm text-slate-500">Masuk untuk melanjutkan ke dashboard.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-slate-600">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@medcoenergi.com"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Kata sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-brand-blue py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Masuk
          </button>
        </div>
      </form>
    </div>
  );
}
