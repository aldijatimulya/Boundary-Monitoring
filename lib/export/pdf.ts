import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DailyReport, WeeklyReport, MonthlyReport } from "@/lib/types";

const CLIENT_NAME = "PT Medco E&P South Sumatra Region";

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(CLIENT_NAME, 14, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Boundary Reconstruction & Monitoring Project", 14, 21);
  doc.setLineWidth(0.3);
  doc.line(14, 24, 196, 24);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 33);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 14, 39);
}

function addSignatureBlock(doc: jsPDF, y: number) {
  doc.setFontSize(9);
  doc.text("Dibuat oleh,", 14, y);
  doc.text("Disetujui oleh,", 120, y);
  doc.text("(_________________________)", 14, y + 20);
  doc.text("(_________________________)", 120, y + 20);
}

export function exportDailyReportPDF(report: DailyReport) {
  const doc = new jsPDF();
  addHeader(doc, "Laporan Harian Kegiatan Lapangan", `Tanggal: ${report.tanggal}`);

  autoTable(doc, {
    startY: 44,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" } },
    body: [
      ["Tim", report.tim ?? "-"],
      ["Jumlah personil", report.personil?.toString() ?? "-"],
      ["Jam kerja", `${report.jam_kerja_mulai ?? "-"} — ${report.jam_kerja_selesai ?? "-"}`],
      ["Cuaca", report.cuaca ?? "-"],
      ["Koordinat", report.koordinat_lat && report.koordinat_lng ? `${report.koordinat_lat}, ${report.koordinat_lng}` : "-"],
      ["Kegiatan", report.kegiatan],
      ["Target", report.target ?? "-"],
      ["Realisasi", report.realisasi ?? "-"],
      ["Material digunakan", report.material_digunakan ?? "-"],
      ["Permasalahan", report.permasalahan ?? "-"],
      ["Mitigasi", report.mitigasi ?? "-"],
      ["Kesimpulan", report.kesimpulan ?? "-"],
      ["Rencana besok", report.rencana_besok ?? "-"],
    ],
  });

  const finalY = (doc as any).lastAutoTable.finalY ?? 44;
  addSignatureBlock(doc, finalY + 20);
  doc.save(`Laporan-Harian-${report.tanggal}.pdf`);
}

export function exportWeeklyReportPDF(report: WeeklyReport) {
  const doc = new jsPDF();
  addHeader(
    doc,
    `Laporan Mingguan — Minggu ke-${report.minggu_ke}`,
    `Periode: ${report.periode_mulai} — ${report.periode_selesai}`
  );

  autoTable(doc, {
    startY: 44,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" } },
    body: [
      ["Ringkasan capaian", report.ringkasan_capaian ?? "-"],
      ["Progres rencana", `${report.progres_rencana_persen ?? 0}%`],
      ["Progres realisasi", `${report.progres_realisasi_persen ?? 0}%`],
      ["Kendala", report.kendala ?? "-"],
      ["Mitigasi", report.mitigasi ?? "-"],
    ],
  });

  const finalY = (doc as any).lastAutoTable.finalY ?? 44;
  addSignatureBlock(doc, finalY + 20);
  doc.save(`Laporan-Mingguan-Minggu-${report.minggu_ke}.pdf`);
}

const BULAN_NAMA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function exportMonthlyReportPDF(report: MonthlyReport) {
  const doc = new jsPDF();
  addHeader(
    doc,
    "Laporan Bulanan Progres Proyek",
    `Periode: ${BULAN_NAMA[report.bulan - 1] ?? report.bulan} ${report.tahun}`
  );

  autoTable(doc, {
    startY: 44,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" } },
    body: [
      ["Ringkasan eksekutif", report.ringkasan_eksekutif ?? "-"],
      ["Progres rencana", `${report.progres_rencana_persen ?? 0}%`],
      ["Progres realisasi", `${report.progres_realisasi_persen ?? 0}%`],
      ["Analisis kendala", report.analisis_kendala ?? "-"],
      ["Proyeksi bulan depan", report.proyeksi_bulan_depan ?? "-"],
    ],
  });

  const finalY = (doc as any).lastAutoTable.finalY ?? 44;
  addSignatureBlock(doc, finalY + 20);
  doc.save(`Laporan-Bulanan-${BULAN_NAMA[report.bulan - 1]}-${report.tahun}.pdf`);
}
