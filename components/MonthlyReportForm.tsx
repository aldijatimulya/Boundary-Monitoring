"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import PhotoUpload from "@/components/PhotoUpload";
import RincianKegiatanInput from "@/components/report/RincianKegiatanInput";
import type { MonthlyReport, RincianKegiatanItem } from "@/lib/types";

type Props = {
  projectId: string;
  /** Kalau diisi, form jadi mode EDIT (update baris ini) -- kalau null/undefined, mode tambah baru (insert). */
  report?: MonthlyReport | null;
  onClose: () => void;
  onSaved: () => void;
};

const BULAN_NAMA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function MonthlyReportForm({ projectId, report, onClose, onSaved }: Props) {
  const isEdit = !!report;
  const now = new Date();
  const [form, setForm] = useState({
    bulan: report ? String(report.bulan) : String(now.getMonth() + 1),
    tahun: report ? String(report.tahun) : String(now.getFullYear()),
    ringkasan_eksekutif: report?.ringkasan_eksekutif ?? "",
    progres_rencana_persen: report?.progres_rencana_persen != null ? String(report.progres_rencana_persen) : "",
    progres_realisasi_persen: report?.progres_realisasi_persen != null ? String(report.progres_realisasi_persen) : "",
    analisis_kendala: report?.analisis_kendala ?? "",
    proyeksi_bulan_depan: report?.proyeksi_bulan_depan ?? "",
  });
  const [rincianKegiatan, setRincianKegiatan] = useState<RincianKegiatanItem[]>(report?.rincian_kegiatan ?? []);
  const [lampiranUrls, setLampiranUrls] = useState<string[]>(report?.lampiran_urls ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      bulan: Number(form.bulan),
      tahun: Number(form.tahun),
      ringkasan_eksekutif: form.ringkasan_eksekutif || null,
      progres_rencana_persen: form.progres_rencana_persen ? Number(form.progres_rencana_persen) : null,
      progres_realisasi_persen: form.progres_realisasi_persen ? Number(form.progres_realisasi_persen) : null,
      analisis_kendala: form.analisis_kendala || null,
      proyeksi_bulan_depan: form.proyeksi_bulan_depan || null,
      rincian_kegiatan: rincianKegiatan,
      lampiran_urls: lampiranUrls,
    };

    const { error: dbError } = isEdit
      ? await supabase.from("monthly_reports").update(payload).eq("id", report!.id)
      : await supabase.from("monthly_reports").insert({ project_id: projectId, ...payload });

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="my-8 w-full max-w-xl rounded-xl bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">{isEdit ? "Edit Laporan Bulanan" : "Laporan Bulanan"}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-600">Bulan</label>
            <select value={form.bulan} onChange={set("bulan")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
              {BULAN_NAMA.map((b, i) => (
                <option key={b} value={i + 1}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600">Tahun</label>
            <input type="number" value={form.tahun} onChange={set("tahun")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <label className="text-sm text-slate-600">Ringkasan eksekutif</label>
            <textarea value={form.ringkasan_eksekutif} onChange={set("ringkasan_eksekutif")} rows={3} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Progres rencana (%)</label>
              <input type="number" value={form.progres_rencana_persen} onChange={set("progres_rencana_persen")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Progres realisasi (%)</label>
              <input type="number" value={form.progres_realisasi_persen} onChange={set("progres_realisasi_persen")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600">Analisis kendala</label>
            <textarea value={form.analisis_kendala} onChange={set("analisis_kendala")} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Proyeksi bulan depan</label>
            <textarea value={form.proyeksi_bulan_depan} onChange={set("proyeksi_bulan_depan")} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>

          <RincianKegiatanInput items={rincianKegiatan} onChange={setRincianKegiatan} />

          <PhotoUpload folder="monthly" urls={lampiranUrls} onChange={setLampiranUrls} />

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm">Batal</button>
          <button type="submit" disabled={saving} className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Menyimpan..." : isEdit ? "Simpan perubahan" : "Simpan laporan"}
          </button>
        </div>
      </form>
    </div>
  );
}
