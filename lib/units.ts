// Data tetap disimpan di database dalam hektar (kolom *_ha), tapi ditampilkan
// dan diinput pengguna dalam meter persegi (m²) supaya lebih presisi/familiar.
export const M2_PER_HA = 10000;

export function haToM2(ha: number | string | null | undefined): number {
  const n = Number(ha);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * M2_PER_HA);
}

export function m2ToHa(m2: number | string | null | undefined): number {
  const n = Number(m2);
  if (!Number.isFinite(n)) return 0;
  return n / M2_PER_HA;
}

export function formatM2(ha: number | string | null | undefined): string {
  return haToM2(ha).toLocaleString("id-ID");
}
