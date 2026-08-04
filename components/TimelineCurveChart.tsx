"use client";

import { forwardRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { TimelineMatrix } from "@/lib/timeline-matrix";

type Props = { matrix: TimelineMatrix };

// forwardRef ke elemen pembungkus <div> -- dipakai lib/export/svg-to-png.ts
// buat cari <svg> hasil render Recharts di dalamnya, lalu diubah jadi PNG.
const TimelineCurveChart = forwardRef<HTMLDivElement, Props>(function TimelineCurveChart(
  { matrix },
  ref
) {
  const chartData = matrix.weeks.map((w, wi) => ({
    label: `Mgg ${wi + 1}`,
    tanggal: w.label,
    rencana: matrix.rencanaKumulatif[wi],
    realisasi: matrix.realisasiKumulatif[wi],
  }));

  return (
    <div ref={ref} className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-2 text-sm font-medium text-slate-700">Kurva-S — Rencana vs Realisasi Kumulatif</p>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            width={50}
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            formatter={(value, name) => [value === null || value === undefined ? "-" : `${value}%`, name]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.tanggal ?? ""}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {matrix.currentWeekIndex >= 0 && (
            <ReferenceLine
              x={`Mgg ${matrix.currentWeekIndex + 1}`}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{ value: "Minggu ini", position: "insideTopRight", fontSize: 10, fill: "#64748b" }}
            />
          )}
          <Line
            type="monotone"
            dataKey="rencana"
            name="Rencana Kumulatif"
            stroke="#2563EB"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="realisasi"
            name="Realisasi Kumulatif"
            stroke="#059669"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export default TimelineCurveChart;
