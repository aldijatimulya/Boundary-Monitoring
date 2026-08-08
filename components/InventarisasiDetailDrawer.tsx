"use client";

import { useMemo, useState } from "react";
import { X, Search, Plus, MapPin } from "lucide-react";

export type PemilikRow = { pemilik_id: string; nama_pemilik: string; luas_m2: number; keterangan: string | null };
export type LokasiGroup = { lokasi_id: string; nama_lokasi: string; pemilik: PemilikRow[] };

type Props = {
  clusterNama: string;
  lokasiGroups: LokasiGroup[];
  canEdit: boolean;
  onClose: () => void;
  onAddLokasi: () => void;
  onAddPemilik: (lokasiId: string, lokasiNama: string) => void;
  onDeleteLokasi: (lokasiId: string) => void;
  onDeletePemilik: (pemilikId: string) => void;
};

export default function InventarisasiDetailDrawer({
  clusterNama,
  lokasiGroups,
  canEdit,
  onClose,
  onAddLokasi,
  onAddPemilik,
  onDeleteLokasi,
  onDeletePemilik,
}: Props) {
  const [search, setSearch] = useState("");

  const totalLokasi = lokasiGroups.length;
  const totalPemilik = lokasiGroups.reduce((s, l) => s + l.pemilik.length, 0);
  const totalLuas = lokasiGroups.reduce((s, l) => s + l.pemilik.reduce((s2, p) => s2 + p.luas_m2, 0), 0);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lokasiGroups;
    return lokasiGroups
      .map((l) => ({ ...l, pemilik: l.pemilik.filter((p) => p.nama_pemilik.toLowerCase().includes(q)) }))
      .filter((l) => l.pemilik.length > 0 || l.nama_lokasi.toLowerCase().includes(q));
  }, [lokasiGroups, search]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs text-slate-400">Detail Cluster</p>
            <h2 className="mt-0.5 text-lg font-medium text-slate-900">{clusterNama}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 border-b border-slate-100 px-6 py-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Jumlah Lokasi</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{totalLokasi}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Jumlah Pemilik</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{totalPemilik}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Total Luas</p>
            <p className="mt-1 text-lg font-semibold text-brand-blue">{totalLuas.toLocaleString("id-ID")} m²</p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pemilik atau lokasi..."
              className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-3 text-xs focus:border-brand-blue focus:outline-none"
            />
          </div>
          {canEdit && (
            <button
              onClick={onAddLokasi}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Lokasi
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredGroups.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">Tidak ada data yang cocok.</p>
          )}
          <div className="space-y-5">
            {filteredGroups.map((lokasi) => {
              const totalLuasLokasi = lokasi.pemilik.reduce((s, p) => s + p.luas_m2, 0);
              return (
                <div key={lokasi.lokasi_id} className="rounded-lg border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg bg-slate-50 px-4 py-2.5">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {lokasi.nama_lokasi}
                      <span className="font-normal text-slate-400">
                        · {lokasi.pemilik.length} pemilik · {totalLuasLokasi.toLocaleString("id-ID")} m²
                      </span>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onAddPemilik(lokasi.lokasi_id, lokasi.nama_lokasi)}
                          className="text-xs text-brand-blue hover:underline"
                        >
                          + Pemilik
                        </button>
                        <button onClick={() => onDeleteLokasi(lokasi.lokasi_id)} className="text-xs text-red-600 hover:underline">
                          Hapus lokasi
                        </button>
                      </div>
                    )}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-400">
                        <th className="px-4 py-2 font-normal">Nama Pemilik</th>
                        <th className="px-4 py-2 text-right font-normal">Luas (m²)</th>
                        <th className="px-4 py-2 font-normal">Keterangan</th>
                        {canEdit && <th className="px-4 py-2 font-normal"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {lokasi.pemilik.length === 0 && (
                        <tr>
                          <td colSpan={canEdit ? 4 : 3} className="px-4 py-3 text-center text-xs text-slate-300">
                            Belum ada pemilik di lokasi ini.
                          </td>
                        </tr>
                      )}
                      {lokasi.pemilik.map((p) => (
                        <tr key={p.pemilik_id} className="border-t border-slate-50">
                          <td className="px-4 py-2 text-slate-700">{p.nama_pemilik}</td>
                          <td className="px-4 py-2 text-right text-slate-700">{p.luas_m2.toLocaleString("id-ID")}</td>
                          <td className="px-4 py-2 text-slate-500">{p.keterangan || "—"}</td>
                          {canEdit && (
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() => onDeletePemilik(p.pemilik_id)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Hapus
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
