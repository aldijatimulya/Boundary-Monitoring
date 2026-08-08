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

export type PhaseSegment = { label: string; percent: number; color: string; detail: string };

/**
 * Donut 4-segmen: tiap komponen (Inventarisasi Data, Rekonstruksi, Patok,
 * Plank) dapat "slot" 1/4 lingkaran masing-masing, terisi sesuai progres
 * komponen itu sendiri (0-100% dari slotnya) -- jadi progres satu-satu tetap
 * kelihatan jelas per warna, sementara angka di tengah adalah rata-rata
 * keempatnya (progres keseluruhan).
 */
export function PhaseProgressDonut({
  segments,
  overallPercent,
}: {
  segments: PhaseSegment[];
  overallPercent: number;
}) {
  const size = 190;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const n = segments.length;
  const slotLength = circumference / n;
  const gapLength = slotLength * 0.06;

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => (
          <circle
            key={`track-${seg.label}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#eef1f5"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${slotLength - gapLength} ${circumference - (slotLength - gapLength)}`}
            strokeDashoffset={-(i * slotLength)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
        {segments.map((seg, i) => {
          const clamped = Math.max(0, Math.min(100, seg.percent));
          const filled = (clamped / 100) * (slotLength - gapLength);
          if (filled <= 0) return null;
          return (
            <circle
              key={`fill-${seg.label}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={seg.color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference - filled}`}
              strokeDashoffset={-(i * slotLength)}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" className="fill-slate-900 text-2xl font-semibold">
          {Math.round(overallPercent)}%
        </text>
        <text x="50%" y="60%" textAnchor="middle" dominantBaseline="central" className="fill-slate-400 text-[10px]">
          Progres Total
        </text>
      </svg>
    </div>
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
