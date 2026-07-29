"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { TimelineActivity } from "@/lib/types";

type Props = {
  projectId: string;
  activities: TimelineActivity[];
  editing: TimelineActivity | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function TimelineForm({ projectId, activities, editing, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    nama_kegiatan: editing?.nama_kegiatan ?? "",
    tanggal_mulai: editing?.tanggal_mulai ?? "",
    tanggal_selesai: editing?.tanggal_selesai ?? "",
    pic: editing?.pic ?? "",
    bobot: editing?.bobot ?? 1,
    progres_persen: editing?.progres_persen ?? 0,
    parent_activity_id: editing?.parent_activity_id ?? "",
    predecessor_id: editing?.predecessor_id ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const predecessor = activities.find((a) => a.id === form.predecessor_id);
  const dependencyWarning =
    predecessor && form.tanggal_mulai && form.tanggal_mulai < predecessor.tanggal_selesai;

  function useAutoDate() {
    if (!predecessor) return;
    const next = new Date(predecessor.tanggal_selesai);
    next.setDate(next.getDate() + 1);
    setForm((f) => ({ ...f, tanggal_mulai: next.toISOString().slice(0, 10) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.nama_kegiatan || !form.tanggal_mulai || !form.tanggal_selesai) {
      setError("Nama kegiatan, tanggal mulai, dan tanggal selesai wajib diisi.");
      return;
    }
    if (form.tanggal_selesai < form.tanggal_mulai) {
      setError("Tanggal selesai tidak boleh sebelum tanggal mulai.");
      return;
    }

    setSaving(true);
    const payload = {
      project_id: projectId,
      nama_kegiatan: form.nama_kegiatan,
      tanggal_mulai: form.tanggal_mulai,
      tanggal_selesai: form.tanggal_selesai,
      pic: form.pic || null,
      bobot: Number(form.bobot) || 1,
      progres_persen: Number(form.progres_persen) || 0,
      parent_activity_id: form.parent_activity_id || null,
      predecessor_id: form.predecessor_id || null,
      status: Number(form.progres_persen) >= 100 ? "selesai" : Number(form.progres_persen) > 0 ? "on_progress" : "belum_mulai",
    };

    const { error: dbError } = editing
      ? await supabase.from("timeline_activities").update(payload).eq("id", editing.id)
      : await supabase.from("timeline_activities").insert(payload);

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
        <h2 className="text-base font-medium text-slate-900">
          {editing ? "Edit kegiatan" : "Tambah kegiatan"}
        </h2>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-slate-600">Nama kegiatan</label>
            <input
              value={form.nama_kegiatan}
              onChange={(e) => setForm({ ...form, nama_kegiatan: e.target.value })}
              placeholder="Rekonstruksi batas — Cluster A"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Tanggal mulai</label>
              <input
                type="date"
                value={form.tanggal_mulai}
                onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Tanggal selesai</label>
              <input
                type="date"
                value={form.tanggal_selesai}
                onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600">Bergantung pada kegiatan (predecessor)</label>
            <select
              value={form.predecessor_id}
              onChange={(e) => setForm({ ...form, predecessor_id: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Tidak ada</option>
              {activities
                .filter((a) => a.id !== editing?.id)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nama_kegiatan}
                  </option>
                ))}
            </select>
            {dependencyWarning && (
              <div className="mt-2 flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <span>
                  Tanggal mulai lebih awal dari selesainya "{predecessor?.nama_kegiatan}" (
                  {predecessor?.tanggal_selesai}).
                </span>
                <button type="button" onClick={useAutoDate} className="ml-2 shrink-0 underline">
                  Gunakan tanggal otomatis
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm text-slate-600">Bagian dari kegiatan induk (rollup progres)</label>
            <select
              value={form.parent_activity_id}
              onChange={(e) => setForm({ ...form, parent_activity_id: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Tidak ada — kegiatan mandiri</option>
              {activities
                .filter((a) => a.id !== editing?.id && !a.parent_activity_id)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nama_kegiatan}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-slate-600">PIC</label>
              <input
                value={form.pic}
                onChange={(e) => setForm({ ...form, pic: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Bobot</label>
              <input
                type="number"
                step="0.1"
                value={form.bobot}
                onChange={(e) => setForm({ ...form, bobot: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Progres (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.progres_persen}
                onChange={(e) => setForm({ ...form, progres_persen: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
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
            {saving ? "Menyimpan..." : "Simpan kegiatan"}
          </button>
        </div>
      </form>
    </div>
  );
}
