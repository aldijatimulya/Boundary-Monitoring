import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, HeadingLevel } from "docx";
import { DailyReport, WeeklyReport, MonthlyReport } from "@/lib/types";

const CLIENT_NAME = "PT Medco E&P South Sumatra Region";

function fieldRow(label: string, value: string) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        children: [new Paragraph(value || "-")],
      }),
    ],
  });
}

async function saveDoc(doc: Document, filename: string) {
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildDocument(title: string, subtitle: string, rows: TableRow[]) {
  return new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: CLIENT_NAME, bold: true, size: 24 })] }),
          new Paragraph({ text: "Boundary Reconstruction & Monitoring Project", spacing: { after: 200 } }),
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: subtitle, spacing: { after: 200 } }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
          new Paragraph({ text: "", spacing: { before: 400 } }),
          new Paragraph({ text: "Dibuat oleh,\t\t\t\tDisetujui oleh," }),
          new Paragraph({ text: "", spacing: { before: 600 } }),
          new Paragraph({ text: "(_________________________)\t\t(_________________________)" }),
        ],
      },
    ],
  });
}

export async function exportDailyReportDocx(report: DailyReport) {
  const rows = [
    fieldRow("Tanggal", report.tanggal),
    fieldRow("Tim", report.tim ?? "-"),
    fieldRow("Jumlah personil", report.personil?.toString() ?? "-"),
    fieldRow("Jam kerja", `${report.jam_kerja_mulai ?? "-"} — ${report.jam_kerja_selesai ?? "-"}`),
    fieldRow("Cuaca", report.cuaca ?? "-"),
    fieldRow(
      "Koordinat",
      report.koordinat_lat && report.koordinat_lng ? `${report.koordinat_lat}, ${report.koordinat_lng}` : "-"
    ),
    fieldRow("Kegiatan", report.kegiatan),
    fieldRow("Target", report.target ?? "-"),
    fieldRow("Realisasi", report.realisasi ?? "-"),
    fieldRow("Material digunakan", report.material_digunakan ?? "-"),
    fieldRow("Permasalahan", report.permasalahan ?? "-"),
    fieldRow("Mitigasi", report.mitigasi ?? "-"),
    fieldRow("Kesimpulan", report.kesimpulan ?? "-"),
    fieldRow("Rencana besok", report.rencana_besok ?? "-"),
  ];
  const doc = buildDocument("Laporan Harian Kegiatan Lapangan", `Tanggal: ${report.tanggal}`, rows);
  await saveDoc(doc, `Laporan-Harian-${report.tanggal}.docx`);
}

export async function exportWeeklyReportDocx(report: WeeklyReport) {
  const rows = [
    fieldRow("Ringkasan capaian", report.ringkasan_capaian ?? "-"),
    fieldRow("Progres rencana", `${report.progres_rencana_persen ?? 0}%`),
    fieldRow("Progres realisasi", `${report.progres_realisasi_persen ?? 0}%`),
    fieldRow("Kendala", report.kendala ?? "-"),
    fieldRow("Mitigasi", report.mitigasi ?? "-"),
  ];
  const doc = buildDocument(
    `Laporan Mingguan — Minggu ke-${report.minggu_ke}`,
    `Periode: ${report.periode_mulai} — ${report.periode_selesai}`,
    rows
  );
  await saveDoc(doc, `Laporan-Mingguan-Minggu-${report.minggu_ke}.docx`);
}

const BULAN_NAMA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export async function exportMonthlyReportDocx(report: MonthlyReport) {
  const rows = [
    fieldRow("Ringkasan eksekutif", report.ringkasan_eksekutif ?? "-"),
    fieldRow("Progres rencana", `${report.progres_rencana_persen ?? 0}%`),
    fieldRow("Progres realisasi", `${report.progres_realisasi_persen ?? 0}%`),
    fieldRow("Analisis kendala", report.analisis_kendala ?? "-"),
    fieldRow("Proyeksi bulan depan", report.proyeksi_bulan_depan ?? "-"),
  ];
  const doc = buildDocument(
    "Laporan Bulanan Progres Proyek",
    `Periode: ${BULAN_NAMA[report.bulan - 1] ?? report.bulan} ${report.tahun}`,
    rows
  );
  await saveDoc(doc, `Laporan-Bulanan-${BULAN_NAMA[report.bulan - 1]}-${report.tahun}.docx`);
}
