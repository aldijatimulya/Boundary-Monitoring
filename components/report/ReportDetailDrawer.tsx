"use client";

import { X } from "lucide-react";
import RincianKegiatanCard from "@/components/report/RincianKegiatanCard";
import type { RincianKegiatanItem } from "@/lib/types";

export type DetailField = { label: string; value: string };

type Props = {
  title: string;
  subtitle: string;
  fields: DetailField[];
  rincianKegiatan?: RincianKegiatanItem[] | null;
  fotoUrls?: string[] | null;
  onClose: () => void;
};

/** Drawer sisi kanan untuk "Lihat detail lengkap": semua field laporan + rincian kegiatan + foto. */
export default function ReportDetailDrawer({ title, subtitle, fields, rincianKegiatan, fotoUrls, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs text-slate-400">Detail Laporan</p>
            <h2 className="mt-0.5 text-lg font-medium text-slate-900">{title}</h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <dl className="divide-y divide-slate-50">
            {fields.map((f) => (
              <div key={f.label} className="grid grid-cols-3 gap-3 py-2.5 text-sm">
                <dt className="text-slate-500">{f.label}</dt>
                <dd className="col-span-2 break-words text-slate-800">{f.value || "-"}</dd>
              </div>
            ))}
          </dl>

          {rincianKegiatan && rincianKegiatan.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-slate-900">Rincian Kegiatan</h3>
              <RincianKegiatanCard items={rincianKegiatan} />
            </div>
          )}

          {fotoUrls && fotoUrls.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-slate-900">Dokumentasi Foto ({fotoUrls.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {fotoUrls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt={`Dokumentasi ${i + 1}`} className="h-24 w-full rounded-md object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
