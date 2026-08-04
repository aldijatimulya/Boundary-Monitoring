"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Topbar from "@/components/Topbar";
import InventarisasiLokasiForm from "@/components/InventarisasiLokasiForm";
import InventarisasiPemilikForm from "@/components/InventarisasiPemilikForm";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { InventarisasiDetailRow, Cluster } from "@/lib/types";
import { exportInventarisasiExcel } from "@/lib/export/excel-modules";

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
  function totalLuasLokasi(lokasi: LokasiGroup) {
    return lokasi.pemilik.reduce((s, p) => s + p.luas_m2, 0);
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

        <div className="flex justify-end">
          <button
            onClick={() =>
              exportInventarisasiExcel(
                rows,
                grouped.map((c) => ({
                  lokasi: c.cluster_nama,
                  jumlah_lokasi: c.lokasi.length,
                  jumlah_pemilik: totalPemilikCluster(c),
                  total_luas_m2: totalLuasCluster(c),
                }))
              )
            }
            disabled={rows.length === 0}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Download Excel
          </button>
        </div>

        {loading && <p className="text-sm text-slate-400">Memuat data...</p>}
        {!loading && grouped.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Belum ada data inventarisasi. Klik "Tambah lokasi" untuk mulai.
          </div>
        )}

        {!loading && grouped.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-center text-slate-600">
                  <th rowSpan={2} className="border border-slate-200 px-3 py-2 font-medium">No</th>
                  <th rowSpan={2} className="border border-slate-200 px-3 py-2 font-medium">Cluster</th>
                  <th rowSpan={2} className="border border-slate-200 px-3 py-2 font-medium">Lokasi</th>
                  <th colSpan={2} className="border border-slate-200 px-3 py-2 font-medium">Daftar Ganti Rugi</th>
                  <th rowSpan={2} className="border border-slate-200 px-3 py-2 font-medium">Total (m²)</th>
                  <th rowSpan={2} className="border border-slate-200 px-3 py-2 font-medium">Keterangan</th>
                  {canEdit && <th rowSpan={2} className="border border-slate-200 px-3 py-2 font-medium">Aksi</th>}
                </tr>
                <tr className="bg-slate-100 text-center text-slate-600">
                  <th className="border border-slate-200 px-3 py-2 font-medium">Nama</th>
                  <th className="border border-slate-200 px-3 py-2 font-medium">Luas (m²)</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((cluster, clusterIdx) => {
                  const clusterRowCount = Math.max(
                    1,
                    cluster.lokasi.reduce((s, l) => s + Math.max(1, l.pemilik.length), 0)
                  );
                  let clusterCellRendered = false;
                  return (
                    <Fragment key={cluster.cluster_id}>
                      {cluster.lokasi.map((lokasi) => {
                        const lokasiRowCount = Math.max(1, lokasi.pemilik.length);
                        const rowsForLokasi = lokasi.pemilik.length > 0 ? lokasi.pemilik : [null];
                        return (
                          <Fragment key={lokasi.lokasi_id}>
                            {rowsForLokasi.map((p, pIdx) => {
                              const isFirstOfLokasi = pIdx === 0;
                              const isFirstOfCluster = !clusterCellRendered;
                              if (isFirstOfCluster) clusterCellRendered = true;
                              return (
                                <tr key={p ? p.pemilik_id : `${lokasi.lokasi_id}-empty`} className="text-slate-700">
                                  {isFirstOfCluster && (
                                    <td
                                      rowSpan={clusterRowCount}
                                      className="border border-slate-200 px-3 py-2 text-center align-middle"
                                    >
                                      {clusterIdx + 1}
                                    </td>
                                  )}
                                  {isFirstOfCluster && (
                                    <td
                                      rowSpan={clusterRowCount}
                                      className="border border-slate-200 px-3 py-2 text-center align-middle font-medium"
                                    >
                                      {cluster.cluster_nama}
                                    </td>
                                  )}
                                  {isFirstOfLokasi && (
                                    <td
                                      rowSpan={lokasiRowCount}
                                      className="border border-slate-200 px-3 py-2 align-middle"
                                    >
                                      {lokasi.nama_lokasi}
                                    </td>
                                  )}
                                  <td className="border border-slate-200 px-3 py-2">
                                    {p ? p.nama_pemilik : <span className="text-slate-300">—</span>}
                                  </td>
                                  <td className="border border-slate-200 px-3 py-2 text-right">
                                    {p ? p.luas_m2.toLocaleString("id-ID") : <span className="text-slate-300">—</span>}
                                  </td>
                                  {isFirstOfLokasi && (
                                    <td
                                      rowSpan={lokasiRowCount}
                                      className="border border-slate-200 px-3 py-2 text-right align-middle font-medium text-brand-blue"
                                    >
                                      {totalLuasLokasi(lokasi).toLocaleString("id-ID")}
                                    </td>
                                  )}
                                  <td className="border border-slate-200 px-3 py-2 text-slate-500">
                                    {p ? p.keterangan || "—" : "—"}
                                  </td>
                                  {canEdit && (
                                    <td className="border border-slate-200 px-3 py-2 text-center">
                                      <div className="flex flex-wrap items-center justify-center gap-2">
                                        {isFirstOfLokasi && (
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
                                        {p && (
                                          <button
                                            onClick={() => handleDeletePemilik(p.pemilik_id)}
                                            className="text-xs text-red-600 hover:underline"
                                          >
                                            Hapus pemilik
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </Fragment>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-medium text-slate-700">
                  <td colSpan={5} className="border border-slate-200 px-3 py-2 text-right">
                    Total Keseluruhan
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-right text-brand-blue">
                    {grandTotal.toLocaleString("id-ID")}
                  </td>
                  <td className="border border-slate-200 px-3 py-2" colSpan={canEdit ? 2 : 1}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
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
