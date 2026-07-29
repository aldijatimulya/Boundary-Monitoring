# Panduan Setup — Boundary Monitoring System (Sprint 1)

Ini adalah fondasi platform: struktur project, skema database, autentikasi, dan 3
halaman inti (Dashboard, Timeline, Reconstruction Report) yang sudah terhubung ke
Supabase dan siap dikembangkan lanjut di Sprint 2–4.

## 1. Buat project Supabase (gratis)

1. Daftar/masuk di https://supabase.com dan buat project baru (pilih region Singapore
   supaya latensi ke Indonesia rendah).
2. Buka **SQL Editor**, tempel seluruh isi file `supabase/schema.sql`, lalu jalankan
   (Run). Ini akan membuat semua tabel, view kalkulasi otomatis, dan RLS policy.
3. Buka **Project Settings > API**, salin `Project URL` dan `anon public key`.

## 2. Konfigurasi environment lokal

```bash
cp .env.local.example .env.local
```

Isi `.env.local` dengan URL dan anon key dari langkah sebelumnya.

## 3. Jalankan secara lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000 — akan redirect ke halaman login.

## 4. Buat user pertama

Di Supabase Dashboard > **Authentication > Users**, klik "Add user" untuk membuat
akun admin pertama (email + password). Setelah itu, tambahkan baris di tabel
`profiles` (Table Editor) dengan `id` yang sama dengan user tersebut dan
`role = 'admin'`.

## 5. Isi data contoh

Lewat **Table Editor**, tambahkan minimal:
- 1 baris di `projects` (misal "SSR Boundary Reconstruction 2024")
- Beberapa baris di `clusters` (Cluster A–E, isi `luas_pembebasan_ha`)
- Beberapa baris di `timeline_activities` (isi tanggal mulai & selesai —
  `durasi_hari` akan terisi otomatis)

Setelah itu Dashboard, Timeline, dan Reconstruction Report akan langsung
menampilkan data dan menghitung progres/selisih secara otomatis.

## 6. Deploy gratis ke Vercel

1. Push folder ini ke repo GitHub.
2. Di https://vercel.com, klik "New Project", import repo tersebut.
3. Tambahkan environment variable yang sama seperti `.env.local` di pengaturan
   Vercel project.
4. Deploy — Vercel akan otomatis build dan memberi URL publik (mis.
   `boundary-monitor.vercel.app`), gratis untuk penggunaan tim kecil–menengah.

## Struktur folder

```
app/
  login/              halaman login
  (main)/             halaman internal (dilindungi sidebar+layout bersama)
    dashboard/
    timeline/
    report/
components/           Sidebar, Topbar, komponen bersama
lib/
  supabase.ts         koneksi ke Supabase
  types.ts            tipe data + label status
supabase/
  schema.sql          skema database lengkap + view kalkulasi otomatis
```

## Apa yang sudah otomatis dihitung (sesuai diskusi sebelumnya)

- `timeline_activities.durasi_hari` — generated column di database
  (`tanggal_selesai − tanggal_mulai + 1`), tidak pernah bisa tidak-sinkron.
- View `v_report_matrix_latest` — menghitung `selisih_ha`, `persen_selisih`, dan
  `status` (not_started/on_progress/completed/need_follow_up) otomatis dari data
  `clusters` + update terbaru di `report_matrix`.
- View `v_project_progress` — menjumlahkan seluruh cluster untuk kartu
  "Progres Proyek" (realisasi ÷ target keseluruhan), terpisah dari metrik selisih
  per cluster.

## Yang belum dikerjakan (rencana Sprint 3–4)

- Sprint 3: Report Center — form harian/mingguan/bulanan + export PDF/Word,
  upload foto ke Supabase Storage.
- Sprint 4: Spatial Map (Leaflet + tile GEE), Analytics lanjutan, role-based
  access per halaman, Document Center.

Beri tahu saya kapan siap lanjut ke Sprint 3, saya bantu bangun Report Center-nya.

---

## Sprint 2 — Form input penuh + dependency + rollup progres

**Kalau kamu sudah menjalankan `schema.sql` versi Sprint 1 sebelumnya**, jangan
jalankan ulang `schema.sql` (akan error karena tabel sudah ada). Cukup jalankan
`supabase/migration_sprint2.sql` di SQL Editor.

**Kalau ini instalasi baru**, langsung jalankan `schema.sql` (sudah termasuk semua
perubahan Sprint 2).

### Apa yang baru

**Timeline (`/timeline`)**
- Tombol "Tambah kegiatan" membuka form penuh: nama, tanggal mulai/selesai, PIC,
  bobot, progres, serta dua relasi:
  - **Predecessor** (dependency): kegiatan yang harus selesai dulu. Kalau tanggal
    mulai kamu isi lebih awal dari tanggal selesai predecessor, muncul peringatan
    kuning dengan tombol "Gunakan tanggal otomatis" (auto-set ke hari setelah
    predecessor selesai).
  - **Kegiatan induk**: untuk membuat sub-kegiatan (misal per-cluster) di bawah
    satu kegiatan payung (misal "Rekonstruksi Batas"). Progres kegiatan induk
    otomatis dihitung sebagai rata-rata tertimbang (`bobot`) dari progres
    sub-kegiatannya — tidak perlu diisi manual.
- Kegiatan yang tanggal-mulainya bentrok dengan predecessor ditandai ⚠ di tabel.
- Status "delay" otomatis muncul kalau tanggal selesai sudah lewat tapi progres
  belum 100%.

**Reconstruction Report (`/report`)**
- Tombol "Tambah cluster" untuk menambah lokasi baru (nama, desa/kecamatan/
  kabupaten, luas pembebasan & deliniasi).
- Tombol "Catat update" per baris membuka form untuk mencatat hasil pengukuran
  rekonstruksi terbaru. Setiap update **ditambahkan sebagai baris baru** di
  tabel `report_matrix` (histori terjaga, tidak menimpa data lama) — form
  langsung menampilkan preview selisih & persentase sebelum disimpan.

### Cara pakai cepat

1. Buka `/timeline`, klik "Tambah kegiatan", isi "Survey Awal" (tanpa
   predecessor/induk).
2. Tambah "Rekonstruksi Batas" sebagai kegiatan induk, lalu tambah beberapa
   sub-kegiatan (misal "Rekonstruksi — Cluster A", dst.) dengan kegiatan induk
   = "Rekonstruksi Batas" dan isi progresnya masing-masing — lihat progres
   "Rekonstruksi Batas" ter-update otomatis.
3. Buka `/report`, klik "Tambah cluster" untuk data cluster, lalu "Catat update"
   untuk mencatat hasil rekonstruksi berkala.

## Sprint 3 — Report Center (Daily/Weekly/Monthly + export PDF/Word + upload foto)

**Kalau kamu sudah menjalankan `schema.sql` + `migration_sprint2.sql` sebelumnya**,
jalankan `supabase/migration_sprint3.sql` di SQL Editor (membuat bucket Storage
`report-photos` beserta policy-nya).

**Kalau ini instalasi baru**, langsung jalankan `schema.sql` (sudah termasuk semua
perubahan Sprint 1–3).

### Apa yang baru

- **`/reports/daily`** — form laporan harian lengkap (tim, personil, jam kerja,
  cuaca, koordinat, kegiatan, target/realisasi, material, permasalahan/mitigasi,
  kesimpulan, rencana besok) + upload foto dokumentasi
- **`/reports/weekly`** — form laporan mingguan (ringkasan capaian, progres
  rencana vs realisasi, kendala/mitigasi) + upload foto
- **`/reports/monthly`** — form laporan bulanan (ringkasan eksekutif, progres,
  analisis kendala, proyeksi bulan depan) + upload lampiran
- **Export PDF** — tombol "PDF" di setiap baris laporan men-generate file PDF
  dengan format kop + tabel + kolom tanda tangan (dibuat oleh / disetujui oleh),
  mengikuti pola laporan lapangan migas
- **Export Word** — tombol "Word" men-generate file `.docx` dengan struktur yang
  sama, bisa diedit ulang di Microsoft Word
- **Upload foto** — foto disimpan di Supabase Storage bucket `report-photos`
  (public read) lewat komponen `PhotoUpload`, URL publiknya disimpan di kolom
  `foto_urls`/`lampiran_urls`

### Catatan penting

- Export PDF/Word berjalan di browser (client-side) — tidak perlu server
  tambahan, cocok untuk hosting statis seperti Vercel.
- Bucket `report-photos` dibuat **public** supaya foto bisa langsung tampil di
  PDF/dashboard tanpa signed URL. Kalau data lapangan bersifat sangat rahasia,
  beri tahu saya — bisa diganti ke private bucket + signed URL di Sprint
  berikutnya.
- Field `status_approval` pada laporan harian saat ini otomatis `submitted`
  saat disimpan. Alur approval (draft → submitted → approved oleh atasan) bisa
  ditambahkan di Sprint 4 bersamaan dengan role-based access.

## Sprint 4 (bagian 1) — Spatial Map (Leaflet + tile GEE)

Tidak ada migrasi SQL baru — kolom `geometry` (jsonb) di tabel `clusters` sudah
ada sejak `schema.sql` Sprint 1, hanya belum dipakai. Kalau install baru,
`npm install` dulu untuk menarik `@types/geojson` yang baru ditambahkan.

### Apa yang baru

- **`/spatial`** — halaman peta interaktif:
  - Base layer OpenStreetMap dan citra satelit (Esri World Imagery), bisa
    ditukar lewat kontrol layer di kanan-atas peta.
  - Overlay tile Google Earth Engine (opsional, lihat konfigurasi di bawah) —
    bisa lebih dari satu layer (mis. Land Cover + NDVI), masing-masing bisa
    dinyalakan/dimatikan sendiri.
  - Batas tiap cluster digambar sebagai polygon GeoJSON, diwarnai otomatis
    sesuai status dari `v_report_matrix_latest` (abu-abu = belum mulai, kuning
    = on progress, hijau = selesai, merah = perlu tindak lanjut) — konsisten
    dengan warna status di Dashboard dan Reconstruction Report.
  - Klik polygon untuk popup ringkasan (luas pembebasan/rekonstruksi/selisih +
    status) dan link langsung ke Reconstruction Report.
  - Peta otomatis zoom-to-fit ke seluruh cluster yang punya geometri.
- **Input geometri cluster** — dua cara:
  1. Saat "Tambah cluster" di `/report`, ada field opsional untuk tempel GeoJSON
     Polygon/MultiPolygon.
  2. Untuk cluster yang sudah ada, klik tombol "Geometri"/"Edit geometri" di
     tabel Reconstruction Report — tempel/ubah GeoJSON kapan saja tanpa perlu
     hapus-buat ulang cluster.
- Cluster yang belum punya geometri tetap muncul normal di semua halaman lain,
  hanya ditandai di `/spatial` sebagai "belum punya data geometri" dan tidak
  digambar di peta.

### Konfigurasi tile GEE (opsional)

Di Earth Engine Python API:

```python
image = ee.Image(...)  # hasil visualisasi (mis. land cover, NDVI)
map_id = image.getMapId({"min": 0, "max": 1, "palette": [...]})
print(map_id["tile_fetcher"].url_format)
```

Salin URL itu ke `.env.local`:

```
NEXT_PUBLIC_GEE_LAYER_1_LABEL=Land Cover
NEXT_PUBLIC_GEE_LAYER_1_URL=https://earthengine.googleapis.com/v1/projects/.../tiles/{z}/{x}/{y}
```

**Catatan:** URL dari `getMapId()` bisa kedaluwarsa (jam–hari, tergantung
setup token). Untuk layer yang perlu tayang terus-menerus, publish lewat GEE
App atau Cloud Function yang me-refresh token secara berkala, lalu pakai URL
endpoint itu. Kalau env var tidak diisi, halaman `/spatial` tetap berfungsi
normal tanpa overlay GEE (cuma peringatan kecil di atas peta).

## Sprint 4 (bagian 2) — Analytics lanjutan (produktivitas, forecast, burn-down)

Tidak ada migrasi SQL baru — modul ini murni membaca histori yang sudah ada
di tabel `report_matrix` (tiap "Catat update" di `/report` menambah satu baris
histori, tidak menimpa data lama), jadi datanya otomatis makin akurat seiring
makin sering update dicatat.

### Apa yang baru

- **`/analytics`** — 4 bagian:
  1. **Kartu metrik**: kecepatan progres (ha/minggu, rata-rata 30 hari
     terakhir — fallback ke rata-rata seluruh histori kalau data belum ada
     30 hari), sisa realisasi, estimasi tanggal selesai (proyeksi linear dari
     tren saat ini), dan perbandingan terhadap `end_date` proyek (isi lewat
     Supabase Table Editor di tabel `projects` kalau belum diisi).
  2. **Burn-down chart**: sisa realisasi aktual (garis merah, dari data
     histori `report_matrix` sungguhan — bukan simulasi) dibanding jadwal
     ideal linear (garis putus-putus, dari `start_date` ke `end_date` proyek).
  3. **Produktivitas mingguan**: bar chart total penambahan luas rekonstruksi
     per minggu (gabungan semua cluster).
  4. **Tabel produktivitas per cluster**: progres %, kecepatan ha/minggu,
     estimasi selesai per cluster, dan status "Perlu perhatian" otomatis kalau
     cluster stagnan (kecepatan ≤ 0) atau proyeksi selesainya >180 hari lagi.
- Semua perhitungan (`lib/analytics.ts`) murni fungsi biasa (tidak butuh
  library statistik tambahan) — proyeksi dibuat linear dari data histori
  terbaru, bukan model machine learning, jadi mudah dijelaskan ke Medco kalau
  ditanya metodologinya.

### Catatan penting

- Butuh minimal 2 baris histori per cluster di `report_matrix` supaya
  kecepatan bisa dihitung; kalau cluster baru punya 1 update, dia tetap
  tampil di tabel tapi kecepatannya 0 dan belum ada estimasi tanggal selesai.
- Isi `start_date`/`end_date` di tabel `projects` (Table Editor) supaya garis
  "jadwal ideal" di burn-down chart dan kartu "Terhadap jadwal rencana" aktif.
  Kalau kosong, chart tetap tampil (cuma garis idealnya kosong).

## Sprint 4 (bagian 3) — Document Center

**Kalau kamu sudah menjalankan `schema.sql` sebelumnya**, jalankan
`supabase/migration_sprint4_documents.sql` di SQL Editor (menambahkan policy
insert/delete untuk tabel `documents` yang sebelumnya cuma bisa dibaca, dan
bucket Storage `documents` beserta policy-nya).

**Kalau ini instalasi baru**, langsung jalankan `schema.sql` (sudah termasuk
semua perubahan Sprint 1–4).

### Apa yang baru

- **`/documents`** — Document Center terpusat untuk semua file pendukung
  proyek: SHP, DXF, PDF, Excel, foto, dan citra drone.
  - Filter cepat lewat tab kategori (dengan jumlah dokumen per kategori),
    filter cluster, dan pencarian nama file.
  - Tombol "Unggah dokumen": pilih kategori, opsional kaitkan ke cluster
    tertentu (atau biarkan "Umum" untuk dokumen level-proyek), bisa unggah
    beberapa file sekaligus.
  - Preview thumbnail otomatis untuk kategori "Foto".
  - Tombol "Unduh" (buka file di tab baru) dan "Hapus" (hapus file di Storage
    + baris metadata-nya sekaligus) per dokumen.
- Semua file disimpan di bucket Storage `documents` (public read, sama seperti
  `report-photos` di Sprint 3), metadatanya (nama file, kategori, cluster
  terkait, ukuran, tanggal unggah) di tabel `documents` yang sudah ada sejak
  Sprint 1.

### Catatan penting

- Untuk shapefile (yang biasanya terdiri dari beberapa file .shp/.shx/.dbf/.prj),
  lebih praktis kompres jadi satu `.zip` dulu baru diunggah — form sudah kasih
  pengingat ini otomatis saat kategori "Shapefile" dipilih.
- Bucket `documents` dibuat **public** supaya link unduh & preview foto bisa
  langsung dibuka tanpa signed URL, konsisten dengan pendekatan `report-photos`
  di Sprint 3. Kalau ada file SHP/DXF/PDF yang sifatnya rahasia (mis. batas
  aset yang sensitif), beri tahu saya — bisa diganti ke private bucket +
  signed URL, sekaligus jadi alasan bagus untuk segera mengerjakan
  role-based access di bagian Sprint 4 berikutnya.

## Yang belum dikerjakan (rencana Sprint 4 lanjutan)

- Role-based access per halaman (admin/surveyor/PIC lapangan/viewer Medco)
- Alur approval laporan (submitted → approved)

Beri tahu saya kapan siap lanjut ke bagian berikutnya.
