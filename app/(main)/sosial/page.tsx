"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Search, Download, Plus, Eye, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import Topbar from "@/components/Topbar";
import SosialEntryForm from "@/components/SosialEntryForm";
import SosialDetailModal from "@/components/SosialDetailModal";
import SosialStatCards from "@/components/SosialStatCards";
import { SosialJenisDonut, SosialClusterBarChart, SosialStatusSummary } from "@/components/SosialCharts";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { SosialReportRow, Cluster, STATUS_LABEL } from "@/lib/types";
import { exportSosialExcel } from "@/lib/export/excel-modules";

type ClusterSosialGroup = { cluster_id: string; cluster_nama: string; patok_terpasang: number; kasus: SosialReportRow[] };

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "proses", label: "Proses" },
  { value: "selesai", label: "Selesai" },
];

const PAGE_SIZE = 10;

export default function SosialReportPage() {
  const { canEdit } = useProfile();
  const [rows, setRows] = useState<SosialReportRow[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<SosialReportRow | null>(null);
  const [detailRow, setDetailRow] = useState<SosialReportRow | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

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
    setMenuOpenId(null);
    await supabase.from("sosial_report").delete().eq("id", id);
    loadData();
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search && !r.lokasi.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (dateFrom && r.tanggal_catat < dateFrom) return false;
      if (dateTo && r.tanggal_catat > dateTo) return false;
      return true;
    });
  }, [rows, search, statusFilter, dateFrom, dateTo]);

  const totalOkupasi = filtered.reduce((s, r) => s + Number(r.luas_okupasi_m2), 0);
  const totalPatok = useMemo(() => {
    const seen = new Set<string>();
    let sum = 0;
    for (const r of filtered) {
      if (seen.has(r.cluster_id)) continue;
      seen.add(r.cluster_id);
      sum += Number(r.patok_terpasang);
    }
    return sum;
  }, [filtered]);

  const grouped: ClusterSosialGroup[] = useMemo(() => {
    const map = new Map<string, ClusterSosialGroup>();
    for (const r of filtered) {
      if (!map.has(r.cluster_id)) {
        map.set(r.cluster_id, {
          cluster_id: r.cluster_id,
          cluster_nama: r.lokasi,
          patok_terpasang: r.patok_terpasang,
          kasus: [],
        });
      }
      map.get(r.cluster_id)!.kasus.push(r);
    }
    return Array.from(map.values());
  }, [filtered]);

  function totalOkupasiCluster(group: ClusterSosialGroup) {
    return group.kasus.reduce((s, r) => s + Number(r.luas_okupasi_m2), 0);
  }

  const totalPages = Math.max(1, Math.ceil(grouped.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedGroups = grouped.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rowNumberOffset = (currentPage - 1) * PAGE_SIZE;

  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <>
      <Topbar title="Sosial Report" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <SosialStatCards
          totalKasus={filtered.length}
          totalLuas={totalOkupasi}
          clusterTerdampak={new Set(filtered.map((r) => r.cluster_id)).size}
          totalPatok={totalPatok}
        />

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                placeholder="Pilih lokasi / cluster..."
                className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-3 text-xs focus:border-brand-blue focus:outline-none"
              />
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleFilterChange(setDateFrom, e.target.value)}
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:border-brand-blue focus:outline-none"
            />
            <span className="text-xs text-slate-400">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleFilterChange(setDateTo, e.target.value)}
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:border-brand-blue focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:border-brand-blue focus:outline-none"
            >
              {STATUS_FILTER_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                onClick={() => exportSosialExcel(filtered)}
                disabled={filtered.length === 0}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                Download Excel
              </button>
              {canEdit && (
                <button
                  onClick={() => {
                    setEditRow(null);
                    setFormOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-md bg-brand-blue px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Data Okupasi
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-center text-slate-500">
                  <th className="px-3 py-3 font-normal">No</th>
                  <th className="px-3 py-3 text-left font-normal">Cluster</th>
                  <th className="px-3 py-3 text-left font-normal">Pemilik Lahan</th>
                  <th className="px-3 py-3 text-left font-normal">Jenis Okupasi</th>
                  <th className="px-3 py-3 font-normal">Luas Okupasi (m²)</th>
                  <th className="px-3 py-3 font-normal">Total (m²)</th>
                  <th className="px-3 py-3 font-normal">Patok Terpasang</th>
                  <th className="px-3 py-3 font-normal">Status</th>
                  <th className="px-3 py-3 font-normal">Tanggal</th>
                  <th className="px-3 py-3 font-normal">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      Memuat data...
                    </td>
                  </tr>
                )}
                {!loading && grouped.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      {rows.length === 0
                        ? "Belum ada data okupasi/permasalahan sosial yang tercatat."
                        : "Tidak ada data yang cocok dengan filter."}
                    </td>
                  </tr>
                )}
                {paginatedGroups.map((group, groupIdx) => (
                  <Fragment key={group.cluster_id}>
                    {group.kasus.map((r, rIdx) => {
                      const status = STATUS_LABEL[r.status];
                      return (
                        <tr key={r.id} className="border-b border-slate-50 text-slate-700 hover:bg-slate-50/60">
                          {rIdx === 0 && (
                            <td rowSpan={group.kasus.length} className="px-3 py-3 text-center align-middle text-slate-500">
                              {rowNumberOffset + groupIdx + 1}
                            </td>
                          )}
                          {rIdx === 0 && (
                            <td rowSpan={group.kasus.length} className="px-3 py-3 align-middle font-medium text-slate-900">
                              {group.cluster_nama}
                            </td>
                          )}
                          <td className="px-3 py-3">{r.pemilik_lahan || "—"}</td>
                          <td className="px-3 py-3">{r.jenis_okupasi || "—"}</td>
                          <td className="px-3 py-3 text-right">{Number(r.luas_okupasi_m2).toLocaleString("id-ID")}</td>
                          {rIdx === 0 && (
                            <td rowSpan={group.kasus.length} className="px-3 py-3 text-right align-middle font-medium text-brand-blue">
                              {totalOkupasiCluster(group).toLocaleString("id-ID")}
                            </td>
                          )}
                          {rIdx === 0 && (
                            <td rowSpan={group.kasus.length} className="px-3 py-3 text-center align-middle">
                              {group.patok_terpasang}
                            </td>
                          )}
                          <td className="px-3 py-3 text-center">
                            <span className={`rounded-full px-2 py-1 text-xs ${status?.className}`}>{status?.label}</span>
                          </td>
                          <td className="px-3 py-3 text-center text-slate-500">{r.tanggal_catat}</td>
                          <td className="px-3 py-3">
                            <div className="relative flex items-center justify-center gap-1">
                              <button
                                onClick={() => setDetailRow(r)}
                                title="Lihat detail"
                                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-blue"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => setMenuOpenId(menuOpenId === r.id ? null : r.id)}
                                  title="Menu"
                                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              )}
                              {menuOpenId === r.id && (
                                <div className="absolute right-0 top-8 z-10 w-32 rounded-md border border-slate-200 bg-white py-1 text-left shadow-lg">
                                  <button
                                    onClick={() => {
                                      setMenuOpenId(null);
                                      setEditRow(r);
                                      setFormOpen(true);
                                    }}
                                    className="block w-full px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(r.id)}
                                    className="block w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
              {grouped.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 font-medium text-slate-700">
                    <td colSpan={5} className="px-3 py-2 text-right">
                      Total Keseluruhan
                    </td>
                    <td className="px-3 py-2 text-right text-brand-blue">{totalOkupasi.toLocaleString("id-ID")}</td>
                    <td colSpan={4} className="px-3 py-2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {grouped.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              <p>
                Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, grouped.length)} dari{" "}
                {grouped.length} data
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs ${
                      n === currentPage ? "bg-brand-blue text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-900">Jenis Okupasi</p>
            <div className="mt-3">
              <SosialJenisDonut rows={filtered} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-900">Luas Okupasi per Cluster (m²)</p>
            <div className="mt-3">
              <SosialClusterBarChart rows={filtered} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-900">Ringkasan Status</p>
            <div className="mt-3">
              <SosialStatusSummary rows={filtered} />
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Data pada tabel akan bertambah sesuai dengan data yang ditambahkan pada Reconstruction Report, Patok
          Report, dan Plank Report. Daftar cluster di form "Tambah Data Okupasi" sama dengan daftar cluster di
          Reconstruction Report. Satu cluster boleh punya lebih dari satu kasus okupasi -- setiap kasus dicatat
          sebagai baris terpisah, dengan kolom Total dan Patok Terpasang mengikuti nilai cluster-nya.
        </p>
      </main>

      {formOpen && (
        <SosialEntryForm
          clusters={clusters}
          editRow={editRow ?? undefined}
          onClose={() => {
            setFormOpen(false);
            setEditRow(null);
          }}
          onSaved={() => {
            setFormOpen(false);
            setEditRow(null);
            loadData();
          }}
        />
      )}

      {detailRow && <SosialDetailModal row={detailRow} onClose={() => setDetailRow(null)} />}
    </>
  );
}
