// Target/ambang batas resmi proyek -- angka tetap yang ditentukan perusahaan
// (bukan hasil hitungan dari data), dipakai bareng di beberapa tempat
// (Dashboard, Plank Report, export Excel) supaya kalau nanti berubah cukup
// diubah di satu file ini saja.

/** Total luasan proyek untuk progres rekonstruksi keseluruhan. */
export const REKONSTRUKSI_TARGET_HA = 500; // = 5.000.000 m²
export const REKONSTRUKSI_TARGET_M2 = REKONSTRUKSI_TARGET_HA * 10_000;

/** Total titik plank yang direncanakan terpasang di seluruh proyek. */
export const PLANK_TARGET_TITIK = 150;
