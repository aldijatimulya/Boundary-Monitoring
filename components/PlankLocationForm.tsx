"use client";

import { useState } from "react";
import PhotoUpload from "@/components/PhotoUpload";
import { supabase } from "@/lib/supabase";
import { Cluster } from "@/lib/types";
import { extractGeometry, extractPoint, parseKmlToGeoJson } from "@/lib/geo";

type Props = {
  clusters: Cluster[];
  onClose: () => void;
  onSaved: () => void;
};

// Hitung centroid kasar dari ring pertama Polygon/MultiPolygon -- dipakai
// supaya field koordinat ikut terisi otomatis kalau yang di-upload polygon
// (mis. area kecil di sekitar plank), bukan cuma titik tunggal.
function roughCentroid(geom: { type: string; coordinates: unknown }): [number, number] | null {
  let ring: number[][] | null = null;
  if (geom.type === "Polygon") {
    ring = (geom.coordinates as number[][][])[0];
  } else if (geom.type === "MultiPolygon") {
    ring = (geom.coordinates as number[][][][])[0]?.[0];
  }
  if (!ring || ring.length === 0) return null;
  const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
  const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  return [lng, lat];
}

export default function PlankLocationForm({ clusters, onClose, onSaved }: Props) {
  const [namaLokasi, setNamaLokasi] = useState("");
  const [clusterId, setClusterId] = useState<string>("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [geometry, setGeometry] = useState<Record<string, unknown> | null>(null);
  const [fotoUrls, setFotoUrls] = useState<string[]>([]);
  const [keterangan, setKeterangan] = useState("");
  const [geoInfo, setGeoInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function applyParsedGeoJson(geojson: Record<string, unknown>, filename: string) {
    const polygon = extractGeometry(geojson);
    if (polygon) {
      setGeometry(polygon as unknown as Record<string, unknown>);
      const centroid = roughCentroid(polygon);
      if (centroid) {
        setLng(String(centroid[0]));
        setLat(String(centroid[1]));
      }
      setGeoInfo(`${filename} terbaca sebagai area (polygon).`);
      return;
    }
    const point = extractPoint(geojson);
    if (point) {
      const pointGeom = { type: "Point", coordinates: point };
      setGeometry(pointGeom);
      setLng(String(point[0]));
      setLat(String(point[1]));
      setGeoInfo(`${filename} terbaca sebagai titik lokasi.`);
      return;
    }
    setGeoInfo("");
    setError(`${filename} tidak mengandung koordinat/geometry yang bisa dibaca.`);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setGeoInfo(`Membaca ${file.name}...`);

    const isKml = /\.kml$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const geojson = isKml ? parseKmlToGeoJson(content) : (JSON.parse(content) as Record<string, unknown>);
        if (!geojson) {
          setGeoInfo("");
          setError("File KML tidak valid.");
          return;
        }
        applyParsedGeoJson(geojson, file.name);
      } catch {
        setGeoInfo("");
        setError(isKml ? "File bukan KML yang valid." : "File bukan JSON/GeoJSON yang valid.");
      }
    };
    reader.onerror = () => {
      setGeoInfo("");
      setError("Gagal membaca file.");
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!namaLokasi.trim()) {
      setError("Isi nama lokasi plank.");
      return;
    }
    setError("");
    setSaving(true);
    const { error: dbError } = await supabase.from("plank_locations").insert({
      cluster_id: clusterId || null,
      nama_lokasi: namaLokasi.trim(),
      koordinat_lat: lat ? Number(lat) : null,
      koordinat_lng: lng ? Number(lng) : null,
      geometry,
      foto_urls: fotoUrls,
      keterangan: keterangan || null,
    });
    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="my-8 w-full max-w-lg rounded-xl bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">Tambah lokasi plank</h2>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-slate-600">Nama lokasi</label>
            <input
              type="text"
              value={namaLokasi}
              onChange={(e) => setNamaLokasi(e.target.value)}
              placeholder="Cth: Plank Batas KM 12 - Cluster A"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Cluster terkait (opsional)</label>
            <select
              value={clusterId}
              onChange={(e) => setClusterId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">— Tidak terhubung ke cluster manapun —</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600">Upload KML/GeoJSON titik atau area plank (opsional)</label>
            <input
              type="file"
              accept=".geojson,.json,.kml,application/geo+json,application/json,application/vnd.google-earth.kml+xml"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm"
            />
            <p className="mt-1 text-xs text-slate-400">
              Kalau di-upload, koordinat di bawah otomatis terisi dan lokasi ini akan muncul sebagai layer terpisah
              "Lokasi Plank" di Spatial Map.
            </p>
            {geoInfo && <p className="mt-1 text-xs text-emerald-600">{geoInfo}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Latitude</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="-3.xxxx"
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Longitude</label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="104.xxxx"
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <PhotoUpload folder="plank" urls={fotoUrls} onChange={setFotoUrls} />

          <div>
            <label className="text-sm text-slate-600">Keterangan (opsional)</label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan lokasi plank"}
          </button>
        </div>
      </form>
    </div>
  );
}
