"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import Topbar from "@/components/Topbar";
import InventarisasiLokasiForm from "@/components/InventarisasiLokasiForm";
import InventarisasiPemilikForm from "@/components/InventarisasiPemilikForm";
import InventarisasiStatCards from "@/components/InventarisasiStatCards";
import InventarisasiClusterTable, { InventarisasiClusterRow } from "@/components/InventarisasiClusterTable";
import InventarisasiDetailDrawer, { LokasiGroup } from "@/components/InventarisasiDetailDrawer";
import { InventarisasiLuasBarChart, InventarisasiTopPemilikPanel } from "@/components/InventarisasiCharts";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { InventarisasiDetailRow, InventarisasiSummaryRow, Cluster } from "@/lib/types";
import { exportInventarisasiExcel } from "@/lib/export/excel-modules";

export default function InventarisasiReportPage() {
  const { canEdit } = useProfile();
  const [detailRows, setDetailRows] = useState<InventarisasiDetailRow[]>([]);
  const [summaryRows, setSummaryRows] = useState<InventarisasiSummaryRow[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCluster, setSelectedCluster] = useState<{ id: string; nama: string } | null>(null);
  const [lokasiFormOpen, setLokasiFormOpen] = useState(false);
  const [lokasiFormDefaultCluster, setLokasiFormDefaultCluster] = useState<string | undefined>(undefined);
  const [pemilikFormFor, setPemilikFormFor] = useState<{ id: string; nama: string } | null>(null);

  async function loadData() {
    setLoading(true);
    const [{ data: detail }, { data: summary }, { data: clusterRows }] = await Promise.all([
      supabase.from("v_inventarisasi_detail").select("*").returns<InventarisasiDetailRow[]>(),
      supabase.from("v_inventarisasi_summary").select("*").returns<InventarisasiSummaryRow[]>(),
      supabase.from("clusters").select("*").order("name").returns<Cluster[]>(),
    ]);
    setDetailRows(detail ?? []);
    setSummaryRows(summary ?? []);
    setClusters(clusterRows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Rekap per cluster untuk kartu ringkasan + tabel utama -- gabungan
  // v_inventarisasi_summary (angka) dengan data desa/kecamatan dari `clusters`
  // supaya tabel lebih informatif tanpa perlu ubah view.
  const clusterTableRows: InventarisasiClusterRow[] = useMemo(() => {
    const clusterInfo = new Map(clusters.map((c) => [c.id, c]));
    return summaryRows
      .filter((s) => s.jumlah_lokasi > 0)
      .map((s) => ({
        cluster_id: s.cluster_id,
        cluster_nama: s.lokasi,
        desa: clusterInfo.get(s.cluster_id)?.desa ?? null,
        kecamatan: clusterInfo.get(s.cluster_id)?.kecamatan ?? null,
        jumlah_lokasi: s.jumlah_lokasi,
        jumlah_pemilik: s.jumlah_pemilik,
        total_luas_m2: Number(s.total_luas_m2),
      }))
      .sort((a, b) => a.cluster_nama.localeCompare(b.cluster_nama));
  }, [summaryRows, clusters]);

  // Detail per lokasi->pemilik, dikelompokkan per cluster -- dipakai saat
  // drawer detail dibuka untuk satu cluster tertentu.
  const lokasiGroupsByCluster = useMemo(() => {
    const map = new Map<string, LokasiGroup[]>();
    for (const r of detailRows) {
      if (!map.has(r.cluster_id)) map.set(r.cluster_id, []);
      const groups = map.get(r.cluster_id)!;
      let lokasi = groups.find((l) => l.lokasi_id === r.lokasi_id);
      if (!lokasi) {
        lokasi = { lokasi_id: r.lokasi_id, nama_lokasi: r.nama_lokasi, pemilik: [] };
        groups.push(lokasi);
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
    return map;
  }, [detailRows]);

  const totalCluster = clusterTableRows.length;
  const totalLokasi = clusterTableRows.reduce((s, c) => s + c.jumlah_lokasi, 0);
  const totalPemilik = clusterTableRows.reduce((s, c) => s + c.jumlah_pemilik, 0);
  const totalLuas = clusterTableRows.reduce((s, c) => s + c.total_luas_m2, 0);

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

  return (
    <>
      <Topbar title="Inventarisasi Report" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <InventarisasiStatCards
          totalCluster={totalCluster}
          totalLokasi={totalLokasi}
          totalPemilik={totalPemilik}
          totalLuas={totalLuas}
        />

        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={() =>
              exportInventarisasiExcel(
                detailRows,
                clusterTableRows.map((c) => ({
                  lokasi: c.cluster_nama,
                  jumlah_lokasi: c.jumlah_lokasi,
                  jumlah_pemilik: c.jumlah_pemilik,
                  total_luas_m2: c.total_luas_m2,
                }))
              )
            }
            disabled={detailRows.length === 0}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download Excel
          </button>
          {canEdit && (
            <button
              onClick={() => {
                setLokasiFormDefaultCluster(undefined);
                setLokasiFormOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Lokasi
            </button>
          )}
        </div>

        <InventarisasiClusterTable
          rows={clusterTableRows}
          loading={loading}
          onDetail={(row) => setSelectedCluster({ id: row.cluster_id, nama: row.cluster_nama })}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <p className="text-sm font-medium text-slate-900">Luas Ganti Rugi Terbesar per Cluster (m²)</p>
            <div className="mt-3">
              <InventarisasiLuasBarChart clusters={clusterTableRows} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-900">Cluster dengan Pemilik Terbanyak</p>
            <div className="mt-3">
              <InventarisasiTopPemilikPanel clusters={clusterTableRows} />
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Klik "Lihat Detail" pada sebuah cluster untuk melihat rekapitulasi lengkap tiap lokasi dan pemilik
          lahannya. Data pemilik pembebasan dipisahkan per cluster supaya tabel tetap ringkas -- rincian penuh
          hanya dimuat saat detail cluster dibuka.
        </p>
      </main>

      {selectedCluster && (
        <InventarisasiDetailDrawer
          clusterNama={selectedCluster.nama}
          lokasiGroups={lokasiGroupsByCluster.get(selectedCluster.id) ?? []}
          canEdit={canEdit}
          onClose={() => setSelectedCluster(null)}
          onAddLokasi={() => {
            setLokasiFormDefaultCluster(selectedCluster.id);
            setLokasiFormOpen(true);
          }}
          onAddPemilik={(lokasiId, lokasiNama) => setPemilikFormFor({ id: lokasiId, nama: lokasiNama })}
          onDeleteLokasi={handleDeleteLokasi}
          onDeletePemilik={handleDeletePemilik}
        />
      )}

      {lokasiFormOpen && (
        <InventarisasiLokasiForm
          clusters={clusters}
          defaultClusterId={lokasiFormDefaultCluster}
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
