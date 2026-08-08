"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, ImageOff } from "lucide-react";
import { PlankLocation } from "@/lib/types";

type Props = {
  rows: PlankLocation[]; // sudah difilter oleh PlankFilterBar di level halaman
  allCount: number; // jumlah total sebelum filter, untuk pesan "belum ada data"
  loading: boolean;
  onDetail: (p: PlankLocation) => void;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

// Setiap baris di tabel plank_locations merepresentasikan lokasi yang SUDAH
// terpasang (skema mewajibkan jumlah_plank >= 1) -- jadi status yang benar
// untuk data yang ada sekarang selalu "Terpasang". Kartu "Belum Terpasang" di
// atas dihitung dari target keseluruhan, bukan dari baris lokasi tersendiri.
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PlankLocationTable({ rows, allCount, loading, onDetail }: Props) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="px-4 py-3 font-normal">Lokasi Plank</th>
              <th className="px-4 py-3 font-normal">Cluster</th>
              <th className="px-4 py-3 font-normal">Koordinat</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Tanggal Pasang</th>
              <th className="px-4 py-3 font-normal">Foto</th>
              <th className="px-4 py-3 font-normal text-right">Aksi</th>
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
                  {allCount === 0
                    ? 'Belum ada lokasi plank. Klik "+ Tambah Lokasi Plank" untuk mulai.'
                    : "Tidak ada lokasi yang cocok dengan filter."}
                </td>
              </tr>
            )}
            {paginated.map((p) => {
              const cover = p.foto_urls?.[0];
              return (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{p.nama_lokasi}</td>
                  <td className="px-4 py-2 text-slate-500">{p.cluster_nama ?? "-"}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {p.koordinat_lat && p.koordinat_lng
                      ? `${Number(p.koordinat_lat).toFixed(6)}, ${Number(p.koordinat_lng).toFixed(6)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Terpasang
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-500">{formatDate(p.created_at)}</td>
                  <td className="px-4 py-2">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={p.nama_lokasi} className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-300">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => onDetail(p)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-brand-blue px-3 py-1 text-xs font-medium text-brand-blue hover:bg-blue-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Detail
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs text-slate-500">
          <p>
            Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, rows.length)} dari{" "}
            {rows.length} data
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
