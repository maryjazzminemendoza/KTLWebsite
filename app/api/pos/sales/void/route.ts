import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const body = await request.json().catch(() => null) as { orderId?: number; reason?: string } | null;
  if (!body?.orderId || !body.reason?.trim()) return NextResponse.json({ error: "Sale and void reason are required." }, { status: 400 });
  const { data, error } = await supabase.rpc("void_pos_sale", { pos_order_id: body.orderId, reason_text: body.reason.trim() });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
