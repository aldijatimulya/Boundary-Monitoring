"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Cluster } from "@/lib/types";

type Props = {
  clusters: Cluster[];
  defaultClusterId?: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function InventarisasiLokasiForm({ clusters, defaultClusterId, onClose, onSaved }: Props) {
  const [clusterId, setClusterId] = useState(defaultClusterId ?? clusters[0]?.id ?? "");
  const [namaLokasi, setNamaLokasi] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clusterId || !namaLokasi.trim()) {
      setError("Pilih cluster dan isi nama lokasi.");
      return;
    }
    setError("");
    setSaving(true);
    const { error: dbError } = await supabase
      .from("inventarisasi_lokasi")
      .insert({ cluster_id: clusterId, nama_lokasi: namaLokasi.trim() });
    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">Tambah lokasi</h2>
        <p className="mt-1 text-xs text-slate-400">Cth: cluster A punya beberapa lokasi seperti "SWF 1", "SWF 2".</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-slate-600">Cluster</label>
            <select
              value={clusterId}
              onChange={(e) => setClusterId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600">Nama lokasi</label>
            <input
              type="text"
              value={namaLokasi}
              onChange={(e) => setNamaLokasi(e.target.value)}
              placeholder="Cth: SWF 1"
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
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
