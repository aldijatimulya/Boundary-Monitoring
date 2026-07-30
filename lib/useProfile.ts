"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type ProfileRole = "admin" | "surveyor" | "pic_lapangan" | "viewer_medco";

type Profile = {
  full_name: string;
  role: ProfileRole;
};

// Ambil profil (nama + role) user yang sedang login. Dipakai untuk
// menyembunyikan tombol edit/tambah/hapus dari akun viewer di UI --
// pembatasan sesungguhnya tetap ditegakkan lewat RLS (can_edit() di database),
// ini cuma supaya viewer tidak melihat tombol yang nanti ditolak server.
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        if (active) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", auth.user.id)
        .single();
      if (active) {
        setProfile((data as Profile) ?? null);
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const canEdit = profile ? profile.role !== "viewer_medco" : false; // default false sampai role terkonfirmasi, biar tidak "muncul-lalu-hilang"

  return { profile, loading, canEdit };
}