"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, LayersControl, Popup, useMap } from "react-leaflet";
import type { Layer, LatLngBoundsExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeeTileLayer, SpatialClusterFeature } from "@/lib/types";

// Ikon marker bawaan Leaflet mengandalkan path asset yang rusak saat dibundle
// lewat Next.js/webpack. Ganti ke CDN supaya tetap tampil (dipakai kalau nanti
// ada fitur marker titik, mis. lokasi tanda batas).
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STATUS_COLOR: Record<SpatialClusterFeature["status"], string> = {
  not_started: "#94A3B8",
  on_progress: "#F59E0B",
  completed: "#16A34A",
  need_follow_up: "#DC2626",
};

const STATUS_TEXT: Record<SpatialClusterFeature["status"], string> = {
  not_started: "Belum mulai",
  on_progress: "On progress",
  completed: "Selesai",
  need_follow_up: "Perlu tindak lanjut",
};

function FitToFeatures({ features }: { features: SpatialClusterFeature[] }) {
  const map = useMap();

  useMemo(() => {
    if (features.length === 0) return;
    const layer = L.geoJSON(features.map((f) => f.geometry) as any);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds as LatLngBoundsExpression, { padding: [24, 24] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features.length]);

  return null;
}

type Props = {
  features: SpatialClusterFeature[];
  geeLayers: GeeTileLayer[];
};

export default function SpatialMap({ features, geeLayers }: Props) {
  const styleFor = (feature?: GeoJSON.Feature) => {
    const status = (feature?.properties?.status as SpatialClusterFeature["status"]) ?? "not_started";
    return {
      color: STATUS_COLOR[status],
      weight: 2,
      fillColor: STATUS_COLOR[status],
      fillOpacity: 0.35,
    };
  };

  const geoJsonCollection = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: features.map((f) => ({
        type: "Feature" as const,
        geometry: f.geometry,
        properties: { ...f },
      })),
    }),
    [features]
  );

  const onEachFeature = (feature: GeoJSON.Feature, layer: Layer) => {
    const p = feature.properties as SpatialClusterFeature;
    const lokasi = [p.desa, p.kecamatan, p.kabupaten].filter(Boolean).join(", ");
    layer.bindPopup(
      `<div style="min-width:180px">
        <p style="font-weight:600;margin-bottom:4px">${p.name}</p>
        ${lokasi ? `<p style="font-size:12px;color:#64748b;margin-bottom:6px">${lokasi}</p>` : ""}
        <table style="font-size:12px;width:100%">
          <tr><td style="color:#64748b">Pembebasan</td><td style="text-align:right">${p.luas_pembebasan_ha.toLocaleString("id-ID")} ha</td></tr>
          <tr><td style="color:#64748b">Rekonstruksi</td><td style="text-align:right">${p.luas_rekonstruksi_ha.toLocaleString("id-ID")} ha</td></tr>
          <tr><td style="color:#64748b">Selisih</td><td style="text-align:right">${p.selisih_ha.toLocaleString("id-ID")} ha (${p.persen_selisih}%)</td></tr>
        </table>
        <p style="margin-top:6px">
          <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;background:${STATUS_COLOR[p.status]}22;color:${STATUS_COLOR[p.status]}">
            ${STATUS_TEXT[p.status]}
          </span>
        </p>
        <a href="/report" style="display:inline-block;margin-top:8px;font-size:12px;color:#2563EB">Lihat Reconstruction Report &rarr;</a>
      </div>`
    );
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={[-3.5, 104.5]} zoom={9} className="h-full w-full" scrollWheelZoom>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Citra Satelit (Esri)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri"
            />
          </LayersControl.BaseLayer>

          {geeLayers.map((layer) => (
            <LayersControl.Overlay key={layer.id} name={`GEE — ${layer.label}`}>
              <TileLayer url={layer.urlTemplate} attribution={layer.attribution} opacity={0.75} />
            </LayersControl.Overlay>
          ))}

          <LayersControl.Overlay checked name="Batas Cluster">
            <GeoJSON data={geoJsonCollection as any} style={styleFor as any} onEachFeature={onEachFeature}>
              {null}
            </GeoJSON>
          </LayersControl.Overlay>
        </LayersControl>

        <FitToFeatures features={features} />
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[1000] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-sm">
        <p className="mb-1 font-medium text-slate-700">Status cluster</p>
        {(Object.keys(STATUS_TEXT) as SpatialClusterFeature["status"][]).map((s) => (
          <div key={s} className="flex items-center gap-2 py-0.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLOR[s] }} />
            <span className="text-slate-600">{STATUS_TEXT[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
