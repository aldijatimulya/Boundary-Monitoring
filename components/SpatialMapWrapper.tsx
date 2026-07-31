"use client";

import dynamic from "next/dynamic";
import { GeeTileLayer, SpatialClusterFeature, PlankLocation } from "@/lib/types";

// Leaflet mengakses `window`/`document` saat modul di-load, jadi wajib
// di-render hanya di client (ssr: false). Ini tidak bisa dilakukan langsung
// di server component (app/(main)/spatial/page.tsx), makanya dipecah lewat
// wrapper client ini.
const SpatialMap = dynamic(() => import("@/components/SpatialMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400">
      Memuat peta...
    </div>
  ),
});

type Props = {
  features: SpatialClusterFeature[];
  geeLayers: GeeTileLayer[];
  plankLocations?: PlankLocation[];
};

export default function SpatialMapWrapper({ features, geeLayers, plankLocations = [] }: Props) {
  return <SpatialMap features={features} geeLayers={geeLayers} plankLocations={plankLocations} />;
}
