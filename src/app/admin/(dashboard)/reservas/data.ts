import { createAdminClient } from "@/lib/supabase/admin";

export type AdminComboReservationRow = {
  id: string;
  combo_sku: string;
  combo_title: string;
  customer_name: string;
  phone: string;
  shipping_address: string;
  payment_method: string;
  status: string;
  notes: string | null;
  created_at: string;
};

export async function loadComboReservations(): Promise<AdminComboReservationRow[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("combo_reservations")
      .select("id,combo_sku,combo_title,customer_name,phone,shipping_address,payment_method,status,notes,created_at")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error || !data) return [];
    return data as AdminComboReservationRow[];
  } catch {
    return [];
  }
}
