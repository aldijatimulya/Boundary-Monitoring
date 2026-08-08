"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { SosialReportRow } from "@/lib/types";

const DONUT_COLORS = ["#2563EB", "#F59E0B", "#0EA5A0", "#8B5CF6", "#E4572E", "#94A3B8"];

/** Donut "Jenis Okupasi": proporsi luas okupasi per jenis (tanaman/bangunan/dll). */
export function SosialJenisDonut({ rows }: { rows: SosialReportRow[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = r.jenis_okupasi?.trim() || "Tidak diketahui";
      map.set(key, (map.get(key) ?? 0) + Number(r.luas_okupasi_m2));
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .map(([name, luas]) => ({ name, luas, persen: total > 0 ? Math.round((luas / total) * 100) : 0 }))
      .sort((a, b) => b.luas - a.luas);
  }, [rows]);

  if (data.length === 0) {
    return <p className="p-5 text-sm text-slate-400">Belum ada data untuk ditampilkan.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-[190px] w-[190px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="luas" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `${v.toLocaleString("id-ID")} m²`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex min-w-0 items-center gap-1.5 text-slate-600">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              <span className="truncate">{d.name}</span>
            </div>
            <span className="shrink-0 text-slate-400">
              {d.persen}% ({d.luas.toLocaleString("id-ID")} m²)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Bar chart "Luas Okupasi per Cluster": satu bar per cluster. */
export function SosialClusterBarChart({ rows }: { rows: SosialReportRow[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      map.set(r.lokasi, (map.get(r.lokasi) ?? 0) + Number(r.luas_okupasi_m2));
    }
    return Array.from(map.entries()).map(([name, luas]) => ({ name, luas }));
  }, [rows]);

  if (data.length === 0) {
    return <p className="p-5 text-sm text-slate-400">Belum ada data untuk ditampilkan.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v: number) => v.toLocaleString("id-ID")} width={50} />
        <Tooltip formatter={(v: number) => `${v.toLocaleString("id-ID")} m²`} />
        <Bar dataKey="luas" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Panel "Ringkasan Status": jumlah kasus per status penanganan. */
export function SosialStatusSummary({ rows }: { rows: SosialReportRow[] }) {
  const selesai = rows.filter((r) => r.status === "selesai").length;
  const proses = rows.filter((r) => r.status === "proses").length;

  const items = [
    { label: "Selesai", value: selesai, dot: "bg-emerald-500" },
    { label: "Proses", value: proses, dot: "bg-amber-500" },
  ];

  return (
    <div className="space-y-1">
      {items.map((it) => (
        <div key={it.label} className="flex items-center justify-between rounded-lg px-1 py-2.5">
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${it.dot}`} />
            {it.label}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold leading-tight text-slate-900">{it.value}</p>
            <p className="text-[11px] text-slate-400">Kasus</p>
          </div>
        </div>
      ))}
    </div>
  );
}
