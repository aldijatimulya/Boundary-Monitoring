"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import ClusterForm from "@/components/ClusterForm";
import ClusterGeometryForm from "@/components/ClusterGeometryForm";
import ReportEntryForm from "@/components/ReportEntryForm";
import { supabase } from "@/lib/supabase";
import { ReportMatrixRow, STATUS_LABEL, Project, Cluster } from "@/lib/types";
import { formatM2 } from "@/lib/units";
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

  return (
    <>
      <Topbar title="Reconstruction report" />
      <main className="flex-1 space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total target rekonstruksi</p>
            <p className="mt-1 text-2xl font-medium">{formatM2(totalTarget)} m²</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Realisasi rekonstruksi</p>
            <p className="mt-1 text-2xl font-medium">{formatM2(totalRealisasi)} m²</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Progres proyek</p>
            <p className="mt-1 text-2xl font-medium text-brand-blue">{progres}%</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => exportReconstructionExcel(rows)}
            disabled={rows.length === 0}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Download Excel
          </button>
          {canEdit && (
            <button
              onClick={() => setClusterFormOpen(true)}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              Tambah cluster
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-normal">Lokasi</th>
                <th className="px-4 py-3 font-normal">Desa</th>
                <th className="px-4 py-3 font-normal">Kecamatan</th>
                <th className="px-4 py-3 font-normal">Kabupaten</th>
                <th className="px-4 py-3 font-normal text-right">Pembebasan (m²)</th>
                <th className="px-4 py-3 font-normal text-right">Deliniasi (m²)</th>
                <th className="px-4 py-3 font-normal text-right">Rekonstruksi (m²)</th>
                <th className="px-4 py-3 font-normal text-right">Selisih (m²)</th>
                <th className="px-4 py-3 font-normal text-right">% selisih</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal text-right"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                    Belum ada cluster. Klik "Tambah cluster" untuk mulai.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const status = STATUS_LABEL[r.status];
                return (
                  <tr key={r.cluster_id} className="border-b border-slate-50">
                    <td className="px-4 py-2 font-medium">{r.lokasi}</td>
                    <td className="px-4 py-2 text-slate-500">{r.desa ?? "-"}</td>
                    <td className="px-4 py-2 text-slate-500">{r.kecamatan ?? "-"}</td>
                    <td className="px-4 py-2 text-slate-500">{r.kabupaten ?? "-"}</td>
                    <td className="px-4 py-2 text-right">{formatM2(r.luas_pembebasan_ha)}</td>
                    <td className="px-4 py-2 text-right">{formatM2(r.luas_deliniasi_ha ?? 0)}</td>
                    <td className="px-4 py-2 text-right">{formatM2(r.luas_rekonstruksi_ha)}</td>
                    <td className="px-4 py-2 text-right">{formatM2(r.selisih_ha)}</td>
                    <td className="px-4 py-2 text-right">{r.persen_selisih}%</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs ${status?.className}`}>
                        {status?.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {canEdit ? (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setGeometryFor(r)}
                            className="text-xs text-brand-blue hover:underline"
                          >
                            {geometryByCluster[r.cluster_id] ? "Edit geometri" : "Geometri"}
                          </button>
                          <button onClick={() => setEntryFor(r)} className="text-xs text-brand-blue hover:underline">
                            Catat update
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
