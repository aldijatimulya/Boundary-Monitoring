import { X } from "lucide-react";
import { SosialReportRow, STATUS_LABEL } from "@/lib/types";

export default function SosialDetailModal({ row, onClose }: { row: SosialReportRow; onClose: () => void }) {
  const status = STATUS_LABEL[row.status];

  const fields: { label: string; value: string }[] = [
    { label: "Cluster", value: row.lokasi },
    { label: "Pemilik Lahan", value: row.pemilik_lahan || "—" },
    { label: "Jenis Okupasi", value: row.jenis_okupasi || "—" },
    { label: "Luas Okupasi", value: `${Number(row.luas_okupasi_m2).toLocaleString("id-ID")} m²` },
    { label: "Patok Terpasang", value: `${row.patok_terpasang}` },
    { label: "Tanggal Catat", value: row.tanggal_catat },
    { label: "Keterangan", value: row.keterangan || "—" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6">
        <div className="flex items-start justify-between">
          <h2 className="text-base font-medium text-slate-900">Detail Kasus Okupasi/Sosial</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start justify-between gap-4">
              <span className="text-slate-500">{f.label}</span>
              <span className="max-w-[60%] text-right font-medium text-slate-900">{f.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Status</span>
            <span className={`rounded-full px-2 py-1 text-xs ${status?.className}`}>{status?.label}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
