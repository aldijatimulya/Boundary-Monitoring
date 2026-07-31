"use client";

import { useEffect, useMemo, useState } from "react";
import Topbar from "@/components/Topbar";
import InventarisasiLokasiForm from "@/components/InventarisasiLokasiForm";
import InventarisasiPemilikForm from "@/components/InventarisasiPemilikForm";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { InventarisasiDetailRow, Cluster } from "@/lib/types";

type PemilikRow = { pemilik_id: string; nama_pemilik: string; luas_m2: number; keterangan: string | null };
type LokasiGroup = { lokasi_id: string; nama_lokasi: string; pemilik: PemilikRow[] };
type ClusterGroup = { cluster_id: string; cluster_nama: string; lokasi: LokasiGroup[] };

export default function InventarisasiReportPage() {
  const { canEdit } = useProfile();
  const [rows, setRows] = useState<InventarisasiDetailRow[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [lokasiFormOpen, setLokasiFormOpen] = useState(false);
  const [pemilikFormFor, setPemilikFormFor] = useState<{ id: string; nama: string } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function loadData() {
    setLoading(true);
    const [{ data: detailRows }, { data: clusterRows }] = await Promise.all([
      supabase.from("v_inventarisasi_detail").select("*").returns<InventarisasiDetailRow[]>(),
      supabase.from("clusters").select("*").order("name").returns<Cluster[]>(),
    ]);
    setRows(detailRows ?? []);
    setClusters(clusterRows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const grouped: ClusterGroup[] = useMemo(() => {
    const clusterMap = new Map<string, ClusterGroup>();
    for (const r of rows) {
      if (!clusterMap.has(r.cluster_id)) {
        clusterMap.set(r.cluster_id, { cluster_id: r.cluster_id, cluster_nama: r.cluster_nama, lokasi: [] });
      }
      const cluster = clusterMap.get(r.cluster_id)!;
      let lokasi = cluster.lokasi.find((l) => l.lokasi_id === r.lokasi_id);
      if (!lokasi) {
        lokasi = { lokasi_id: r.lokasi_id, nama_lokasi: r.nama_lokasi, pemilik: [] };
        cluster.lokasi.push(lokasi);
      }
      if (r.pemilik_id) {
        lokasi.pemilik.push({
          pemilik_id: r.pemilik_id,
          nama_pemilik: r.nama_pemilik ?? "-",
          luas_m2: Number(r.luas_m2 ?? 0),
          keterangan: r.keterangan,
        });
      }
    }
    return Array.from(clusterMap.values());
  }, [rows]);

  async function handleDeletePemilik(id: string) {
    if (!confirm("Hapus data pemilik ini?")) return;
    await supabase.from("inventarisasi_pemilik").delete().eq("id", id);
    loadData();
  }

  async function handleDeleteLokasi(id: string) {
    if (!confirm("Hapus lokasi ini beserta semua data pemiliknya?")) return;
    await supabase.from("inventarisasi_lokasi").delete().eq("id", id);
    loadData();
  }

  function totalLuasCluster(cluster: ClusterGroup) {
    return cluster.lokasi.reduce((s, l) => s + l.pemilik.reduce((s2, p) => s2 + p.luas_m2, 0), 0);
  }
  function totalPemilikCluster(cluster: ClusterGroup) {
    return cluster.lokasi.reduce((s, l) => s + l.pemilik.length, 0);
  }

  const grandTotal = grouped.reduce((s, c) => s + totalLuasCluster(c), 0);

  return (
    <>
      <Topbar title="Inventarisasi Report" />
      <main className="flex-1 space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total cluster tercatat</p>
            <p className="mt-1 text-2xl font-medium">{grouped.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total pemilik lahan</p>
            <p className="mt-1 text-2xl font-medium">{grouped.reduce((s, c) => s + totalPemilikCluster(c), 0)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total luasan keseluruhan</p>
            <p className="mt-1 text-2xl font-medium text-brand-blue">{grandTotal.toLocaleString("id-ID")} m²</p>
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end">
            <button
              onClick={() => setLokasiFormOpen(true)}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              Tambah lokasi
            </button>
          </div>
        )}

        {loading && <p className="text-sm text-slate-400">Memuat data...</p>}
        {!loading && grouped.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Belum ada data inventarisasi. Klik "Tambah lokasi" untuk mulai.
          </div>
        )}

        <div className="space-y-4">
          {grouped.map((cluster) => {
            const isOpen = expanded[cluster.cluster_id] ?? true;
            return (
              <div key={cluster.cluster_id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [cluster.cluster_id]: !isOpen }))}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{cluster.cluster_nama}</p>
                    <p className="text-xs text-slate-400">
                      {cluster.lokasi.length} lokasi · {totalPemilikCluster(cluster)} pemilik
                    </p>
                  </div>
                  <p className="text-lg font-medium text-brand-blue">
                    {totalLuasCluster(cluster).toLocaleString("id-ID")} m²
                  </p>
                </button>

                {isOpen && (
                  <div className="divide-y divide-slate-100 border-t border-slate-100">
                    {cluster.lokasi.map((lokasi) => {
                      const subtotal = lokasi.pemilik.reduce((s, p) => s + p.luas_m2, 0);
                      return (
                        <div key={lokasi.lokasi_id} className="p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">{lokasi.nama_lokasi}</p>
                            <div className="flex items-center gap-3">
                              <p className="text-xs text-slate-400">{subtotal.toLocaleString("id-ID")} m²</p>
                              {canEdit && (
                                <>
                                  <button
                                    onClick={() =>
                                      setPemilikFormFor({ id: lokasi.lokasi_id, nama: lokasi.nama_lokasi })
                                    }
                                    className="text-xs text-brand-blue hover:underline"
                                  >
                                    + Pemilik
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLokasi(lokasi.lokasi_id)}
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    Hapus lokasi
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {lokasi.pemilik.length === 0 ? (
                            <p className="text-xs text-slate-400">Belum ada pemilik tercatat.</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs text-slate-400">
                                  <th className="py-1 font-normal">Pemilik</th>
                                  <th className="py-1 font-normal text-right">Luas (m²)</th>
                                  <th className="py-1 font-normal">Keterangan</th>
                                  {canEdit && <th className="py-1"></th>}
                                </tr>
                              </thead>
                              <tbody>
                                {lokasi.pemilik.map((p) => (
                                  <tr key={p.pemilik_id} className="border-t border-slate-50">
                                    <td className="py-1.5">{p.nama_pemilik}</td>
                                    <td className="py-1.5 text-right">{p.luas_m2.toLocaleString("id-ID")}</td>
                                    <td className="py-1.5 text-slate-500">{p.keterangan || "—"}</td>
                                    {canEdit && (
                                      <td className="py-1.5 text-right">
                                        <button
                                          onClick={() => handleDeletePemilik(p.pemilik_id)}
                                          className="text-xs text-red-600 hover:underline"
                                        >
                                          Hapus
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {lokasiFormOpen && (
        <InventarisasiLokasiForm
          clusters={clusters}
          onClose={() => setLokasiFormOpen(false)}
          onSaved={() => {
            setLokasiFormOpen(false);
            loadData();
          }}
        />
      )}
      {pemilikFormFor && (
        <InventarisasiPemilikForm
          lokasiId={pemilikFormFor.id}
          lokasiNama={pemilikFormFor.nama}
          onClose={() => setPemilikFormFor(null)}
          onSaved={() => {
            setPemilikFormFor(null);
            loadData();
          }}
        />
      )}
    </>
  );
}
