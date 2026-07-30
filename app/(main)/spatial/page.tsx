import Topbar from "@/components/Topbar";
import SpatialMapWrapper from "@/components/SpatialMapWrapper";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getGeeTileLayers } from "@/lib/gee-layers";
import { Cluster, ReportMatrixRow, SpatialClusterFeature } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getData() {
  const supabase = await createServerSupabaseClient();

  const { data: clusters } = await supabase.from("clusters").select("*").returns<Cluster[]>();

  const { data: statusRows } = await supabase
    .from("v_report_matrix_latest")
    .select("*")
    .returns<ReportMatrixRow[]>();

  return { clusters: clusters ?? [], statusRows: statusRows ?? [] };
}

export default async function SpatialPage() {
  const { clusters, statusRows } = await getData();
  const geeLayers = getGeeTileLayers();

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

  return (
    <>
      <Topbar title="Spatial Map — Boundary Monitoring System" />
      <main className="flex-1 space-y-4 p-6">
        {geeLayers.length === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Belum ada layer GEE yang dikonfigurasi. Tambahkan
            <code className="mx-1 rounded bg-amber-100 px-1">NEXT_PUBLIC_GEE_LAYER_1_URL</code>
            (dan <code className="mx-1 rounded bg-amber-100 px-1">_LABEL</code>) di{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code> untuk menampilkan tile GEE
            (mis. land cover atau NDVI) di atas peta.
          </div>
        )}

        {withoutGeometry.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <span className="font-medium text-slate-800">{withoutGeometry.length} cluster</span> belum
            punya data geometri dan tidak tampil di peta:{" "}
            {withoutGeometry.map((c) => c.name).join(", ")}. Tambahkan lewat form edit cluster (isi
            GeoJSON Polygon/MultiPolygon batas area).
          </div>
        )}

        <div style={{ height: "calc(100vh - 220px)" }}>
          <SpatialMapWrapper features={withGeometry} geeLayers={geeLayers} />
        </div>
      </main>
    </>
  );
}
