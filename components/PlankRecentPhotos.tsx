"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { PlankLocation } from "@/lib/types";

export default function PlankRecentPhotos({ planks }: { planks: PlankLocation[] }) {
  const [showAll, setShowAll] = useState(false);

  const allPhotos = useMemo(() => {
    const out: { url: string; lokasi: string }[] = [];
    // planks sudah terurut terbaru dulu (order by created_at desc di v_plank_locations)
    for (const p of planks) {
      for (const url of p.foto_urls ?? []) {
        out.push({ url, lokasi: p.nama_lokasi });
      }
    }
    return out;
  }, [planks]);

  const preview = allPhotos.slice(0, 4);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">Foto Terbaru</p>
        {allPhotos.length > 4 && (
          <button onClick={() => setShowAll(true)} className="text-xs font-medium text-brand-blue hover:underline">
            Lihat semua
          </button>
        )}
      </div>

      {preview.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">Belum ada foto.</p>
      ) : (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {preview.map((ph, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${ph.url}-${i}`}
              src={ph.url}
              alt={ph.lokasi}
              className="aspect-square w-full rounded-md object-cover"
            />
          ))}
        </div>
      )}

      {showAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-slate-900">Semua Foto Plank ({allPhotos.length})</h2>
              <button onClick={() => setShowAll(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {allPhotos.map((ph, i) => (
                <div key={`${ph.url}-${i}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph.url} alt={ph.lokasi} className="aspect-square w-full rounded-md object-cover" />
                  <p className="mt-1 truncate text-[11px] text-slate-400">{ph.lokasi}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
