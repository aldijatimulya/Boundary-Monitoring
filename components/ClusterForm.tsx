"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  projectId: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function ClusterForm({ projectId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: "",
    desa: "",
    kecamatan: "",
    kabupaten: "",
    luas_pembebasan_ha: "",
    luas_deliniasi_ha: "",
    keterangan: "",
    geometryText: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.luas_pembebasan_ha) {
      setError("Nama cluster dan luas pembebasan wajib diisi.");
      return;
    }

    let geometry = null;
    if (form.geometryText.trim()) {
      try {
        const parsed = JSON.parse(form.geometryText);
        if (parsed.type !== "Polygon" && parsed.type !== "MultiPolygon") {
          setError('Geometri harus bertipe "Polygon" atau "MultiPolygon" (GeoJSON).');
          return;
        }
        geometry = parsed;
      } catch {
        setError("Geometri bukan JSON yang valid. Salin GeoJSON Polygon/MultiPolygon dari QGIS/GEE.");
        return;
      }
    }

    setSaving(true);
    const { error: dbError } = await supabase.from("clusters").insert({
      project_id: projectId,
      name: form.name,
      desa: form.desa || null,
      kecamatan: form.kecamatan || null,
      kabupaten: form.kabupaten || null,
      luas_pembebasan_ha: Number(form.luas_pembebasan_ha),
      luas_deliniasi_ha: form.luas_deliniasi_ha ? Number(form.luas_deliniasi_ha) : 0,
      keterangan: form.keterangan || null,
      geometry,
    });
    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">Tambah cluster</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-slate-600">Nama cluster / lokasi</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Cluster F"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-slate-600">Desa</label>
              <input
                value={form.desa}
                onChange={(e) => setForm({ ...form, desa: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Kecamatan</label>
              <input
                value={form.kecamatan}
                onChange={(e) => setForm({ ...form, kecamatan: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Kabupaten</label>
              <input
                value={form.kabupaten}
                onChange={(e) => setForm({ ...form, kabupaten: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Luas pembebasan (ha)</label>
              <input
                type="number"
                step="0.01"
                value={form.luas_pembebasan_ha}
                onChange={(e) => setForm({ ...form, luas_pembebasan_ha: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Luas deliniasi (ha)</label>
              <input
                type="number"
                step="0.01"
                value={form.luas_deliniasi_ha}
                onChange={(e) => setForm({ ...form, luas_deliniasi_ha: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600">Keterangan</label>
            <textarea
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">
              Geometri batas (GeoJSON Polygon/MultiPolygon) — opsional
            </label>
            <textarea
              value={form.geometryText}
              onChange={(e) => setForm({ ...form, geometryText: e.target.value })}
              placeholder='{"type":"Polygon","coordinates":[[[104.7,-3.1],[104.75,-3.1],[104.75,-3.05],[104.7,-3.05],[104.7,-3.1]]]}'
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-xs"
              rows={3}
            />
            <p className="mt-1 text-xs text-slate-400">
              Bisa diisi belakangan lewat tombol "Geometri" di tabel Reconstruction Report. Kalau kosong,
              cluster tidak akan muncul di Spatial Map sampai geometrinya diisi.
            </p>
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
            {saving ? "Menyimpan..." : "Simpan cluster"}
          </button>
        </div>
      </form>
    </div>
  );
}
