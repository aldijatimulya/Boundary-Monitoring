"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import PhotoUpload from "@/components/PhotoUpload";
import RincianKegiatanInput from "@/components/report/RincianKegiatanInput";
import type { WeeklyReport, RincianKegiatanItem } from "@/lib/types";

type Props = {
  projectId: string;
  /** Kalau diisi, form jadi mode EDIT (update baris ini) -- kalau null/undefined, mode tambah baru (insert). */
  report?: WeeklyReport | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function WeeklyReportForm({ projectId, report, onClose, onSaved }: Props) {
  const isEdit = !!report;
  const [form, setForm] = useState({
    minggu_ke: report?.minggu_ke != null ? String(report.minggu_ke) : "",
    periode_mulai: report?.periode_mulai ?? "",
    periode_selesai: report?.periode_selesai ?? "",
    ringkasan_capaian: report?.ringkasan_capaian ?? "",
    progres_rencana_persen: report?.progres_rencana_persen != null ? String(report.progres_rencana_persen) : "",
    progres_realisasi_persen: report?.progres_realisasi_persen != null ? String(report.progres_realisasi_persen) : "",
    kendala: report?.kendala ?? "",
    mitigasi: report?.mitigasi ?? "",
  });
  const [rincianKegiatan, setRincianKegiatan] = useState<RincianKegiatanItem[]>(report?.rincian_kegiatan ?? []);
  const [fotoUrls, setFotoUrls] = useState<string[]>(report?.foto_urls ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.minggu_ke || !form.periode_mulai || !form.periode_selesai) {
      setError("Minggu ke, periode mulai, dan periode selesai wajib diisi.");
      return;
    }
    setSaving(true);

    const payload = {
      minggu_ke: Number(form.minggu_ke),
      periode_mulai: form.periode_mulai,
      periode_selesai: form.periode_selesai,
      ringkasan_capaian: form.ringkasan_capaian || null,
      progres_rencana_persen: form.progres_rencana_persen ? Number(form.progres_rencana_persen) : null,
      progres_realisasi_persen: form.progres_realisasi_persen ? Number(form.progres_realisasi_persen) : null,
      kendala: form.kendala || null,
      mitigasi: form.mitigasi || null,
      rincian_kegiatan: rincianKegiatan,
      foto_urls: fotoUrls,
    };

    const { error: dbError } = isEdit
      ? await supabase.from("weekly_reports").update(payload).eq("id", report!.id)
      : await supabase.from("weekly_reports").insert({ project_id: projectId, ...payload });

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
        <h2 className="text-base font-medium text-slate-900">{isEdit ? "Edit Laporan Mingguan" : "Laporan Mingguan"}</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-slate-600">Minggu ke-</label>
            <input type="number" value={form.minggu_ke} onChange={set("minggu_ke")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Periode mulai</label>
            <input type="date" value={form.periode_mulai} onChange={set("periode_mulai")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Periode selesai</label>
            <input type="date" value={form.periode_selesai} onChange={set("periode_selesai")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <label className="text-sm text-slate-600">Ringkasan capaian</label>
            <textarea value={form.ringkasan_capaian} onChange={set("ringkasan_capaian")} rows={3} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
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
            <label className="text-sm text-slate-600">Kendala</label>
            <textarea value={form.kendala} onChange={set("kendala")} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Mitigasi</label>
            <textarea value={form.mitigasi} onChange={set("mitigasi")} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>

          <RincianKegiatanInput items={rincianKegiatan} onChange={setRincianKegiatan} />

          <PhotoUpload folder="weekly" urls={fotoUrls} onChange={setFotoUrls} />

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
