"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import ClusterForm from "@/components/ClusterForm";
import ClusterGeometryForm from "@/components/ClusterGeometryForm";
import ReportEntryForm from "@/components/ReportEntryForm";
import ReconstructionStatCards from "@/components/ReconstructionStatCards";
import ReconstructionSidePanel from "@/components/ReconstructionSidePanel";
import ReconstructionClusterTable from "@/components/ReconstructionClusterTable";
import { supabase } from "@/lib/supabase";
import { ReportMatrixRow, Project, Cluster } from "@/lib/types";
import { exportReconstructionExcel } from "@/lib/export/excel-modules";
import { useProfile } from "@/lib/useProfile";

export default function ReportMatrixPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [rows, setRows] = useState<ReportMatrixRow[]>([]);
  const [geometryByCluster, setGeometryByCluster] = useState<Record<string, Cluster["geometry"]>>({});
  const [loading, setLoading] = useState(true);
  const [clusterFormOpen, setClusterFormOpen] = useState(false);
  const { canEdit } = useProfile();
  const [entryFor, setEntryFor] = useState<ReportMatrixRow | null>(null);
  const [geometryFor, setGeometryFor] = useState<ReportMatrixRow | null>(null);

  async function loadData() {
    setLoading(true);
    const { data: projects } = await supabase.from("projects").select("id,name,client_name").limit(1);
    setProject((projects?.[0] as Project) ?? null);

    const { data } = await supabase.from("v_report_matrix_latest").select("*").returns<ReportMatrixRow[]>();
    setRows(data ?? []);

    const { data: clusters } = await supabase.from("clusters").select("id,geometry").returns<
      Pick<Cluster, "id" | "geometry">[]
    >();
    setGeometryByCluster(Object.fromEntries((clusters ?? []).map((c) => [c.id, c.geometry])));

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalTarget = rows.reduce((s, r) => s + Number(r.luas_pembebasan_ha), 0);
  const totalRealisasi = rows.reduce((s, r) => s + Number(r.luas_rekonstruksi_ha), 0);
  const progres = totalTarget > 0 ? Math.round((totalRealisasi / totalTarget) * 10000) / 100 : 0;
  const geometrySet = Object.fromEntries(Object.entries(geometryByCluster).map(([id, g]) => [id, !!g]));

  return (
    <>
      <Topbar title="Reconstruction report" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => exportReconstructionExcel(rows)}
            disabled={rows.length === 0}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Export Excel
          </button>
          {canEdit && (
            <button
              onClick={() => setClusterFormOpen(true)}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Tambah Cluster
            </button>
          )}
        </div>

        <ReconstructionStatCards totalTarget={totalTarget} totalRealisasi={totalRealisasi} progresPersen={progres} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <ReconstructionSidePanel rows={rows} />
          <ReconstructionClusterTable
            rows={rows}
            loading={loading}
            canEdit={canEdit}
            geometrySet={geometrySet}
            onDetail={(r) => setEntryFor(r)}
            onGeometry={(r) => setGeometryFor(r)}
          />
        </div>

        <p className="text-xs text-slate-400">
          Setiap "Catat update" menambah baris baru ke histori pengukuran — data lama tidak tertimpa, sehingga
          progres rekonstruksi bisa ditelusuri dari waktu ke waktu.
        </p>
      </main>

      {clusterFormOpen && project && (
        <ClusterForm
          projectId={project.id}
          onClose={() => setClusterFormOpen(false)}
          onSaved={() => {
            setClusterFormOpen(false);
            loadData();
          }}
        />
      )}
      {entryFor && (
        <ReportEntryForm
          cluster={entryFor}
          onClose={() => setEntryFor(null)}
          onSaved={() => {
            setEntryFor(null);
            loadData();
          }}
        />
      )}
      {geometryFor && (
        <ClusterGeometryForm
          clusterId={geometryFor.cluster_id}
          clusterName={geometryFor.lokasi}
          currentGeometry={geometryByCluster[geometryFor.cluster_id] ?? null}
          onClose={() => setGeometryFor(null)}
          onSaved={() => {
            setGeometryFor(null);
            loadData();
          }}
        />
      )}
    </>
  );
}
