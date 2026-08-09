"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { BurndownChart, ProductivityChart } from "@/components/AnalyticsCharts";
import AnalyticsStatCards from "@/components/AnalyticsStatCards";
import AnalyticsClusterSummary from "@/components/AnalyticsClusterSummary";
import AnalyticsClusterTable from "@/components/AnalyticsClusterTable";
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
import { formatM2, haToM2 } from "@/lib/units";

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
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {loading && <p className="text-sm text-slate-400">Memuat data...</p>}

        {!loading && points.length === 0 && (
          <p className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
            Belum ada histori "Catat update" di Reconstruction Report — analytics butuh minimal 2 titik data per
            cluster untuk menghitung tren dan proyeksi.
          </p>
        )}

        {!loading && points.length > 0 && (
          <>
            <AnalyticsStatCards
              velocityLabel={velocity ? `${haToM2(velocity.haPerWeek).toLocaleString("id-ID")} m²/minggu` : "-"}
              velocitySub={
                velocity
                  ? velocity.basis === "30_hari_terakhir"
                    ? "Rata-rata 30 hari terakhir"
                    : "Rata-rata seluruh histori (data <30 hari)"
                  : "Butuh minimal 2 titik data"
              }
              sisaValue={`${formatM2(remainingNow)} m²`}
              sisaSub={`dari total target ${formatM2(totalTarget)} m²`}
              estimasiValue={forecast ? format(new Date(forecast.forecastDate), "d MMM yyyy") : "-"}
              estimasiSub={
                forecast
                  ? `~${forecast.daysRemaining} hari lagi (proyeksi linear dari tren saat ini)`
                  : velocity && velocity.haPerDay <= 0
                  ? "Tren progres stagnan/menurun"
                  : "Belum bisa diproyeksikan"
              }
              jadwalValue={
                scheduleGapDays === null
                  ? "-"
                  : scheduleGapDays <= 0
                  ? `Lebih cepat ${Math.abs(scheduleGapDays)} hari`
                  : `Berpotensi mundur ${scheduleGapDays} hari`
              }
              jadwalSub={
                project?.end_date
                  ? `Target jadwal: ${format(new Date(project.end_date), "d MMM yyyy")}`
                  : "Isi tanggal selesai proyek untuk aktifkan"
              }
              jadwalTone={scheduleGapDays === null ? "slate" : scheduleGapDays <= 0 ? "emerald" : "amber"}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-1 text-sm font-medium text-slate-900">Burn-down — sisa realisasi vs jadwal ideal</h2>
                <p className="mb-3 text-xs text-slate-400">
                  Garis merah = sisa area yang belum direkonstruksi berdasarkan data aktual. Garis putus-putus
                  abu-abu = jadwal ideal linear dari tanggal mulai sampai tanggal selesai proyek.
                </p>
                <BurndownChart series={series} />
              </div>
              <AnalyticsClusterSummary clusters={clusterStats} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-medium text-slate-900">Produktivitas mingguan</h2>
              <p className="mb-3 text-xs text-slate-400">
                Total penambahan luas rekonstruksi (semua cluster digabung) per minggu.
              </p>
              <ProductivityChart data={weekly} />
            </div>

            <AnalyticsClusterTable clusters={clusterStats} />

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
