"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import SosialEntryForm from "@/components/SosialEntryForm";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { SosialReportRow, Cluster } from "@/lib/types";


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

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-normal">Cluster</th>
                <th className="px-4 py-3 font-normal text-right">Luas okupasi</th>
                <th className="px-4 py-3 font-normal">Jenis okupasi</th>
                <th className="px-4 py-3 font-normal">Pemilik lahan</th>
                <th className="px-4 py-3 font-normal">Keterangan</th>
                <th className="px-4 py-3 font-normal">Tanggal</th>
                {canEdit && <th className="px-4 py-3 font-normal text-right"></th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Belum ada data okupasi/permasalahan sosial yang tercatat.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="px-4 py-2 font-medium">{r.lokasi}</td>
                  <td className="px-4 py-2 text-right">{Number(r.luas_okupasi_m2).toLocaleString("id-ID")} m²</td>
                  <td className="px-4 py-2">{r.jenis_okupasi || "—"}</td>
                  <td className="px-4 py-2">{r.pemilik_lahan || "—"}</td>
                  <td className="max-w-xs px-4 py-2 text-slate-500">{r.keterangan || "—"}</td>
                  <td className="px-4 py-2 text-slate-500">{r.tanggal_catat}</td>
                  {canEdit && (
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => handleDelete(r.id)} className="text-xs text-red-600 hover:underline">
                        Hapus
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
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
