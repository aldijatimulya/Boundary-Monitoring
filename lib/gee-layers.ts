import { GeeTileLayer } from "@/lib/types";

/**
 * Layer tile Google Earth Engine untuk Spatial Map.
 *
 * Cara mendapatkan urlTemplate dari Earth Engine (Python API):
 *
 *   image = ee.Image(...)  # atau hasil visualisasi lain
 *   map_id = image.getMapId({"min": 0, "max": 1, "palette": [...]})
 *   print(map_id["tile_fetcher"].url_format)
 *   # -> https://earthengine.googleapis.com/v1/projects/EE_PROJECT/maps/MAP_ID/tiles/{z}/{x}/{y}
 *
 * Catatan: URL dari getMapId() bersifat SEMENTARA (biasanya kedaluwarsa dalam
 * beberapa jam–hari tergantung setup). Untuk layer yang perlu tampil terus-menerus,
 * publish lewat GEE App / Cloud Function yang me-refresh token secara berkala,
 * lalu taruh URL endpoint itu di env var di bawah.
 *
 * Tiap layer didefinisikan lewat 2 env var bernomor (maks 4 layer bawaan):
 *   NEXT_PUBLIC_GEE_LAYER_1_LABEL=Land Cover
 *   NEXT_PUBLIC_GEE_LAYER_1_URL=https://earthengine.googleapis.com/.../{z}/{x}/{y}
 *   NEXT_PUBLIC_GEE_LAYER_2_LABEL=NDVI
 *   NEXT_PUBLIC_GEE_LAYER_2_URL=...
 *
 * Kalau env var tidak diisi, layer tersebut otomatis tidak muncul di peta —
 * tidak akan error.
 */
export function getGeeTileLayers(): GeeTileLayer[] {
  const layers: GeeTileLayer[] = [];

  for (let i = 1; i <= 4; i++) {
    const url = process.env[`NEXT_PUBLIC_GEE_LAYER_${i}_URL`];
    const label = process.env[`NEXT_PUBLIC_GEE_LAYER_${i}_LABEL`] || `GEE Layer ${i}`;
    if (url) {
      layers.push({
        id: `gee-layer-${i}`,
        label,
        urlTemplate: url,
        attribution: "Google Earth Engine",
        defaultVisible: false,
      });
    }
  }

  return layers;
}
