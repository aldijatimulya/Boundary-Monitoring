// Helper bersama untuk parsing file .geojson/.json/.kml jadi geometry
// Polygon/MultiPolygon (dipakai ClusterGeometryForm & PlankLocationForm) --
// juga titik tunggal (Point) untuk lokasi patok/plank.
"use client";

import { kml as kmlToGeoJson } from "@tmcw/togeojson";

// Buang nilai Z (elevasi) dari array koordinat, sisakan [lng, lat] saja.
export function stripZ(coords: unknown): unknown {
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
export function extractGeometry(raw: unknown): { type: string; coordinates: unknown } | null {
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

// Cari titik (Point) pertama dari GeoJSON apapun -- dipakai untuk lokasi plank
// yang biasanya berupa satu titik Placemark di KML, bukan polygon. Mengembalikan
// [lng, lat] atau null.
function collectFirstPoint(geom: Record<string, unknown> | null | undefined): [number, number] | null {
  if (!geom || typeof geom !== "object") return null;
  if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
    const [lng, lat] = geom.coordinates as number[];
    return [lng, lat];
  }
  if (geom.type === "GeometryCollection" && Array.isArray(geom.geometries)) {
    for (const g of geom.geometries as Record<string, unknown>[]) {
      const p = collectFirstPoint(g);
      if (p) return p;
    }
  }
  return null;
}

export function extractPoint(raw: unknown): [number, number] | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    for (const feature of obj.features as Record<string, unknown>[]) {
      const p = collectFirstPoint(feature?.geometry as Record<string, unknown>);
      if (p) return p;
    }
    return null;
  }
  if (obj.type === "Feature") {
    return collectFirstPoint(obj.geometry as Record<string, unknown>);
  }
  return collectFirstPoint(obj);
}

// Parse isi file .kml jadi GeoJSON FeatureCollection lewat @tmcw/togeojson.
export function parseKmlToGeoJson(text: string): Record<string, unknown> | null {
  const xml = new DOMParser().parseFromString(text, "text/xml");
  const parserError = xml.querySelector("parsererror");
  if (parserError) return null;
  return kmlToGeoJson(xml) as unknown as Record<string, unknown>;
}

// Parse .kml langsung ke geometry Polygon/MultiPolygon (dipakai batas cluster).
export function parseKmlPolygon(text: string): { type: string; coordinates: unknown } | null {
  const geojson = parseKmlToGeoJson(text);
  return geojson ? extractGeometry(geojson) : null;
}

// Parse .kml langsung ke titik [lng, lat] pertama (dipakai lokasi plank).
export function parseKmlPoint(text: string): [number, number] | null {
  const geojson = parseKmlToGeoJson(text);
  return geojson ? extractPoint(geojson) : null;
}
