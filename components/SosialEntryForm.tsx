"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Cluster, SosialReportRow } from "@/lib/types";

type Props = {
  clusters: Cluster[];
  defaultClusterId?: string;
  /** Kalau diisi, form jadi mode edit (update baris ini) alih-alih tambah baru. */
  editRow?: SosialReportRow;
  onClose: () => void;
  onSaved: () => void;
};

const STATUS_OPTIONS: { value: SosialReportRow["status"]; label: string }[] = [
  { value: "proses", label: "Proses" },
  { value: "selesai", label: "Selesai" },
];

export default function SosialEntryForm({ clusters, defaultClusterId, editRow, onClose, onSaved }: Props) {
  const isEdit = Boolean(editRow);
  const [clusterId, setClusterId] = useState(editRow?.cluster_id ?? defaultClusterId ?? clusters[0]?.id ?? "");
  const [luas, setLuas] = useState(editRow?.luas_okupasi_m2 ?? 0);
  const [jenis, setJenis] = useState(editRow?.jenis_okupasi ?? "");
  const [pemilik, setPemilik] = useState(editRow?.pemilik_lahan ?? "");
  const [keterangan, setKeterangan] = useState(editRow?.keterangan ?? "");
  const [status, setStatus] = useState<SosialReportRow["status"]>(editRow?.status ?? "proses");
  const [tanggal, setTanggal] = useState(editRow?.tanggal_catat ?? new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clusterId) {
      setError("Pilih cluster terlebih dahulu.");
      return;
    }
    setError("");
    setSaving(true);
    const payload = {
      cluster_id: clusterId,
      luas_okupasi_m2: luas,
      jenis_okupasi: jenis || null,
      pemilik_lahan: pemilik || null,
      keterangan: keterangan || null,
      status,
      tanggal_catat: tanggal,
    };
    const { error: dbError } = isEdit
      ? await supabase.from("sosial_report").update(payload).eq("id", editRow!.id)
      : await supabase.from("sosial_report").insert(payload);
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
        <h2 className="text-base font-medium text-slate-900">
          {isEdit ? "Edit data okupasi/permasalahan sosial" : "Tambah data okupasi/permasalahan sosial"}
        </h2>

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
            <label className="text-sm text-slate-600">Tanggal catat</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Luas okupasi (m²)</label>
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
            <label className="text-sm text-slate-600">Jenis okupasi (tanaman/bangunan)</label>
            <input
              type="text"
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              placeholder="Cth: kebun sawit, rumah semi permanen"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Pemilik lahan okupasi</label>
            <input
              type="text"
              value={pemilik}
              onChange={(e) => setPemilik(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Status penanganan</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SosialReportRow["status"])}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600">Keterangan</label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={2}
              placeholder="Cth: sudah dilakukan negosiasi, menunggu ganti rugi"
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
            {saving ? "Menyimpan..." : isEdit ? "Simpan perubahan" : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
