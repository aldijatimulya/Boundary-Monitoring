import { Download, Plus } from "lucide-react";

type Props = {
  filters: React.ReactNode;
  onDownloadExcel: () => void;
  downloadDisabled?: boolean;
  addLabel: string;
  onAdd?: () => void;
  canAdd: boolean;
};

/** Kartu putih berisi filter (kiri) + tombol Download Excel & Tambah laporan (kanan). */
export default function ReportFilterBar({ filters, onDownloadExcel, downloadDisabled, addLabel, onAdd, canAdd }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">{filters}</div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDownloadExcel}
          disabled={downloadDisabled}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> Download Excel
        </button>
        {canAdd && onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export const filterSelectClass =
  "rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-blue focus:outline-none";
