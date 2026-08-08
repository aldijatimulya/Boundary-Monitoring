import type { LucideIcon } from "lucide-react";

type Tone = "blue" | "emerald" | "amber" | "violet" | "slate";

const TONE_CLASSES: Record<Tone, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-50", icon: "text-brand-blue" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600" },
  violet: { bg: "bg-violet-50", icon: "text-violet-600" },
  slate: { bg: "bg-slate-100", icon: "text-slate-600" },
};

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
  tone?: Tone;
  dot?: "emerald" | "amber" | "slate" | "red";
};

const DOT_CLASSES: Record<NonNullable<Props["dot"]>, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  slate: "bg-slate-400",
  red: "bg-red-500",
};

/** Kartu ringkas satu metrik (ikon + label + nilai + sublabel opsional). */
export default function StatCard({ icon: Icon, label, value, sublabel, tone = "blue", dot }: Props) {
  const colors = TONE_CLASSES[tone];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
        <Icon className={`h-5 w-5 ${colors.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500">{label}</p>
        <div className="flex items-center gap-1.5">
          <p className="truncate text-lg font-semibold text-slate-900">{value}</p>
          {dot && <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASSES[dot]}`} />}
        </div>
        {sublabel && <p className="truncate text-xs text-slate-400">{sublabel}</p>}
      </div>
    </div>
  );
}
