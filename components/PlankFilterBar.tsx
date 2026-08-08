"use client";

import { Filter, Search } from "lucide-react";
import { Cluster } from "@/lib/types";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  clusterFilter: string;
  onClusterFilterChange: (v: string) => void;
  clusters: Cluster[];
  onReset: () => void;
};

export default function PlankFilterBar({
  search,
  onSearchChange,
  clusterFilter,
  onClusterFilterChange,
  clusters,
  onReset,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari lokasi plank atau cluster..."
          className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-3 text-xs focus:border-brand-blue focus:outline-none"
        />
      </div>
      <select
        value={clusterFilter}
        onChange={(e) => onClusterFilterChange(e.target.value)}
        className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:border-brand-blue focus:outline-none"
      >
        <option value="">Semua Cluster</option>
        {clusters.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        disabled
        title="Semua lokasi yang tercatat berarti sudah terpasang"
        className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-400"
      >
        <option>Semua Status</option>
      </select>
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
      >
        <Filter className="h-3.5 w-3.5" />
        Filter
      </button>
    </div>
  );
}
