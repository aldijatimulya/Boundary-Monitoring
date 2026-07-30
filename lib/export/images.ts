// Helper bersama untuk export PDF & Word: ambil foto laporan dari URL (Supabase
// Storage), ubah jadi data URL + baca dimensi asli gambarnya, supaya bisa
// ditempel ke dokumen PDF/Word dengan rasio yang benar.

export type LoadedImage = {
  url: string;
  dataUrl: string;
  width: number;
  height: number;
  format: "JPEG" | "PNG";
};

async function loadImage(url: string): Promise<LoadedImage | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
      reader.readAsDataURL(blob);
    });

    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.src = dataUrl;
    });

    const format: "JPEG" | "PNG" = blob.type.includes("png") ? "PNG" : "JPEG";
    return { url, dataUrl, width, height, format };
  } catch {
    // Foto gagal diambil (mis. URL kadaluarsa/rusak) -- dilewati saja supaya
    // export tetap jalan untuk foto lain, bukan gagal total.
    return null;
  }
}

// Ambil semua foto secara paralel, buang yang gagal dimuat.
export async function loadReportPhotos(urls: string[] | null | undefined): Promise<LoadedImage[]> {
  if (!urls || urls.length === 0) return [];
  const results = await Promise.all(urls.map(loadImage));
  return results.filter((r): r is LoadedImage => r !== null);
}
