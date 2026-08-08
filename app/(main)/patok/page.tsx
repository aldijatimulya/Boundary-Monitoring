"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import PatokEntryForm from "@/components/PatokEntryForm";
import PatokStatCards from "@/components/PatokStatCards";
import PatokSummaryPanel from "@/components/PatokSummaryPanel";
import PatokClusterTable from "@/components/PatokClusterTable";
import PatokClusterPicker from "@/components/PatokClusterPicker";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { PatokReportRow } from "@/lib/types";
import { exportPatokExcel } from "@/lib/export/excel-modules";

export default function PatokReportPage() {
  const { canEdit } = useProfile();
  const [rows, setRows] = useState<PatokReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [entryFor, setEntryFor] = useState<PatokReportRow | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

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
  const sisaPatok = Math.max(totalSementara - totalPermanen, 0);
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
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => exportPatokExcel(rows)}
            disabled={rows.length === 0}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Export Excel
          </button>
          {canEdit && (
            <button
              onClick={() => setPickerOpen(true)}
              disabled={rows.length === 0}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              + Tambah Data Patok
            </button>
          )}
        </div>

        <PatokStatCards
          totalSementara={totalSementara}
          totalPermanen={totalPermanen}
          persenPermanen={persenPermanen}
          sisaPatok={sisaPatok}
        />

        <PatokSummaryPanel
          rows={rows}
          totalSementara={totalSementara}
          totalPermanen={totalPermanen}
          persenPermanen={persenPermanen}
          sisaPatok={sisaPatok}
        />

        <PatokClusterTable rows={rows} loading={loading} canEdit={canEdit} onDetail={(r) => setEntryFor(r)} />

        <p className="text-xs text-slate-400">
          Persentase dihitung dari jumlah patok permanen dibagi jumlah patok sementara (bukan dibagi total) — jadi
          menunjukkan seberapa banyak titik sementara yang sudah di-upgrade jadi permanen. Isi kolom "Keterangan"
          saat Catat update untuk menjelaskan mis. kenapa ada patok sementara yang belum dipasang patok permanen.
          Setiap "Catat update" menambah baris baru ke histori pemasangan — data lama tidak tertimpa.
        </p>
      </main>

      {pickerOpen && (
        <PatokClusterPicker
          rows={rows}
          onClose={() => setPickerOpen(false)}
          onPick={(r) => {
            setPickerOpen(false);
            setEntryFor(r);
          }}
        />
      )}

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
