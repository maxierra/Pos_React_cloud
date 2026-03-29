"use client";

import * as React from "react";

import { createClient } from "@/lib/supabase/browser";

/**
 * Una vez por pestaña/sesión registra inicio de uso del sistema para el negocio activo.
 */
export function ActivitySessionPing({ businessId }: { businessId: string | null }) {
  React.useEffect(() => {
    if (!businessId) return;
    const key = `activity_session_${businessId}`;
    try {
      if (typeof sessionStorage === "undefined") return;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      return;
    }

    void (async () => {
      const supabase = createClient();
      await supabase.rpc("record_session_activity", { p_business_id: businessId });
    })();
  }, [businessId]);

  return null;
}
