"use client";

import { useRef, useState } from "react";
import { kml as kmlToGeoJson } from "@tmcw/togeojson";
import { supabase } from "@/lib/supabase";
import { Cluster } from "@/lib/types";

type Props = {
  clusterId: string;
  clusterName: string;
  currentGeometry: Cluster["geometry"];
  onClose: () => void;
  onSaved: () => void;
};

// Buang nilai Z (elevasi) dari array koordinat, sisakan [lng, lat] saja.
function stripZ(coords: unknown): unknown {
  if (Array.isArray(coords) && coords.length > 0 && typeof coords[0] === "number") {
    return [coords[0], coords[1]];
  }
  if (Array.isArray(coords)) {
    return coords.map(stripZ);
  }
  return coords;
}

// Kumpulkan SEMUA ring polygon dari sebuah geometry (termasuk yang bersarang
// di GeometryCollection) ke dalam `out`. Dipakai supaya kalau file punya
// beberapa Polygon/MultiPolygon terpisah, semuanya ikut kepakai — bukan cuma
// yang pertama.
function collectPolygonRings(geom: Record<string, unknown> | null | undefined, out: unknown[]) {
  if (!geom || typeof geom !== "object") return;
  if (geom.type === "Polygon" && Array.isArray(geom.coordinates)) {
    out.push(geom.coordinates);
  } else if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
    out.push(...(geom.coordinates as unknown[]));
  } else if (geom.type === "GeometryCollection" && Array.isArray(geom.geometries)) {
    (geom.geometries as Record<string, unknown>[]).forEach((g) => collectPolygonRings(g, out));
  }
}

// Ambil geometry Polygon/MultiPolygon dari berbagai bentuk GeoJSON (Feature,
// FeatureCollection dengan banyak feature, GeometryCollection, atau geometry
// mentah), gabungkan semua bagian yang ditemukan jadi satu Polygon/MultiPolygon,
// lalu buang nilai Z (elevasi). Mengembalikan null kalau tidak ada polygon sama sekali.
function extractGeometry(raw: unknown): { type: string; coordinates: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const rings: unknown[] = [];

  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    for (const feature of obj.features as Record<string, unknown>[]) {
      collectPolygonRings(feature?.geometry as Record<string, unknown>, rings);
    }
  } else if (obj.type === "Feature") {
    collectPolygonRings(obj.geometry as Record<string, unknown>, rings);
  } else {
    collectPolygonRings(obj, rings);
  }

  if (rings.length === 0) return null;

  const cleaned = stripZ(rings) as unknown[];
  if (cleaned.length === 1) {
    return { type: "Polygon", coordinates: cleaned[0] };
  }
  return { type: "MultiPolygon", coordinates: cleaned };
}

// Parse isi file .kml jadi GeoJSON FeatureCollection lewat @tmcw/togeojson,
// lalu lewatkan ke extractGeometry seperti file .geojson biasa.
function parseKml(text: string): { type: string; coordinates: unknown } | null {
  const xml = new DOMParser().parseFromString(text, "text/xml");
  const parserError = xml.querySelector("parsererror");
  if (parserError) return null;
  const geojson = kmlToGeoJson(xml);
  return extractGeometry(geojson);
}

export default function ClusterGeometryForm({ clusterId, clusterName, currentGeometry, onClose, onSaved }: Props) {
  const [text, setText] = useState(currentGeometry ? JSON.stringify(currentGeometry, null, 2) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadInfo, setUploadInfo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function saveGeometry(geometry: { type: string; coordinates: unknown }) {
    setSaving(true);
    setError("");
    const { error: dbError } = await supabase.from("clusters").update({ geometry }).eq("id", clusterId);
    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    onSaved();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploadInfo(`Membaca ${file.name}...`);

    const isKml = /\.kml$/i.test(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const content = reader.result as string;
        const geometry = isKml ? parseKml(content) : extractGeometry(JSON.parse(content));

        if (!geometry) {
          setUploadInfo("");
          setError(
            isKml
              ? "File KML tidak mengandung Polygon batas area yang valid (cek isi Placemark-nya)."
              : 'File tidak mengandung geometry bertipe "Polygon"/"MultiPolygon" yang valid (cek isi file .geojson-nya).'
          );
          return;
        }
        setText(JSON.stringify(geometry));
        setUploadInfo(`${file.name} terbaca — menyimpan otomatis...`);
        await saveGeometry(geometry);
        setUploadInfo(`${file.name} berhasil disimpan.`);
      } catch {
        setUploadInfo("");
        setError(isKml ? "File bukan KML yang valid." : "File bukan JSON/GeoJSON yang valid.");
      }
    };
    reader.onerror = () => {
      setUploadInfo("");
      setError("Gagal membaca file.");
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!text.trim()) {
      setError("Tempel GeoJSON Polygon/MultiPolygon, upload file, atau tutup form ini kalau belum punya datanya.");
      return;
    }

    let geometry;
    try {
      geometry = JSON.parse(text);
    } catch {
      setError("Bukan JSON yang valid.");
      return;
    }
    if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") {
      setError('Geometri harus bertipe "Polygon" atau "MultiPolygon".');
      return;
    }

    await saveGeometry(geometry);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">Geometri batas — {clusterName}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload file <code className="rounded bg-slate-100 px-1 text-xs">.geojson</code> atau{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">.kml</code> hasil export dari QGIS/Google Earth/Global
          Mapper/Earth Engine — akan otomatis tersimpan begitu terbaca. Mendukung format Feature, FeatureCollection,
          GeometryCollection, maupun geometry mentah (Polygon/MultiPolygon); kalau ada beberapa
          bagian/Placemark polygon, semuanya digabung otomatis, dan nilai Z/elevasi otomatis dibuang.
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file && fileInputRef.current) {
              const dt = new DataTransfer();
              dt.items.add(file);
              fileInputRef.current.files = dt.files;
              handleFileChange({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>);
            }
          }}
          className="mt-4 cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-brand-blue hover:bg-blue-50"
        >
          <p className="text-sm font-medium text-slate-700">Klik untuk pilih file, atau drag & drop di sini</p>
          <p className="mt-1 text-xs text-slate-400">.geojson, .json, atau .kml</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".geojson,.json,.kml,application/geo+json,application/json,application/vnd.google-earth.kml+xml"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {uploadInfo && <p className="mt-2 text-xs text-brand-blue">{uploadInfo}</p>}

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          atau tempel manual
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='{"type":"Polygon","coordinates":[[[104.7,-3.1],...]]}'
          rows={6}
          className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-xs"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm">
            Tutup
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan geometri"}
          </button>
        </div>
      </form>
    </div>
  );
}
