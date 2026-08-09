"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Network, ArrowUpDown, Info, UploadCloud, FolderOpen } from "lucide-react";
import Topbar from "@/components/Topbar";
import DocumentUploadForm from "@/components/DocumentUploadForm";
import { supabase } from "@/lib/supabase";
import { deleteDocument } from "@/lib/documents";
import { Cluster, DocumentCategory, DocumentRecord, DOCUMENT_CATEGORY_LABEL, Project, ProfileLite } from "@/lib/types";
import { CATEGORY_ICON, CATEGORY_ACCENT, CATEGORY_BADGE } from "@/lib/document-category-ui";
import { useProfile } from "@/lib/useProfile";
import { format } from "date-fns";

const CATEGORY_ORDER: (DocumentCategory | "semua")[] = ["semua", "shp", "dxf", "pdf", "excel", "foto", "drone", "lainnya"];

function formatSize(kb: number | null) {
  if (!kb) return "-";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const { canEdit } = useProfile();

  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "semua">("semua");
  const [clusterFilter, setClusterFilter] = useState<string>("semua");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const { data: projects } = await supabase.from("projects").select("id,name,client_name").limit(1);
    setProject((projects?.[0] as Project) ?? null);

    const { data: clusterRows } = await supabase.from("clusters").select("*").returns<Cluster[]>();
    setClusters(clusterRows ?? []);

    const { data: profileRows } = await supabase.from("profiles").select("id,full_name").returns<ProfileLite[]>();
    setProfiles(profileRows ?? []);

    const { data: docRows } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<DocumentRecord[]>();
    setDocs(docRows ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const clusterName = useMemo(() => {
    const map = new Map(clusters.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? map.get(id) ?? "-" : "Umum");
  }, [clusters]);

  const uploaderName = useMemo(() => {
    const map = new Map(profiles.map((p) => [p.id, p.full_name]));
    return (id: string | null) => (id ? map.get(id) ?? "-" : "-");
  }, [profiles]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { semua: docs.length };
    for (const d of docs) counts[d.kategori] = (counts[d.kategori] ?? 0) + 1;
    return counts;
  }, [docs]);

  const filtered = useMemo(() => {
    const rows = docs.filter((d) => {
      if (categoryFilter !== "semua" && d.kategori !== categoryFilter) return false;
      if (clusterFilter !== "semua" && (d.cluster_id ?? "umum") !== clusterFilter) return false;
      if (search && !d.nama_file.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    return rows.sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? diff : -diff;
    });
  }, [docs, categoryFilter, clusterFilter, search, sortDir]);

  async function handleDelete(doc: DocumentRecord) {
    if (!confirm(`Hapus "${doc.nama_file}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeletingId(doc.id);
    try {
      await deleteDocument(doc.id, doc.file_url);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message ?? err}`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Topbar title="Document Center — Boundary Monitoring System" />
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((k) => {
              const Icon = CATEGORY_ICON[k];
              const active = categoryFilter === k;
              return (
                <button
                  key={k}
                  onClick={() => setCategoryFilter(k)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition ${
                    active
                      ? "bg-brand-blue text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : CATEGORY_ACCENT[k]}`} />
                  {k === "semua" ? "Semua" : DOCUMENT_CATEGORY_LABEL[k]} ({categoryCounts[k] ?? 0})
                </button>
              );
            })}
          </div>
          {canEdit && (
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <UploadCloud className="h-4 w-4" />
              Unggah dokumen
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama file..."
              className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-brand-blue focus:outline-none"
            />
          </div>
          <div className="relative">
            <Network className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue" />
            <select
              value={clusterFilter}
              onChange={(e) => setClusterFilter(e.target.value)}
              className="rounded-md border border-slate-200 py-2 pl-9 pr-8 text-sm text-slate-700 focus:border-brand-blue focus:outline-none"
            >
              <option value="semua">Semua cluster</option>
              <option value="umum">Umum (tidak terkait cluster)</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-normal">File</th>
                <th className="px-4 py-3 font-normal">Kategori</th>
                <th className="px-4 py-3 font-normal">Cluster</th>
                <th className="px-4 py-3 text-right font-normal">Ukuran</th>
                <th className="px-4 py-3 font-normal">
                  <button
                    onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                    className="flex items-center gap-1 font-normal text-slate-500 hover:text-slate-700"
                  >
                    Diunggah
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-normal">Diunggah oleh</th>
                <th className="px-4 py-3 text-right font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.length === 0 &&
                (docs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative">
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                            <FolderOpen className="h-9 w-9 text-brand-blue" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-blue">
                            <UploadCloud className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <p className="mt-4 text-base font-medium text-slate-900">Belum ada dokumen</p>
                        <p className="mt-1 text-sm text-slate-500">Belum ada dokumen yang diunggah.</p>
                        <p className="text-sm text-slate-500">
                          Silakan unggah dokumen untuk mulai menyimpan dan mengelola file proyek.
                        </p>
                        {canEdit && (
                          <button
                            onClick={() => setUploadOpen(true)}
                            className="mt-5 flex items-center gap-1.5 rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                          >
                            <UploadCloud className="h-4 w-4" />
                            Unggah dokumen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada dokumen yang cocok dengan filter.
                    </td>
                  </tr>
                ))}
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      {d.kategori === "foto" && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.file_url} alt={d.nama_file} className="h-10 w-10 rounded-md object-cover" />
                      )}
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-slate-800 hover:text-brand-blue hover:underline"
                      >
                        {d.nama_file}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${CATEGORY_BADGE[d.kategori]}`}>
                      {DOCUMENT_CATEGORY_LABEL[d.kategori]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-500">{clusterName(d.cluster_id)}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{formatSize(d.ukuran_kb)}</td>
                  <td className="px-4 py-2 text-slate-500">{format(new Date(d.created_at), "d MMM yyyy")}</td>
                  <td className="px-4 py-2 text-slate-500">{uploaderName(d.uploaded_by)}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-blue hover:underline">
                        Unduh
                      </a>
                      {canEdit && (
                        <button
                          onClick={() => handleDelete(d)}
                          disabled={deletingId === d.id}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          {deletingId === d.id ? "Menghapus..." : "Hapus"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Info className="h-4 w-4 shrink-0" />
          Maksimal ukuran file per dokumen adalah 100 MB.
        </div>
      </main>

      {uploadOpen && project && (
        <DocumentUploadForm
          projectId={project.id}
          clusters={clusters}
          onClose={() => setUploadOpen(false)}
          onSaved={() => {
            setUploadOpen(false);
            loadData();
          }}
        />
      )}
    </>
  );
}
