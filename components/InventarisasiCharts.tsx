"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type ClusterSummary = { cluster_id: string; cluster_nama: string; jumlah_lokasi: number; jumlah_pemilik: number; total_luas_m2: number };

/** Bar chart: cluster dengan luasan ganti rugi terbesar (top 8, biar tetap terbaca). */
export function InventarisasiLuasBarChart({ clusters }: { clusters: ClusterSummary[] }) {
  const data = useMemo(
    () =>
      [...clusters]
        .sort((a, b) => b.total_luas_m2 - a.total_luas_m2)
        .slice(0, 8)
        .map((c) => ({ name: c.cluster_nama, luas: c.total_luas_m2 })),
    [clusters]
  );

  if (data.length === 0) {
    return <p className="p-5 text-sm text-slate-400">Belum ada data untuk ditampilkan.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v: number) => v.toLocaleString("id-ID")} width={60} />
        <Tooltip formatter={(v: number) => `${v.toLocaleString("id-ID")} m²`} />
        <Bar dataKey="luas" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Panel ranking: cluster dengan pemilik lahan terbanyak (top 5). */
export function InventarisasiTopPemilikPanel({ clusters }: { clusters: ClusterSummary[] }) {
  const top = useMemo(() => [...clusters].sort((a, b) => b.jumlah_pemilik - a.jumlah_pemilik).slice(0, 5), [clusters]);

  if (top.length === 0) {
    return <p className="p-5 text-sm text-slate-400">Belum ada data untuk ditampilkan.</p>;
  }

  return (
    <div className="space-y-1">
      {top.map((c, i) => (
        <div key={c.cluster_id} className="flex items-center justify-between gap-2 rounded-lg px-1 py-2">
          <div className="flex min-w-0 items-center gap-2.5 text-sm text-slate-600">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
              {i + 1}
            </span>
            <span className="truncate">{c.cluster_nama}</span>
          </div>
          <span className="shrink-0 text-sm font-medium text-slate-900">{c.jumlah_pemilik} pemilik</span>
        </div>
      ))}
    </div>
  );
}
