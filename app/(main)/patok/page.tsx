"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import PatokEntryForm from "@/components/PatokEntryForm";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { PatokReportRow, STATUS_LABEL } from "@/lib/types";
import { exportPatokExcel } from "@/lib/export/excel-modules";

export default function PatokReportPage() {
  const { canEdit } = useProfile();
  const [rows, setRows] = useState<PatokReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [entryFor, setEntryFor] = useState<PatokReportRow | null>(null);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from("v_patok_report_latest").select("*").returns<PatokReportRow[]>();
    setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalSementara = rows.reduce((s, r) => s + Number(r.jumlah_patok_sementara), 0);
  const totalPermanen = rows.reduce((s, r) => s + Number(r.jumlah_patok_permanen), 0);
  const totalPatok = totalSementara + totalPermanen;
  // Sama seperti per-cluster: persentase = permanen dibagi SEMENTARA (bukan total).
  const persenPermanen =
    totalSementara > 0
      ? Math.round((totalPermanen / totalSementara) * 10000) / 100
      : totalPermanen > 0
      ? 100
      : 0;

  return (
    <>
      <Topbar title="Patok Report" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total patok sementara</p>
            <p className="mt-1 text-2xl font-medium">{totalSementara}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total patok permanen</p>
            <p className="mt-1 text-2xl font-medium">{totalPermanen}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">% permanen (keseluruhan)</p>
            <p className="mt-1 text-2xl font-medium text-brand-blue">{persenPermanen}%</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={() => exportPatokExcel(rows)}
            disabled={rows.length === 0}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Download Excel
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-normal">Cluster</th>
                <th className="px-4 py-3 font-normal text-right">Patok sementara terpasang</th>
                <th className="px-4 py-3 font-normal text-right">Patok permanen terpasang</th>
                <th className="px-4 py-3 font-normal text-right">Persentase</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Keterangan</th>
                <th className="px-4 py-3 font-normal text-right"></th>
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
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Belum ada cluster. Tambahkan cluster lewat halaman Reconstruction Report.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const status = STATUS_LABEL[r.status];
                return (
                  <tr key={r.cluster_id} className="border-b border-slate-50">
                    <td className="px-4 py-2 font-medium">{r.lokasi}</td>
                    <td className="px-4 py-2 text-right">{r.jumlah_patok_sementara}</td>
                    <td className="px-4 py-2 text-right">{r.jumlah_patok_permanen}</td>
                    <td className="px-4 py-2 text-right">{r.persen_permanen}%</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs ${status?.className}`}>
                        {status?.label}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-2 text-slate-500">{r.keterangan || "—"}</td>
                    <td className="px-4 py-2 text-right">
                      {canEdit ? (
                        <button onClick={() => setEntryFor(r)} className="text-xs text-brand-blue hover:underline">
                          Catat update
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400">
          Persentase dihitung dari jumlah patok permanen dibagi jumlah patok sementara (bukan dibagi total) — jadi
          menunjukkan seberapa banyak titik sementara yang sudah di-upgrade jadi permanen. Isi kolom "Keterangan"
          saat Catat update untuk menjelaskan mis. kenapa ada patok sementara yang belum dipasang patok permanen.
          Setiap "Catat update" menambah baris baru ke histori pemasangan — data lama tidak tertimpa.
        </p>
      </main>

      {entryFor && (
        <PatokEntryForm
          cluster={entryFor}
          onClose={() => setEntryFor(null)}
          onSaved={() => {
            setEntryFor(null);
            loadData();
          }}
        />
      )}
    </>
  );
}
