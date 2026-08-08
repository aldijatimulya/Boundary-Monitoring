"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { PatokReportRow } from "@/lib/types";

type Props = {
  rows: PatokReportRow[];
  onPick: (row: PatokReportRow) => void;
  onClose: () => void;
};

export default function PatokClusterPicker({ rows, onPick, onClose }: Props) {
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => `${r.lokasi} ${r.desa ?? ""} ${r.kecamatan ?? ""}`.toLowerCase().includes(q))
    : rows;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">Tambah Data Patok</h2>
        <p className="mt-1 text-xs text-slate-400">Pilih cluster yang ingin dicatat data patoknya.</p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari cluster, desa, kecamatan..."
            className="w-full rounded-md border border-slate-200 py-2 pl-8 pr-3 text-sm focus:border-brand-blue focus:outline-none"
          />
        </div>

        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
          {filtered.length === 0 && <p className="px-1 py-6 text-center text-sm text-slate-400">Cluster tidak ditemukan.</p>}
          {filtered.map((r) => (
            <button
              key={r.cluster_id}
              onClick={() => onPick(r)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{r.lokasi}</span>
              <span className="text-xs text-slate-400">
                {r.desa ?? "-"}, {r.kecamatan ?? "-"}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
