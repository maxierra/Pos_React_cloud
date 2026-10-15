export const landingConfig = {
  whatsappNumber: "5491123145742",
  whatsappBase: "https://wa.me/5491123145742",
  loginUrl: "/auth/login",
  demoUrl: (location: "hero" | "store_band" | "final" | "mobile_bar") =>
    `/api/store/microsoft?location=${location}`,
  demoUser: "admin",
  demoPassword: "admin123",
  advisorMessage: "Hola, quiero hablar con un asesor sobre Tienda360.",
  purchaseUrl: (location: "hero" | "price" | "final") =>
    `/api/store/mercadolibre?location=${location}`,
} as const;

export function whatsappUrl(message: string) {
  return `${landingConfig.whatsappBase}?text=${encodeURIComponent(message)}`;
}

export const tutorials = [
  { id: "mEWPzS6RD70", title: "Login y acceso", description: "Cómo ingresar al sistema por primera vez." },
  { id: "xX_EWjoduZ0", title: "Carga de productos", description: "Con lector de códigos o a mano." },
  { id: "_gnGrbQz5Dw", title: "Ventas", description: "Cómo registrar una venta paso a paso." },
  { id: "jWTHrNC3TXU", title: "Caja diaria", description: "Cómo abrir, controlar y cerrar la caja." },
  { id: "hsSXo-roQ5E", title: "Reportes", description: "Consultá ventas y resultados con claridad." },
  { id: "J8Cxgc_l-iY", title: "Configuración", description: "Personalizá Tienda360 para tu comercio." },
  { id: "eKf_n6Twk7c", title: "Facturación electrónica", description: "Configurá y emití comprobantes de ARCA." },
  { id: "f8qx4hahRh4", title: "Inventario", description: "Controlá existencias y movimientos de stock." },
  { id: "NYDewU_XjI8", title: "Estadísticas", description: "Entendé las métricas principales del negocio." },
  { id: "TyNRPwxu6S0", title: "Etiquetas", description: "Diseñá e imprimí etiquetas para tus productos." },
] as const;
