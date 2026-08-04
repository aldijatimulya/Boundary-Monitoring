import type { TimelineMatrix } from "@/lib/timeline-matrix";

/**
 * Beda dengan lib/export/excel.ts (SheetJS) yang dipakai modul lain -- ini
 * pakai ExcelJS karena perlu menyisipkan GAMBAR (screenshot grafik kurva-S)
 * ke dalam file .xlsx, sesuatu yang tidak didukung SheetJS versi gratis.
 * Catatan: ini menyisipkan gambar statis dari kurvanya, BUKAN native Excel
 * chart object yang interaktif -- ExcelJS juga tidak mendukung itu. Kalau mau
 * chart yang bisa diedit langsung di Excel, tetap ada sheet datanya di bawah
 * gambar supaya bisa dipakai bikin chart baru manual (Insert > Chart).
 *
 * ExcelJS di-import dinamis (bukan di top-level) karena ukurannya lumayan
 * besar (~250KB) -- kalau di-import biasa, dia ikut kebawa ke initial bundle
 * halaman Timeline walaupun jarang dipakai. Dengan dynamic import, dia cuma
 * di-download browser saat tombol "Download Grafik (Excel)" benar-benar diklik.
 */
export async function exportTimelineCurveExcel(pngDataUrl: string, matrix: TimelineMatrix) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Boundary Monitoring System";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Kurva-S Timeline");

  sheet.getCell("A1").value = "Kurva-S — Rencana vs Realisasi Kumulatif";
  sheet.getCell("A1").font = { bold: true, size: 14 };
  sheet.mergeCells("A1:F1");

  // Gambar hasil render grafik (base64 data URL -> buffer) disisipkan mulai
  // baris ke-3, cukup lega untuk ukuran grafik standar 900x350px.
  const base64 = pngDataUrl.split(",")[1];
  const imageId = workbook.addImage({ base64, extension: "png" });
  sheet.addImage(imageId, {
    tl: { col: 0, row: 2 },
    ext: { width: 900, height: 350 },
  });

  // Data tabel mentah diletakkan di bawah gambar (mulai baris 22) supaya
  // tetap bisa dipakai bikin chart Excel manual, atau sekadar diperiksa angkanya.
  const dataStartRow = 22;
  sheet.getCell(`A${dataStartRow - 1}`).value = "Data pendukung grafik di atas:";
  sheet.getCell(`A${dataStartRow - 1}`).font = { italic: true, size: 10, color: { argb: "FF64748B" } };

  const header = sheet.getRow(dataStartRow);
  header.values = ["Minggu", "Periode", "Rencana Kumulatif (%)", "Realisasi Kumulatif (%)"];
  header.font = { bold: true };

  matrix.weeks.forEach((w, wi) => {
    const row = sheet.getRow(dataStartRow + 1 + wi);
    row.values = [
      `Minggu ${wi + 1}`,
      w.label,
      matrix.rencanaKumulatif[wi],
      matrix.realisasiKumulatif[wi] ?? "",
    ];
  });

  sheet.columns = [{ width: 12 }, { width: 20 }, { width: 22 }, { width: 24 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const today = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Timeline-Kurva-S_${today}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
}
