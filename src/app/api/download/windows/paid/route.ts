import { NextResponse, type NextRequest } from "next/server";

import {
  DESKTOP_PAID_EXTERNAL_URL,
  DESKTOP_PAID_STORAGE_BUCKET,
  DESKTOP_PAID_STORAGE_PATH,
} from "@/lib/desktop-download";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const orderId = new URL(request.url).searchParams.get("order")?.trim() ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("store_orders")
      .select("status,provisioned_at,product_sku")
      .eq("id", orderId)
      .maybeSingle();

    if (
      !order ||
      order.status !== "paid" ||
      !order.provisioned_at ||
      order.product_sku !== "software_lifetime"
    ) {
      return NextResponse.json(
        { error: "La descarga se habilita cuando el pago queda acreditado." },
        { status: 403 }
      );
    }

    if (DESKTOP_PAID_EXTERNAL_URL) {
      let externalUrl: URL;
      try {
        externalUrl = new URL(DESKTOP_PAID_EXTERNAL_URL);
      } catch {
        return NextResponse.json(
          { error: "El enlace de descarga configurado no es válido." },
          { status: 503 }
        );
      }
      if (externalUrl.protocol !== "https:") {
        return NextResponse.json(
          { error: "El enlace de descarga debe utilizar HTTPS." },
          { status: 503 }
        );
      }
      return NextResponse.redirect(externalUrl, { status: 307 });
    }

    const { data, error } = await admin.storage
      .from(DESKTOP_PAID_STORAGE_BUCKET)
      .createSignedUrl(DESKTOP_PAID_STORAGE_PATH, 60, { download: true });

    if (error || !data?.signedUrl) {
      console.error("[paid-download] signed URL failed", error);
      return NextResponse.json(
        { error: "El instalador todavía no está disponible. Contactanos por WhatsApp." },
        { status: 503 }
      );
    }

    return NextResponse.redirect(data.signedUrl, { status: 307 });
  } catch (error) {
    console.error("[paid-download] unexpected error", error);
    return NextResponse.json({ error: "No se pudo preparar la descarga." }, { status: 500 });
  }
}
