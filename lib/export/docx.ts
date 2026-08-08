import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, ImageRun, WidthType, HeadingLevel } from "docx";
import { DailyReport, WeeklyReport, MonthlyReport, RincianKegiatanItem } from "@/lib/types";
import { loadReportPhotos } from "@/lib/export/images";

const CLIENT_NAME = "PT Medco E&P South Sumatra Region";
const MAX_IMG_WIDTH = 420; // px, ditampilkan proporsional dari ukuran asli foto

// Bangun paragraf "Dokumentasi Foto" + tiap foto (satu per baris, proporsional).
async function buildPhotoParagraphs(urls: string[] | null | undefined): Promise<Paragraph[]> {
  const photos = await loadReportPhotos(urls);
  if (photos.length === 0) return [];

  const paragraphs: Paragraph[] = [
    new Paragraph({ text: "Dokumentasi Foto", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }),
  ];

  for (const photo of photos) {
    const width = Math.min(photo.width, MAX_IMG_WIDTH);
    const height = Math.round((width * photo.height) / photo.width);
    // docx butuh Buffer/Uint8Array, bukan data URL -- ambil bagian base64-nya saja.
    const base64 = photo.dataUrl.split(",")[1] ?? "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    paragraphs.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new ImageRun({
            data: bytes,
            transformation: { width, height },
            type: photo.format === "PNG" ? "png" : "jpg",
          }),
        ],
      })
    );
  }

  return paragraphs;
}

// Bangun paragraf "Rincian Kegiatan" (jenis + persen per baris) untuk disisipkan
// sebelum dokumentasi foto, kalau laporan punya breakdown per jenis kegiatan.
function buildRincianKegiatanParagraphs(items: RincianKegiatanItem[] | null | undefined): Paragraph[] {
  if (!items || items.length === 0) return [];
  const paragraphs: Paragraph[] = [
    new Paragraph({ text: "Rincian Kegiatan", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }),
  ];
  for (const item of items) {
    paragraphs.push(new Paragraph({ text: `${item.jenis}: ${item.persen}%`, bullet: { level: 0 } }));
  }
  return paragraphs;
}

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

function buildDocument(
  title: string,
  subtitle: string,
  rows: TableRow[],
  rincianParagraphs: Paragraph[] = [],
  photoParagraphs: Paragraph[] = []
) {
  return new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: CLIENT_NAME, bold: true, size: 24 })] }),
          new Paragraph({ text: "Boundary Reconstruction & Monitoring Project", spacing: { after: 200 } }),
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: subtitle, spacing: { after: 200 } }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
          ...rincianParagraphs,
          ...photoParagraphs,
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
    fieldRow("Target (%)", report.target_persen != null ? `${report.target_persen}%` : "-"),
    fieldRow("Realisasi (%)", report.realisasi_persen != null ? `${report.realisasi_persen}%` : "-"),
    fieldRow("Material digunakan", report.material_digunakan ?? "-"),
    fieldRow("Permasalahan", report.permasalahan ?? "-"),
    fieldRow("Mitigasi", report.mitigasi ?? "-"),
    fieldRow("Kesimpulan", report.kesimpulan ?? "-"),
    fieldRow("Rencana besok", report.rencana_besok ?? "-"),
  ];
  const rincianParagraphs = buildRincianKegiatanParagraphs(report.rincian_kegiatan);
  const photoParagraphs = await buildPhotoParagraphs(report.foto_urls);
  const doc = buildDocument("Laporan Harian Kegiatan Lapangan", `Tanggal: ${report.tanggal}`, rows, rincianParagraphs, photoParagraphs);
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
  const rincianParagraphs = buildRincianKegiatanParagraphs(report.rincian_kegiatan);
  const photoParagraphs = await buildPhotoParagraphs(report.foto_urls);
  const doc = buildDocument(
    `Laporan Mingguan — Minggu ke-${report.minggu_ke}`,
    `Periode: ${report.periode_mulai} — ${report.periode_selesai}`,
    rows,
    rincianParagraphs,
    photoParagraphs
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
  const rincianParagraphs = buildRincianKegiatanParagraphs(report.rincian_kegiatan);
  const photoParagraphs = await buildPhotoParagraphs(report.lampiran_urls);
  const doc = buildDocument(
    "Laporan Bulanan Progres Proyek",
    `Periode: ${BULAN_NAMA[report.bulan - 1] ?? report.bulan} ${report.tahun}`,
    rows,
    rincianParagraphs,
    photoParagraphs
  );
  await saveDoc(doc, `Laporan-Bulanan-${BULAN_NAMA[report.bulan - 1]}-${report.tahun}.docx`);
}
