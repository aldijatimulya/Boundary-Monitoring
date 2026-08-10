"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import PhotoUpload from "@/components/PhotoUpload";
import RincianKegiatanInput from "@/components/report/RincianKegiatanInput";
import type { DailyReport, RincianKegiatanItem } from "@/lib/types";

type Props = {
  projectId: string;
  /** Kalau diisi, form jadi mode EDIT (update baris ini) -- kalau null/undefined, mode tambah baru (insert). */
  report?: DailyReport | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function DailyReportForm({ projectId, report, onClose, onSaved }: Props) {
  const isEdit = !!report;
  const [form, setForm] = useState({
    tanggal: report?.tanggal ?? new Date().toISOString().slice(0, 10),
    tim: report?.tim ?? "",
    personil: report?.personil != null ? String(report.personil) : "",
    jam_kerja_mulai: report?.jam_kerja_mulai ?? "07:00",
    jam_kerja_selesai: report?.jam_kerja_selesai ?? "16:00",
    cuaca: report?.cuaca ?? "Cerah",
    koordinat_lat: report?.koordinat_lat != null ? String(report.koordinat_lat) : "",
    koordinat_lng: report?.koordinat_lng != null ? String(report.koordinat_lng) : "",
    kegiatan: report?.kegiatan ?? "",
    target: report?.target ?? "",
    realisasi: report?.realisasi ?? "",
    target_persen: report?.target_persen != null ? String(report.target_persen) : "",
    realisasi_persen: report?.realisasi_persen != null ? String(report.realisasi_persen) : "",
    material_digunakan: report?.material_digunakan ?? "",
    permasalahan: report?.permasalahan ?? "",
    mitigasi: report?.mitigasi ?? "",
    kesimpulan: report?.kesimpulan ?? "",
    rencana_besok: report?.rencana_besok ?? "",
  });
  const [rincianKegiatan, setRincianKegiatan] = useState<RincianKegiatanItem[]>(report?.rincian_kegiatan ?? []);
  const [fotoUrls, setFotoUrls] = useState<string[]>(report?.foto_urls ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.kegiatan) {
      setError("Kolom kegiatan wajib diisi.");
      return;
    }
    setSaving(true);

    const payload = {
      tanggal: form.tanggal,
      tim: form.tim || null,
      personil: form.personil ? Number(form.personil) : null,
      jam_kerja_mulai: form.jam_kerja_mulai || null,
      jam_kerja_selesai: form.jam_kerja_selesai || null,
      cuaca: form.cuaca || null,
      koordinat_lat: form.koordinat_lat ? Number(form.koordinat_lat) : null,
      koordinat_lng: form.koordinat_lng ? Number(form.koordinat_lng) : null,
      kegiatan: form.kegiatan,
      target: form.target || null,
      realisasi: form.realisasi || null,
      target_persen: form.target_persen ? Number(form.target_persen) : null,
      realisasi_persen: form.realisasi_persen ? Number(form.realisasi_persen) : null,
      rincian_kegiatan: rincianKegiatan,
      material_digunakan: form.material_digunakan || null,
      permasalahan: form.permasalahan || null,
      mitigasi: form.mitigasi || null,
      kesimpulan: form.kesimpulan || null,
      rencana_besok: form.rencana_besok || null,
      foto_urls: fotoUrls,
    };

    // Mode edit: UPDATE baris yang sudah ada, status_approval sengaja TIDAK
    // ikut diubah (biar laporan yang sudah "approved" tidak otomatis balik
    // status cuma karena admin membetulkan isinya).
    // Mode tambah: INSERT baris baru dengan status_approval awal "submitted".
    const { error: dbError } = isEdit
      ? await supabase.from("daily_reports").update(payload).eq("id", report!.id)
      : await supabase.from("daily_reports").insert({ project_id: projectId, ...payload, status_approval: "submitted" });

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    onSaved();
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="my-8 w-full max-w-2xl rounded-xl bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">{isEdit ? "Edit Laporan Harian" : "Laporan Harian"}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-600">Tanggal</label>
            <input type="date" value={form.tanggal} onChange={set("tanggal")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Tim</label>
            <input value={form.tim} onChange={set("tim")} placeholder="Tim Lapangan 2" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Jumlah personil</label>
            <input type="number" value={form.personil} onChange={set("personil")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Cuaca</label>
            <select value={form.cuaca} onChange={set("cuaca")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
              <option>Cerah</option>
              <option>Berawan</option>
              <option>Hujan</option>
              <option>Hujan Lebat</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600">Jam mulai</label>
            <input type="time" value={form.jam_kerja_mulai} onChange={set("jam_kerja_mulai")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Jam selesai</label>
            <input type="time" value={form.jam_kerja_selesai} onChange={set("jam_kerja_selesai")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Koordinat lat</label>
            <input type="number" step="0.000001" value={form.koordinat_lat} onChange={set("koordinat_lat")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Koordinat lng</label>
            <input type="number" step="0.000001" value={form.koordinat_lng} onChange={set("koordinat_lng")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <label className="text-sm text-slate-600">Kegiatan</label>
            <textarea value={form.kegiatan} onChange={set("kegiatan")} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Target</label>
              <textarea value={form.target} onChange={set("target")} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Realisasi</label>
              <textarea value={form.realisasi} onChange={set("realisasi")} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Target hari ini (%)</label>
              <input type="number" min={0} max={100} value={form.target_persen} onChange={set("target_persen")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Realisasi (%)</label>
              <input type="number" min={0} max={100} value={form.realisasi_persen} onChange={set("realisasi_persen")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>

          <RincianKegiatanInput items={rincianKegiatan} onChange={setRincianKegiatan} />

          <div>
            <label className="text-sm text-slate-600">Material digunakan</label>
            <input value={form.material_digunakan} onChange={set("material_digunakan")} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Permasalahan</label>
              <textarea value={form.permasalahan} onChange={set("permasalahan")} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Mitigasi</label>
              <textarea value={form.mitigasi} onChange={set("mitigasi")} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600">Kesimpulan</label>
            <textarea value={form.kesimpulan} onChange={set("kesimpulan")} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Rencana besok</label>
            <textarea value={form.rencana_besok} onChange={set("rencana_besok")} rows={2} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>

          <PhotoUpload folder="daily" urls={fotoUrls} onChange={setFotoUrls} />

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
