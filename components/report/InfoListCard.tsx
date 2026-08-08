import type { LucideIcon } from "lucide-react";

export type InfoRow = {
  icon: LucideIcon;
  label: string;
  value: string;
};

/** Kartu daftar informasi ikon + label + value, satu baris per item. */
export default function InfoListCard({ rows }: { rows: InfoRow[] }) {
  return (
    <div className="space-y-3.5">
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-3 text-sm">
          <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span className="w-28 shrink-0 text-slate-500">{row.label}</span>
          <span className="min-w-0 flex-1 break-words font-medium text-slate-800">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
