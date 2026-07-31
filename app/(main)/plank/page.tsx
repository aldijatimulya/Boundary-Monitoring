"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import PlankLocationForm from "@/components/PlankLocationForm";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { PlankLocation, Cluster } from "@/lib/types";

function PlankDetailModal({
  plank,
  canEdit,
  onClose,
  onDeleted,
}: {
  plank: PlankLocation;
  canEdit: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const photos = plank.foto_urls ?? [];

  async function handleDelete() {
    if (!confirm(`Hapus lokasi plank "${plank.nama_lokasi}"?`)) return;
    setDeleting(true);
    await supabase.from("plank_locations").delete().eq("id", plank.id);
    setDeleting(false);
    onDeleted();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-2xl rounded-xl bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium text-slate-900">{plank.nama_lokasi}</h2>
            {plank.cluster_nama && <p className="text-sm text-slate-500">Cluster: {plank.cluster_nama}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-slate-500">Koordinat</p>
            <p className="font-medium">
              {plank.koordinat_lat && plank.koordinat_lng
                ? `${plank.koordinat_lat}, ${plank.koordinat_lng}`
                : "Belum diisi"}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Data spasial</p>
            <p className="font-medium">
              {plank.geometry ? "Ada (tampil di Spatial Map)" : "Belum ada KML/GeoJSON"}
            </p>
          </div>
        </div>

        {plank.keterangan && (
          <div className="mt-3">
            <p className="text-sm text-slate-500">Keterangan</p>
            <p className="text-sm">{plank.keterangan}</p>
          </div>
        )}

        <div className="mt-4">
          <p className="mb-2 text-sm text-slate-500">Dokumentasi foto ({photos.length})</p>
          {photos.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada foto.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt={`${plank.nama_lokasi} ${i + 1}`} className="h-28 w-full rounded-md object-cover" />
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {canEdit && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "Menghapus..." : "Hapus lokasi"}
            </button>
          )}
          <button onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlankReportPage() {
  const { canEdit } = useProfile();
  const [planks, setPlanks] = useState<PlankLocation[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<PlankLocation | null>(null);

  async function loadData() {
    setLoading(true);
    const [{ data: plankRows }, { data: clusterRows }] = await Promise.all([
      supabase.from("v_plank_locations").select("*").returns<PlankLocation[]>(),
      supabase.from("clusters").select("*").order("name").returns<Cluster[]>(),
    ]);
    setPlanks(plankRows ?? []);
    setClusters(clusterRows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = planks.filter(
    (p) => p.nama_lokasi.toLowerCase().includes(q) || (p.cluster_nama ?? "").toLowerCase().includes(q)
  );

  return (
    <>
      <Topbar title="Plank Report" />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari lokasi plank atau cluster..."
            className="w-full max-w-xs rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          {canEdit && (
            <button
              onClick={() => setFormOpen(true)}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Tambah lokasi plank
            </button>
          )}
        </div>

        {loading && <p className="text-sm text-slate-400">Memuat data...</p>}
        {!loading && filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            {planks.length === 0
              ? 'Belum ada lokasi plank. Klik "Tambah lokasi plank" untuk mulai.'
              : "Tidak ada lokasi yang cocok dengan pencarian."}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => {
            const cover = p.foto_urls?.[0];
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left hover:shadow-md"
              >
                <div className="aspect-square w-full bg-slate-100">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={p.nama_lokasi} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      Belum ada foto
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-slate-900">{p.nama_lokasi}</p>
                  {p.cluster_nama && <p className="truncate text-xs text-slate-400">{p.cluster_nama}</p>}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {formOpen && (
        <PlankLocationForm
          clusters={clusters}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            loadData();
          }}
        />
      )}
      {selected && (
        <PlankDetailModal
          plank={selected}
          canEdit={canEdit}
          onClose={() => setSelected(null)}
          onDeleted={() => {
            setSelected(null);
            loadData();
          }}
        />
      )}
    </>
  );
}
