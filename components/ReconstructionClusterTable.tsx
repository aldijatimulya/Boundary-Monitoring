"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { ReportMatrixRow, STATUS_LABEL } from "@/lib/types";
import { formatM2 } from "@/lib/units";

type Props = {
  rows: ReportMatrixRow[];
  loading: boolean;
  canEdit: boolean;
  geometrySet: Record<string, boolean>;
  onDetail: (row: ReportMatrixRow) => void;
  onGeometry: (row: ReportMatrixRow) => void;
};

const STATUS_OPTIONS = [
  { value: "not_started", label: "Belum mulai" },
  { value: "on_progress", label: "On progress" },
  { value: "completed", label: "Selesai" },
  { value: "need_follow_up", label: "Perlu tindak lanjut" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function ReconstructionClusterTable({ rows, loading, canEdit, geometrySet, onDetail, onGeometry }: Props) {
  const [search, setSearch] = useState("");
  const [desaFilter, setDesaFilter] = useState("");
  const [kecamatanFilter, setKecamatanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const desaOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.desa).filter(Boolean))) as string[],
    [rows]
  );
  const kecamatanOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.kecamatan).filter(Boolean))) as string[],
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const haystack = `${r.lokasi} ${r.desa ?? ""} ${r.kecamatan ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (desaFilter && r.desa !== desaFilter) return false;
      if (kecamatanFilter && r.kecamatan !== kecamatanFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, desaFilter, kecamatanFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function resetFilters() {
    setSearch("");
    setDesaFilter("");
    setKecamatanFilter("");
    setStatusFilter("");
    setPage(1);
  }

  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-medium text-slate-900">Daftar Cluster Rekonstruksi</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari cluster, desa, kecamatan..."
            className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-3 text-xs focus:border-brand-blue focus:outline-none"
          />
        </div>
        <select
          value={desaFilter}
          onChange={(e) => handleFilterChange(setDesaFilter, e.target.value)}
          className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Semua Desa</option>
          {desaOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={kecamatanFilter}
          onChange={(e) => handleFilterChange(setKecamatanFilter, e.target.value)}
          className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Semua Kecamatan</option>
          {kecamatanOptions.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
          className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          <Filter className="h-3.5 w-3.5" />
          Filter
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="px-4 py-3 font-normal">Cluster</th>
              <th className="px-4 py-3 font-normal">Desa</th>
              <th className="px-4 py-3 font-normal">Kecamatan</th>
              <th className="px-4 py-3 font-normal">Kabupaten</th>
              <th className="px-4 py-3 font-normal text-right">Target (m²)</th>
              <th className="px-4 py-3 font-normal text-right">Realisasi (m²)</th>
              <th className="px-4 py-3 font-normal text-right">Selisih (m²)</th>
              <th className="px-4 py-3 font-normal text-right">% Selisih</th>
              <th className="px-4 py-3 font-normal">% Realisasi</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                  {rows.length === 0 ? 'Belum ada cluster. Klik "Tambah Cluster" untuk mulai.' : "Tidak ada cluster yang cocok dengan filter."}
                </td>
              </tr>
            )}
            {paginated.map((r) => {
              const status = STATUS_LABEL[r.status];
              const progres =
                Number(r.luas_pembebasan_ha) > 0
                  ? Math.min(100, Math.round((Number(r.luas_rekonstruksi_ha) / Number(r.luas_pembebasan_ha)) * 100))
                  : Number(r.luas_rekonstruksi_ha) > 0
                  ? 100
                  : 0;
              return (
                <tr key={r.cluster_id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.lokasi}</td>
                  <td className="px-4 py-3 text-slate-500">{r.desa ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{r.kecamatan ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{r.kabupaten ?? "-"}</td>
                  <td className="px-4 py-3 text-right">{formatM2(r.luas_pembebasan_ha)}</td>
                  <td className="px-4 py-3 text-right">{formatM2(r.luas_rekonstruksi_ha)}</td>
                  <td className={`px-4 py-3 text-right ${Number(r.selisih_ha) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {formatM2(r.selisih_ha)}
                  </td>
                  <td className={`px-4 py-3 text-right ${r.persen_selisih < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {r.persen_selisih}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand-blue" style={{ width: `${progres}%` }} />
                      </div>
                      <span className="w-8 shrink-0 text-xs text-slate-400">{progres}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${status?.className}`}>{status?.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canEdit ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onGeometry(r)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
                          title={geometrySet[r.cluster_id] ? "Edit geometri" : "Tambah geometri"}
                        >
                          {geometrySet[r.cluster_id] ? "Geometri" : "+ Geometri"}
                        </button>
                        <button
                          onClick={() => onDetail(r)}
                          className="rounded-md border border-brand-blue px-3 py-1 text-xs font-medium text-brand-blue hover:bg-blue-50"
                        >
                          Detail
                        </button>
                      </div>
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

      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs text-slate-500">
          <p>
            Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} dari{" "}
            {filtered.length} data
          </p>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-brand-blue focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} / halaman
                </option>
              ))}
            </select>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5)
              .map((n) => (
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
  );
}
