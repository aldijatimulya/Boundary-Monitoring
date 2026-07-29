import { addDays, differenceInCalendarDays, format, startOfWeek } from "date-fns";

export type ReportMatrixPoint = {
  cluster_id: string;
  tanggal_update: string; // yyyy-mm-dd
  luas_rekonstruksi_ha: number;
};

export type ClusterTarget = {
  id: string;
  name: string;
  luas_pembebasan_ha: number;
};

export type BurndownPoint = {
  date: string; // yyyy-mm-dd
  actualHa: number; // total realisasi kumulatif (semua cluster) pada tanggal ini
  remainingHa: number; // target total - actualHa
  idealRemainingHa: number | null; // garis ideal (linear, jadwal rencana), null kalau di luar rentang proyek
};

/**
 * Gabungkan histori report_matrix SEMUA cluster jadi satu deret waktu total
 * realisasi kumulatif. Untuk tiap cluster, nilai di antara dua tanggal update
 * di-"forward fill" (nilai terakhir yang diketahui dianggap bertahan sampai
 * ada update baru) — ini cocok karena `luas_rekonstruksi_ha` memang kumulatif,
 * bukan increment.
 */
export function buildActualSeries(
  points: ReportMatrixPoint[],
  clusters: ClusterTarget[],
  projectStart?: string | null,
  projectEnd?: string | null
): BurndownPoint[] {
  const totalTarget = clusters.reduce((s, c) => s + Number(c.luas_pembebasan_ha), 0);

  const byCluster = new Map<string, ReportMatrixPoint[]>();
  for (const p of points) {
    const arr = byCluster.get(p.cluster_id) ?? [];
    arr.push(p);
    byCluster.set(p.cluster_id, arr);
  }
  for (const arr of byCluster.values()) {
    arr.sort((a, b) => a.tanggal_update.localeCompare(b.tanggal_update));
  }

  const allDates = Array.from(new Set(points.map((p) => p.tanggal_update))).sort();
  if (allDates.length === 0) return [];

  const startMs = projectStart ? new Date(projectStart).getTime() : new Date(allDates[0]).getTime();
  const endMs = projectEnd ? new Date(projectEnd).getTime() : null;

  return allDates.map((date) => {
    let total = 0;
    for (const [, arr] of byCluster) {
      let latest = 0;
      for (const p of arr) {
        if (p.tanggal_update <= date) latest = p.luas_rekonstruksi_ha;
        else break;
      }
      total += latest;
    }
    const remaining = Math.max(totalTarget - total, 0);

    let idealRemaining: number | null = null;
    if (endMs && endMs > startMs) {
      const nowMs = new Date(date).getTime();
      const fraction = Math.min(Math.max((nowMs - startMs) / (endMs - startMs), 0), 1);
      idealRemaining = totalTarget * (1 - fraction);
    }

    return {
      date,
      actualHa: Math.round(total * 100) / 100,
      remainingHa: Math.round(remaining * 100) / 100,
      idealRemainingHa: idealRemaining !== null ? Math.round(idealRemaining * 100) / 100 : null,
    };
  });
}

export type VelocityResult = {
  haPerDay: number;
  haPerWeek: number;
  windowDays: number;
  basis: "30_hari_terakhir" | "seluruh_histori";
};

/**
 * Kecepatan progres (velocity). Pakai jendela 30 hari terakhir kalau datanya
 * cukup panjang (supaya lebih responsif terhadap tren terbaru); kalau histori
 * lebih pendek dari itu, pakai rata-rata dari seluruh histori yang ada.
 */
export function computeVelocity(series: BurndownPoint[]): VelocityResult | null {
  if (series.length < 2) return null;

  const last = series[series.length - 1];
  const windowStart = addDays(new Date(last.date), -30).toISOString().slice(0, 10);
  const inWindow = series.filter((p) => p.date >= windowStart);

  const basisSeries = inWindow.length >= 2 ? inWindow : series;
  const first = basisSeries[0];
  const days = Math.max(differenceInCalendarDays(new Date(last.date), new Date(first.date)), 1);
  const haPerDay = (last.actualHa - first.actualHa) / days;

  return {
    haPerDay: Math.round(haPerDay * 1000) / 1000,
    haPerWeek: Math.round(haPerDay * 7 * 100) / 100,
    windowDays: days,
    basis: inWindow.length >= 2 ? "30_hari_terakhir" : "seluruh_histori",
  };
}

export type ForecastResult = {
  forecastDate: string;
  daysRemaining: number;
};

export function computeForecast(remainingHa: number, velocity: VelocityResult | null, fromDate: string): ForecastResult | null {
  if (!velocity || velocity.haPerDay <= 0 || remainingHa <= 0) return null;
  const daysRemaining = Math.ceil(remainingHa / velocity.haPerDay);
  const forecastDate = format(addDays(new Date(fromDate), daysRemaining), "yyyy-MM-dd");
  return { forecastDate, daysRemaining };
}

export type WeeklyProductivity = {
  weekLabel: string; // "27 Jul"
  incrementHa: number;
};

/** Bin kenaikan realisasi total per minggu (Senin sebagai awal minggu). */
export function buildWeeklyProductivity(series: BurndownPoint[]): WeeklyProductivity[] {
  if (series.length === 0) return [];

  const byWeek = new Map<string, { weekStart: Date; lastValue: number }>();

  for (const point of series) {
    const weekStart = startOfWeek(new Date(point.date), { weekStartsOn: 1 });
    const key = weekStart.toISOString().slice(0, 10);
    byWeek.set(key, { weekStart, lastValue: point.actualHa });
  }

  const weeks = Array.from(byWeek.entries()).sort(([a], [b]) => a.localeCompare(b));
  const result: WeeklyProductivity[] = [];
  let runningPrev = 0;
  for (const [, { weekStart, lastValue }] of weeks) {
    result.push({
      weekLabel: format(weekStart, "d MMM"),
      incrementHa: Math.round((lastValue - runningPrev) * 100) / 100,
    });
    runningPrev = lastValue;
  }
  return result;
}

export type ClusterProductivity = {
  cluster_id: string;
  name: string;
  targetHa: number;
  actualHa: number;
  remainingHa: number;
  persenSelesai: number;
  haPerWeek: number;
  forecastDate: string | null;
  atRisk: boolean; // trending won't reach target within a reasonable horizon
};

export function buildClusterProductivity(
  points: ReportMatrixPoint[],
  clusters: ClusterTarget[],
  today: string
): ClusterProductivity[] {
  return clusters.map((c) => {
    const history = points
      .filter((p) => p.cluster_id === c.id)
      .sort((a, b) => a.tanggal_update.localeCompare(b.tanggal_update));

    const actualHa = history.length > 0 ? history[history.length - 1].luas_rekonstruksi_ha : 0;
    const remainingHa = Math.max(c.luas_pembebasan_ha - actualHa, 0);
    const persenSelesai = c.luas_pembebasan_ha > 0 ? Math.round((actualHa / c.luas_pembebasan_ha) * 10000) / 100 : 0;

    let haPerWeek = 0;
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const days = Math.max(differenceInCalendarDays(new Date(last.tanggal_update), new Date(first.tanggal_update)), 1);
      haPerWeek = Math.round(((last.luas_rekonstruksi_ha - first.luas_rekonstruksi_ha) / days) * 7 * 100) / 100;
    }

    let forecastDate: string | null = null;
    if (haPerWeek > 0 && remainingHa > 0) {
      const daysRemaining = Math.ceil((remainingHa / haPerWeek) * 7);
      forecastDate = format(addDays(new Date(today), daysRemaining), "yyyy-MM-dd");
    }

    // Ditandai "perlu perhatian" kalau belum selesai, dan (tidak ada progres sama
    // sekali dalam histori) atau (proyeksi penyelesaian lebih dari 180 hari lagi).
    const atRisk =
      remainingHa > 0 &&
      (haPerWeek <= 0 || (forecastDate ? differenceInCalendarDays(new Date(forecastDate), new Date(today)) > 180 : true));

    return { cluster_id: c.id, name: c.name, targetHa: c.luas_pembebasan_ha, actualHa, remainingHa, persenSelesai, haPerWeek, forecastDate, atRisk };
  });
}
