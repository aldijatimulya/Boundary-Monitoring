"use client";

import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { useMobileNav } from "@/lib/mobile-nav-context";
import { getInitials, getAvatarStyle, ROLE_LABEL } from "@/lib/avatar";

export default function Topbar({ title }: { title: string }) {
  const router = useRouter();
  const { profile } = useProfile();
  const { setOpen } = useMobileNav();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  const displayName = profile?.full_name ?? "Memuat...";
  const roleLabel = profile ? ROLE_LABEL[profile.role] ?? profile.role : "";
  const avatar = getAvatarStyle(profile?.full_name || "?");

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          className="-ml-1 shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-base font-medium text-slate-900 sm:text-lg">{title}</h1>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <div className="hidden text-right sm:block">
          <p className="font-medium text-slate-700">{displayName}</p>
          {roleLabel && <p className="text-xs text-slate-400">{roleLabel}</p>}
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 ${avatar.bg} ${avatar.text} ${avatar.ring}`}
          title={profile ? `${displayName} — ${roleLabel}` : undefined}
        >
          {getInitials(displayName)}
        </div>
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
