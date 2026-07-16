import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function parseCode(value: unknown) {
  if (typeof value !== "string") return null;
  const code = value.trim().replace(/^kainan-loyalty:/, "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code) ? code : null;
}

async function adminClient() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? supabase : null;
}

export async function POST(request: Request) {
  const supabase = await adminClient();
  if (!supabase) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json().catch(() => null) as { action?: string; code?: string; receipt?: string; billAmount?: number } | null;
  const code = parseCode(body?.code);
  if (!code) return NextResponse.json({ error: "This is not a valid Kainan loyalty QR." }, { status: 400 });
  if (body?.action === "lookup") {
    const { data, error } = await supabase.rpc("get_loyalty_customer", { scan_code: code });
    if (error || !data?.[0]) return NextResponse.json({ error: error?.message || "Customer not found." }, { status: 404 });
    return NextResponse.json({ customer: data[0] });
  }
  if (body?.action === "record") {
    const { data, error } = await supabase.rpc("record_loyalty_visit", { scan_code: code, receipt: body.receipt, bill_amount: body.billAmount ?? null, reservation_ref: null });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ visit: data?.[0] });
  }
  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
