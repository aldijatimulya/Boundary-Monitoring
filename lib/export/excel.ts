import * as XLSX from "xlsx";

export type ExcelSheet = {
  name: string;
  rows: Record<string, string | number | null | undefined>[];
};

/**
 * Set lebar kolom otomatis berdasarkan konten terpanjang di tiap kolom
 * (SheetJS tidak menghitung ini otomatis), supaya file Excel yang di-download
 * langsung enak dibaca tanpa perlu resize manual dulu.
 */
function autoWidthColumns(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]);
  return headers.map((h) => {
    const longest = rows.reduce((max, row) => {
      const v = row[h];
      const len = v === null || v === undefined ? 0 : String(v).length;
      return Math.max(max, len);
    }, h.length);
    return { wch: Math.min(Math.max(longest + 2, 10), 60) };
  });
}

/**
 * Buat & download file .xlsx berisi satu atau beberapa sheet, langsung dari
 * browser (tidak lewat server) memakai SheetJS. Dipanggil dari tombol
 * "Download Excel" di tiap halaman report.
 */
export function downloadExcel(filename: string, sheets: ExcelSheet[]) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows.length > 0 ? sheet.rows : [{}]);
    ws["!cols"] = autoWidthColumns(sheet.rows);
    // Nama sheet Excel maksimal 31 karakter & tidak boleh ada karakter tertentu.
    const safeName = sheet.name.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Sheet1";
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  }
  XLSX.writeFile(wb, filename);
}

/** Format tanggal ISO (yyyy-mm-dd) jadi dd/mm/yyyy untuk kolom Excel, aman kalau null. */
export function excelDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("id-ID");
}

/** Nama file dengan timestamp konsisten untuk semua modul, mis. "Reconstruction-Report_2026-08-04.xlsx" */
export function excelFilename(base: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${base}_${today}.xlsx`;
}
