"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { haToM2 } from "@/lib/units";

type ClusterChartRow = {
  lokasi: string;
  luas_pembebasan_ha: number;
  luas_rekonstruksi_ha: number;
};

export function ClusterProgressBarChart({ rows }: { rows: ClusterChartRow[] }) {
  const data = rows.map((r) => ({
    name: r.lokasi,
    Pembebasan: haToM2(r.luas_pembebasan_ha),
    Rekonstruksi: haToM2(r.luas_rekonstruksi_ha),
  }));

  if (data.length === 0) {
    return <p className="p-5 text-sm text-slate-400">Belum ada data untuk ditampilkan.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis
          tick={{ fontSize: 12 }}
          stroke="#94a3b8"
          tickFormatter={(v: number) => v.toLocaleString("id-ID")}
          width={70}
        />
        <Tooltip formatter={(v: number) => `${v.toLocaleString("id-ID")} m²`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Pembebasan" fill="#93c5fd" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Rekonstruksi" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProgressDonut({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const size = 140;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#eef1f5" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2563eb"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-slate-900 text-xl font-semibold">
          {clamped}%
        </text>
      </svg>
    </div>
  );
}
