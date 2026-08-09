"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { ClusterProductivity } from "@/lib/analytics";
import { formatM2 } from "@/lib/units";
import { format } from "date-fns";

type SortKey = "priority" | "name" | "persen" | "remaining";

function statusOf(c: ClusterProductivity): "selesai" | "risk" | "progress" {
  if (c.remainingHa === 0) return "selesai";
  if (c.atRisk) return "risk";
  return "progress";
}

// Urutan default: yang perlu perhatian duluan (paling butuh dilihat), baru
// on progress, baru yang sudah selesai di paling bawah.
const PRIORITY: Record<string, number> = { risk: 0, progress: 1, selesai: 2 };

export default function AnalyticsClusterTable({ clusters }: { clusters: ClusterProductivity[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("priority");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? clusters.filter((c) => c.name.toLowerCase().includes(q)) : clusters;

    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "persen":
          return b.persenSelesai - a.persenSelesai;
        case "remaining":
          return b.remainingHa - a.remainingHa;
        case "priority":
        default:
          return PRIORITY[statusOf(a)] - PRIORITY[statusOf(b)] || a.name.localeCompare(b.name);
      }
    });
    return sorted;
  }, [clusters, search, sortKey]);

  function SortButton({ k, children }: { k: SortKey; children: React.ReactNode }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => setSortKey(k)}
        className={`inline-flex items-center gap-1 hover:text-slate-700 ${active ? "text-slate-900" : ""}`}
      >
        {children}
        <ArrowUpDown className={`h-3 w-3 ${active ? "text-brand-blue" : "text-slate-300"}`} />
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-medium text-slate-900">Produktivitas per cluster</h2>
          <p className="mt-1 text-xs text-slate-400">
            Cluster ditandai "Perlu perhatian" kalau progresnya stagnan atau proyeksi penyelesaiannya lebih dari
            180 hari lagi.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari cluster..."
            className="w-48 rounded-md border border-slate-200 py-1.5 pl-8 pr-3 text-xs focus:border-brand-blue focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="px-5 py-3 font-normal">
                <SortButton k="name">Cluster</SortButton>
              </th>
              <th className="px-5 py-3 text-right font-normal">
                <SortButton k="persen">Progres</SortButton>
              </th>
              <th className="px-5 py-3 text-right font-normal">Kecepatan (m²/minggu)</th>
              <th className="px-5 py-3 text-right font-normal">
                <SortButton k="remaining">Sisa (m²)</SortButton>
              </th>
              <th className="px-5 py-3 font-normal">Estimasi selesai</th>
              <th className="px-5 py-3 font-normal">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  Tidak ada cluster yang cocok dengan pencarian.
                </td>
              </tr>
            )}
            {rows.map((c) => {
              const status = statusOf(c);
              return (
                <tr key={c.cluster_id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-5 py-3 text-right">{c.persenSelesai}%</td>
                  <td className="px-5 py-3 text-right">{formatM2(c.haPerWeek)}</td>
                  <td className="px-5 py-3 text-right">{formatM2(c.remainingHa)}</td>
                  <td className="px-5 py-3">{c.forecastDate ? format(new Date(c.forecastDate), "d MMM yyyy") : "-"}</td>
                  <td className="px-5 py-3">
                    {status === "selesai" ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Selesai</span>
                    ) : status === "risk" ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">Perlu perhatian</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">On progress</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
