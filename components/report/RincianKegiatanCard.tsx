import type { RincianKegiatanItem } from "@/lib/types";

const BAR_COLORS = ["bg-brand-blue", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-brand-coral", "bg-brand-teal"];

/** Daftar progress bar per jenis kegiatan pada satu laporan (Inventarisasi, Rekonstruksi, Pemasangan Patok, dst). */
export default function RincianKegiatanCard({ items }: { items: RincianKegiatanItem[] | null | undefined }) {
  const rows = items ?? [];

  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Belum ada rincian kegiatan pada laporan ini.</p>;
  }

  return (
    <div className="space-y-4">
      {rows.map((item, i) => {
        const persen = Math.min(Math.max(item.persen, 0), 100);
        return (
          <div key={`${item.jenis}-${i}`}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-slate-600">{item.jenis}</span>
              <span className="font-medium text-slate-800">{persen}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                style={{ width: `${persen}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
