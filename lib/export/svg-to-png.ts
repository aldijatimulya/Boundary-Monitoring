// Konversi elemen <svg> (mis. hasil render Recharts) jadi PNG, murni di
// browser -- tidak perlu library screenshot tambahan (html2canvas dkk) karena
// chart-nya sudah berbentuk SVG vector, tinggal digambar ulang ke <canvas>.

async function svgElementToPngBlob(
  svgEl: SVGSVGElement,
  opts?: { backgroundColor?: string; scale?: number }
): Promise<Blob> {
  const scale = opts?.scale ?? 2; // render 2x supaya tidak pecah waktu di-zoom/print
  const backgroundColor = opts?.backgroundColor ?? "#ffffff";

  const width = svgEl.viewBox?.baseVal?.width || svgEl.clientWidth || 800;
  const height = svgEl.viewBox?.baseVal?.height || svgEl.clientHeight || 400;

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Gagal memuat grafik sebagai gambar"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak didukung di browser ini");
    ctx.scale(scale, scale);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Gagal membuat file PNG");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Cari elemen <svg> pertama di dalam sebuah container ref (dipakai untuk chart Recharts). */
export function findSvgInContainer(container: HTMLElement | null): SVGSVGElement | null {
  if (!container) return null;
  return container.querySelector("svg");
}

/** Download langsung sebagai file .png. */
export async function downloadSvgAsPng(svgEl: SVGSVGElement, filename: string) {
  const blob = await svgElementToPngBlob(svgEl, { backgroundColor: "#ffffff", scale: 2 });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** Ambil PNG-nya sebagai data URL base64 (dipakai untuk disisipkan ke file Excel). */
export async function svgToPngDataUrl(svgEl: SVGSVGElement): Promise<string> {
  const blob = await svgElementToPngBlob(svgEl, { backgroundColor: "#ffffff", scale: 2 });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca hasil PNG"));
    reader.readAsDataURL(blob);
  });
}
