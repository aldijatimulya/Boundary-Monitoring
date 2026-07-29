"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Cluster } from "@/lib/types";

type Props = {
  clusterId: string;
  clusterName: string;
  currentGeometry: Cluster["geometry"];
  onClose: () => void;
  onSaved: () => void;
};

export default function ClusterGeometryForm({ clusterId, clusterName, currentGeometry, onClose, onSaved }: Props) {
  const [text, setText] = useState(currentGeometry ? JSON.stringify(currentGeometry, null, 2) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!text.trim()) {
      setError("Tempel GeoJSON Polygon/MultiPolygon, atau tutup form ini kalau belum punya datanya.");
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

    setSaving(true);
    const { error: dbError } = await supabase.from("clusters").update({ geometry }).eq("id", clusterId);
    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">Geometri batas — {clusterName}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tempel GeoJSON Polygon/MultiPolygon (export dari QGIS, atau hasil{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">.getInfo()</code> geometri di Earth Engine
          Python API).
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='{"type":"Polygon","coordinates":[[[104.7,-3.1],...]]}'
          rows={10}
          className="mt-4 w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-xs"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm">
            Batal
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
