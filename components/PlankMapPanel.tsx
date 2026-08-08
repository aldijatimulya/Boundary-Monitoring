"use client";

import dynamic from "next/dynamic";
import { PlankLocation } from "@/lib/types";

// Leaflet mengakses `window`/`document` saat modul di-load, jadi wajib
// di-render hanya di client (ssr: false) -- sama seperti pola SpatialMapWrapper.
const PlankMiniMap = dynamic(() => import("@/components/PlankMiniMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-400">
      Memuat peta...
    </div>
  ),
});

export default function PlankMapPanel({ planks }: { planks: PlankLocation[] }) {
  const withCoords = planks.filter((p) => p.koordinat_lat != null && p.koordinat_lng != null);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-900">Peta Lokasi Plank</p>
      <div className="mt-3 h-64 w-full">
        {withCoords.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-400">
            Belum ada lokasi dengan koordinat.
          </div>
        ) : (
          <PlankMiniMap planks={planks} />
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        Terpasang ({withCoords.length})
      </div>
    </div>
  );
}
