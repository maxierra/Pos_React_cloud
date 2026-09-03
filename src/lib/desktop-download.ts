// Este asset público es la fuente canónica de la prueba. No permitir que una
// variable de entorno antigua vuelva a dirigir clientes a un archivo inexistente.
export const DESKTOP_DEMO_DOWNLOAD_URL =
  "https://github.com/maxierra/sistema-punto-venta-demo/releases/download/v1.0.0/Tienda.360.zip";

export const DESKTOP_DOWNLOAD_TRACKED_PATH = "/api/download/windows";
export const DESKTOP_PAID_DOWNLOAD_PATH = "/api/download/windows/paid";

export const DESKTOP_DOWNLOAD_ASSET_KEY = "pos_windows_demo_v1_0_0";

export const DESKTOP_PAID_STORAGE_BUCKET =
  process.env.STORE_PAID_DOWNLOAD_BUCKET || "software-downloads";
export const DESKTOP_PAID_STORAGE_PATH =
  process.env.STORE_PAID_DOWNLOAD_PATH || "tienda360-pos-final.zip";

export const DESKTOP_PAID_EXTERNAL_URL =
  (process.env.STORE_PAID_DOWNLOAD_URL || "").trim();
