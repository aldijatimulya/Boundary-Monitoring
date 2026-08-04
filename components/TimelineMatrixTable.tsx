"use client";

import { TimelineMatrix } from "@/lib/timeline-matrix";

export default function TimelineMatrixTable({ matrix }: { matrix: TimelineMatrix | null }) {
  if (!matrix) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
        Matriks belum bisa dibuat -- tambahkan minimal satu kegiatan dengan tanggal mulai &amp; selesai
        terlebih dulu.
      </div>
    );
  }

  const { weeks, activities, rencanaKumulatif, realisasiKumulatif, currentWeekIndex } = matrix;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="sticky left-0 z-10 min-w-[220px] border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left font-normal">
                Kegiatan
              </th>
              <th className="min-w-[70px] border-b border-r border-slate-200 px-2 py-2 text-right font-normal">
                Bobot (%)
              </th>
              {weeks.map((w, wi) => (
                <th
                  key={w.start}
                  className={`min-w-[76px] border-b border-slate-200 px-2 py-2 text-center font-normal ${
                    wi === currentWeekIndex ? "bg-blue-50 text-brand-blue" : ""
                  }`}
                >
                  Mgg {wi + 1}
                  <div className="font-normal text-[10px] text-slate-400">{w.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id} className="border-b border-slate-50">
                <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-3 py-2 text-left font-medium text-slate-700">
                  {a.nama_kegiatan}
                </td>
                <td className="border-r border-slate-100 px-2 py-2 text-right text-slate-500">
                  {a.bobotPersen}%
                </td>
                {a.weekly.map((v, wi) => (
                  <td
                    key={wi}
                    className={`px-2 py-2 text-center ${
                      v > 0 ? "bg-blue-50/60 text-slate-700" : "text-slate-300"
                    } ${wi === currentWeekIndex ? "ring-1 ring-inset ring-blue-200" : ""}`}
                  >
                    {v > 0 ? `${v}%` : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-medium text-slate-700">
              <td className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 px-3 py-2">
                Rencana Kumulatif
              </td>
              <td className="border-r border-slate-200 px-2 py-2 text-right">100%</td>
              {rencanaKumulatif.map((v, wi) => (
                <td
                  key={wi}
                  className={`px-2 py-2 text-center ${wi === currentWeekIndex ? "bg-blue-100" : ""}`}
                >
                  {v}%
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50 font-medium text-brand-blue">
              <td className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 px-3 py-2">
                Realisasi Kumulatif
              </td>
              <td className="border-r border-slate-200 px-2 py-2"></td>
              {realisasiKumulatif.map((v, wi) => (
                <td
                  key={wi}
                  className={`px-2 py-2 text-center ${wi === currentWeekIndex ? "bg-blue-100" : ""}`}
                >
                  {v === null ? <span className="text-slate-300">-</span> : `${v}%`}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="border-t border-slate-100 px-4 py-3 text-[11px] leading-relaxed text-slate-400">
        Rencana dihitung dari bobot & rentang tanggal tiap kegiatan (kurva-S standar), dijumlah per minggu.
        Realisasi memakai progres kegiatan yang tercatat SAAT INI, diproyeksikan mengikuti bentuk kurva
        rencana untuk minggu-minggu yang sudah lewat -- ini estimasi, bukan histori mingguan sebenarnya
        (skema database belum menyimpan snapshot progres per minggu). Minggu yang belum dilewati sengaja
        dikosongkan ("-") pada baris Realisasi.
      </p>
    </div>
  );
}
