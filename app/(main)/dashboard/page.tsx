import Topbar from "@/components/Topbar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ReportMatrixRow, STATUS_LABEL } from "@/lib/types";
import { formatM2 } from "@/lib/units";
import { ClusterProgressBarChart, ProgressDonut } from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

async function getData() {
  const supabase = await createServerSupabaseClient();

  const { data: rows } = await supabase
    .from("v_report_matrix_latest")
    .select("*")
    .returns<ReportMatrixRow[]>();

  const { data: progress } = await supabase
    .from("v_project_progress")
    .select("*")
    .limit(1)
    .maybeSingle();

  return { rows: rows ?? [], progress };
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const { rows, progress } = await getData();

  const totalPembebasan = rows.reduce((s, r) => s + Number(r.luas_pembebasan_ha), 0);
  const totalRekonstruksi = progress?.total_rekonstruksi_ha ?? 0;
  const persenProgres = Number(progress?.progres_persen ?? 0);

  return (
    <>
      <Topbar title="Dashboard — Boundary Monitoring System" />
      <main className="flex-1 space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total area (pembebasan)" value={`${formatM2(totalPembebasan)} m²`} />
          <MetricCard label="Area rekonstruksi" value={`${formatM2(totalRekonstruksi)} m²`} />
          <MetricCard label="Progres proyek" value={`${persenProgres}%`} sub="Realisasi ÷ target rekonstruksi" />
          <MetricCard label="Cluster aktif" value={`${rows.length}`} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-slate-900">Progres keseluruhan</h2>
            <ProgressDonut percent={persenProgres} />
            <p className="mt-2 text-center text-xs text-slate-400">
              {formatM2(totalRekonstruksi)} m² dari {formatM2(totalPembebasan)} m² target
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-medium text-slate-900">Pembebasan vs rekonstruksi per cluster</h2>
            <ClusterProgressBarChart rows={rows} />
          </div>
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
                      <td className="px-5 py-3 text-right">{formatM2(r.selisih_ha)}</td>
                      <td className="px-5 py-3 text-right">{r.persen_selisih}%</td>
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
