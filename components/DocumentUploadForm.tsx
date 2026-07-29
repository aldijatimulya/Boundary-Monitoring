"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadDocumentFile } from "@/lib/documents";
import { Cluster, DocumentCategory, DOCUMENT_CATEGORY_LABEL } from "@/lib/types";

type Props = {
  projectId: string;
  clusters: Cluster[];
  onClose: () => void;
  onSaved: () => void;
};

const CATEGORY_ACCEPT: Record<DocumentCategory, string> = {
  shp: ".zip,.shp,.shx,.dbf,.prj",
  dxf: ".dxf",
  pdf: ".pdf",
  excel: ".xlsx,.xls,.csv",
  foto: "image/*",
  drone: "image/*,.tif,.tiff",
  lainnya: "*",
};

export default function DocumentUploadForm({ projectId, clusters, onClose, onSaved }: Props) {
  const [kategori, setKategori] = useState<DocumentCategory>("pdf");
  const [clusterId, setClusterId] = useState<string>("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!files || files.length === 0) {
      setError("Pilih minimal 1 file.");
      return;
    }

    setUploading(true);
    const folder = clusterId || "umum";

    for (const file of Array.from(files)) {
      setProgress(`Mengunggah ${file.name}...`);
      try {
        const { publicUrl } = await uploadDocumentFile(file, folder);
        const { error: dbError } = await supabase.from("documents").insert({
          project_id: projectId,
          cluster_id: clusterId || null,
          nama_file: file.name,
          kategori,
          file_url: publicUrl,
          ukuran_kb: Math.round(file.size / 1024),
        });
        if (dbError) throw dbError;
      } catch (err: any) {
        setError((prev) => (prev ? `${prev}\n` : "") + `Gagal unggah ${file.name}: ${err.message ?? err}`);
      }
    }

    setUploading(false);
    setProgress("");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-white p-6">
        <h2 className="text-base font-medium text-slate-900">Unggah dokumen</h2>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-slate-600">Kategori</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value as DocumentCategory)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              {(Object.keys(DOCUMENT_CATEGORY_LABEL) as DocumentCategory[]).map((k) => (
                <option key={k} value={k}>
                  {DOCUMENT_CATEGORY_LABEL[k]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600">Cluster terkait (opsional)</label>
            <select
              value={clusterId}
              onChange={(e) => setClusterId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Umum / seluruh proyek</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600">File (bisa pilih lebih dari satu)</label>
            <input
              type="file"
              multiple
              accept={CATEGORY_ACCEPT[kategori]}
              onChange={(e) => setFiles(e.target.files)}
              className="mt-1 block w-full text-sm"
            />
            {kategori === "shp" && (
              <p className="mt-1 text-xs text-slate-400">
                Kalau shapefile terdiri dari beberapa file (.shp/.shx/.dbf/.prj), lebih praktis kompres jadi
                satu .zip lalu unggah itu saja.
              </p>
            )}
          </div>

          {uploading && progress && <p className="text-xs text-slate-400">{progress}</p>}
          {error && <p className="whitespace-pre-line text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm">
            Tutup
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Mengunggah..." : "Unggah"}
          </button>
        </div>
      </form>
    </div>
  );
}
