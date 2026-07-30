"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { PatokReportRow } from "@/lib/types";

type Props = {
  cluster: PatokReportRow;
  onClose: () => void;
  onSaved: () => void;
};

export default function PatokEntryForm({ cluster, onClose, onSaved }: Props) {
  const [sementara, setSementara] = useState(cluster.jumlah_patok_sementara);
  const [permanen, setPermanen] = useState(cluster.jumlah_patok_permanen);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = sementara + permanen;
  const persen = total > 0 ? Math.round((permanen / total) * 10000) / 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const { error: dbError } = await supabase.from("patok_report").insert({
      cluster_id: cluster.cluster_id,
      jumlah_patok_sementara: sementara,
      jumlah_patok_permanen: permanen,
      tanggal_update: tanggal,
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
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">Catat update patok — {cluster.lokasi}</h2>
        <p className="mt-1 text-xs text-slate-400">
          Update ini akan ditambahkan ke histori, bukan menimpa data lama.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-slate-600">Tanggal update</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Patok sementara</label>
              <input
                type="number"
                step="1"
                min="0"
                value={sementara}
                onChange={(e) => setSementara(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Patok permanen</label>
              <input
                type="number"
                step="1"
                min="0"
                value={permanen}
                onChange={(e) => setPermanen(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600">Keterangan (opsional)</label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={2}
              placeholder="Cth: pemasangan patok permanen titik 1-10"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3 text-sm">
            <div>
              <p className="text-slate-500">Total patok</p>
              <p className="font-medium">{total}</p>
            </div>
            <div>
              <p className="text-slate-500">% permanen</p>
              <p className="font-medium">{persen}%</p>
            </div>
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
            {saving ? "Menyimpan..." : "Simpan update"}
          </button>
        </div>
      </form>
    </div>
  );
}
