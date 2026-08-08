"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PlankLocation } from "@/lib/types";

const TERPASANG_COLOR = "#16A34A"; // hijau -- semua lokasi tercatat berarti sudah terpasang

function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    const bounds = L.latLngBounds(points as L.LatLngExpression[]);
    if (bounds.isValid()) {
      map.fitBounds(bounds as LatLngBoundsExpression, { padding: [24, 24] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length]);

  return null;
}

export default function PlankMiniMap({ planks }: { planks: PlankLocation[] }) {
  const points = useMemo(
    () =>
      planks
        .filter((p) => p.koordinat_lat != null && p.koordinat_lng != null)
        .map((p) => ({ p, latlng: [Number(p.koordinat_lat), Number(p.koordinat_lng)] as [number, number] })),
    [planks]
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg">
      <MapContainer center={[-3.5, 104.5]} zoom={9} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        {points.map(({ p, latlng }) => (
          <CircleMarker
            key={p.id}
            center={latlng}
            radius={7}
            color={TERPASANG_COLOR}
            weight={2}
            fillColor={TERPASANG_COLOR}
            fillOpacity={0.85}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">{p.nama_lokasi}</p>
                {p.cluster_nama && <p className="text-slate-500">{p.cluster_nama}</p>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
        <FitToMarkers points={points.map((pt) => pt.latlng)} />
      </MapContainer>
    </div>
  );
}
