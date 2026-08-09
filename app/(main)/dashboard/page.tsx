import Topbar from "@/components/Topbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ReportMatrixRow, PatokReportRow, STATUS_LABEL } from "@/lib/types";
import { formatM2 } from "@/lib/units";
import { REKONSTRUKSI_TARGET_HA, PLANK_TARGET_TITIK } from "@/lib/targets";
import { ClusterProgressBarChart, ProgressDonut, PhaseProgressDonut, PhaseSegment } from "@/components/DashboardCharts";
import { ClipboardList, Ruler, MapPinned, Milestone } from "lucide-react";

export const dynamic = "force-dynamic";

async function getData() {
  const supabase = await createServerSupabaseClient();

  const [{ data: rows }, { count: lokasiCount }, { data: patokRows }, { data: plankRows }] = await Promise.all([
    supabase.from("v_report_matrix_latest").select("*").returns<ReportMatrixRow[]>(),
    supabase.from("inventarisasi_lokasi").select("id", { count: "exact", head: true }),
    supabase.from("v_patok_report_latest").select("*").returns<PatokReportRow[]>(),
    supabase.from("v_plank_locations").select("jumlah_plank").returns<{ jumlah_plank: number }[]>(),
  ]);

  return {
    rows: rows ?? [],
    lokasiCount: lokasiCount ?? 0,
    patokRows: patokRows ?? [],
    plankRows: plankRows ?? [],
  };
}

function MetricCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  sub,
  percent,
  barColor,
}: {
  icon: React.ElementType;
  iconClassName: string;
  label: string;
  value: string;
  sub?: string;
  percent?: number;
  barColor?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
      {percent !== undefined && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${barColor ?? "bg-brand-blue"}`}
            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const { rows, lokasiCount, patokRows, plankRows } = await getData();

  // ---- Inventarisasi Data ----
  // Target dinamis: mengikuti jumlah cluster/lokasi yang ada di Reconstruction
  // Report (bukan angka tetap) -- realisasi: jumlah baris yang sudah dicatat
  // di Inventarisasi Report.
  const targetLokasi = rows.length;
  const persenInventarisasi = targetLokasi > 0 ? Math.min(100, (lokasiCount / targetLokasi) * 100) : 0;

  // ---- Rekonstruksi ----
  // Data pembebasan tetap ditampilkan seperti biasa (tidak berubah), tapi
  // PERSENTASE progresnya sekarang dihitung terhadap ambang batas tetap
  // 500 Ha (5.000.000 m²) -- bukan lagi terhadap jumlah pembebasan yang
  // diinput (yang nilainya bisa berubah-ubah seiring cluster baru masuk).
  const totalPembebasanHa = rows.reduce((s, r) => s + Number(r.luas_pembebasan_ha), 0);
  const totalRekonstruksiHa = rows.reduce((s, r) => s + Number(r.luas_rekonstruksi_ha), 0);
  const persenRekonstruksi = Math.min(100, (totalRekonstruksiHa / REKONSTRUKSI_TARGET_HA) * 100);

  // ---- Pemasangan Patok ----
  // Formula TIDAK diubah -- tetap sama seperti di halaman Patok Report:
  // total permanen dibagi total sementara (persen konversi ke permanen).
  const totalPatokSementara = patokRows.reduce((s, r) => s + Number(r.jumlah_patok_sementara), 0);
  const totalPatokPermanen = patokRows.reduce((s, r) => s + Number(r.jumlah_patok_permanen), 0);
  const persenPatok =
    totalPatokSementara > 0
      ? Math.min(100, (totalPatokPermanen / totalPatokSementara) * 100)
      : totalPatokPermanen > 0
      ? 100
      : 0;

  // ---- Pemasangan Plank ----
  // Target tetap 150 titik -- realisasi: SUM(jumlah_plank) dari semua lokasi.
  const totalPlank = plankRows.reduce((s, r) => s + Number(r.jumlah_plank || 0), 0);
  const persenPlank = Math.min(100, (totalPlank / PLANK_TARGET_TITIK) * 100);

  // ---- Progres keseluruhan: rata-rata 4 komponen di atas ----
  const overallPercent = (persenInventarisasi + persenRekonstruksi + persenPatok + persenPlank) / 4;

  const phaseSegments: PhaseSegment[] = [
    {
      label: "Inventarisasi Data",
      percent: persenInventarisasi,
      color: "#2563EB",
      detail: `${lokasiCount.toLocaleString("id-ID")} / ${targetLokasi.toLocaleString("id-ID")} lokasi`,
    },
    {
      label: "Rekonstruksi",
      percent: persenRekonstruksi,
      color: "#0EA5A0",
      detail: `${formatM2(totalRekonstruksiHa)} / ${REKONSTRUKSI_TARGET_HA.toLocaleString("id-ID")} Ha`,
    },
    {
      label: "Pemasangan Patok",
      percent: persenPatok,
      color: "#F59E0B",
      detail: `${totalPatokPermanen.toLocaleString("id-ID")} / ${totalPatokSementara.toLocaleString("id-ID")} patok`,
    },
    {
      label: "Pemasangan Plank",
      percent: persenPlank,
      color: "#8B5CF6",
      detail: `${totalPlank.toLocaleString("id-ID")} / ${PLANK_TARGET_TITIK.toLocaleString("id-ID")} titik`,
    },
  ];

  return (
    <>
      <Topbar title="Dashboard — Boundary Monitoring System" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Ruler}
            iconClassName="bg-blue-50 text-blue-600"
            label="Total Area (Pembebasan)"
            value={`${formatM2(totalPembebasanHa)} m²`}
            sub="Total area perusahaan"
          />
          <MetricCard
            icon={ClipboardList}
            iconClassName="bg-violet-50 text-violet-600"
            label="Inventarisasi Data"
            value={lokasiCount.toLocaleString("id-ID")}
            sub={`${Math.round(persenInventarisasi)}% dari ${targetLokasi.toLocaleString("id-ID")} lokasi`}
            percent={persenInventarisasi}
            barColor="bg-violet-500"
          />
          <MetricCard
            icon={Milestone}
            iconClassName="bg-teal-50 text-teal-600"
            label="Rekonstruksi"
            value={`${formatM2(totalRekonstruksiHa)} m²`}
            sub={`${Math.round(persenRekonstruksi)}% dari ${REKONSTRUKSI_TARGET_HA} Ha target`}
            percent={persenRekonstruksi}
            barColor="bg-teal-500"
          />
          <MetricCard
            icon={MapPinned}
            iconClassName="bg-amber-50 text-amber-600"
            label="Patok Terpasang"
            value={totalPatokPermanen.toLocaleString("id-ID")}
            sub={`${Math.round(persenPatok)}% dari ${totalPatokSementara.toLocaleString("id-ID")} sementara`}
            percent={persenPatok}
            barColor="bg-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-slate-900">Progres Kegiatan per Tahapan</h2>
            <PhaseProgressDonut segments={phaseSegments} overallPercent={overallPercent} />
            <div className="mt-2 space-y-2">
              {phaseSegments.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="text-slate-600">{seg.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-slate-700">{Math.round(seg.percent)}%</span>
                    <span className="ml-1.5 text-slate-400">{seg.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-medium text-slate-900">Pembebasan vs rekonstruksi per cluster</h2>
            <ClusterProgressBarChart rows={rows} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-slate-900">Progres Keseluruhan</h2>
          <ProgressDonut percent={Math.round(overallPercent)} />
          <p className="mt-2 text-center text-xs text-slate-400">
            Rata-rata dari 4 komponen: Inventarisasi Data, Rekonstruksi, Pemasangan Patok, Pemasangan Plank
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-medium text-slate-900">Reconstruction report (ringkasan)</h2>
            <a href="/report" className="text-xs text-brand-blue hover:underline">
              Lihat semua
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-5 py-3 font-normal">Lokasi</th>
                  <th className="px-5 py-3 font-normal text-right">Pembebasan (m²)</th>
                  <th className="px-5 py-3 font-normal text-right">Rekonstruksi (m²)</th>
                  <th className="px-5 py-3 font-normal text-right">Selisih (m²)</th>
                  <th className="px-5 py-3 font-normal text-right">% selisih</th>
                  <th className="px-5 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Belum ada data cluster. Tambahkan data lewat Supabase Table Editor atau modul input.
                    </td>
                  </tr>
                )}
                {rows.map((r) => {
                  const status = STATUS_LABEL[r.status];
                  return (
                    <tr key={r.cluster_id} className="border-b border-slate-50">
                      <td className="px-5 py-3">{r.lokasi}</td>
                      <td className="px-5 py-3 text-right">{formatM2(r.luas_pembebasan_ha)}</td>
                      <td className="px-5 py-3 text-right">{formatM2(r.luas_rekonstruksi_ha)}</td>
                      <td className={`px-5 py-3 text-right ${Number(r.selisih_ha) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {formatM2(r.selisih_ha)}
                      </td>
                      <td className={`px-5 py-3 text-right ${r.persen_selisih < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {r.persen_selisih}%
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs ${status?.className}`}>
                          {status?.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
