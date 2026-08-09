import Link from "next/link";
import { Network, CheckCircle2, MapPinned, List } from "lucide-react";
import Topbar from "@/components/Topbar";
import SpatialMapWrapper from "@/components/SpatialMapWrapper";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getGeeTileLayers } from "@/lib/gee-layers";
import { Cluster, ReportMatrixRow, SpatialClusterFeature, PlankLocation } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_META = [
  { key: "not_started", label: "Belum mulai", dot: "bg-status-pending" },
  { key: "on_progress", label: "On progress", dot: "bg-status-progress" },
  { key: "completed", label: "Selesai", dot: "bg-status-done" },
  { key: "need_follow_up", label: "Perlu tindak lanjut", dot: "bg-status-risk" },
] as const;

async function getData() {
  const supabase = await createServerSupabaseClient();

  const { data: clusters } = await supabase.from("clusters").select("*").returns<Cluster[]>();

  const { data: statusRows } = await supabase
    .from("v_report_matrix_latest")
    .select("*")
    .returns<ReportMatrixRow[]>();

  const { data: plankRows } = await supabase.from("v_plank_locations").select("*").returns<PlankLocation[]>();

  return { clusters: clusters ?? [], statusRows: statusRows ?? [], plankLocations: plankRows ?? [] };
}

export default async function SpatialPage() {
  const { clusters, statusRows, plankLocations } = await getData();
  const geeLayers = getGeeTileLayers();

  const plankWithGeometry = plankLocations.filter((p) => p.geometry);

  const statusByCluster = new Map(statusRows.map((r) => [r.cluster_id, r]));

  const withGeometry: SpatialClusterFeature[] = [];
  const withoutGeometry: Cluster[] = [];

  for (const c of clusters) {
    if (!c.geometry) {
      withoutGeometry.push(c);
      continue;
    }
    const status = statusByCluster.get(c.id);
    withGeometry.push({
      cluster_id: c.id,
      name: c.name,
      desa: c.desa,
      kecamatan: c.kecamatan,
      kabupaten: c.kabupaten,
      geometry: c.geometry,
      luas_pembebasan_ha: c.luas_pembebasan_ha,
      luas_rekonstruksi_ha: status?.luas_rekonstruksi_ha ?? 0,
      selisih_ha: status?.selisih_ha ?? c.luas_pembebasan_ha,
      persen_selisih: status?.persen_selisih ?? 100,
      status: status?.status ?? "not_started",
      tanggal_update: status?.tanggal_update ?? null,
    });
  }

  // Rekap status dihitung dari SEMUA cluster (bukan cuma yang punya geometri) --
  // cluster yang belum ada laporan rekonstruksinya otomatis dianggap "Belum mulai".
  const statusCounts = STATUS_META.map((s) => ({
    ...s,
    count: clusters.filter((c) => (statusByCluster.get(c.id)?.status ?? "not_started") === s.key).length,
  }));

  return (
    <>
      <Topbar title="Spatial Map — Boundary Monitoring System" />
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm text-slate-500">Total cluster belum punya data</p>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Network className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{withoutGeometry.length}</p>
            <p className="mt-1 text-xs text-blue-600">Cluster</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm text-slate-500">Cluster dengan data geometri</p>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{withGeometry.length}</p>
            <p className="mt-1 text-xs text-emerald-600">Cluster</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm text-slate-500">Total lokasi terpetakan</p>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <MapPinned className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{plankWithGeometry.length}</p>
            <p className="mt-1 text-xs text-violet-600">Lokasi</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-5">
            <p className="text-sm font-medium text-slate-900">Keterangan Cluster</p>
            {statusCounts.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-sm">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
                <span className="font-medium text-slate-900">{s.count}</span>
                <span className="text-slate-500">{s.label}</span>
              </div>
            ))}
          </div>
          <Link
            href="/report"
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-brand-blue px-3.5 py-1.5 text-xs font-medium text-brand-blue hover:bg-blue-50"
          >
            Lihat Semua Cluster
            <List className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div style={{ height: "calc(100vh - 380px)" }}>
          <SpatialMapWrapper features={withGeometry} geeLayers={geeLayers} plankLocations={plankWithGeometry} />
        </div>
      </main>
    </>
  );
}
