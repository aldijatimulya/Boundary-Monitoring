"use client";

import { useMemo, useState } from "react";
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";

export type InventarisasiClusterRow = {
  cluster_id: string;
  cluster_nama: string;
  desa: string | null;
  kecamatan: string | null;
  jumlah_lokasi: number;
  jumlah_pemilik: number;
  total_luas_m2: number;
};

type Props = {
  rows: InventarisasiClusterRow[];
  loading: boolean;
  onDetail: (row: InventarisasiClusterRow) => void;
};

const PAGE_SIZE = 10;

export default function InventarisasiClusterTable({ rows, loading, onDetail }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.cluster_nama} ${r.desa ?? ""} ${r.kecamatan ?? ""}`.toLowerCase().includes(q));
  }, [rows, search]);

  const totalLuas = filtered.reduce((s, r) => s + r.total_luas_m2, 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
        <div className="relative min-w-[220px] flex-1">
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="px-4 py-3 font-normal">No</th>
              <th className="px-4 py-3 font-normal">Cluster</th>
              <th className="px-4 py-3 font-normal">Desa</th>
              <th className="px-4 py-3 font-normal">Kecamatan</th>
              <th className="px-4 py-3 font-normal text-right">Jumlah Lokasi</th>
              <th className="px-4 py-3 font-normal text-right">Jumlah Pemilik</th>
              <th className="px-4 py-3 font-normal text-right">Total Luas (m²)</th>
              <th className="px-4 py-3 font-normal text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  {rows.length === 0
                    ? 'Belum ada data inventarisasi. Klik "Tambah Lokasi" untuk mulai.'
                    : "Tidak ada cluster yang cocok dengan pencarian."}
                </td>
              </tr>
            )}
            {paginated.map((r, idx) => (
              <tr key={r.cluster_id} className="border-b border-slate-50 hover:bg-slate-50/60">
                <td className="px-4 py-3 text-slate-500">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{r.cluster_nama}</td>
                <td className="px-4 py-3 text-slate-500">{r.desa ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">{r.kecamatan ?? "—"}</td>
                <td className="px-4 py-3 text-right">{r.jumlah_lokasi}</td>
                <td className="px-4 py-3 text-right">{r.jumlah_pemilik}</td>
                <td className="px-4 py-3 text-right font-medium text-brand-blue">
                  {r.total_luas_m2.toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onDetail(r)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-brand-blue px-3 py-1 text-xs font-medium text-brand-blue hover:bg-blue-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Lihat Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 font-medium text-slate-700">
                <td colSpan={6} className="px-4 py-2 text-right">
                  Total Keseluruhan
                </td>
                <td className="px-4 py-2 text-right text-brand-blue">{totalLuas.toLocaleString("id-ID")}</td>
                <td className="px-4 py-2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <p>
            Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} dari{" "}
            {filtered.length} cluster
          </p>
          <div className="flex items-center gap-2">
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
