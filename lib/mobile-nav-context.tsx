"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type MobileNavContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

/**
 * Bungkus seluruh halaman di dalam grup route (main) supaya Sidebar (drawer
 * di mobile) dan Topbar (tombol hamburger) bisa berbagi satu state yang sama,
 * tanpa perlu prop-drilling lewat setiap halaman yang me-render <Topbar />.
 */
export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <MobileNavContext.Provider value={{ open, setOpen }}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav harus dipakai di dalam <MobileNavProvider>");
  return ctx;
}
