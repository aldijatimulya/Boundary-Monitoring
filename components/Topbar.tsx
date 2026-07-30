"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Topbar({ title }: { title: string }) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <h1 className="text-lg font-medium text-slate-900">{title}</h1>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>Admin Medco</span>
        <div className="h-8 w-8 rounded-full bg-slate-200" />
        <button
          onClick={handleLogout}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          Keluar
        </button>
      </div>
    </header>
  );
}
