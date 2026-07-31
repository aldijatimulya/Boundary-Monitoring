"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  lokasiId: string;
  lokasiNama: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function InventarisasiPemilikForm({ lokasiId, lokasiNama, onClose, onSaved }: Props) {
  const [namaPemilik, setNamaPemilik] = useState("");
  const [luas, setLuas] = useState(0);
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!namaPemilik.trim()) {
      setError("Isi nama pemilik lahan.");
      return;
    }
    setError("");
    setSaving(true);
    const { error: dbError } = await supabase.from("inventarisasi_pemilik").insert({
      lokasi_id: lokasiId,
      nama_pemilik: namaPemilik.trim(),
      luas_m2: luas,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">Tambah pemilik — {lokasiNama}</h2>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-slate-600">Nama pemilik lahan</label>
            <input
              type="text"
              value={namaPemilik}
              onChange={(e) => setNamaPemilik(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Luasan (m²)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={luas}
              onChange={(e) => setLuas(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
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
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
