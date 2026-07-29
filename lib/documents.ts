import { supabase } from "@/lib/supabase";

export const DOCUMENTS_BUCKET = "documents";

/**
 * Ekstrak path relatif dalam bucket dari public URL Supabase Storage, supaya
 * bisa dipakai untuk `storage.from(bucket).remove([path])` saat menghapus.
 * Contoh public URL:
 *   https://xxx.supabase.co/storage/v1/object/public/documents/clusterA/123-peta.pdf
 * -> path: clusterA/123-peta.pdf
 */
export function storagePathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function uploadDocumentFile(file: File, folder: string) {
  const path = `${folder}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function deleteDocument(documentId: string, fileUrl: string) {
  const path = storagePathFromPublicUrl(fileUrl, DOCUMENTS_BUCKET);
  if (path) {
    // Kalau hapus file di storage gagal (mis. sudah terhapus manual), tetap
    // lanjut hapus baris metadata-nya supaya tidak jadi entri "yatim" di UI.
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
  }
  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) throw error;
}
