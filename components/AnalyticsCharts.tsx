"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BurndownPoint, WeeklyProductivity } from "@/lib/analytics";
import { format } from "date-fns";
import { haToM2 } from "@/lib/units";

export function BurndownChart({ series }: { series: BurndownPoint[] }) {
  const chartData = series.map((p) => ({
    ...p,
    dateLabel: format(new Date(p.date), "d MMM"),
    remainingHa: haToM2(p.remainingHa),
    idealRemainingHa: haToM2(p.idealRemainingHa),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: "#64748b" }} />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          width={70}
          tickFormatter={(v: number) => v.toLocaleString("id-ID")}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${Number(value).toLocaleString("id-ID")} m²`,
            name,
          ]}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="remainingHa"
          name="Sisa realisasi (aktual)"
          stroke="#DC2626"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="idealRemainingHa"
          name="Ideal (jadwal rencana)"
          stroke="#94A3B8"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function ProductivityChart({ data }: { data: WeeklyProductivity[] }) {
  const chartData = data.map((p) => ({
    ...p,
    incrementHa: haToM2(p.incrementHa),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: "#64748b" }} />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          width={60}
          tickFormatter={(v: number) => v.toLocaleString("id-ID")}
        />
        <Tooltip formatter={(value: number) => [`${Number(value).toLocaleString("id-ID")} m²`, "Realisasi minggu ini"]} />
        <Bar dataKey="incrementHa" name="Realisasi per minggu" fill="#2563EB" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
