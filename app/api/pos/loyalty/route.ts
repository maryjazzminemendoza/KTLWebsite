import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function parseCode(value: unknown) {
  if (typeof value !== "string") return null;
  const code = value.trim().replace(/^kainan-loyalty:/, "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code) ? code : null;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const body = await request.json().catch(() => null) as { code?: string } | null;
  const code = parseCode(body?.code);
  if (!code) return NextResponse.json({ error: "This is not a valid Kainan loyalty QR." }, { status: 400 });
  const { data, error } = await supabase.rpc("get_loyalty_customer", { scan_code: code });
  if (error || !data?.[0]) return NextResponse.json({ error: error?.message || "Customer not found." }, { status: 404 });
  return NextResponse.json({ customer: data[0], code });
}
