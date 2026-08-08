import { Plus, Trash2 } from "lucide-react";
import type { RincianKegiatanItem } from "@/lib/types";

const SUGGESTIONS = ["Inventarisasi", "Rekonstruksi", "Pemasangan Patok", "Pemasangan Plank"];

type Props = {
  items: RincianKegiatanItem[];
  onChange: (items: RincianKegiatanItem[]) => void;
};

/** Baris-baris input "jenis kegiatan + persen realisasi" yang bisa ditambah/hapus, disimpan sebagai jsonb. */
export default function RincianKegiatanInput({ items, onChange }: Props) {
  function updateRow(index: number, patch: Partial<RincianKegiatanItem>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addRow(jenis = "") {
    onChange([...items, { jenis, persen: 0 }]);
  }

  function removeRow(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const usedJenis = new Set(items.map((it) => it.jenis));
  const quickAdd = SUGGESTIONS.filter((s) => !usedJenis.has(s));

  return (
    <div>
      <label className="text-sm text-slate-600">Rincian kegiatan (per jenis)</label>

      <div className="mt-2 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={item.jenis}
              onChange={(e) => updateRow(i, { jenis: e.target.value })}
              placeholder="Jenis kegiatan, mis. Inventarisasi"
              className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                value={item.persen}
                onChange={(e) => updateRow(i, { persen: Number(e.target.value) })}
                className="w-20 rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <span className="text-sm text-slate-400">%</span>
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Hapus baris"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => addRow()}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:border-brand-blue hover:text-brand-blue"
        >
          <Plus className="h-3.5 w-3.5" /> Tambah baris
        </button>
        {quickAdd.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => addRow(s)}
            className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
          >
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}
