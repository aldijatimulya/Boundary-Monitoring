"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Topbar from "@/components/Topbar";
import SosialEntryForm from "@/components/SosialEntryForm";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { SosialReportRow, Cluster } from "@/lib/types";
import { exportSosialExcel } from "@/lib/export/excel-modules";

type ClusterSosialGroup = { cluster_id: string; cluster_nama: string; kasus: SosialReportRow[] };

export default function SosialReportPage() {
  const { canEdit } = useProfile();
  const [rows, setRows] = useState<SosialReportRow[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");

  async function loadData() {
    setLoading(true);
    const [{ data: reportRows }, { data: clusterRows }] = await Promise.all([
      supabase.from("v_sosial_report").select("*").returns<SosialReportRow[]>(),
      supabase.from("clusters").select("*").order("name").returns<Cluster[]>(),
    ]);
    setRows(reportRows ?? []);
    setClusters(clusterRows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Hapus data okupasi ini?")) return;
    await supabase.from("sosial_report").delete().eq("id", id);
    loadData();
  }

  const filtered = rows.filter((r) => r.lokasi.toLowerCase().includes(search.toLowerCase()));
  const totalOkupasi = filtered.reduce((s, r) => s + Number(r.luas_okupasi_m2), 0);

  const grouped: ClusterSosialGroup[] = useMemo(() => {
    const map = new Map<string, ClusterSosialGroup>();
    for (const r of filtered) {
      if (!map.has(r.cluster_id)) {
        map.set(r.cluster_id, { cluster_id: r.cluster_id, cluster_nama: r.lokasi, kasus: [] });
      }
      map.get(r.cluster_id)!.kasus.push(r);
    }
    return Array.from(map.values());
  }, [filtered]);

  function totalOkupasiCluster(group: ClusterSosialGroup) {
    return group.kasus.reduce((s, r) => s + Number(r.luas_okupasi_m2), 0);
  }

  return (
    <>
      <Topbar title="Sosial Report" />
      <main className="flex-1 space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total kasus okupasi/sosial</p>
            <p className="mt-1 text-2xl font-medium">{filtered.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total luas okupasi</p>
            <p className="mt-1 text-2xl font-medium">{totalOkupasi.toLocaleString("id-ID")} m²</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Cluster terdampak</p>
            <p className="mt-1 text-2xl font-medium">{new Set(filtered.map((r) => r.cluster_id)).size}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari lokasi/cluster..."
            className="w-full max-w-xs rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          {canEdit && (
            <button
              onClick={() => setFormOpen(true)}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Tambah data okupasi
            </button>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => exportSosialExcel(filtered)}
            disabled={filtered.length === 0}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Download Excel
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-center text-slate-600">
                <th className="border border-slate-200 px-3 py-2 font-medium">No</th>
                <th className="border border-slate-200 px-3 py-2 font-medium">Cluster</th>
                <th className="border border-slate-200 px-3 py-2 font-medium">Pemilik Lahan</th>
                <th className="border border-slate-200 px-3 py-2 font-medium">Jenis Okupasi</th>
                <th className="border border-slate-200 px-3 py-2 font-medium">Luas Okupasi (m²)</th>
                <th className="border border-slate-200 px-3 py-2 font-medium">Total (m²)</th>
                <th className="border border-slate-200 px-3 py-2 font-medium">Keterangan</th>
                <th className="border border-slate-200 px-3 py-2 font-medium">Tanggal</th>
                {canEdit && <th className="border border-slate-200 px-3 py-2 font-medium">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="border border-slate-200 px-4 py-8 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && grouped.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="border border-slate-200 px-4 py-8 text-center text-slate-400">
                    Belum ada data okupasi/permasalahan sosial yang tercatat.
                  </td>
                </tr>
              )}
              {grouped.map((group, groupIdx) => (
                <Fragment key={group.cluster_id}>
                  {group.kasus.map((r, rIdx) => (
                    <tr key={r.id} className="text-slate-700">
                      {rIdx === 0 && (
                        <td
                          rowSpan={group.kasus.length}
                          className="border border-slate-200 px-3 py-2 text-center align-middle"
                        >
                          {groupIdx + 1}
                        </td>
                      )}
                      {rIdx === 0 && (
                        <td
                          rowSpan={group.kasus.length}
                          className="border border-slate-200 px-3 py-2 text-center align-middle font-medium"
                        >
                          {group.cluster_nama}
                        </td>
                      )}
                      <td className="border border-slate-200 px-3 py-2">{r.pemilik_lahan || "—"}</td>
                      <td className="border border-slate-200 px-3 py-2">{r.jenis_okupasi || "—"}</td>
                      <td className="border border-slate-200 px-3 py-2 text-right">
                        {Number(r.luas_okupasi_m2).toLocaleString("id-ID")}
                      </td>
                      {rIdx === 0 && (
                        <td
                          rowSpan={group.kasus.length}
                          className="border border-slate-200 px-3 py-2 text-right align-middle font-medium text-brand-blue"
                        >
                          {totalOkupasiCluster(group).toLocaleString("id-ID")}
                        </td>
                      )}
                      <td className="border border-slate-200 px-3 py-2 text-slate-500">{r.keterangan || "—"}</td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-500">{r.tanggal_catat}</td>
                      {canEdit && (
                        <td className="border border-slate-200 px-3 py-2 text-center">
                          <button onClick={() => handleDelete(r.id)} className="text-xs text-red-600 hover:underline">
                            Hapus
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
            {grouped.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-medium text-slate-700">
                  <td colSpan={5} className="border border-slate-200 px-3 py-2 text-right">
                    Total Keseluruhan
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-right text-brand-blue">
                    {totalOkupasi.toLocaleString("id-ID")}
                  </td>
                  <td colSpan={canEdit ? 3 : 2} className="border border-slate-200 px-3 py-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <p className="text-xs text-slate-400">
          Daftar cluster di form "Tambah data okupasi" sama dengan daftar cluster di Reconstruction Report. Satu
          cluster boleh punya lebih dari satu kasus okupasi -- setiap kasus dicatat sebagai baris terpisah.
        </p>
      </main>

      {formOpen && (
        <SosialEntryForm
          clusters={clusters}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            loadData();
          }}
        />
      )}
    </>
  );
}
