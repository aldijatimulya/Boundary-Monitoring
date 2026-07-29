"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { BurndownChart, ProductivityChart } from "@/components/AnalyticsCharts";
import { supabase } from "@/lib/supabase";
import { Project, Cluster } from "@/lib/types";
import {
  ReportMatrixPoint,
  buildActualSeries,
  computeVelocity,
  computeForecast,
  buildWeeklyProductivity,
  buildClusterProductivity,
  ClusterProductivity,
} from "@/lib/analytics";
import { format } from "date-fns";

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-medium text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [points, setPoints] = useState<ReportMatrixPoint[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: projects } = await supabase
        .from("projects")
        .select("id,name,client_name,start_date,end_date")
        .limit(1);
      setProject((projects?.[0] as Project) ?? null);

      const { data: clusterRows } = await supabase
        .from("clusters")
        .select("id,project_id,name,luas_pembebasan_ha")
        .returns<Cluster[]>();
      setClusters(clusterRows ?? []);

      const { data: matrixRows } = await supabase
        .from("report_matrix")
        .select("cluster_id,tanggal_update,luas_rekonstruksi_ha")
        .order("tanggal_update", { ascending: true })
        .returns<ReportMatrixPoint[]>();
      setPoints(matrixRows ?? []);

      setLoading(false);
    }
    load();
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");
  const totalTarget = clusters.reduce((s, c) => s + Number(c.luas_pembebasan_ha), 0);

  const series = buildActualSeries(points, clusters, project?.start_date, project?.end_date);
  const velocity = computeVelocity(series);
  const remainingNow = series.length > 0 ? series[series.length - 1].remainingHa : totalTarget;
  const forecast = computeForecast(remainingNow, velocity, today);
  const weekly = buildWeeklyProductivity(series);
  const clusterStats: ClusterProductivity[] = buildClusterProductivity(points, clusters, today);

  const scheduleGapDays =
    forecast && project?.end_date
      ? Math.round((new Date(forecast.forecastDate).getTime() - new Date(project.end_date).getTime()) / 86400000)
      : null;

  return (
    <>
      <Topbar title="Analytics — Boundary Monitoring System" />
      <main className="flex-1 space-y-6 p-6">
        {loading && <p className="text-sm text-slate-400">Memuat data...</p>}

        {!loading && points.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
            Belum ada histori "Catat update" di Reconstruction Report — analytics butuh minimal 2 titik data
            per cluster untuk menghitung tren dan proyeksi.
          </div>
        )}

        {!loading && points.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Kecepatan progres"
                value={velocity ? `${velocity.haPerWeek.toLocaleString("id-ID")} ha/minggu` : "-"}
                sub={
                  velocity
                    ? velocity.basis === "30_hari_terakhir"
                      ? "Rata-rata 30 hari terakhir"
                      : "Rata-rata seluruh histori (data <30 hari)"
                    : "Butuh minimal 2 titik data"
                }
              />
              <MetricCard
                label="Sisa realisasi"
                value={`${remainingNow.toLocaleString("id-ID")} ha`}
                sub={`dari total target ${totalTarget.toLocaleString("id-ID")} ha`}
              />
              <MetricCard
                label="Estimasi selesai"
                value={forecast ? format(new Date(forecast.forecastDate), "d MMM yyyy") : "-"}
                sub={
                  forecast
                    ? `~${forecast.daysRemaining} hari lagi (proyeksi linear dari tren saat ini)`
                    : velocity && velocity.haPerDay <= 0
                    ? "Tren progres stagnan/menurun"
                    : "Belum bisa diproyeksikan"
                }
              />
              <MetricCard
                label="Terhadap jadwal rencana"
                value={
                  scheduleGapDays === null
                    ? "-"
                    : scheduleGapDays <= 0
                    ? `Lebih cepat ${Math.abs(scheduleGapDays)} hari`
                    : `Berpotensi mundur ${scheduleGapDays} hari`
                }
                sub={project?.end_date ? `Target jadwal: ${format(new Date(project.end_date), "d MMM yyyy")}` : "Isi tanggal selesai proyek untuk aktifkan"}
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-1 text-sm font-medium text-slate-900">Burn-down — sisa realisasi vs jadwal ideal</h2>
              <p className="mb-3 text-xs text-slate-400">
                Garis merah = sisa area yang belum direkonstruksi berdasarkan data aktual. Garis putus-putus
                abu-abu = jadwal ideal linear dari tanggal mulai sampai tanggal selesai proyek.
              </p>
              <BurndownChart series={series} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-1 text-sm font-medium text-slate-900">Produktivitas mingguan</h2>
              <p className="mb-3 text-xs text-slate-400">
                Total penambahan luas rekonstruksi (semua cluster digabung) per minggu.
              </p>
              <ProductivityChart data={weekly} />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-medium text-slate-900">Produktivitas per cluster</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Cluster ditandai "Perlu perhatian" kalau progresnya stagnan atau proyeksi penyelesaiannya
                  lebih dari 180 hari lagi.
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="px-5 py-3 font-normal">Cluster</th>
                    <th className="px-5 py-3 text-right font-normal">Progres</th>
                    <th className="px-5 py-3 text-right font-normal">Kecepatan (ha/minggu)</th>
                    <th className="px-5 py-3 text-right font-normal">Sisa (ha)</th>
                    <th className="px-5 py-3 font-normal">Estimasi selesai</th>
                    <th className="px-5 py-3 font-normal">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {clusterStats.map((c) => (
                    <tr key={c.cluster_id} className="border-b border-slate-50">
                      <td className="px-5 py-3 font-medium">{c.name}</td>
                      <td className="px-5 py-3 text-right">{c.persenSelesai}%</td>
                      <td className="px-5 py-3 text-right">{c.haPerWeek.toLocaleString("id-ID")}</td>
                      <td className="px-5 py-3 text-right">{c.remainingHa.toLocaleString("id-ID")}</td>
                      <td className="px-5 py-3">
                        {c.forecastDate ? format(new Date(c.forecastDate), "d MMM yyyy") : "-"}
                      </td>
                      <td className="px-5 py-3">
                        {c.remainingHa === 0 ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                            Selesai
                          </span>
                        ) : c.atRisk ? (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                            Perlu perhatian
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                            On progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-400">
              Catatan: proyeksi tanggal selesai dihitung dari tren linear kecepatan realisasi terkini —
              bukan model statistik formal, dan akan berubah seiring data baru masuk lewat "Catat update" di
              Reconstruction Report.
            </p>
          </>
        )}
      </main>
    </>
  );
}
