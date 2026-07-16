import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    items?: unknown[]; orderType?: string; paymentMethod?: string;
    amountReceived?: number | null; notes?: string; loyaltyCode?: string | null;
  } | null;
  if (!body || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Invalid sale." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("create_pos_sale", {
    cart_items: body.items,
    sale_order_type: body.orderType,
    sale_payment_method: body.paymentMethod,
    cash_received: body.amountReceived ?? null,
    sale_notes: body.notes || null,
    loyalty_scan_code: body.loyaltyCode || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ sale: data });
}
