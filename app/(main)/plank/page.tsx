"use client";

import { useEffect, useMemo, useState } from "react";
import Topbar from "@/components/Topbar";
import PlankLocationForm from "@/components/PlankLocationForm";
import PlankStatCards from "@/components/PlankStatCards";
import PlankFilterBar from "@/components/PlankFilterBar";
import PlankLocationTable from "@/components/PlankLocationTable";
import PlankMapPanel from "@/components/PlankMapPanel";
import PlankRecentPhotos from "@/components/PlankRecentPhotos";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { PlankLocation, Cluster } from "@/lib/types";
import { exportPlankExcel } from "@/lib/export/excel-modules";
import { PLANK_TARGET_TITIK } from "@/lib/targets";

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
            <p className="text-slate-500">Jumlah plank terpasang</p>
            <p className="font-medium">{plank.jumlah_plank}</p>
          </div>
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
  const [clusterFilter, setClusterFilter] = useState("");
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return planks.filter((p) => {
      if (q) {
        const haystack = `${p.nama_lokasi} ${p.cluster_nama ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (clusterFilter && p.cluster_nama !== clusterFilter) return false;
      return true;
    });
  }, [planks, search, clusterFilter]);

  // Total lokasi plank = target tetap yang direncanakan proyek (bukan hasil
  // hitungan data). Plank terpasang dihitung dari data yang diinput admin.
  const totalPlank = planks.reduce((s, p) => s + Number(p.jumlah_plank || 0), 0);

  return (
    <>
      <Topbar title="Plank Report" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => exportPlankExcel(filtered)}
            disabled={filtered.length === 0}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Export Excel
          </button>
          {canEdit && (
            <button
              onClick={() => setFormOpen(true)}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Tambah Lokasi Plank
            </button>
          )}
        </div>

        <PlankStatCards target={PLANK_TARGET_TITIK} terpasang={totalPlank} />

        <PlankFilterBar
          search={search}
          onSearchChange={setSearch}
          clusterFilter={clusterFilter}
          onClusterFilterChange={setClusterFilter}
          clusters={clusters}
          onReset={() => {
            setSearch("");
            setClusterFilter("");
          }}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <PlankLocationTable rows={filtered} allCount={planks.length} loading={loading} onDetail={(p) => setSelected(p)} />
          <div className="space-y-4">
            <PlankMapPanel planks={filtered} />
            <PlankRecentPhotos planks={filtered} />
          </div>
        </div>

        <p className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
          Pastikan plank dalam kondisi terbaca jelas, tidak rusak, dan sesuai dengan standar pemasangan proyek.
        </p>
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
